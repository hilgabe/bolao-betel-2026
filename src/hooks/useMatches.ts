import { collection, doc, onSnapshot, serverTimestamp, setDoc, writeBatch } from 'firebase/firestore'
import { useEffect, useMemo, useState } from 'react'
import { initialMatches, sortMatches } from '../data/matches'
import { db } from '../lib/firebase'
import type { Match } from '../types'

const defaultManualOpenMatchIds = new Set<string>()

function normalizeMatch(id: string, data: Partial<Match>): Match {
  return {
    id,
    codigo: data.codigo || id,
    fase: data.fase || 'Mata-mata',
    date: data.date || '2026-06-28',
    time: data.time || '00:00',
    teamA: data.teamA || '',
    teamB: data.teamB || '',
    flagA: data.flagA || '',
    flagB: data.flagB || '',
    status: data.status || 'scheduled',
    manualOpen: data.manualOpen ?? defaultManualOpenMatchIds.has(id),
    scoreA: data.scoreA ?? null,
    scoreB: data.scoreB ?? null,
    winner: data.winner || '',
    scorersTexto: data.scorersTexto || '',
    resultUpdatedAt: data.resultUpdatedAt,
  }
}

function mergeInitialAndRemoteMatches(remoteMatches: Match[]) {
  const remoteById = new Map(remoteMatches.map((match) => [match.id, match]))
  const merged = initialMatches.map((initialMatch) => {
    const remoteMatch = remoteById.get(initialMatch.id)
    return {
      ...initialMatch,
      manualOpen: defaultManualOpenMatchIds.has(initialMatch.id),
      ...remoteMatch,
    }
  })

  const extraRemoteMatches = remoteMatches.filter(
    (remoteMatch) => !initialMatches.some((initialMatch) => initialMatch.id === remoteMatch.id),
  )

  return sortMatches([...merged, ...extraRemoteMatches])
}

export function useMatches() {
  const [remoteMatches, setRemoteMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(Boolean(db))
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!db) {
      setLoading(false)
      return
    }

    return onSnapshot(
      collection(db, 'matches'),
      (snapshot) => {
        setRemoteMatches(
          snapshot.docs.map((item) => normalizeMatch(item.id, item.data())),
        )
        setLoading(false)
      },
      (snapshotError) => {
        setError(snapshotError.message)
        setLoading(false)
      },
    )
  }, [])

  const matches = useMemo(
    () => mergeInitialAndRemoteMatches(remoteMatches),
    [remoteMatches],
  )

  return { matches, loading, error, usingInitialData: remoteMatches.length === 0 }
}

export async function seedInitialMatches() {
  if (!db) {
    throw new Error('Firebase não configurado.')
  }

  const firestore = db
  const batch = writeBatch(firestore)
  initialMatches.forEach((match) => {
    batch.set(
      doc(firestore, 'matches', match.id),
      {
        ...match,
        seededAt: serverTimestamp(),
      },
      { merge: true },
    )
  })
  await batch.commit()
}

export async function saveMatch(match: Match) {
  if (!db) {
    throw new Error('Firebase não configurado.')
  }

  const firestore = db
  await setDoc(doc(firestore, 'matches', match.id), match, { merge: true })
}
