import type { AvailabilityState, Match } from '../types'

const saoPauloTimeZone = 'America/Sao_Paulo'

function dateParts(now = new Date()) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: saoPauloTimeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  const parts = formatter.formatToParts(now)
  const year = parts.find((part) => part.type === 'year')?.value ?? '2026'
  const month = parts.find((part) => part.type === 'month')?.value ?? '01'
  const day = parts.find((part) => part.type === 'day')?.value ?? '01'
  return `${year}-${month}-${day}`
}

function clockMinutes(now = new Date()) {
  const formatter = new Intl.DateTimeFormat('pt-BR', {
    timeZone: saoPauloTimeZone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
  const [hour = '0', minute = '0'] = formatter.format(now).split(':')
  return Number(hour) * 60 + Number(minute)
}

export function getSaoPauloToday() {
  return dateParts()
}

export function formatDateBR(date: string) {
  const [year, month, day] = date.split('-')
  return `${day}/${month}/${year}`
}

export function formatMatchDateTime(match: Match) {
  return `${formatDateBR(match.date)} às ${match.time}`
}

export function matchStartMinutes(match: Match) {
  const [hour = '0', minute = '0'] = match.time.split(':')
  return Number(hour) * 60 + Number(minute)
}

export function getMatchAvailability(match: Match, now = new Date()) {
  if (match.manualOpen) {
    return {
      state: 'open' as AvailabilityState,
      message: 'Palpite liberado manualmente pelo admin.',
      isOpen: true,
      label: 'Liberado manual',
    }
  }

  const today = dateParts(now)
  let state: AvailabilityState = 'future'
  let message = 'Este jogo ainda não está liberado.'

  if (match.date < today) {
    state = 'closed'
    message = 'O prazo para este palpite já encerrou.'
  } else if (match.date === today) {
    if (clockMinutes(now) >= matchStartMinutes(match)) {
      state = 'closed'
      message = 'O prazo para este palpite já encerrou.'
    } else {
      state = 'open'
      message = 'Palpite liberado para hoje.'
    }
  }

  return {
    state,
    message,
    isOpen: state === 'open',
    label:
      state === 'open' ? 'Liberado hoje' : state === 'future' ? 'Bloqueado' : 'Encerrado',
  }
}
