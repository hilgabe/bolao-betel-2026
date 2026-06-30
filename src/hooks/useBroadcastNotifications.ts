import { addDoc, collection, onSnapshot, serverTimestamp } from 'firebase/firestore'
import { useEffect, useMemo, useState } from 'react'
import { db } from '../lib/firebase'
import type { BroadcastNotification } from '../types'

function normalizeBroadcastNotification(
  id: string,
  data: Partial<BroadcastNotification>,
): BroadcastNotification {
  return {
    id,
    title: data.title || 'Aviso do bolao',
    body: data.body || '',
    createdAtMs: Number(data.createdAtMs || 0),
    link: data.link || '/jogos',
    createdAt: data.createdAt,
  }
}

export function useBroadcastNotifications() {
  const [broadcasts, setBroadcasts] = useState<BroadcastNotification[]>([])
  const [loading, setLoading] = useState(Boolean(db))
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!db) {
      setLoading(false)
      return
    }

    return onSnapshot(
      collection(db, 'broadcastNotifications'),
      (snapshot) => {
        setBroadcasts(
          snapshot.docs.map((item) => normalizeBroadcastNotification(item.id, item.data())),
        )
        setLoading(false)
      },
      (snapshotError) => {
        setError(snapshotError.message)
        setLoading(false)
      },
    )
  }, [])

  const sortedBroadcasts = useMemo(
    () => [...broadcasts].sort((a, b) => b.createdAtMs - a.createdAtMs),
    [broadcasts],
  )

  return { broadcasts: sortedBroadcasts, loading, error }
}

export async function sendBroadcastNotification({
  title,
  body,
  link = '/jogos',
}: {
  title: string
  body: string
  link?: string
}) {
  if (!db) {
    throw new Error('Firebase nao configurado.')
  }

  await addDoc(collection(db, 'broadcastNotifications'), {
    title,
    body,
    link,
    createdAtMs: Date.now(),
    createdAt: serverTimestamp(),
  })
}
