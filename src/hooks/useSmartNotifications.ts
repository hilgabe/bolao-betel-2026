import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/auth'
import { useMatches } from './useMatches'
import { useMatchEvents } from './useMatchEvents'
import { useUserPredictions } from './usePredictions'
import { useRanking } from './useRanking'
import { scorerNamesMatch } from '../lib/scoring'
import type { AppNotification, AppUser, Match, MatchEvent, Prediction } from '../types'

const maxStoredNotifications = 50
const liveEventWindowMs = 12 * 60 * 60 * 1000

function storageKey(userId: string, suffix: string) {
  return `bolao-betel-${suffix}-${userId}`
}

function readJson<T>(key: string, fallback: T): T {
  const raw = window.localStorage.getItem(key)
  if (!raw) {
    return fallback
  }

  try {
    return JSON.parse(raw) as T
  } catch {
    window.localStorage.removeItem(key)
    return fallback
  }
}

function writeJson<T>(key: string, value: T) {
  window.localStorage.setItem(key, JSON.stringify(value))
}

function browserNotificationPermission() {
  if (!('Notification' in window)) {
    return 'unsupported'
  }

  return window.Notification.permission
}

function notifyBrowser(notification: AppNotification) {
  if (!('Notification' in window) || window.Notification.permission !== 'granted') {
    return
  }

  new window.Notification(notification.title, {
    body: notification.body,
    icon: '/favicon.svg',
    tag: notification.id,
  })
}

function formatOrdinal(position: number) {
  return `${position}º`
}

function matchStartDate(match: Match) {
  return new Date(`${match.date}T${match.time}:00-03:00`)
}

function predictionReminderNotification(match: Match): AppNotification {
  return {
    id: `reminder-${match.id}`,
    type: 'prediction-reminder',
    title: 'Ainda da tempo de palpitar',
    body: `${match.codigo}: ${match.teamA} x ${match.teamB} comeca as ${match.time}. Falta perto de 1 hora.`,
    createdAtMs: Date.now(),
    read: false,
    link: `/palpite/${match.id}`,
  }
}

function goalNotificationForPrediction(
  event: MatchEvent,
  prediction?: Prediction,
): AppNotification | null {
  if (!prediction || !prediction.jogadoresGolTexto.trim()) {
    return null
  }

  const hit = scorerNamesMatch(prediction.jogadoresGolTexto, event.playerName)
  return {
    id: `event-${event.id}-${hit ? 'hit' : 'miss'}`,
    type: hit ? 'goal-hit' : 'goal-miss',
    title: hit ? 'Voce cravou o gol' : 'Gol fora do seu palpite',
    body: hit
      ? `${event.playerName} fez gol no ${event.matchCode}, do jeitinho que voce chutou. Meu profeta!`
      : `${event.playerName} fez gol no ${event.matchCode}. Esse nome nao estava no seu palpite.`,
    createdAtMs: event.createdAtMs || Date.now(),
    read: false,
    link: `/palpite/${event.matchId}`,
  }
}

function notificationExists(notifications: AppNotification[], id: string) {
  return notifications.some((notification) => notification.id === id)
}

