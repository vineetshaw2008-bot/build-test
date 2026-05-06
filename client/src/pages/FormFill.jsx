import { useCallback, useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/client';

export function FormBuilder({ sheetId }) {
  const [columns, setColumns] = useState([]);
  const [formFields, setFormFields] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadSheet = useCallback(async () => {
    try {
      const sheet = await api.getSheet(sheetId);
      setColumns(sheet.columns_config || []);
      setFormFields(sheet.form_fields || sheet.columns_config || []);
    } catch (err) {
      alert('Failed to load sheet: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [sheetId]);

  useEffect(() => {
    loadSheet();
  }, [loadSheet]);

  const toggleField = (colKey) => {
    if (formFields.some(f => f.key === colKey)) {
      setFormFields(formFields.filter(f => f.key !== colKey));
    } else {
      const field = columns.find(c => c.key === colKey);
      if (field) setFormFields([...formFields, field]);
    }
  };

  const handleSave = async () => {
    try {
      await api.updateFormConfig(sheetId, { form_fields: formFields });
      alert('Form saved successfully!');
    } catch (err) {
      alert('Failed to save: ' + err.message);
    }
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div style={styles.container}>
      <h2>Configure Form Fields</h2>
      <p style={styles.subtitle}>Select which columns should appear in the submission form:</p>

      <div style={styles.fieldList}>
        {columns.map(col => (
          <label key={col.key} style={styles.fieldLabel}>
            <input
              type="checkbox"
              checked={formFields.some(f => f.key === col.key)}
              onChange={() => toggleField(col.key)}
            />
            {col.label}
          </label>
        ))}
      </div>

      <button className="btn" onClick={handleSave} style={{ marginTop: 'var(--space-4)' }}>
        Save Form Configuration
      </button>
    </div>
  );
}

export function FormFill() {
  const { sheetId } = useParams();
  const navigate = useNavigate();
  const [formFields, setFormFields] = useState([]);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const loadForm = useCallback(async () => {
    try {
      const form = await api.getFormDefinition(sheetId);
      const fields = form.fields || form.form_fields || [];
      setFormFields(fields);
      const initialData = {};
      fields.forEach(field => {
        initialData[field.key] = '';
      });
      setFormData(initialData);
    } catch (err) {
      alert('Failed to load form: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [sheetId]);

  useEffect(() => {
    loadForm();
  }, [loadForm]);

  const handleChange = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await api.submitForm(sheetId, formData);
      alert('Form submitted successfully!');
      navigate('/sheets');
    } catch (err) {
      alert('Submission failed: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div style={styles.container}>Loading form...</div>;

  return (
    <div style={styles.formContainer}>
      <div className="card" style={styles.formCard}>
        <h2>Submit Data</h2>
        <form onSubmit={handleSubmit}>
          {formFields.map(field => (
            <div key={field.key} className="form-group">
              <label>{field.label}</label>
              <input
                type={field.type || 'text'}
                value={formData[field.key] || ''}
                onChange={(e) => handleChange(field.key, e.target.value)}
                required={field.required !== false}
              />
            </div>
          ))}
          <button type="submit" className="btn" disabled={submitting} style={{ width: '100%' }}>
            {submitting ? 'Submitting...' : 'Submit'}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: 'var(--space-8)',
    maxWidth: '600px',
    margin: '0 auto',
  },
  subtitle: {
    color: 'var(--text-secondary)',
    marginBottom: 'var(--space-6)',
  },
  fieldList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-3)',
  },
  fieldLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-3)',
    padding: 'var(--space-3)',
    borderRadius: 'var(--radius-md)',
    cursor: 'pointer',
    transition: 'background 0.2s',
  },
  formContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    padding: 'var(--space-4)',
  },
  formCard: {
    width: '100%',
    maxWidth: '400px',
  },
};
