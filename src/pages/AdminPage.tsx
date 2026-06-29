import { CalendarDays, Database, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { TeamLabel } from '../components/TeamLabel'
import { seedInitialMatches, useMatches } from '../hooks/useMatches'
import { formatDateBR } from '../lib/time'

export function AdminPage() {
  const { matches, loading, error, usingInitialData } = useMatches()
  const [dateFilter, setDateFilter] = useState('')
  const [query, setQuery] = useState('')
  const [seeding, setSeeding] = useState(false)
  const [seedMessage, setSeedMessage] = useState<string | null>(null)

  const filteredMatches = useMemo(() => {
    return matches.filter((match) => {
      const dateMatches = dateFilter ? match.date === dateFilter : true
      const text = `${match.codigo} ${match.teamA} ${match.teamB} ${match.fase}`.toLowerCase()
      const queryMatches = query ? text.includes(query.toLowerCase()) : true
      return dateMatches && queryMatches
    })
  }, [dateFilter, matches, query])

  async function handleSeedMatches() {
    setSeeding(true)
    setSeedMessage(null)
    try {
      await seedInitialMatches()
      setSeedMessage('Jogos iniciais gravados no Firestore sem apagar resultados oficiais.')
    } catch (seedError) {
      setSeedMessage(seedError instanceof Error ? seedError.message : 'Falha ao gravar jogos.')
    } finally {
      setSeeding(false)
    }
  }

  return (
    <div className="page-wrap">
      <section className="mb-5">
        <p className="text-sm font-bold uppercase text-betel-blue">Admin</p>
        <h1 className="mt-1 text-3xl font-black text-slate-950">Painel administrativo</h1>
        <p className="mt-2 text-sm text-slate-600">
          Atualize o resultado oficial de cada jogo e acompanhe os palpites enviados.
        </p>
      </section>

      <section className="panel mb-5 p-4">
        <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
          <label>
            <span className="label">Filtrar por data</span>
            <div className="mt-1 flex items-center rounded-lg border border-slate-300 bg-white px-3 focus-within:border-betel-blue focus-within:ring-4 focus-within:ring-blue-100">
              <CalendarDays className="h-4 w-4 text-slate-500" aria-hidden="true" />
              <input
                type="date"
                value={dateFilter}
                onChange={(event) => setDateFilter(event.target.value)}
                className="w-full border-0 bg-transparent px-2 py-2 text-sm outline-none"
              />
            </div>
          </label>
          <label>
            <span className="label">Buscar</span>
            <div className="mt-1 flex items-center rounded-lg border border-slate-300 bg-white px-3 focus-within:border-betel-blue focus-within:ring-4 focus-within:ring-blue-100">
              <Search className="h-4 w-4 text-slate-500" aria-hidden="true" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="J73, BRA, Final..."
                className="w-full border-0 bg-transparent px-2 py-2 text-sm outline-none"
              />
            </div>
          </label>
          <div className="flex items-end">
            <button type="button" onClick={handleSeedMatches} className="btn-primary w-full" disabled={seeding}>
              <Database className="h-4 w-4" aria-hidden="true" />
              Sincronizar jogos
            </button>
          </div>
        </div>
        {usingInitialData ? (
          <p className="mt-3 text-sm font-bold text-yellow-800">
            Exibindo jogos iniciais locais. Use sincronizar para gravar em matches.
          </p>
        ) : null}
        {seedMessage ? <p className="mt-3 text-sm font-bold text-slate-700">{seedMessage}</p> : null}
      </section>

      {loading ? <p className="text-sm font-bold text-slate-600">Carregando jogos...</p> : null}
      {error ? <p className="text-sm font-bold text-red-700">{error}</p> : null}

      <div className="grid gap-3">
        {filteredMatches.map((match) => (
          <article key={match.id} className="panel flex flex-wrap items-center justify-between gap-3 p-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-lg bg-betel-ink px-2 py-1 text-xs font-black text-white">
                  {match.codigo}
                </span>
                <span className="text-xs font-bold uppercase text-slate-500">{match.fase}</span>
                {match.winner ? (
                  <span className="status-pill bg-green-100 text-green-800">
                    Classificado: {match.winner}
                  </span>
                ) : null}
                {match.manualOpen ? (
                  <span className="status-pill bg-blue-100 text-blue-800">Liberado manual</span>
                ) : null}
              </div>
              <h2 className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
                <TeamLabel team={match.teamA} fallbackFlag={match.flagA} />
                <span className="text-xl font-black text-slate-400">x</span>
                <TeamLabel team={match.teamB} fallbackFlag={match.flagB} />
              </h2>
              <p className="mt-1 text-sm font-bold text-slate-600">
                {formatDateBR(match.date)} às {match.time}
              </p>
            </div>
            <Link to={`/admin/jogo/${match.id}`} className="btn-primary">
              Atualizar jogo
            </Link>
          </article>
        ))}
      </div>
    </div>
  )
}
