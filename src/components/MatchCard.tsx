import { CheckCircle2, ChevronRight, Clock, Lock } from 'lucide-react'
import { Link } from 'react-router-dom'
import { formatPredictionScore } from '../lib/matchResult'
import { formatMatchDateTime, getMatchAvailability } from '../lib/time'
import type { Match, Prediction } from '../types'
import { TeamLabel } from './TeamLabel'

function statusStyle(state: string) {
  if (state === 'open') {
    return 'bg-green-100 text-green-800'
  }
  if (state === 'closed') {
    return 'bg-slate-200 text-slate-700'
  }
  return 'bg-yellow-100 text-yellow-900'
}

function statusIcon(state: string) {
  if (state === 'open') {
    return <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
  }
  if (state === 'closed') {
    return <Clock className="h-3.5 w-3.5" aria-hidden="true" />
  }
  return <Lock className="h-3.5 w-3.5" aria-hidden="true" />
}

export function MatchCard({
  match,
  prediction,
  compact = false,
}: {
  match: Match
  prediction?: Prediction
  compact?: boolean
}) {
  const availability = getMatchAvailability(match)

  return (
    <article className="panel p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-lg bg-betel-ink px-2 py-1 text-xs font-black text-white">
              {match.codigo}
            </span>
            <span className={`status-pill ${statusStyle(availability.state)}`}>
              {statusIcon(availability.state)}
              {availability.label}
            </span>
            {prediction ? (
              <span className="status-pill bg-blue-100 text-blue-800">Palpite salvo</span>
            ) : null}
          </div>
          <p className="mt-2 text-xs font-bold uppercase text-slate-500">{match.fase}</p>
          <h2 className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
            <TeamLabel team={match.teamA} fallbackFlag={match.flagA} />
            <span className="text-xl font-black text-slate-400">x</span>
            <TeamLabel team={match.teamB} fallbackFlag={match.flagB} />
          </h2>
          <p className="mt-1 text-sm font-bold text-slate-600">{formatMatchDateTime(match)}</p>
          {!compact ? (
            <p className="mt-3 text-sm text-slate-600">{availability.message}</p>
          ) : null}
        </div>
        {availability.isOpen || availability.state === 'closed' ? (
          <Link
            to={`/palpite/${match.id}`}
            className={availability.isOpen ? 'btn-primary shrink-0 px-3' : 'btn-secondary shrink-0 px-3'}
            title={availability.isOpen ? 'Fazer palpite' : 'Ver palpites'}
          >
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        ) : (
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-400">
            <Lock className="h-4 w-4" aria-hidden="true" />
          </span>
        )}
      </div>
      {prediction ? (
        <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">
          <p className="font-bold text-slate-950">
            Seu palpite: {formatPredictionScore(prediction)}, classifica{' '}
            {prediction.classificado}
          </p>
          <p className="mt-1 text-slate-600">
            {prediction.pontuado ? `${prediction.totalPontos} pontos lançados` : 'Aguardando pontuação'}
          </p>
        </div>
      ) : null}
    </article>
  )
}
