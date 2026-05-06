TeamSheet Backend API
=====================

A complete Node.js + Express backend for TeamSheet - Team Excel Dashboard.

Features:
- User authentication with JWT
- Team management and CRUD operations
- Excel spreadsheet management with import/export
- SQLite database with proper schema
- Multi-user team support
- Row-level data management

Getting Started
===============

Prerequisites:
- Node.js v20+
- npm v9+

Installation:
1. Navigate to server directory:
   cd /home/venom/Downloads/experiment/server

2. Install dependencies:
   npm install

3. Start the server:
   npm start

Server will run on http://localhost:5000

Project Structure
=================

server/
├── index.js                    # Main Express application
├── package.json               # Dependencies and scripts
├── db/
│   └── init.js               # Database initialization and schema
├── middleware/
│   └── auth.js               # JWT authentication middleware
├── routes/
│   ├── auth.js               # Authentication endpoints
│   ├── teams.js              # Team CRUD endpoints
│   └── sheets.js             # Sheet and row management
├── services/
│   ├── excelParser.js        # Excel file import service
│   └── excelExporter.js      # Excel file export service
├── data/                      # SQLite database (auto-created)
├── uploads/                   # Temporary upload storage
└── exports/                   # Generated Excel exports

API Documentation
=================

Base URL: http://localhost:5000/api

Authentication Endpoints
------------------------

POST /auth/register
Register a new user
Body: { email, password, name }
Response: { userId, email, name, token }

POST /auth/login
Login with credentials
Body: { email, password }
Response: { userId, email, name, token }

Team Endpoints (Requires Authentication)
-----------------------------------------

GET /teams
Get all teams for the authenticated user
Headers: Authorization: Bearer <token>
Response: [{ id, name, description, owner_id, created_at, updated_at }]

GET /teams/:id
Get specific team with members
Headers: Authorization: Bearer <token>
Response: { id, name, description, owner_id, members: [{id, email, name, role}] }

POST /teams
Create a new team
Headers: Authorization: Bearer <token>
Body: { name, description }
Response: { id, name, description, owner_id, created_at, updated_at }

PUT /teams/:id
Update team (owner only)
Headers: Authorization: Bearer <token>
Body: { name, description }
Response: { success, message }

DELETE /teams/:id
Delete team (owner only)
Headers: Authorization: Bearer <token>
Response: { success, message }

Sheet Endpoints (Requires Authentication)
------------------------------------------

GET /sheets?teamId=<id>
Get all sheets in a team
Headers: Authorization: Bearer <token>
Response: [{ id, team_id, name, description, created_at, updated_at }]

GET /sheets/:id
Get sheet with all rows
Headers: Authorization: Bearer <token>
Response: { id, team_id, name, description, rows: [{id, row_number, data}] }

POST /sheets
Create a new sheet
Headers: Authorization: Bearer <token>
Body: { teamId, name, description }
Response: { id, team_id, name, description, created_at, updated_at }

PUT /sheets/:id
Update sheet
Headers: Authorization: Bearer <token>
Body: { name, description }
Response: { success, message }

DELETE /sheets/:id
Delete sheet
Headers: Authorization: Bearer <token>
Response: { success, message }

POST /sheets/:id/rows
Add rows to a sheet
Headers: Authorization: Bearer <token>
Body: { rows: [{row_number, data}] }
Response: [{ id, sheet_id, row_number, data }]

DELETE /sheets/:id/rows/:rowId
Delete a specific row
Headers: Authorization: Bearer <token>
Response: { success, message }

Excel Operations (Requires Authentication)
-------------------------------------------

POST /import
Import Excel file into a sheet
Headers: Authorization: Bearer <token>
Body: multipart/form-data with:
  - file: Excel file (.xlsx or .xls)
  - sheetId: Target sheet ID
Response: { importedRowCount, rows, sheetName }

GET /export/:sheetId
Export sheet to Excel file
Headers: Authorization: Bearer <token>
Response: Binary Excel file download

System Endpoints
----------------

GET /health
Health check endpoint
Response: { success, message, timestamp }

Database Schema
===============

users
-----
- id (INTEGER PRIMARY KEY)
- email (TEXT UNIQUE)
- password (TEXT)
- name (TEXT)
- created_at (DATETIME)
- updated_at (DATETIME)

teams
-----
- id (INTEGER PRIMARY KEY)
- name (TEXT)
- description (TEXT)
- owner_id (INTEGER FK → users.id)
- created_at (DATETIME)
- updated_at (DATETIME)

team_members
------------
- id (INTEGER PRIMARY KEY)
- team_id (INTEGER FK → teams.id)
- user_id (INTEGER FK → users.id)
- role (TEXT)
- created_at (DATETIME)

sheets
------
- id (INTEGER PRIMARY KEY)
- team_id (INTEGER FK → teams.id)
- name (TEXT)
- description (TEXT)
- created_at (DATETIME)
- updated_at (DATETIME)

sheet_rows
----------
- id (INTEGER PRIMARY KEY)
- sheet_id (INTEGER FK → sheets.id)
- row_number (INTEGER)
- data (JSON)
- created_at (DATETIME)
- updated_at (DATETIME)

Testing
=======

Example Workflow:

1. Register User:
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"SecurePass123","name":"John Doe"}'

2. Login:
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"SecurePass123"}'

3. Create Team:
curl -X POST http://localhost:5000/api/teams \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"name":"Engineering","description":"Engineering team"}'

4. Create Sheet:
curl -X POST http://localhost:5000/api/sheets \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"teamId":1,"name":"Project Status","description":"Q1 projects"}'

5. Import Excel:
curl -X POST http://localhost:5000/api/import \
  -H "Authorization: Bearer <token>" \
  -F "file=@/path/to/file.xlsx" \
  -F "sheetId=1"

6. Export Excel:
curl -X GET http://localhost:5000/api/export/1 \
  -H "Authorization: Bearer <token>" \
  -o exported.xlsx

Security
========

- Passwords: Hashed with bcryptjs (10 salt rounds)
- Authentication: JWT tokens with 7-day expiration
- Authorization: Role-based access control (owner vs member)
- File uploads: MIME type and extension validation
- File size: 10MB limit on uploads
- Database: Foreign key constraints enabled
- Input validation: All endpoints validate input

Development
===========

Install dev dependencies:
npm install --save-dev nodemon

Run with auto-reload:
npx nodemon index.js

Environment Variables
====================

Optional (defaults provided):
- PORT=5000 (server port)
- JWT_SECRET=your-secret-key-change-in-production
- NODE_ENV=production

For production, create .env file in server/ directory:
PORT=5000
JWT_SECRET=your-very-secure-random-secret-key-here
NODE_ENV=production

License
=======

ISC

Author
======

Built for TeamSheet Project
