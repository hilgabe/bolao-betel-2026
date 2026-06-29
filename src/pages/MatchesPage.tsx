import { Filter } from 'lucide-react'
import { useMemo, useState } from 'react'
import { MatchCard } from '../components/MatchCard'
import { useAuth } from '../context/auth'
import { useMatches } from '../hooks/useMatches'
import { useUserPredictions } from '../hooks/usePredictions'
import { getMatchAvailability, getSaoPauloToday } from '../lib/time'
import type { AvailabilityState } from '../types'

const tabs: Array<{ id: AvailabilityState | 'today'; label: string }> = [
  { id: 'today', label: 'Hoje' },
  { id: 'future', label: 'Bloqueados' },
  { id: 'closed', label: 'Encerrados' },
]

export function MatchesPage() {
  const { profile } = useAuth()
  const { matches, loading, error } = useMatches()
  const { predictions } = useUserPredictions(profile?.uid)
  const [activeTab, setActiveTab] = useState<AvailabilityState | 'today'>('today')
  const today = getSaoPauloToday()

  const filteredMatches = useMemo(() => {
    if (activeTab === 'today') {
      return matches.filter((match) => match.date === today)
    }
    return matches.filter((match) => getMatchAvailability(match).state === activeTab)
  }, [activeTab, matches, today])

  return (
    <div className="page-wrap">
      <section className="mb-5">
        <p className="text-sm font-bold uppercase text-betel-blue">Mata-mata</p>
        <h1 className="mt-1 text-3xl font-black text-slate-950">Jogos</h1>
        <p className="mt-2 text-sm text-slate-600">
          Apenas jogos do dia atual ficam abertos, e o envio fecha no horário da partida.
        </p>
      </section>

      <div className="panel mb-5 flex flex-wrap items-center gap-2 p-2">
        <Filter className="ml-2 h-4 w-4 text-slate-500" aria-hidden="true" />
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={[
              'rounded-lg px-3 py-2 text-sm font-bold transition',
              activeTab === tab.id ? 'bg-betel-ink text-white' : 'text-slate-600 hover:bg-slate-100',
            ].join(' ')}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? <p className="text-sm font-bold text-slate-600">Carregando jogos...</p> : null}
      {error ? <p className="text-sm font-bold text-red-700">{error}</p> : null}

      <div className="grid gap-3 lg:grid-cols-2">
        {filteredMatches.map((match) => (
          <MatchCard
            key={match.id}
            match={match}
            prediction={predictions.find((prediction) => prediction.matchId === match.id)}
          />
        ))}
      </div>

      {!loading && filteredMatches.length === 0 ? (
        <div className="panel p-5 text-sm text-slate-600">Nenhum jogo nesta categoria.</div>
      ) : null}
    </div>
  )
}
