import type { Match, Prediction, ScoreFields } from '../types'

export const scoringRules = {
  classified: 1,
  exactScore: 2,
  goalOccurrence: 1,
}

export const scoreFieldLabels: Array<{ field: keyof ScoreFields; label: string }> = [
  { field: 'pontosClassificado', label: 'Classificado' },
  { field: 'pontosPlacar', label: 'Placar exato' },
  { field: 'pontosGols', label: 'Gols' },
  { field: 'pontosExtras', label: 'Extras' },
]

export function emptyScoreFields(): ScoreFields {
  return {
    pontosPlacar: 0,
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
    .replace(/\b(gol|gols|penalti|penalty|contra|gc)\b/gi, '')
    .replace(/\d+['’´`]?/g, '')
    .replace(/[()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
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

  let points = 0
  predicted.forEach((predictedCount, scorer) => {
    const actualCount = actual.get(scorer) || 0
    points += Math.min(predictedCount, actualCount) * scoringRules.goalOccurrence
  })

  return points
}

export function calculateAutomaticPredictionScores(
  prediction: Prediction,
  match: Pick<Match, 'scoreA' | 'scoreB' | 'winner' | 'scorersTexto'>,
): ScoreFields {
  const exactScore =
    match.scoreA !== null &&
    match.scoreA !== undefined &&
    match.scoreB !== null &&
    match.scoreB !== undefined &&
    prediction.palpiteA === match.scoreA &&
    prediction.palpiteB === match.scoreB

  return {
    pontosClassificado:
      match.winner && prediction.classificado === match.winner ? scoringRules.classified : 0,
    pontosPlacar: exactScore ? scoringRules.exactScore : 0,
    pontosGols: calculateGoalScorerPoints(
      prediction.jogadoresGolTexto || '',
      match.scorersTexto || '',
    ),
    pontosExtras: prediction.pontosExtras || 0,
  }
}
