import { addDoc, collection, onSnapshot, query, serverTimestamp, where } from 'firebase/firestore'
import { useEffect, useMemo, useState } from 'react'
import { db } from '../lib/firebase'
import type { Match, MatchEvent } from '../types'

function normalizeMatchEvent(id: string, data: Partial<MatchEvent>): MatchEvent {
  return {
    id,
    type: data.type || 'goal',
    matchId: data.matchId || '',
    matchCode: data.matchCode || '',
    teamA: data.teamA || '',
    teamB: data.teamB || '',
    playerName: data.playerName || '',
    createdAtMs: Number(data.createdAtMs || 0),
    createdAt: data.createdAt,
  }
}

export function useMatchEvents(matchId?: string) {
  const [events, setEvents] = useState<MatchEvent[]>([])
  const [loading, setLoading] = useState(Boolean(db))
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!db) {
      setLoading(false)
      return
    }

    const source = matchId
      ? query(collection(db, 'matchEvents'), where('matchId', '==', matchId))
      : collection(db, 'matchEvents')

    return onSnapshot(
      source,
      (snapshot) => {
        setEvents(snapshot.docs.map((item) => normalizeMatchEvent(item.id, item.data())))
        setLoading(false)
      },
      (snapshotError) => {
        setError(snapshotError.message)
        setLoading(false)
      },
    )
  }, [matchId])

  const sortedEvents = useMemo(
    () => [...events].sort((a, b) => b.createdAtMs - a.createdAtMs),
    [events],
  )

  return { events: sortedEvents, loading, error }
}

export async function addGoalMatchEvent(match: Match, playerName: string) {
  if (!db) {
    throw new Error('Firebase nao configurado.')
  }

  await addDoc(collection(db, 'matchEvents'), {
    type: 'goal',
    matchId: match.id,
    matchCode: match.codigo,
    teamA: match.teamA,
    teamB: match.teamB,
    playerName: playerName.trim(),
    createdAtMs: Date.now(),
    createdAt: serverTimestamp(),
  })
}
