import { CheckCircle2, Goal, ListChecks, Trophy } from 'lucide-react'
import { scoringRules } from '../lib/scoring'

const rules = [
  {
    title: 'Classificado correto',
    points: `${scoringRules.classified} ponto`,
    icon: Trophy,
    text: 'Acertou quem passa de fase, ganha 1 ponto, mesmo errando o placar.',
  },
  {
    title: 'Placar exato',
    points: `${scoringRules.exactScore} pontos`,
    icon: CheckCircle2,
    text: 'Acertou exatamente o placar final do jogo, ganha 2 pontos.',
  },
  {
    title: 'Gols dos jogadores',
    points: `${scoringRules.goalOccurrence} ponto por gol`,
    icon: Goal,
    text: 'Cada gol previsto corretamente para um jogador vale 1 ponto, limitado ao que aconteceu no jogo.',
  },
]

export function RulesPage() {
  return (
    <div className="page-wrap">
      <section className="mb-5">
        <p className="text-sm font-bold uppercase text-betel-blue">Bolao Betel 2026</p>
        <h1 className="mt-1 text-3xl font-black text-slate-950">Regras do jogo</h1>
        <p className="mt-2 text-sm text-slate-600">
          A pontuacao e calculada depois que o admin salva o resultado oficial de cada partida.
        </p>
      </section>

      <section className="grid gap-3 md:grid-cols-3">
        {rules.map((rule) => (
          <article key={rule.title} className="panel p-4">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-betel-blue text-white">
                <rule.icon className="h-5 w-5" aria-hidden="true" />
              </div>
              <span className="rounded-lg bg-slate-100 px-3 py-1 text-sm font-black text-slate-950">
                {rule.points}
              </span>
            </div>
            <h2 className="text-lg font-black text-slate-950">{rule.title}</h2>
            <p className="mt-2 text-sm text-slate-600">{rule.text}</p>
          </article>
        ))}
      </section>

      <section className="panel mt-5 p-5">
        <div className="mb-4 flex items-center gap-2">
          <ListChecks className="h-5 w-5 text-betel-blue" aria-hidden="true" />
          <h2 className="text-xl font-black text-slate-950">Como preencher os gols</h2>
        </div>
        <div className="grid gap-3 text-sm text-slate-700 md:grid-cols-2">
          <div className="rounded-lg bg-slate-50 p-3">
            <p className="font-bold text-slate-950">Um gol</p>
            <p className="mt-1">Escreva o nome do jogador: David, Neymar, Vini Jr.</p>
          </div>
          <div className="rounded-lg bg-slate-50 p-3">
            <p className="font-bold text-slate-950">Mais de um gol</p>
            <p className="mt-1">Use quantidade: Vini Jr 2, Neymar x2, David 3.</p>
          </div>
        </div>
      </section>

      <section className="panel mt-5 p-5">
        <h2 className="text-xl font-black text-slate-950">Observacoes</h2>
        <ul className="mt-3 space-y-2 text-sm text-slate-700">
          <li>Os palpites ficam liberados somente no dia do jogo e fecham no horario da partida.</li>
          <li>Se o placar estiver empatado, informe os penaltis para definir quem se classifica.</li>
          <li>O campo de gols vale por ocorrencia. Se o jogador fez 2 gols e voce colocou 2, recebe 2 pontos.</li>
          <li>Se houver ajuste manual necessario, o admin pode corrigir a pontuacao individualmente.</li>
        </ul>
      </section>
    </div>
  )
}
