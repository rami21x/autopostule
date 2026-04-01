import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import AuthPage from './pages/AuthPage';
import ProfilPage from './pages/ProfilPage';
import RecherchePage from './pages/RecherchePage';
import AnalysePage from './pages/AnalysePage';
import LettrePage from './pages/LettrePage';
import SuiviPage from './pages/SuiviPage';
import AuthCallbackPage from './pages/AuthCallbackPage';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Routes publiques */}
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />

          {/* Routes protegees avec layout */}
          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="/profil" element={<ProfilPage />} />
            <Route path="/recherche" element={<RecherchePage />} />
            <Route path="/analyse" element={<AnalysePage />} />
            <Route path="/lettre" element={<LettrePage />} />
            <Route path="/suivi" element={<SuiviPage />} />
          </Route>

          {/* Redirection par defaut */}
          <Route path="*" element={<Navigate to="/profil" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
