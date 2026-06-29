export const authDomain = 'bolao-betel.local'

export function participantIdFromName(name: string) {
  const normalized = name
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

  return normalized || `participante-${Date.now()}`
}

export function authEmailFromParticipantId(participantId: string) {
  return `${participantId}@${authDomain}`
}
