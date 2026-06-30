import { useRanking } from '../hooks/useRanking'
import type { RankingEntry } from '../types'

const avatarsByName: Record<string, string> = {
  gabriel: '/avatars/gabriel.jpg',
  ghabryel: '/avatars/ghabryel.jpg',
  gustavo: '/avatars/gustavo.jpg',
  izabel: '/avatars/izabel.jpg',
  julinha: '/avatars/julinha.jpg',
  marcelo: '/avatars/marcelo.jpg',
  vinicius: '/avatars/vinicius.jpg',
}

function normalizeName(name: string) {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

function formatOrdinal(position: number) {
  return `${position}\u00ba`
}

function avatarFor(entry: RankingEntry) {
  return avatarsByName[normalizeName(entry.nome)]
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}

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
            <div className="relative shrink-0">
              {avatarFor(entry) ? (
                <img
                  src={avatarFor(entry)}
                  alt={entry.nome}
                  className={[
                    'h-16 w-16 rounded-full object-cover shadow-sm',
                    entry.posicao === 1
                      ? 'ring-4 ring-betel-yellow'
                      : 'ring-2 ring-slate-200',
                  ].join(' ')}
                />
              ) : (
                <div className="grid h-16 w-16 place-items-center rounded-full bg-slate-100 text-sm font-black text-slate-700 ring-2 ring-slate-200">
                  {initials(entry.nome)}
                </div>
              )}
              <span
                className={[
                  'absolute -bottom-1 -right-1 grid h-7 min-w-7 place-items-center rounded-full px-1 text-xs font-black shadow-sm',
                  entry.posicao === 1
                    ? 'bg-betel-yellow text-slate-950'
                    : 'bg-betel-blue text-white',
                ].join(' ')}
              >
                {formatOrdinal(entry.posicao)}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-base font-black text-slate-950">
                {formatOrdinal(entry.posicao)} - {entry.nome}
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
