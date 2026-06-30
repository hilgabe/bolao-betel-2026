import { collection, onSnapshot, query, where } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { emptyScoreFields } from '../lib/scoring'
import { db } from '../lib/firebase'
import type { Prediction } from '../types'

function normalizePrediction(id: string, data: Partial<Prediction>): Prediction {
  const emptyScores = emptyScoreFields()
  return {
    id,
    userId: data.userId || '',
    userName: data.userName || 'Participante',
    matchId: data.matchId || '',
    matchCode: data.matchCode || '',
    teamA: data.teamA || '',
    teamB: data.teamB || '',
    palpiteA: Number(data.palpiteA || 0),
    palpiteB: Number(data.palpiteB || 0),
    palpitePenaltisA: data.palpitePenaltisA ?? null,
    palpitePenaltisB: data.palpitePenaltisB ?? null,
    classificado: data.classificado || '',
    jogadoresGolTexto: data.jogadoresGolTexto || '',
    pontosPlacar: Number(data.pontosPlacar ?? emptyScores.pontosPlacar),
    pontosPenaltis: Number(data.pontosPenaltis ?? emptyScores.pontosPenaltis),
    pontosGols: Number(data.pontosGols ?? emptyScores.pontosGols),
    pontosClassificado: Number(data.pontosClassificado ?? emptyScores.pontosClassificado),
    pontosExtras: Number(data.pontosExtras ?? emptyScores.pontosExtras),
    totalPontos: Number(data.totalPontos || 0),
    pontuado: Boolean(data.pontuado),
    observacaoAdmin: data.observacaoAdmin || '',
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  }
}

function usePredictionQuery(field: 'userId' | 'matchId' | null, value?: string) {
  const [predictions, setPredictions] = useState<Prediction[]>([])
  const [loading, setLoading] = useState(Boolean(db && (field === null || value)))
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!db || (field && !value)) {
      setLoading(false)
      return
    }

    const source =
      field && value
        ? query(collection(db, 'predictions'), where(field, '==', value))
        : collection(db, 'predictions')

    return onSnapshot(
      source,
      (snapshot) => {
        setPredictions(snapshot.docs.map((item) => normalizePrediction(item.id, item.data())))
        setLoading(false)
      },
      (snapshotError) => {
        setError(snapshotError.message)
        setLoading(false)
      },
    )
  }, [field, value])

  return { predictions, loading, error }
}

export function useUserPredictions(userId?: string) {
  return usePredictionQuery('userId', userId)
}

export function useMatchPredictions(matchId?: string) {
  return usePredictionQuery('matchId', matchId)
}

export function useAllPredictions() {
  return usePredictionQuery(null)
}
