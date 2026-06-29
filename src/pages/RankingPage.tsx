import { Medal, Trophy } from 'lucide-react'
import { useRanking } from '../hooks/useRanking'

export function RankingPage() {
  const { ranking, loading, error } = useRanking()

  return (
    <div className="page-wrap">
      <section className="mb-5">
        <p className="text-sm font-bold uppercase text-betel-blue">Classificação</p>
        <h1 className="mt-1 text-3xl font-black text-slate-950">Ranking geral</h1>
        <p className="mt-2 text-sm text-slate-600">
          Pontuação somada automaticamente a partir dos lançamentos manuais do admin.
        </p>
      </section>

      {loading ? <p className="text-sm font-bold text-slate-600">Carregando ranking...</p> : null}
      {error ? <p className="text-sm font-bold text-red-700">{error}</p> : null}

      <div className="grid gap-3">
        {ranking.map((entry) => (
          <article key={entry.uid} className="panel flex items-center gap-3 p-4">
            <div
              className={[
                'grid h-11 w-11 shrink-0 place-items-center rounded-lg text-sm font-black',
                entry.posicao === 1 ? 'bg-betel-yellow text-slate-950' : 'bg-slate-100 text-slate-700',
              ].join(' ')}
            >
              {entry.posicao === 1 ? (
                <Trophy className="h-5 w-5" aria-hidden="true" />
              ) : (
                <Medal className="h-5 w-5" aria-hidden="true" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-base font-black text-slate-950">
                {entry.posicao}o - {entry.nome}
              </p>
              <p className="text-sm text-slate-600">
                {entry.palpitesFeitos} palpites, {entry.palpitesPontuados} pontuados
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-black text-slate-950">{entry.totalPontos}</p>
              <p className="text-xs font-bold uppercase text-slate-500">pontos</p>
            </div>
          </article>
        ))}
      </div>

      {!loading && ranking.length === 0 ? (
        <div className="panel p-5 text-sm text-slate-600">Ranking ainda vazio.</div>
      ) : null}
    </div>
  )
}
