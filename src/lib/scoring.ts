import type { Match, Prediction, ScoreFields } from '../types'

export const scoringRules = {
  classified: 1,
  exactScore: 2,
  exactPenalties: 1,
  goalOccurrence: 1,
}

export const scoreFieldLabels: Array<{ field: keyof ScoreFields; label: string }> = [
  { field: 'pontosClassificado', label: 'Classificado' },
  { field: 'pontosPlacar', label: 'Placar exato' },
  { field: 'pontosPenaltis', label: 'Penaltis' },
  { field: 'pontosGols', label: 'Gols' },
  { field: 'pontosExtras', label: 'Extras' },
]

export function emptyScoreFields(): ScoreFields {
  return {
    pontosPlacar: 0,
    pontosPenaltis: 0,
    pontosGols: 0,
    pontosClassificado: 0,
    pontosExtras: 0,
  }
}

export function calculateScoreTotal(scores: ScoreFields) {
  return scoreFieldLabels.reduce((total, item) => total + Number(scores[item.field] || 0), 0)
}

function normalizeScorerName(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\b(gol|gols|penalti|penalty|contra|gc|jr|junior)\b/gi, '')
    .replace(/\d+['’´`]?/g, '')
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

function scorerTokens(name: string) {
  return normalizeScorerName(name)
    .split(/\s+/)
    .filter((token) => token.length >= 3 && !['malvadeza', 'menino', 'craque'].includes(token))
}

function levenshteinDistance(left: string, right: string) {
  const distances = Array.from({ length: left.length + 1 }, (_, index) => index)

  for (let rightIndex = 1; rightIndex <= right.length; rightIndex += 1) {
    let previousDiagonal = distances[0]
    distances[0] = rightIndex

    for (let leftIndex = 1; leftIndex <= left.length; leftIndex += 1) {
      const previousLeft = distances[leftIndex]
      const cost = left[leftIndex - 1] === right[rightIndex - 1] ? 0 : 1
      distances[leftIndex] = Math.min(
        distances[leftIndex] + 1,
        distances[leftIndex - 1] + 1,
        previousDiagonal + cost,
      )
      previousDiagonal = previousLeft
    }
  }

  return distances[left.length]
}

function tokenLooksLikeSamePlayer(left: string, right: string) {
  if (left === right) {
    return true
  }

  const shorter = left.length <= right.length ? left : right
  const longer = left.length > right.length ? left : right

  if (shorter.length >= 4 && longer.startsWith(shorter)) {
    return true
  }

  const maxDistance = longer.length >= 7 ? 2 : 1
  return shorter.length >= 5 && levenshteinDistance(shorter, longer) <= maxDistance
}

export function scorerNamesMatch(predictedName: string, actualName: string) {
  const predictedTokens = scorerTokens(predictedName)
  const actualTokens = scorerTokens(actualName)

  if (predictedTokens.length === 0 || actualTokens.length === 0) {
    return false
  }

  return predictedTokens.some((predictedToken) =>
    actualTokens.some((actualToken) => tokenLooksLikeSamePlayer(predictedToken, actualToken)),
  )
}

export function parseScorersText(text: string) {
  const scorers = new Map<string, number>()

  text
    .split(/[,;\n]+/)
    .map((item) => item.trim())
    .filter(Boolean)
    .forEach((rawItem) => {
      const explicitCount = rawItem.match(
        /(?:\(|\s|^)(?:x\s*)?(\d+)(?:\s*x)?(?:\)|\s*(?:gol|gols)?)?\s*$/i,
      )
      const count = explicitCount ? Math.max(1, Number(explicitCount[1])) : 1
      const withoutCount = explicitCount ? rawItem.slice(0, explicitCount.index).trim() : rawItem
      const name = normalizeScorerName(withoutCount)

      if (!name) {
        return
      }

      scorers.set(name, (scorers.get(name) || 0) + count)
    })

  return scorers
}

export function calculateGoalScorerPoints(predictedText: string, actualText: string) {
  const predicted = parseScorersText(predictedText)
  const actual = parseScorersText(actualText)
  const remainingActual = new Map(actual)

  let points = 0
  predicted.forEach((predictedCount, predictedScorer) => {
    let bestActualScorer = ''
    let bestActualCount = 0

    remainingActual.forEach((actualCount, actualScorer) => {
      if (actualCount > bestActualCount && scorerNamesMatch(predictedScorer, actualScorer)) {
        bestActualScorer = actualScorer
        bestActualCount = actualCount
      }
    })

    const matchedCount = Math.min(predictedCount, bestActualCount)
    if (matchedCount > 0) {
      points += matchedCount * scoringRules.goalOccurrence
      remainingActual.set(bestActualScorer, bestActualCount - matchedCount)
    }
  })

  return points
}

export function calculateAutomaticPredictionScores(
  prediction: Prediction,
  match: Pick<Match, 'scoreA' | 'scoreB' | 'penaltiesA' | 'penaltiesB' | 'winner' | 'scorersTexto'>,
): ScoreFields {
  const exactScore =
    match.scoreA !== null &&
    match.scoreA !== undefined &&
    match.scoreB !== null &&
    match.scoreB !== undefined &&
    prediction.palpiteA === match.scoreA &&
    prediction.palpiteB === match.scoreB
  const exactPenalties =
    match.scoreA === match.scoreB &&
    prediction.palpiteA === prediction.palpiteB &&
    match.penaltiesA !== null &&
    match.penaltiesA !== undefined &&
    match.penaltiesB !== null &&
    match.penaltiesB !== undefined &&
    prediction.palpitePenaltisA !== null &&
    prediction.palpitePenaltisA !== undefined &&
    prediction.palpitePenaltisB !== null &&
    prediction.palpitePenaltisB !== undefined &&
    prediction.palpitePenaltisA === match.penaltiesA &&
    prediction.palpitePenaltisB === match.penaltiesB

  return {
    pontosClassificado:
      match.winner && prediction.classificado === match.winner ? scoringRules.classified : 0,
    pontosPlacar: exactScore ? scoringRules.exactScore : 0,
    pontosPenaltis: exactPenalties ? scoringRules.exactPenalties : 0,
    pontosGols: calculateGoalScorerPoints(
      prediction.jogadoresGolTexto || '',
      match.scorersTexto || '',
    ),
    pontosExtras: prediction.pontosExtras || 0,
  }
}
