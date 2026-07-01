import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/AppShell'
import { AdminRoute, ProtectedRoute } from './components/ProtectedRoute'
import { AdminMatchPage } from './pages/AdminMatchPage'
import { AdminPage } from './pages/AdminPage'
import { HomePage } from './pages/HomePage'
import { LoginPage } from './pages/LoginPage'
import { MatchesPage } from './pages/MatchesPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { PanelPage } from './pages/PanelPage'
import { PredictionPage } from './pages/PredictionPage'
import { RankingPage } from './pages/RankingPage'
import { RulesPage } from './pages/RulesPage'
import { TablePage } from './pages/TablePage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<AppShell />}>
            <Route path="/" element={<Navigate to="/home" replace />} />
            <Route path="/home" element={<HomePage />} />
            <Route path="/jogos" element={<MatchesPage />} />
            <Route path="/palpite/:matchId" element={<PredictionPage />} />
            <Route path="/tabela" element={<TablePage />} />
            <Route path="/regras" element={<RulesPage />} />
            <Route path="/ranking" element={<RankingPage />} />
            <Route element={<AdminRoute />}>
              <Route path="/painel" element={<PanelPage />} />
              <Route path="/admin" element={<AdminPage />} />
              <Route path="/admin/jogo/:matchId" element={<AdminMatchPage />} />
            </Route>
          </Route>
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
