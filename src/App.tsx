import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Loading } from './components/shared/Loading';
import { LoginPage } from './pages/admin/Login';
import { SignupPage } from './pages/admin/Signup';
import { DashboardPage } from './pages/admin/Dashboard';
import { SuperAdminDashboard } from './pages/admin/SuperAdminDashboard';
import { SessionBuilderPage } from './pages/admin/SessionBuilder';
import { SessionDashboard } from './pages/admin/SessionDashboard';
import { GameResultsPage } from './pages/admin/GameResults';
import { AssetManager } from './pages/admin/AssetManager';
import { LiveSessionPage } from './pages/game/LiveSession';
import { PlayerJoinPage } from './pages/player/Join';
import { PlayerGamePage } from './pages/player/Game';
import { IndividualGamePage } from './pages/player/IndividualGame';

function App() {
  const { isLoading, initializeAuth } = useAuthStore();

  useEffect(() => {
    initializeAuth();
  }, []);

  if (isLoading) {
    return <Loading />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/super-admin"
          element={
            <ProtectedRoute>
              <SuperAdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/session/new"
          element={
            <ProtectedRoute>
              <SessionBuilderPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/session/edit/:sessionId"
          element={
            <ProtectedRoute>
              <SessionBuilderPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/session/dashboard/:sessionId"
          element={
            <ProtectedRoute>
              <SessionDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/results/:sessionPin"
          element={
            <ProtectedRoute>
              <GameResultsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/assets"
          element={
            <ProtectedRoute>
              <AssetManager />
            </ProtectedRoute>
          }
        />
        <Route path="/live/:sessionPin" element={<LiveSessionPage />} />
        <Route path="/join" element={<PlayerJoinPage />} />
        <Route path="/play/:sessionPin" element={<PlayerGamePage />} />
        <Route path="/individual/:sessionPin" element={<IndividualGamePage />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
