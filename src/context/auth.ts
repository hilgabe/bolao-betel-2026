import type { User } from 'firebase/auth'
import { createContext, useContext } from 'react'
import type { AppUser } from '../types'

export interface AuthContextValue {
  firebaseReady: boolean
  firebaseUser: User | null
  profile: AppUser | null
  loading: boolean
  loginWithName: (nome: string, senha: string) => Promise<void>
  logout: () => Promise<void>
  refreshProfile: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth() {
  const value = useContext(AuthContext)
  if (!value) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider.')
  }
  return value
}
