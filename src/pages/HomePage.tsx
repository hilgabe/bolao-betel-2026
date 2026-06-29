import { CalendarDays, Medal, Trophy } from 'lucide-react'
import { Link } from 'react-router-dom'
import { MatchCard } from '../components/MatchCard'
import { useAuth } from '../context/auth'
import { useMatches } from '../hooks/useMatches'
import { useUserPredictions } from '../hooks/usePredictions'
import { useRanking } from '../hooks/useRanking'
import { getMatchAvailability, getSaoPauloToday } from '../lib/time'

export function HomePage() {
  const { profile } = useAuth()
  const { matches } = useMatches()
  const { predictions } = useUserPredictions(profile?.uid)
  const { ranking } = useRanking()
  const today = getSaoPauloToday()
  const todayMatches = matches.filter((match) => match.date === today)
  const openToday = todayMatches.filter((match) => getMatchAvailability(match).isOpen)
  const currentPosition = ranking.find((entry) => entry.uid === profile?.uid)?.posicao

  return (
    <div className="page-wrap">
      <section className="mb-5">
        <p className="text-sm font-bold uppercase text-betel-blue">Célula Betel</p>
        <h1 className="mt-1 text-3xl font-black text-slate-950">Painel do participante</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-600">
          Palpites são liberados apenas no dia do jogo, no horário de Brasília.
        </p>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        <div className="panel p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-slate-500">Meus pontos</p>
            <Trophy className="h-5 w-5 text-betel-yellow" aria-hidden="true" />
          </div>
          <p className="mt-3 text-3xl font-black text-slate-950">{profile?.totalPontos || 0}</p>
        </div>
        <div className="panel p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-slate-500">Posição</p>
            <Medal className="h-5 w-5 text-betel-red" aria-hidden="true" />
          </div>
          <p className="mt-3 text-3xl font-black text-slate-950">
            {currentPosition ? `${currentPosition}º` : '--'}
          </p>
        </div>
        <div className="panel p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-slate-500">Jogos hoje</p>
            <CalendarDays className="h-5 w-5 text-betel-green" aria-hidden="true" />
          </div>
          <p className="mt-3 text-3xl font-black text-slate-950">{todayMatches.length}</p>
        </div>
      </section>

      <section className="mt-6">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-xl font-black text-slate-950">Jogos liberados hoje</h2>
          <Link to="/jogos" className="btn-secondary px-3">
            Ver todos
          </Link>
        </div>
        {openToday.length > 0 ? (
          <div className="grid gap-3 lg:grid-cols-2">
            {openToday.map((match) => (
              <MatchCard
                key={match.id}
                match={match}
                prediction={predictions.find((prediction) => prediction.matchId === match.id)}
              />
            ))}
          </div>
        ) : (
          <div className="panel p-5 text-sm text-slate-600">
            Nenhum jogo está liberado neste momento. Confira a lista completa para ver bloqueados e
            encerrados.
          </div>
        )}
      </section>
    </div>
  )
}
