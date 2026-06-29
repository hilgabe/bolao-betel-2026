import { collection, onSnapshot } from 'firebase/firestore'
import { useEffect, useMemo, useState } from 'react'
import { db } from '../lib/firebase'
import type { AppUser, Prediction, RankingEntry } from '../types'
import { useAllPredictions } from './usePredictions'

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
