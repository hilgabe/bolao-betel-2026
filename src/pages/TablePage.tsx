import { CheckCircle2, Clock } from 'lucide-react'
import { useMemo } from 'react'
import { TeamLabel } from '../components/TeamLabel'
import { useMatches } from '../hooks/useMatches'
import { formatMatchScore } from '../lib/matchResult'
import type { Match } from '../types'

const phaseOrder = [
  '1\u00aa fase mata-mata',
  'Oitavas de final',
  'Quartas de final',
  'Semifinais',
  'Decis\u00e3o do 3\u00ba lugar',
  'Final',
]

function hasResult(match: Match) {
  return (
    match.scoreA !== null &&
    match.scoreA !== undefined &&
    match.scoreB !== null &&
    match.scoreB !== undefined
  )
}

function sourceMatchFromCode(rawCode: string, matchesByCode: Map<string, Match>) {
  const directMatch = matchesByCode.get(`J${rawCode}`)
  if (directMatch) {
    return directMatch
  }

  if (rawCode === '101') {
    return matchesByCode.get('J01')
  }

  if (rawCode === '102') {
    return matchesByCode.get('J02')
  }

  return undefined
}

function resolveTeamSlot(
  team: string,
  matchesByCode: Map<string, Match>,
  visited = new Set<string>(),
): string {
  const winnerMatch = /^W(\d+)$/.exec(team)
  if (winnerMatch) {
    const sourceMatch = sourceMatchFromCode(winnerMatch[1], matchesByCode)
    if (!sourceMatch?.winner) {
      return team
    }

    return sourceMatch.winner
  }

  const runnerUpMatch = /^RU(\d+)$/.exec(team)
  if (runnerUpMatch) {
    const sourceMatch = sourceMatchFromCode(runnerUpMatch[1], matchesByCode)
    if (!sourceMatch?.winner || visited.has(sourceMatch.codigo)) {
      return team
    }

    visited.add(sourceMatch.codigo)
    const sourceTeamA = resolveTeamSlot(sourceMatch.teamA, matchesByCode, visited)
    const sourceTeamB = resolveTeamSlot(sourceMatch.teamB, matchesByCode, visited)

    if (sourceMatch.winner === sourceTeamA) {
      return sourceTeamB
    }

    if (sourceMatch.winner === sourceTeamB) {
      return sourceTeamA
    }
  }

  return team
}

function MatchBracketCard({
  match,
  matchesByCode,
}: {
  match: Match
  matchesByCode: Map<string, Match>
}) {
  const resultReady = hasResult(match)
  const teamA = resolveTeamSlot(match.teamA, matchesByCode)
  const teamB = resolveTeamSlot(match.teamB, matchesByCode)
  const fallbackFlagA = teamA === match.teamA ? match.flagA : ''
  const fallbackFlagB = teamB === match.teamB ? match.flagB : ''

  return (
    <article className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="rounded-lg bg-betel-ink px-2 py-1 text-xs font-black text-white">
          {match.codigo}
        </span>
        <span
          className={[
            'status-pill',
            resultReady ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-600',
          ].join(' ')}
        >
          {resultReady ? (
            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
          ) : (
            <Clock className="h-3.5 w-3.5" aria-hidden="true" />
          )}
          {resultReady ? 'Atualizado' : 'Aguardando'}
        </span>
      </div>

      <div className="space-y-2">
        <div
          className={[
            'flex items-center justify-between gap-3 rounded-lg px-2 py-2',
            match.winner === teamA ? 'bg-green-50' : 'bg-slate-50',
          ].join(' ')}
        >
          <TeamLabel team={teamA} fallbackFlag={fallbackFlagA} />
          <span className="text-xl font-black text-slate-950">
            {resultReady ? match.scoreA : '-'}
          </span>
        </div>
        <div
          className={[
            'flex items-center justify-between gap-3 rounded-lg px-2 py-2',
            match.winner === teamB ? 'bg-green-50' : 'bg-slate-50',
          ].join(' ')}
        >
          <TeamLabel team={teamB} fallbackFlag={fallbackFlagB} />
          <span className="text-xl font-black text-slate-950">
            {resultReady ? match.scoreB : '-'}
          </span>
        </div>
      </div>

      {match.winner ? (
        <p className="mt-3 text-sm font-bold text-green-800">Classificado: {match.winner}</p>
      ) : null}
      {resultReady ? (
        <p className="mt-1 text-sm font-bold text-slate-700">Placar: {formatMatchScore(match)}</p>
      ) : null}
      {match.scorersTexto ? (
        <p className="mt-2 text-sm text-slate-600">Gols: {match.scorersTexto}</p>
      ) : null}
    </article>
  )
}

export function TablePage() {
  const { matches, loading, error } = useMatches()
  const matchesByCode = useMemo(
    () => new Map(matches.map((match) => [match.codigo, match])),
    [matches],
  )

  const groupedMatches = phaseOrder
    .map((phase) => ({
      phase,
      matches: matches.filter((match) => match.fase === phase),
    }))
    .filter((group) => group.matches.length > 0)

  return (
    <div className="page-wrap">
      <section className="mb-5">
        <p className="text-sm font-bold uppercase text-betel-blue">Copa do Mundo 2026</p>
        <h1 className="mt-1 text-3xl font-black text-slate-950">Tabela dinamica</h1>
        <p className="mt-2 text-sm text-slate-600">
          Esta tabela atualiza em tempo real com os resultados oficiais salvos no admin.
        </p>
      </section>

      {loading ? <p className="text-sm font-bold text-slate-600">Carregando tabela...</p> : null}
      {error ? <p className="text-sm font-bold text-red-700">{error}</p> : null}

      <div className="overflow-x-auto pb-3">
        <div
          className="grid min-w-[1180px] gap-4"
          style={{ gridTemplateColumns: `repeat(${groupedMatches.length}, minmax(220px, 1fr))` }}
        >
          {groupedMatches.map((group) => (
            <section key={group.phase} className="space-y-3">
              <h2 className="rounded-lg bg-betel-blue px-3 py-2 text-center text-sm font-black uppercase text-white shadow-sm">
                {group.phase}
              </h2>
              <div className="grid gap-3">
                {group.matches.map((match) => (
                  <MatchBracketCard key={match.id} match={match} matchesByCode={matchesByCode} />
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  )
}
