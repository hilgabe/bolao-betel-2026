import { Activity, BarChart3, Filter, Flame, Search, Target, Trophy, Users } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useMatches } from '../hooks/useMatches'
import { useAllPredictions } from '../hooks/usePredictions'
import { useRanking } from '../hooks/useRanking'
import { formatDateBR } from '../lib/time'
import type { Match, Prediction } from '../types'

type StatusFilter = 'all' | 'scheduled' | 'active' | 'finished'

interface MatchPanelStats {
  match: Match
  predictions: number
  scored: number
  classifiedHits: number
  exactScoreHits: number
  penaltyHits: number
  goalHits: number
  totalPoints: number
}

interface UserPanelStats {
  uid: string
  name: string
  points: number
  predictions: number
  scored: number
  classifiedHits: number
  exactScoreHits: number
  penaltyHits: number
  goalHits: number
}

function percent(value: number, total: number) {
  if (total === 0) {
    return '0%'
  }

  return `${Math.round((value / total) * 100)}%`
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 }).format(value)
}

function hasOfficialResult(match: Match) {
  return Boolean(match.winner || match.status === 'finished')
}

function matchesSearch(match: Match, query: string) {
  if (!query) {
    return true
  }

  const text = `${match.codigo} ${match.teamA} ${match.teamB} ${match.fase}`.toLowerCase()
  return text.includes(query.toLowerCase())
}

function predictionHasSearch(prediction: Prediction, query: string) {
  if (!query) {
    return true
  }

  const text = `${prediction.userName} ${prediction.matchCode} ${prediction.teamA} ${prediction.teamB}`.toLowerCase()
  return text.includes(query.toLowerCase())
}

function MetricCard({
  title,
  value,
  detail,
  icon: Icon,
  tone = 'blue',
}: {
  title: string
  value: string | number
  detail: string
  icon: LucideIcon
  tone?: 'blue' | 'green' | 'yellow' | 'red'
}) {
  const colors = {
    blue: 'text-betel-blue bg-blue-50',
    green: 'text-green-700 bg-green-50',
    yellow: 'text-yellow-700 bg-yellow-50',
    red: 'text-red-700 bg-red-50',
  }

  return (
    <article className="panel p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-slate-500">{title}</p>
          <p className="mt-2 text-3xl font-black text-slate-950">{value}</p>
          <p className="mt-1 text-sm text-slate-600">{detail}</p>
        </div>
        <span className={`grid h-10 w-10 place-items-center rounded-lg ${colors[tone]}`}>
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
      </div>
    </article>
  )
}

function EmptyPanel({ children }: { children: string }) {
  return <div className="rounded-lg bg-slate-50 p-4 text-sm text-slate-600">{children}</div>
}

function MatchStatsCard({ item, maxPoints }: { item: MatchPanelStats; maxPoints: number }) {
  const hitTotal = item.classifiedHits + item.exactScoreHits + item.penaltyHits + item.goalHits
  const width = maxPoints > 0 ? Math.max(8, Math.round((item.totalPoints / maxPoints) * 100)) : 0

  return (
    <article className="rounded-lg border border-slate-200 bg-white p-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-lg bg-betel-ink px-2 py-1 text-xs font-black text-white">
              {item.match.codigo}
            </span>
            <span className="text-xs font-bold uppercase text-slate-500">{item.match.fase}</span>
          </div>
          <p className="mt-2 text-base font-black text-slate-950">
            {item.match.teamA} x {item.match.teamB}
          </p>
          <p className="mt-1 text-sm text-slate-600">
            {formatDateBR(item.match.date)} as {item.match.time}
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-black text-slate-950">{item.totalPoints}</p>
          <p className="text-xs font-bold uppercase text-slate-500">pts gerados</p>
        </div>
      </div>

      <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-betel-blue" style={{ width: `${width}%` }} />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-xs font-bold text-slate-600 sm:grid-cols-4">
        <span>{item.predictions} palpites</span>
        <span>{item.classifiedHits} classif.</span>
        <span>{item.exactScoreHits} placares</span>
        <span>{hitTotal} acertos</span>
      </div>
    </article>
  )
}

