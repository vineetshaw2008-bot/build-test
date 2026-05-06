import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar" style={styles.navbar}>
      <div style={styles.navContent}>
        <Link to="/" style={styles.logo}>
          <span style={styles.logoIcon}>📊</span>
          TeamSheet
        </Link>
        
        <div style={styles.userMenu}>
          {user && (
            <>
              <span style={styles.username}>{user.name}</span>
              <button onClick={handleLogout} className="btn btn-secondary btn-small">
                Logout
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

export function Sidebar() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <aside style={styles.sidebar}>
      <nav style={styles.sidebarNav}>
        <SidebarLink to="/dashboard" icon="📈">
          Dashboard
        </SidebarLink>
        <SidebarLink to="/sheets" icon="📋">
          Sheets
        </SidebarLink>
      </nav>
    </aside>
  );
}

function SidebarLink({ to, icon, children }) {
  return (
    <Link to={to} style={styles.sidebarLink}>
      <span style={styles.sidebarIcon}>{icon}</span>
      <span>{children}</span>
    </Link>
  );
}

const styles = {
  navbar: {
    background: 'var(--glass-bg)',
    borderBottom: '1px solid var(--border)',
    backdropFilter: 'var(--glass-blur)',
    padding: 'var(--space-4) var(--space-8)',
    position: 'sticky',
    top: 0,
    zIndex: 1000,
  },
  navContent: {
    maxWidth: '1400px',
    margin: '0 auto',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logo: {
    fontSize: 'var(--font-size-lg)',
    fontWeight: 'bold',
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-2)',
    color: 'var(--text-primary)',
  },
  logoIcon: {
    fontSize: '1.5rem',
  },
  userMenu: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-4)',
  },
  username: {
    color: 'var(--text-secondary)',
    fontSize: 'var(--font-size-sm)',
  },
  sidebar: {
    width: '200px',
    background: 'var(--bg-secondary)',
    borderRight: '1px solid var(--border)',
    padding: 'var(--space-6)',
    minHeight: 'calc(100vh - 61px)',
    position: 'fixed',
    top: '61px',
    left: 0,
  },
  sidebarNav: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-2)',
  },
  sidebarLink: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-3)',
    padding: 'var(--space-3) var(--space-4)',
    color: 'var(--text-secondary)',
    borderRadius: 'var(--radius-md)',
    transition: 'all 0.2s',
  },
  sidebarIcon: {
    fontSize: '1.25rem',
  },
};
