import { useCallback, useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { StatCard, DashboardCharts, AIInsights } from '../components/Dashboard';

export function DashboardPage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const sheetId = searchParams.get('sheetId');
  
  const [insights, setInsights] = useState(null);
  const [stats, setStats] = useState(null);
  const [sheets, setSheets] = useState([]);
  const [selectedSheetId, setSelectedSheetId] = useState(sheetId);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setInsights(null);
      
      if (user) {
        const teams = await api.getTeams();
        const activeTeamId = user.team_id || teams[0]?.id;
        const sheetsData = activeTeamId ? await api.getSheets(activeTeamId) : [];
        setSheets(sheetsData);
        
        // Load insights for selected sheet
        if (selectedSheetId && sheetsData.some(s => s.id === parseInt(selectedSheetId))) {
          const insightsData = await api.getDashboardInsights(selectedSheetId);
          setInsights(insightsData);
        } else if (sheetsData.length > 0 && !selectedSheetId) {
          setSelectedSheetId(sheetsData[0].id);
          const insightsData = await api.getDashboardInsights(sheetsData[0].id);
          setInsights(insightsData);
        }
      }

      // Load overall stats
      const statsData = await api.getDashboardStats();
      setStats(statsData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [selectedSheetId, user]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  if (loading) {
    return <div style={styles.container}>Loading dashboard...</div>;
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1>Dashboard</h1>
      </div>

      {error && <p style={styles.error}>{error}</p>}

      {/* Sheet selector */}
      {sheets.length > 0 && (
        <div style={styles.sheetSelector}>
          <label>Select Sheet:</label>
          <select
            value={selectedSheetId || ''}
            onChange={(e) => setSelectedSheetId(e.target.value)}
          >
            {sheets.map(sheet => (
              <option key={sheet.id} value={sheet.id}>
                {sheet.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Stats cards */}
      {stats && (
        <div style={styles.statsGrid}>
          <StatCard
            icon="📝"
            label="Total Rows"
            value={stats.total_rows || 0}
          />
          <StatCard
            icon="👥"
            label="Active Members"
            value={stats.active_members || 0}
          />
          <StatCard
            icon="✅"
            label="Completion Rate"
            value={`${stats.completion_rate || 0}%`}
          />
          <StatCard
            icon="📈"
            label="Avg Response Time"
            value={`${stats.avg_response_time || 0}h`}
          />
        </div>
      )}

      {/* Charts */}
      {insights && (
        <>
          <DashboardCharts data={insights} />
          {insights.summary && (
            <AIInsights
              summary={insights.summary}
              alerts={insights.alerts}
            />
          )}
        </>
      )}

      {!insights && <p style={styles.noData}>No data available. Create and fill a sheet to see insights.</p>}
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
  error: {
    background: 'rgba(255, 77, 106, 0.1)',
    border: '1px solid var(--danger)',
    color: 'var(--danger)',
    padding: 'var(--space-4)',
    borderRadius: 'var(--radius-md)',
    marginBottom: 'var(--space-4)',
  },
  sheetSelector: {
    marginBottom: 'var(--space-8)',
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-4)',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: 'var(--space-6)',
    marginBottom: 'var(--space-8)',
  },
  noData: {
    textAlign: 'center',
    color: 'var(--text-secondary)',
    padding: 'var(--space-8)',
  },
};