function UserStatsRow({ item, index, maxPoints }: { item: UserPanelStats; index: number; maxPoints: number }) {
  const width = maxPoints > 0 ? Math.max(8, Math.round((item.points / maxPoints) * 100)) : 0

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-black text-slate-950">
            {index + 1}º - {item.name}
          </p>
          <p className="mt-1 text-xs text-slate-600">
            {item.predictions} palpites, {item.scored} pontuados
          </p>
        </div>
        <div className="text-right">
          <p className="text-xl font-black text-slate-950">{item.points}</p>
          <p className="text-xs font-bold uppercase text-slate-500">pts</p>
        </div>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-green-500" style={{ width: `${width}%` }} />
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <span className="rounded-lg bg-blue-50 px-2 py-1 text-xs font-bold text-blue-700">
          {item.classifiedHits} classif.
        </span>
        <span className="rounded-lg bg-yellow-50 px-2 py-1 text-xs font-bold text-yellow-700">
          {item.exactScoreHits} placares
        </span>
        <span className="rounded-lg bg-green-50 px-2 py-1 text-xs font-bold text-green-700">
          {item.goalHits} gols
        </span>
      </div>
    </div>
  )
}

export function PanelPage() {
  const { matches, loading: loadingMatches, error: matchesError } = useMatches()
  const { predictions, loading: loadingPredictions, error: predictionsError } = useAllPredictions()
  const { ranking, loading: loadingRanking, error: rankingError } = useRanking()
  const [phaseFilter, setPhaseFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [query, setQuery] = useState('')

  const phases = useMemo(
    () => [...new Set(matches.map((match) => match.fase))],
    [matches],
  )

  const matchesById = useMemo(
    () => new Map(matches.map((match) => [match.id, match])),
    [matches],
  )

  const filteredMatches = useMemo(() => {
    return matches.filter((match) => {
      const phaseMatches = phaseFilter === 'all' || match.fase === phaseFilter
      const statusMatches = statusFilter === 'all' || match.status === statusFilter
      return phaseMatches && statusMatches && matchesSearch(match, query)
    })
  }, [matches, phaseFilter, query, statusFilter])

  const filteredMatchIds = useMemo(
    () => new Set(filteredMatches.map((match) => match.id)),
    [filteredMatches],
  )

  const filteredPredictions = useMemo(() => {
    return predictions.filter((prediction) => {
      const match = matchesById.get(prediction.matchId)
      const matchIncluded = filteredMatchIds.has(prediction.matchId)
      const directSearch = predictionHasSearch(prediction, query)
      const matchSearch = match ? matchesSearch(match, query) : false
      return matchIncluded && (directSearch || matchSearch)
    })
  }, [filteredMatchIds, matchesById, predictions, query])

  const matchStats = useMemo<MatchPanelStats[]>(() => {
    return filteredMatches
      .map((match) => {
        const matchPredictions = predictions.filter((prediction) => prediction.matchId === match.id)
        return {
          match,
          predictions: matchPredictions.length,
          scored: matchPredictions.filter((prediction) => prediction.pontuado).length,
          classifiedHits: matchPredictions.filter((prediction) => prediction.pontosClassificado > 0).length,
          exactScoreHits: matchPredictions.filter((prediction) => prediction.pontosPlacar > 0).length,
          penaltyHits: matchPredictions.filter((prediction) => prediction.pontosPenaltis > 0).length,
          goalHits: matchPredictions.filter((prediction) => prediction.pontosGols > 0).length,
          totalPoints: matchPredictions.reduce((sum, prediction) => sum + prediction.totalPontos, 0),
        }
      })
      .sort((left, right) => right.totalPoints - left.totalPoints || right.exactScoreHits - left.exactScoreHits)
  }, [filteredMatches, predictions])

  const userStats = useMemo<UserPanelStats[]>(() => {
    const byUser = new Map<string, UserPanelStats>()

    filteredPredictions.forEach((prediction) => {
      const current = byUser.get(prediction.userId) || {
        uid: prediction.userId,
        name: prediction.userName,
        points: 0,
        predictions: 0,
        scored: 0,
        classifiedHits: 0,
        exactScoreHits: 0,
        penaltyHits: 0,
        goalHits: 0,
      }

      current.points += prediction.totalPontos
      current.predictions += 1
      current.scored += prediction.pontuado ? 1 : 0
      current.classifiedHits += prediction.pontosClassificado > 0 ? 1 : 0
      current.exactScoreHits += prediction.pontosPlacar > 0 ? 1 : 0
      current.penaltyHits += prediction.pontosPenaltis > 0 ? 1 : 0
      current.goalHits += prediction.pontosGols > 0 ? 1 : 0
      byUser.set(prediction.userId, current)
    })

    return [...byUser.values()].sort((left, right) => right.points - left.points || left.name.localeCompare(right.name))
  }, [filteredPredictions])

  const scoredPredictions = filteredPredictions.filter((prediction) => prediction.pontuado)
  const exactScoreHits = filteredPredictions.filter((prediction) => prediction.pontosPlacar > 0).length
  const classifiedHits = filteredPredictions.filter((prediction) => prediction.pontosClassificado > 0).length
  const goalHits = filteredPredictions.filter((prediction) => prediction.pontosGols > 0).length
  const totalPoints = filteredPredictions.reduce((sum, prediction) => sum + prediction.totalPontos, 0)
  const finishedMatches = filteredMatches.filter(hasOfficialResult)
  const matchesWithoutScore = filteredMatches.filter(
    (match) => hasOfficialResult(match) && !predictions.some((prediction) => prediction.matchId === match.id && prediction.pontuado),
  )
  const maxMatchPoints = Math.max(...matchStats.map((item) => item.totalPoints), 0)
  const maxUserPoints = Math.max(...userStats.map((item) => item.points), 0)
  const topRanking = ranking.slice(0, 3)
  const loading = loadingMatches || loadingPredictions || loadingRanking
  const error = matchesError || predictionsError || rankingError

  return (
    <div className="page-wrap">
      <section className="mb-5">
        <p className="text-sm font-bold uppercase text-betel-blue">Gestao a vista</p>
        <h1 className="mt-1 text-3xl font-black text-slate-950">Painel do bolao</h1>
        <p className="mt-2 text-sm text-slate-600">
          Visao rapida dos palpites, acertos, jogos mais previsiveis e participantes em destaque.
        </p>
      </section>

      <section className="panel mb-5 p-4">
        <div className="mb-3 flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-500" aria-hidden="true" />
          <h2 className="text-base font-black text-slate-950">Filtros</h2>
        </div>
        <div className="grid gap-3 md:grid-cols-[1fr_1fr_2fr]">
          <label>
            <span className="label">Fase</span>
            <select
              className="input mt-1"
              value={phaseFilter}
              onChange={(event) => setPhaseFilter(event.target.value)}
            >
              <option value="all">Todas as fases</option>
              {phases.map((phase) => (
                <option key={phase} value={phase}>
                  {phase}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="label">Status</span>
            <select
              className="input mt-1"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
            >
              <option value="all">Todos</option>
              <option value="scheduled">Agendados</option>
              <option value="active">Ao vivo</option>
              <option value="finished">Finalizados</option>
            </select>
          </label>
          <label>
            <span className="label">Buscar jogo ou pessoa</span>
            <div className="mt-1 flex items-center rounded-lg border border-slate-300 bg-white px-3 focus-within:border-betel-blue focus-within:ring-4 focus-within:ring-blue-100">
              <Search className="h-4 w-4 shrink-0 text-slate-500" aria-hidden="true" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Gabriel, J76, BRA, semifinal..."
                className="w-full border-0 bg-transparent px-2 py-2 text-sm outline-none"
              />
            </div>
          </label>
        </div>
      </section>

      {loading ? <p className="text-sm font-bold text-slate-600">Carregando painel...</p> : null}
      {error ? <p className="text-sm font-bold text-red-700">{error}</p> : null}

      <section className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Participantes"
          value={ranking.length}
          detail={`${filteredPredictions.length} palpites no filtro`}
          icon={Users}
        />
        <MetricCard
          title="Jogos com resultado"
          value={finishedMatches.length}
          detail={`${filteredMatches.length} jogos no recorte`}
          icon={Activity}
          tone="green"
        />
        <MetricCard
          title="Taxa de placar exato"
          value={percent(exactScoreHits, scoredPredictions.length)}
          detail={`${exactScoreHits} placares em ${scoredPredictions.length} palpites pontuados`}
          icon={Target}
          tone="yellow"
        />
        <MetricCard
          title="Pontos gerados"
          value={totalPoints}
          detail={`${formatNumber(totalPoints / Math.max(1, scoredPredictions.length))} pts por palpite pontuado`}
          icon={Trophy}
          tone="red"
        />
      </section>

      <section className="mb-5 grid gap-5 lg:grid-cols-[1.15fr_.85fr]">
        <div className="panel p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold uppercase text-betel-blue">Jogos</p>
              <h2 className="text-xl font-black text-slate-950">Mais acertados pela galera</h2>
            </div>
            <BarChart3 className="h-5 w-5 text-slate-400" aria-hidden="true" />
          </div>
          <div className="grid gap-3">
            {matchStats.slice(0, 6).map((item) => (
              <MatchStatsCard key={item.match.id} item={item} maxPoints={maxMatchPoints} />
            ))}
            {matchStats.length === 0 ? <EmptyPanel>Nenhum jogo encontrado neste filtro.</EmptyPanel> : null}
          </div>
        </div>

        <div className="panel p-4">
          <div className="mb-3">
            <p className="text-sm font-bold uppercase text-betel-blue">Destaques</p>
            <h2 className="text-xl font-black text-slate-950">Quem mais pontuou</h2>
          </div>
          <div className="grid gap-3">
            {userStats.slice(0, 6).map((item, index) => (
              <UserStatsRow key={item.uid} item={item} index={index} maxPoints={maxUserPoints} />
            ))}
            {userStats.length === 0 ? <EmptyPanel>Nenhum participante neste filtro.</EmptyPanel> : null}
          </div>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-3">
        <div className="panel p-4">
          <div className="mb-3 flex items-center gap-2">
            <Flame className="h-5 w-5 text-betel-red" aria-hidden="true" />
            <h2 className="text-xl font-black text-slate-950">Raio-X dos acertos</h2>
          </div>
          <div className="grid gap-3 text-sm">
            <div className="flex items-center justify-between rounded-lg bg-slate-50 p-3">
              <span className="font-bold text-slate-600">Classificado correto</span>
              <span className="font-black text-slate-950">
                {classifiedHits} ({percent(classifiedHits, scoredPredictions.length)})
              </span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-slate-50 p-3">
              <span className="font-bold text-slate-600">Placar exato</span>
              <span className="font-black text-slate-950">
                {exactScoreHits} ({percent(exactScoreHits, scoredPredictions.length)})
              </span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-slate-50 p-3">
              <span className="font-bold text-slate-600">Jogador do gol</span>
              <span className="font-black text-slate-950">
                {goalHits} ({percent(goalHits, scoredPredictions.length)})
              </span>
            </div>
          </div>
        </div>

        <div className="panel p-4">
          <h2 className="text-xl font-black text-slate-950">Pontos de atencao</h2>
          <div className="mt-3 grid gap-2">
            {matchesWithoutScore.slice(0, 5).map((match) => (
              <div key={match.id} className="rounded-lg bg-yellow-50 p-3 text-sm font-bold text-yellow-800">
                {match.codigo} tem resultado, mas ainda nao tem palpites pontuados.
              </div>
            ))}
            {matchesWithoutScore.length === 0 ? (
              <EmptyPanel>Nenhum alerta operacional neste recorte.</EmptyPanel>
            ) : null}
          </div>
        </div>

        <div className="panel p-4">
          <h2 className="text-xl font-black text-slate-950">Podio atual</h2>
          <div className="mt-3 grid gap-2">
            {topRanking.map((entry) => (
              <div key={entry.uid} className="flex items-center justify-between rounded-lg bg-slate-50 p-3">
                <span className="font-black text-slate-950">
                  {entry.posicao}º - {entry.nome}
                </span>
                <span className="font-black text-betel-blue">{entry.totalPontos} pts</span>
              </div>
            ))}
            {topRanking.length === 0 ? <EmptyPanel>Ranking ainda vazio.</EmptyPanel> : null}
          </div>
        </div>
      </section>
    </div>
  )
}
