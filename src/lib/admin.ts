import { participantIdFromName } from './participants'
import type { AppUser, UserRole } from '../types'

const adminParticipantIds = new Set(['gabriel'])
const adminEmails = new Set(['gabriel@bolao-betel.local'])

type AdminCheckUser = Partial<Pick<AppUser, 'uid' | 'nome' | 'email' | 'role'>>

function isConfiguredAdmin(user: AdminCheckUser) {
  const uid = user.uid ? participantIdFromName(user.uid) : ''
  const nameId = user.nome ? participantIdFromName(user.nome) : ''
  const email = user.email?.trim().toLowerCase() || ''

  return adminParticipantIds.has(uid) || adminParticipantIds.has(nameId) || adminEmails.has(email)
}

export function resolveUserRole(user: AdminCheckUser): UserRole {
  if (isConfiguredAdmin(user)) {
    return 'admin'
  }

  return user.role === 'admin' ? 'admin' : 'user'
}

export function canAccessAdmin(user: AdminCheckUser | null | undefined) {
  return Boolean(user && resolveUserRole(user) === 'admin')
}
