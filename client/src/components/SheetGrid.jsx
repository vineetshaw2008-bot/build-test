import { useState } from 'react';
import api from '../api/client';

export function FileUpload({ onUploadSuccess, teamId }) {
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      await uploadFile(files[0]);
    }
  };

  const handleChange = async (e) => {
    const files = e.target.files;
    if (files && files[0]) {
      await uploadFile(files[0]);
    }
  };

  const uploadFile = async (file) => {
    if (!file.name.match(/\.(xlsx|csv|xls)$/i)) {
      setError('Please upload an Excel or CSV file');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await api.importExcel(file, teamId);
      onUploadSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        ...styles.dropzone,
        ...(dragActive && styles.dropzoneActive),
      }}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      <input
        type="file"
        accept=".xlsx,.csv,.xls"
        onChange={handleChange}
        style={{ display: 'none' }}
        id="file-input"
        disabled={loading}
      />
      <label htmlFor="file-input" style={styles.dropzoneLabel}>
        <div style={styles.dropzoneIcon}>📁</div>
        <p style={styles.dropzoneText}>
          {loading ? 'Uploading...' : 'Drag and drop Excel file here'}
        </p>
        <button type="button" className="btn btn-small" disabled={loading}>
          Choose File
        </button>
      </label>
      {error && <p style={styles.error}>{error}</p>}
    </div>
  );
}

export function SheetGrid({ data, columns, onEdit, onDelete, readOnly = false }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingCell, setEditingCell] = useState(null);
  const [editValue, setEditValue] = useState('');

  const filteredData = data.filter(row =>
    Object.values(row).some(val =>
      String(val).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const handleCellClick = (rowId, colKey, value) => {
    if (!readOnly) {
      setEditingCell({ rowId, colKey });
      setEditValue(String(value));
    }
  };

  const handleCellSave = (rowId) => {
    if (editingCell && editingCell.rowId === rowId) {
      onEdit(rowId, {
        ...data.find(r => r.id === rowId),
        [editingCell.colKey]: editValue,
      });
      setEditingCell(null);
    }
  };

  return (
    <div>
      <input
        type="text"
        placeholder="Search..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        style={styles.searchInput}
      />

      <div style={styles.tableWrapper}>
        <table>
          <thead>
            <tr>
              {columns.map(col => (
                <th key={col.key}>{col.label}</th>
              ))}
              {!readOnly && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {filteredData.map(row => (
              <tr key={row.id}>
                {columns.map(col => (
                  <td
                    key={`${row.id}-${col.key}`}
                    onClick={() => handleCellClick(row.id, col.key, row[col.key])}
                    style={{
                      ...styles.cell,
                      ...(editingCell?.rowId === row.id && editingCell?.colKey === col.key && styles.cellEditing),
                    }}
                  >
                    {editingCell?.rowId === row.id && editingCell?.colKey === col.key ? (
                      <input
                        autoFocus
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={() => handleCellSave(row.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleCellSave(row.id);
                          if (e.key === 'Escape') setEditingCell(null);
                        }}
                        style={styles.cellInput}
                      />
                    ) : (
                      row[col.key]
                    )}
                  </td>
                ))}
                {!readOnly && (
                  <td style={styles.actionsCell}>
                    <button
                      className="btn btn-danger btn-small"
                      onClick={() => onDelete(row.id)}
                    >
                      Delete
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const styles = {
  dropzone: {
    border: '2px dashed var(--border)',
    borderRadius: 'var(--radius-lg)',
    padding: 'var(--space-8)',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'all 0.3s',
    background: 'var(--bg-card)',
  },
  dropzoneActive: {
    borderColor: 'var(--accent-primary)',
    background: 'rgba(108, 99, 255, 0.05)',
  },
  dropzoneLabel: {
    cursor: 'pointer',
  },
  dropzoneIcon: {
    fontSize: '3rem',
    marginBottom: 'var(--space-4)',
  },
  dropzoneText: {
    marginBottom: 'var(--space-4)',
  },
  searchInput: {
    marginBottom: 'var(--space-4)',
    width: '100%',
    maxWidth: '300px',
  },
  tableWrapper: {
    overflowX: 'auto',
  },
  cell: {
    cursor: 'pointer',
    transition: 'background 0.2s',
  },
  cellEditing: {
    background: 'rgba(108, 99, 255, 0.1)',
  },
  cellInput: {
    background: 'var(--bg-primary)',
    border: '1px solid var(--accent-primary)',
    color: 'var(--text-primary)',
    padding: 'var(--space-2)',
    borderRadius: 'var(--radius-sm)',
    width: '100%',
  },
  actionsCell: {
    textAlign: 'center',
  },
  error: {
    color: 'var(--danger)',
    marginTop: 'var(--space-2)',
    fontSize: 'var(--font-size-sm)',
  },
};