export function useSmartNotifications() {
  const { profile } = useAuth()
  const { matches } = useMatches()
  const { predictions } = useUserPredictions(profile?.uid)
  const { ranking } = useRanking()
  const { events } = useMatchEvents()
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [permission, setPermission] = useState(browserNotificationPermission())

  useEffect(() => {
    if (!profile?.uid) {
      setNotifications([])
      return
    }

    setNotifications(readJson(storageKey(profile.uid, 'notifications'), []))
  }, [profile?.uid])

  const persistNotifications = useCallback(
    (nextNotifications: AppNotification[]) => {
      if (!profile?.uid) {
        return
      }

      const limited = nextNotifications
        .slice()
        .sort((a, b) => b.createdAtMs - a.createdAtMs)
        .slice(0, maxStoredNotifications)
      setNotifications(limited)
      writeJson(storageKey(profile.uid, 'notifications'), limited)
    },
    [profile?.uid],
  )

  const pushNotification = useCallback(
    (notification: AppNotification) => {
      if (!profile?.uid) {
        return
      }

      setNotifications((current) => {
        if (notificationExists(current, notification.id)) {
          return current
        }

        const next = [notification, ...current]
          .sort((a, b) => b.createdAtMs - a.createdAtMs)
          .slice(0, maxStoredNotifications)
        writeJson(storageKey(profile.uid, 'notifications'), next)
        notifyBrowser(notification)
        return next
      })
    },
    [profile?.uid],
  )

  useEffect(() => {
    if (!profile?.uid || events.length === 0) {
      return
    }

    const seenKey = storageKey(profile.uid, 'seen-live-events')
    const seenEvents = new Set(readJson<string[]>(seenKey, []))
    const recentCutoff = Date.now() - liveEventWindowMs
    const predictionsByMatch = new Map(predictions.map((prediction) => [prediction.matchId, prediction]))
    const nextSeenEvents = new Set(seenEvents)

    events
      .filter((event) => event.createdAtMs >= recentCutoff && !seenEvents.has(event.id))
      .forEach((event) => {
        const notification = goalNotificationForPrediction(event, predictionsByMatch.get(event.matchId))
        if (notification) {
          pushNotification(notification)
        }
        nextSeenEvents.add(event.id)
      })

    writeJson(seenKey, [...nextSeenEvents].slice(-200))
  }, [events, predictions, profile?.uid, pushNotification])

  useEffect(() => {
    if (!profile?.uid || matches.length === 0) {
      return
    }

    const remindedKey = storageKey(profile.uid, 'prediction-reminders')
    const remindedMatches = new Set(readJson<string[]>(remindedKey, []))
    const predictionMatchIds = new Set(predictions.map((prediction) => prediction.matchId))
    const now = Date.now()
    const nextRemindedMatches = new Set(remindedMatches)

    matches.forEach((match) => {
      if (match.status === 'finished' || predictionMatchIds.has(match.id) || remindedMatches.has(match.id)) {
        return
      }

      const minutesUntilStart = (matchStartDate(match).getTime() - now) / 60000
      if (minutesUntilStart > 0 && minutesUntilStart <= 60) {
        pushNotification(predictionReminderNotification(match))
        nextRemindedMatches.add(match.id)
      }
    })

    writeJson(remindedKey, [...nextRemindedMatches])
  }, [matches, predictions, profile?.uid, pushNotification])

  useEffect(() => {
    if (!profile?.uid || ranking.length === 0) {
      return
    }

    const currentRanking = ranking.find((entry) => entry.uid === profile.uid)
    if (!currentRanking) {
      return
    }

    const positionKey = storageKey(profile.uid, 'last-position')
    const previousPosition = Number(window.localStorage.getItem(positionKey) || 0)

    if (previousPosition > 0 && currentRanking.posicao < previousPosition) {
      pushNotification({
        id: `rank-up-${currentRanking.posicao}-${Date.now()}`,
        type: 'rank-up',
        title: 'Voce subiu no ranking',
        body: `Passou! Agora voce esta em ${formatOrdinal(currentRanking.posicao)}. Abre o ranking para ver.`,
        createdAtMs: Date.now(),
        read: false,
        link: '/ranking',
      })
    }

    window.localStorage.setItem(positionKey, String(currentRanking.posicao))
  }, [profile?.uid, pushNotification, ranking])

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.read).length,
    [notifications],
  )

  function markAllRead() {
    persistNotifications(
      notifications.map((notification) => ({
        ...notification,
        read: true,
      })),
    )
  }

  function openNotification(notification: AppNotification) {
    persistNotifications(
      notifications.map((item) =>
        item.id === notification.id ? { ...item, read: true } : item,
      ),
    )

    if (notification.link) {
      navigate(notification.link)
    }
  }

  async function requestBrowserPermission() {
    if (!('Notification' in window)) {
      setPermission('unsupported')
      return
    }

    const nextPermission = await window.Notification.requestPermission()
    setPermission(nextPermission)
  }

  return {
    notifications,
    unreadCount,
    permission,
    markAllRead,
    openNotification,
    requestBrowserPermission,
    profile: profile as AppUser | null,
  }
}
