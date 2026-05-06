import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar, Sidebar } from './components/Navbar';
import { Login, Register } from './pages/Login';
import { DashboardPage } from './pages/Dashboard';
import { Sheets, SheetView } from './pages/Sheets';
import { FormFill } from './pages/FormFill';

function ProtectedLayout({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div className="app-loading">Loading TeamSheet...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <>
      <Navbar />
      <Sidebar />
      <main className="app-shell">{children}</main>
    </>
  );
}

function PublicRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div className="app-loading">Loading TeamSheet...</div>;
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route
        path="/login"
        element={(
          <PublicRoute>
            <Login />
          </PublicRoute>
        )}
      />
      <Route
        path="/register"
        element={(
          <PublicRoute>
            <Register />
          </PublicRoute>
        )}
      />
      <Route
        path="/dashboard"
        element={(
          <ProtectedLayout>
            <DashboardPage />
          </ProtectedLayout>
        )}
      />
      <Route
        path="/sheets"
        element={(
          <ProtectedLayout>
            <Sheets />
          </ProtectedLayout>
        )}
      />
      <Route
        path="/sheet/:sheetId"
        element={(
          <ProtectedLayout>
            <SheetView />
          </ProtectedLayout>
        )}
      />
      <Route
        path="/form/:sheetId"
        element={(
          <ProtectedLayout>
            <FormFill />
          </ProtectedLayout>
        )}
      />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
