import { useCallback, useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { FileUpload, SheetGrid } from '../components/SheetGrid';
import { FormBuilder } from './FormFill';

export function Sheets() {
  const { user, setUser } = useAuth();
  const [sheets, setSheets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [teamId, setTeamId] = useState(user?.team_id || null);
  const [teamName, setTeamName] = useState('');

  const loadSheets = useCallback(async () => {
    try {
      setLoading(true);
      const teams = await api.getTeams();
      const activeTeamId = user?.team_id || teams[0]?.id || null;
      if (!activeTeamId) {
        setSheets([]);
        setTeamId(null);
        return;
      }
      setTeamId(activeTeamId);
      if (!user?.team_id) {
        setUser(prev => ({ ...prev, team_id: activeTeamId, role: teams[0]?.owner_id === prev?.id ? 'head' : prev?.role }));
      }
      const data = await api.getSheets(activeTeamId);
      setSheets(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [setUser, user]);

  useEffect(() => {
    loadSheets();
  }, [loadSheets]);

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    if (!teamName.trim()) return;

    try {
      setError('');
      const team = await api.createTeam({ name: teamName.trim() });
      setTeamId(team.id);
      setUser(prev => ({ ...prev, team_id: team.id, role: 'head' }));
      setTeamName('');
      await loadSheets();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleExport = async (sheetId) => {
    try {
      const blob = await api.exportExcel(sheetId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sheet-${sheetId}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('Export failed: ' + err.message);
    }
  };

  if (loading) return <div style={styles.container}>Loading sheets...</div>;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1>Sheets</h1>
        {error && <p style={styles.error}>{error}</p>}
      </div>

      {!teamId && (
        <form onSubmit={handleCreateTeam} className="card" style={styles.teamSetup}>
          <h2>Create your first team</h2>
          <div className="form-group">
            <label>Team name</label>
            <input
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="Operations Team"
              required
            />
          </div>
          <button type="submit" className="btn">Create Team</button>
        </form>
      )}

      {teamId && (
        <div className="card" style={styles.uploadCard}>
          <h2>Import Excel</h2>
          <FileUpload teamId={teamId} onUploadSuccess={loadSheets} />
        </div>
      )}

      <div style={styles.sheetsGrid}>
        {sheets.map(sheet => (
          <div key={sheet.id} className="card card-compact" style={styles.sheetCard}>
            <h3>{sheet.name}</h3>
            <p style={styles.sheetMeta}>{sheet.row_count || 0} rows</p>
            <div style={styles.cardActions}>
              <a href={`/sheet/${sheet.id}`} className="btn btn-small">
                View
              </a>
              <button
                className="btn btn-secondary btn-small"
                onClick={() => handleExport(sheet.id)}
              >
                Export
              </button>
            </div>
          </div>
        ))}
      </div>
      {teamId && sheets.length === 0 && (
        <p style={styles.empty}>No sheets yet. Import an Excel file to create one.</p>
      )}
    </div>
  );
}

export function SheetView() {
  const { sheetId } = useParams();
  const { user } = useAuth();
  const [sheet, setSheet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadSheet = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.getSheet(sheetId);
      setSheet(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [sheetId]);

  useEffect(() => {
    loadSheet();
  }, [loadSheet]);

  const handleEdit = async (rowId, newData) => {
    try {
      await api.updateRow(sheetId, rowId, newData);
      loadSheet();
    } catch (err) {
      alert('Update failed: ' + err.message);
    }
  };

  const handleDelete = async (rowId) => {
    if (window.confirm('Delete this row?')) {
      try {
        await api.deleteRow(sheetId, rowId);
        loadSheet();
      } catch (err) {
        alert('Delete failed: ' + err.message);
      }
    }
  };

  if (loading) return <div style={styles.container}>Loading sheet...</div>;
  if (!sheet) return <div style={styles.container}>Sheet not found</div>;

  const columns = sheet.columns_config || [];
  const rows = sheet.rows || [];

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1>{sheet.name}</h1>
        <button
          className="btn btn-secondary btn-small"
          onClick={() => {
            const url = `/form/${sheetId}`;
            window.location.href = url;
          }}
        >
          Add Row
        </button>
      </div>

      {error && <p style={styles.error}>{error}</p>}

      {user?.role === 'head' && (
        <div className="card" style={styles.formBuilder}>
          <FormBuilder sheetId={sheetId} />
        </div>
      )}

      <SheetGrid
        data={rows}
        columns={columns}
        onEdit={handleEdit}
        onDelete={handleDelete}
        readOnly={user?.role !== 'head'}
      />
    </div>
  );
}

const styles = {
  container: {
    padding: 'var(--space-8)',
    minHeight: 'calc(100vh - 61px)',
  },
  header: {
    marginBottom: 'var(--space-8)',
  },
  sheetsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
    gap: 'var(--space-6)',
  },
  uploadCard: {
    marginBottom: 'var(--space-8)',
  },
  formBuilder: {
    marginBottom: 'var(--space-8)',
  },
  teamSetup: {
    maxWidth: '520px',
    marginBottom: 'var(--space-8)',
  },
  sheetCard: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  sheetMeta: {
    color: 'var(--text-secondary)',
    marginBottom: 'var(--space-4)',
  },
  cardActions: {
    display: 'flex',
    gap: 'var(--space-2)',
  },
  error: {
    color: 'var(--danger)',
    marginBottom: 'var(--space-4)',
  },
  empty: {
    textAlign: 'center',
    padding: 'var(--space-8)',
  },
};
