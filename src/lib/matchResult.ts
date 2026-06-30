import type { Match, Prediction } from '../types'

export function numberFromForm(value: string) {
  if (value.trim() === '') {
    return null
  }
  return Number(value)
}

export function isDraw(scoreA?: number | null, scoreB?: number | null) {
  return scoreA !== null && scoreA !== undefined && scoreB !== null && scoreB !== undefined && scoreA === scoreB
}

export function winnerFromScores({
  teamA,
  teamB,
  scoreA,
  scoreB,
  penaltiesA,
  penaltiesB,
}: {
  teamA: string
  teamB: string
  scoreA?: number | null
  scoreB?: number | null
  penaltiesA?: number | null
  penaltiesB?: number | null
}) {
  if (scoreA === null || scoreA === undefined || scoreB === null || scoreB === undefined) {
    return ''
  }

  if (scoreA > scoreB) {
    return teamA
  }

  if (scoreB > scoreA) {
    return teamB
  }

  if (
    penaltiesA === null ||
    penaltiesA === undefined ||
    penaltiesB === null ||
    penaltiesB === undefined ||
    penaltiesA === penaltiesB
  ) {
    return ''
  }

  return penaltiesA > penaltiesB ? teamA : teamB
}

export function formatPredictionScore(prediction: Prediction) {
  const base = `${prediction.palpiteA} x ${prediction.palpiteB}`
  if (
    prediction.palpiteA === prediction.palpiteB &&
    prediction.palpitePenaltisA !== null &&
    prediction.palpitePenaltisA !== undefined &&
    prediction.palpitePenaltisB !== null &&
    prediction.palpitePenaltisB !== undefined
  ) {
    return `${base} (${prediction.palpitePenaltisA} x ${prediction.palpitePenaltisB} pen.)`
  }

  return base
}

export function formatMatchScore(match: Match) {
  if (match.scoreA === null || match.scoreA === undefined || match.scoreB === null || match.scoreB === undefined) {
    return '-'
  }

  const base = `${match.scoreA} x ${match.scoreB}`
  if (
    match.scoreA === match.scoreB &&
    match.penaltiesA !== null &&
    match.penaltiesA !== undefined &&
    match.penaltiesB !== null &&
    match.penaltiesB !== undefined
  ) {
    return `${base} (${match.penaltiesA} x ${match.penaltiesB} pen.)`
  }

  return base
}
