import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/auth'
import { canAccessAdmin } from '../lib/admin'

export function ProtectedRoute() {
  const { firebaseUser, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="grid min-h-svh place-items-center bg-betel-paper px-4 text-center">
        <div className="panel max-w-sm p-6">
          <p className="text-sm font-bold text-slate-600">Carregando Bolão Betel 2026...</p>
        </div>
      </div>
    )
  }

  if (!firebaseUser) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return <Outlet />
}

export function AdminRoute() {
  const { profile } = useAuth()

  if (!canAccessAdmin(profile)) {
    return <Navigate to="/home" replace />
  }

  return <Outlet />
}
