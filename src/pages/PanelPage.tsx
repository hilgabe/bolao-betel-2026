import {
  AlertTriangle,
  BarChart3,
  Filter,
  LineChart,
  PieChart,
  Search,
  Target,
  Trophy,
  Users,
} from 'lucide-react'
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

interface ChartSlice {
  label: string
  value: number
  color: string
}

interface LinePoint {
  label: string
  value: number
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

  const text =
    `${prediction.userName} ${prediction.matchCode} ${prediction.teamA} ${prediction.teamB}`.toLowerCase()
  return text.includes(query.toLowerCase())
}

function polarToCartesian(center: number, radius: number, angle: number) {
  const radians = ((angle - 90) * Math.PI) / 180
  return {
    x: center + radius * Math.cos(radians),
    y: center + radius * Math.sin(radians),
  }
}

function describeArc(center: number, radius: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(center, radius, endAngle)
  const end = polarToCartesian(center, radius, startAngle)
  const largeArc = endAngle - startAngle <= 180 ? '0' : '1'

  return [
    `M ${center} ${center}`,
    `L ${start.x} ${start.y}`,
    `A ${radius} ${radius} 0 ${largeArc} 0 ${end.x} ${end.y}`,
    'Z',
  ].join(' ')
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
        <div className="min-w-0">
          <p className="text-sm font-bold text-slate-500">{title}</p>
          <p className="mt-2 text-3xl font-black text-slate-950">{value}</p>
          <p className="mt-1 text-sm text-slate-600">{detail}</p>
        </div>
        <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg ${colors[tone]}`}>
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
      </div>
    </article>
  )
}

function EmptyPanel({ children }: { children: string }) {
  return <div className="rounded-lg bg-slate-50 p-4 text-sm text-slate-600">{children}</div>
}

function PieChartCard({ slices, total }: { slices: ChartSlice[]; total: number }) {
  let currentAngle = 0
  const visibleSlices = slices.filter((slice) => slice.value > 0)

  return (
    <article className="panel p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-bold uppercase text-betel-blue">Composicao</p>
          <h2 className="text-xl font-black text-slate-950">De onde vieram os pontos</h2>
        </div>
        <PieChart className="h-5 w-5 text-slate-400" aria-hidden="true" />
      </div>

      {total > 0 ? (
        <div className="grid gap-4 md:grid-cols-[180px_1fr] md:items-center">
          <svg viewBox="0 0 180 180" className="mx-auto h-44 w-44" role="img" aria-label="Grafico de pizza">
            <circle cx="90" cy="90" r="78" fill="#f1f5f9" />
            {visibleSlices.map((slice) => {
              const sliceAngle = (slice.value / total) * 360
              const path = describeArc(90, 78, currentAngle, currentAngle + sliceAngle)
              currentAngle += sliceAngle
              return <path key={slice.label} d={path} fill={slice.color} />
            })}
            <circle cx="90" cy="90" r="44" fill="white" />
            <text x="90" y="86" textAnchor="middle" className="fill-slate-950 text-xl font-black">
              {total}
            </text>
            <text x="90" y="104" textAnchor="middle" className="fill-slate-500 text-xs font-bold">
              pontos
            </text>
          </svg>

          <div className="grid gap-2">
            {visibleSlices.map((slice) => (
              <div key={slice.label} className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 p-3">
                <span className="flex items-center gap-2 text-sm font-bold text-slate-700">
                  <span className="h-3 w-3 rounded-sm" style={{ backgroundColor: slice.color }} />
                  {slice.label}
                </span>
                <span className="text-sm font-black text-slate-950">
                  {slice.value} ({percent(slice.value, total)})
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <EmptyPanel>Ainda nao ha pontos no recorte filtrado.</EmptyPanel>
      )}
    </article>
  )
}

function PeakLineChart({ points }: { points: LinePoint[] }) {
  const chartWidth = 620
  const chartHeight = 220
  const paddingX = 34
  const paddingTop = 24
  const paddingBottom = 40
  const maxValue = Math.max(...points.map((point) => point.value), 0)
  const innerWidth = chartWidth - paddingX * 2
  const innerHeight = chartHeight - paddingTop - paddingBottom
  const coordinates = points.map((point, index) => {
    const x = points.length === 1 ? chartWidth / 2 : paddingX + (index / (points.length - 1)) * innerWidth
    const y =
      maxValue === 0
        ? paddingTop + innerHeight
        : paddingTop + innerHeight - (point.value / maxValue) * innerHeight
    return { ...point, x, y }
  })
  const path = coordinates.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ')
  const areaPath = coordinates.length
    ? `${path} L ${coordinates[coordinates.length - 1].x} ${paddingTop + innerHeight} L ${coordinates[0].x} ${
        paddingTop + innerHeight
      } Z`
    : ''

  return (
    <article className="panel p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-bold uppercase text-betel-blue">Picos</p>
          <h2 className="text-xl font-black text-slate-950">Pontos gerados por jogo</h2>
          <p className="mt-1 text-sm text-slate-600">
            Mostra quais partidas mexeram mais no ranking.
          </p>
        </div>
        <LineChart className="h-5 w-5 text-slate-400" aria-hidden="true" />
      </div>

      {points.length > 0 ? (
        <div className="overflow-x-auto">
          <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="min-w-[620px]">
            <line
              x1={paddingX}
              y1={paddingTop + innerHeight}
              x2={chartWidth - paddingX}
              y2={paddingTop + innerHeight}
              stroke="#cbd5e1"
              strokeWidth="2"
            />
            {[0.25, 0.5, 0.75, 1].map((step) => {
              const y = paddingTop + innerHeight - step * innerHeight
              return (
                <line
                  key={step}
                  x1={paddingX}
                  y1={y}
                  x2={chartWidth - paddingX}
                  y2={y}
                  stroke="#e2e8f0"
                  strokeWidth="1"
                />
              )
            })}
            {areaPath ? <path d={areaPath} fill="rgba(17, 60, 252, .10)" /> : null}
            {path ? <path d={path} fill="none" stroke="#113CFC" strokeWidth="4" strokeLinecap="round" /> : null}
            {coordinates.map((point) => (
              <g key={point.label}>
                <circle cx={point.x} cy={point.y} r="5" fill="#113CFC" />
                <text x={point.x} y={point.y - 10} textAnchor="middle" className="fill-slate-950 text-xs font-black">
                  {point.value}
                </text>
                <text
                  x={point.x}
                  y={chartHeight - 16}
                  textAnchor="middle"
                  className="fill-slate-500 text-xs font-bold"
                >
                  {point.label}
                </text>
              </g>
            ))}
          </svg>
        </div>
      ) : (
        <EmptyPanel>Ainda nao ha jogos pontuados neste recorte.</EmptyPanel>
      )}
    </article>
  )
}

function MatchStatsCard({ item, maxPoints }: { item: MatchPanelStats; maxPoints: number }) {
  const hitTotal = item.classifiedHits + item.exactScoreHits + item.penaltyHits + item.goalHits
  const width = maxPoints > 0 ? Math.max(8, Math.round((item.totalPoints / maxPoints) * 100)) : 0
  const assertiveness = percent(item.classifiedHits, Math.max(1, item.scored))

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
        <span>{item.scored} pontuados</span>
        <span>{assertiveness} classif.</span>
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
  const expectedPredictions = ranking.length * filteredMatches.length
  const matchesWithoutScore = filteredMatches.filter(
    (match) => hasOfficialResult(match) && !predictions.some((prediction) => prediction.matchId === match.id && prediction.pontuado),
  )
  const pointSlices: ChartSlice[] = [
    {
      label: 'Classificado',
      value: filteredPredictions.reduce((sum, prediction) => sum + prediction.pontosClassificado, 0),
      color: '#113CFC',
    },
    {
      label: 'Placar exato',
      value: filteredPredictions.reduce((sum, prediction) => sum + prediction.pontosPlacar, 0),
      color: '#F7D002',
    },
    {
      label: 'Penaltis',
      value: filteredPredictions.reduce((sum, prediction) => sum + prediction.pontosPenaltis, 0),
      color: '#7C2DFF',
    },
    {
      label: 'Gols',
      value: filteredPredictions.reduce((sum, prediction) => sum + prediction.pontosGols, 0),
      color: '#00A878',
    },
    {
      label: 'Extras',
      value: filteredPredictions.reduce((sum, prediction) => sum + prediction.pontosExtras, 0),
      color: '#FF2E1F',
    },
  ]
  const linePoints = matchStats
    .slice()
    .sort((left, right) => {
      const leftDate = `${left.match.date} ${left.match.time} ${left.match.codigo}`
      const rightDate = `${right.match.date} ${right.match.time} ${right.match.codigo}`
      return leftDate.localeCompare(rightDate)
    })
    .filter((item) => item.scored > 0 || item.totalPoints > 0)
    .map((item) => ({
      label: item.match.codigo,
      value: item.totalPoints,
    }))
  const maxMatchPoints = Math.max(...matchStats.map((item) => item.totalPoints), 0)
  const maxUserPoints = Math.max(...userStats.map((item) => item.points), 0)
  const topRanking = ranking.slice(0, 3)
  const mostPredictableMatch = matchStats.find((item) => item.scored > 0 && item.classifiedHits > 0)
  const hardestMatch = matchStats
    .slice()
    .reverse()
    .find((item) => item.scored > 0 && item.totalPoints === 0)
  const loading = loadingMatches || loadingPredictions || loadingRanking
  const error = matchesError || predictionsError || rankingError

  return (
    <div className="page-wrap">
      <section className="mb-5">
        <p className="text-sm font-bold uppercase text-betel-blue">Gestao a vista</p>
        <h1 className="mt-1 text-3xl font-black text-slate-950">Painel do bolao</h1>
        <p className="mt-2 text-sm text-slate-600">
          Leitura objetiva do jogo: participacao, pontos, picos e onde o admin precisa agir.
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
          title="Participacao"
          value={percent(filteredPredictions.length, expectedPredictions)}
          detail={`${filteredPredictions.length} de ${expectedPredictions} palpites esperados`}
          icon={Users}
        />
        <MetricCard
          title="Pontuacao aplicada"
          value={percent(scoredPredictions.length, filteredPredictions.length)}
          detail={`${scoredPredictions.length} de ${filteredPredictions.length} palpites avaliados`}
          icon={BarChart3}
          tone="green"
        />
        <MetricCard
          title="Acerto de classificado"
          value={percent(classifiedHits, scoredPredictions.length)}
          detail={`${classifiedHits} acertos em ${scoredPredictions.length} palpites pontuados`}
          icon={Target}
          tone="yellow"
        />
        <MetricCard
          title="Pontos por palpite"
          value={formatNumber(totalPoints / Math.max(1, scoredPredictions.length))}
          detail={`${totalPoints} pontos gerados no recorte`}
          icon={Trophy}
          tone="red"
        />
      </section>

      <section className="mb-5 grid gap-5 lg:grid-cols-[.9fr_1.1fr]">
        <PieChartCard slices={pointSlices} total={totalPoints} />
        <PeakLineChart points={linePoints} />
      </section>

      <section className="mb-5 grid gap-5 lg:grid-cols-[1.15fr_.85fr]">
        <div className="panel p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold uppercase text-betel-blue">Jogos</p>
              <h2 className="text-xl font-black text-slate-950">Partidas que mais mexeram no ranking</h2>
              <p className="mt-1 text-sm text-slate-600">
                Ordenado por pontos gerados, nao por quantidade de jogos.
              </p>
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
            <h2 className="text-xl font-black text-slate-950">Quem mais pontuou no recorte</h2>
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
          <h2 className="text-xl font-black text-slate-950">Leitura rapida</h2>
          <div className="mt-3 grid gap-2">
            <div className="rounded-lg bg-blue-50 p-3 text-sm text-blue-900">
              <span className="font-black">Mais previsivel: </span>
              {mostPredictableMatch
                ? `${mostPredictableMatch.match.codigo} teve ${mostPredictableMatch.classifiedHits} acertos de classificado.`
                : 'sem jogo pontuado suficiente no filtro.'}
            </div>
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-900">
              <span className="font-black">Mais dificil: </span>
              {hardestMatch
                ? `${hardestMatch.match.codigo} nao gerou pontos entre palpites avaliados.`
                : 'nenhum jogo zerado neste recorte.'}
            </div>
            <div className="rounded-lg bg-green-50 p-3 text-sm text-green-900">
              <span className="font-black">Placar exato: </span>
              {exactScoreHits} acertos ({percent(exactScoreHits, scoredPredictions.length)}).
            </div>
            <div className="rounded-lg bg-yellow-50 p-3 text-sm text-yellow-900">
              <span className="font-black">Gols: </span>
              {goalHits} palpites pontuaram com jogador do gol.
            </div>
          </div>
        </div>

        <div className="panel p-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600" aria-hidden="true" />
            <h2 className="text-xl font-black text-slate-950">Pontos de atencao</h2>
          </div>
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
