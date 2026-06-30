export type UserRole = 'user' | 'admin'

export type MatchStatus = 'scheduled' | 'active' | 'finished'

export type AvailabilityState = 'open' | 'future' | 'closed'

export interface AppUser {
  uid: string
  nome: string
  email: string
  role: UserRole
  totalPontos: number
  createdAt?: unknown
}

export interface Match {
  id: string
  codigo: string
  fase: string
  date: string
  time: string
  teamA: string
  teamB: string
  flagA: string
  flagB: string
  status: MatchStatus
  manualOpen?: boolean
  scoreA?: number | null
  scoreB?: number | null
  penaltiesA?: number | null
  penaltiesB?: number | null
  winner?: string
  scorersTexto?: string
  resultUpdatedAt?: unknown
}

export interface ScoreFields {
  pontosPlacar: number
  pontosGols: number
  pontosClassificado: number
  pontosExtras: number
}

export interface Prediction extends ScoreFields {
  id: string
  userId: string
  userName: string
  matchId: string
  matchCode: string
  teamA: string
  teamB: string
  palpiteA: number
  palpiteB: number
  palpitePenaltisA?: number | null
  palpitePenaltisB?: number | null
  classificado: string
  jogadoresGolTexto: string
  totalPontos: number
  pontuado: boolean
  observacaoAdmin: string
  createdAt?: unknown
  updatedAt?: unknown
}

export interface RankingEntry {
  uid: string
  nome: string
  email: string
  totalPontos: number
  palpitesFeitos: number
  palpitesPontuados: number
  posicao: number
}
