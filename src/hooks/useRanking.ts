import { collection, onSnapshot } from 'firebase/firestore'
import { useEffect, useMemo, useState } from 'react'
import { db } from '../lib/firebase'
import type { AppUser, Prediction, RankingEntry, RankingPointSource } from '../types'
import { useAllPredictions } from './usePredictions'

const pointFieldLabels: Array<{ field: keyof Pick<
  Prediction,
  'pontosClassificado' | 'pontosPlacar' | 'pontosPenaltis' | 'pontosGols' | 'pontosExtras'
>; label: string }> = [
  { field: 'pontosClassificado', label: 'Classificado correto' },
  { field: 'pontosPlacar', label: 'Placar exato' },
  { field: 'pontosPenaltis', label: 'Penaltis exatos' },
  { field: 'pontosGols', label: 'Gols' },
  { field: 'pontosExtras', label: 'Extras' },
]

function normalizeUser(id: string, data: Partial<AppUser>): AppUser {
  return {
    uid: data.uid || id,
    nome: data.nome || data.email || 'Participante',
    email: data.email || '',
    role: data.role || 'user',
    totalPontos: Number(data.totalPontos || 0),
    createdAt: data.createdAt,
  }
}

function countPredictions(predictions: Prediction[], uid: string) {
  const userPredictions = predictions.filter((prediction) => prediction.userId === uid)
  return {
    feitos: userPredictions.length,
    pontuados: userPredictions.filter((prediction) => prediction.pontuado).length,
  }
}

function pointSourcesForUser(predictions: Prediction[], uid: string): RankingPointSource[] {
  return predictions
    .filter((prediction) => prediction.userId === uid && prediction.pontuado)
    .map((prediction) => {
      const itens = pointFieldLabels
        .map((item) => ({
          label: item.label,
          points: Number(prediction[item.field] || 0),
        }))
        .filter((item) => item.points > 0)

      return {
        predictionId: prediction.id,
        matchId: prediction.matchId,
        matchCode: prediction.matchCode,
        teamA: prediction.teamA,
        teamB: prediction.teamB,
        total: itens.reduce((sum, item) => sum + item.points, 0),
        itens,
      }
    })
    .filter((source) => source.total > 0)
    .sort((a, b) => a.matchCode.localeCompare(b.matchCode))
}

export function useRanking() {
  const [users, setUsers] = useState<AppUser[]>([])
  const [loadingUsers, setLoadingUsers] = useState(Boolean(db))
  const [error, setError] = useState<string | null>(null)
  const { predictions, loading: loadingPredictions } = useAllPredictions()

  useEffect(() => {
    if (!db) {
      setLoadingUsers(false)
      return
    }

    return onSnapshot(
      collection(db, 'users'),
      (snapshot) => {
        setUsers(snapshot.docs.map((item) => normalizeUser(item.id, item.data())))
        setLoadingUsers(false)
      },
      (snapshotError) => {
        setError(snapshotError.message)
        setLoadingUsers(false)
      },
    )
  }, [])

  const ranking = useMemo<RankingEntry[]>(() => {
    return users
      .map((user) => {
        const counters = countPredictions(predictions, user.uid)
        return {
          uid: user.uid,
          nome: user.nome,
          email: user.email,
          totalPontos: user.totalPontos,
          palpitesFeitos: counters.feitos,
          palpitesPontuados: counters.pontuados,
          fontesPontos: pointSourcesForUser(predictions, user.uid),
          posicao: 0,
        }
      })
      .sort((a, b) => b.totalPontos - a.totalPontos || a.nome.localeCompare(b.nome))
      .map((entry, index) => ({ ...entry, posicao: index + 1 }))
  }, [predictions, users])

  return {
    ranking,
    loading: loadingUsers || loadingPredictions,
    error,
  }
}
