import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export function StatCard({ icon, label, value, trend }) {
  return (
    <div className="card card-compact" style={styles.statCard}>
      <div style={styles.statIcon}>{icon}</div>
      <div style={styles.statContent}>
        <p style={styles.statLabel}>{label}</p>
        <h3 style={styles.statValue}>{value}</h3>
        {trend && <p style={styles.statTrend}>{trend}</p>}
      </div>
    </div>
  );
}

export function ChartCard({ title, children }) {
  return (
    <div className="card" style={styles.chartCard}>
      <h3 style={styles.chartTitle}>{title}</h3>
      {children}
    </div>
  );
}

export function AIInsights({ summary, alerts }) {
  return (
    <div className="card" style={styles.insightsCard}>
      <h3>📊 AI Insights</h3>
      <p style={styles.summary}>{summary}</p>

      {alerts && alerts.length > 0 && (
        <div style={styles.alerts}>
          <h4>Alerts</h4>
          <ul>
            {alerts.map((alert, idx) => (
              <li key={idx} style={styles.alertItem}>
                <span style={styles.alertIcon}>⚠️</span>
                {alert}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export function DashboardCharts({ data }) {
  const COLORS = ['#6c63ff', '#00d4aa', '#ffb347', '#ff4d6a'];

  if (!data || !data.charts) {
    return <p style={styles.noData}>No data available</p>;
  }

  return (
    <div style={styles.chartsGrid}>
      {data.charts.map((chart, idx) => (
        <ChartCard key={idx} title={chart.title}>
          {chart.type === 'bar' && (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chart.data}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="name" tick={{ fill: '#8b8fa3', fontSize: 12 }} />
                <YAxis tick={{ fill: '#8b8fa3', fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="value" fill="#6c63ff" />
              </BarChart>
            </ResponsiveContainer>
          )}

          {chart.type === 'line' && (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chart.data}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="name" tick={{ fill: '#8b8fa3', fontSize: 12 }} />
                <YAxis tick={{ fill: '#8b8fa3', fontSize: 12 }} />
                <Tooltip />
                <Line type="monotone" dataKey="value" stroke="#00d4aa" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          )}

          {chart.type === 'pie' && (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={chart.data}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {chart.data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      ))}
    </div>
  );
}

const styles = {
  statCard: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-4)',
  },
  statIcon: {
    fontSize: '2.5rem',
  },
  statContent: {
    flex: 1,
  },
  statLabel: {
    fontSize: 'var(--font-size-sm)',
    color: 'var(--text-secondary)',
    marginBottom: 'var(--space-1)',
  },
  statValue: {
    fontSize: 'var(--font-size-2xl)',
    fontWeight: 'bold',
    marginBottom: 'var(--space-1)',
  },
  statTrend: {
    fontSize: 'var(--font-size-xs)',
    color: 'var(--success)',
  },
  chartCard: {
    minHeight: '350px',
  },
  chartTitle: {
    marginBottom: 'var(--space-4)',
  },
  chartsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: 'var(--space-6)',
  },
  insightsCard: {
    gridColumn: '1 / -1',
  },
  summary: {
    lineHeight: 1.8,
    marginBottom: 'var(--space-4)',
  },
  alerts: {
    marginTop: 'var(--space-4)',
    paddingTop: 'var(--space-4)',
    borderTop: '1px solid var(--border)',
  },
  alertItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-2)',
    padding: 'var(--space-2) 0',
    color: 'var(--warning)',
  },
  alertIcon: {
    fontSize: '1.2rem',
  },
  noData: {
    textAlign: 'center',
    color: 'var(--text-secondary)',
    padding: 'var(--space-8)',
  },
};
