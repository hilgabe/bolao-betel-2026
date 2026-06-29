import { Save, Sparkles } from 'lucide-react'
import {
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore'
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { TeamLabel } from '../components/TeamLabel'
import { useMatches } from '../hooks/useMatches'
import { useMatchPredictions } from '../hooks/usePredictions'
import { db } from '../lib/firebase'
import { authEmailFromParticipantId, participantIdFromName } from '../lib/participants'
import {
  calculateAutomaticPredictionScores,
  calculateScoreTotal,
  emptyScoreFields,
  scoreFieldLabels,
  scoringRules,
} from '../lib/scoring'
import { formatMatchDateTime } from '../lib/time'
import type { Match, Prediction, ScoreFields } from '../types'

interface ResultFormState {
  scoreA: string
  scoreB: string
  winner: string
  scorersTexto: string
}

interface AdminPredictionFormState extends ScoreFields {
  observacaoAdmin: string
  pontuado: boolean
}

interface ManualPredictionFormState {
  userName: string
  palpiteA: string
  palpiteB: string
  classificado: string
  jogadoresGolTexto: string
}

function resultStateFromMatch(match: Match): ResultFormState {
  return {
    scoreA: match.scoreA === null || match.scoreA === undefined ? '' : String(match.scoreA),
    scoreB: match.scoreB === null || match.scoreB === undefined ? '' : String(match.scoreB),
    winner: match.winner || match.teamA,
    scorersTexto: match.scorersTexto || '',
  }
}

function stateFromPrediction(prediction: Prediction): AdminPredictionFormState {
  return {
    pontosPlacar: prediction.pontosPlacar,
    pontosGols: prediction.pontosGols,
    pontosClassificado: prediction.pontosClassificado,
    pontosExtras: prediction.pontosExtras,
    observacaoAdmin: prediction.observacaoAdmin,
    pontuado: prediction.pontuado,
  }
}

function emptyManualPredictionForm(match: Match): ManualPredictionFormState {
  return {
    userName: '',
    palpiteA: '',
    palpiteB: '',
    classificado: match.teamA,
    jogadoresGolTexto: '',
  }
}

async function recalculateUserTotal(userId: string) {
  if (!db) {
    throw new Error('Firebase nao configurado.')
  }

  const snapshot = await getDocs(query(collection(db, 'predictions'), where('userId', '==', userId)))
  const total = snapshot.docs.reduce((sum, item) => sum + Number(item.data().totalPontos || 0), 0)
  await updateDoc(doc(db, 'users', userId), { totalPontos: total })
}

function buildOfficialResult(match: Match, form: ResultFormState) {
  return {
    ...match,
    scoreA: Number(form.scoreA),
    scoreB: Number(form.scoreB),
    winner: form.winner,
    scorersTexto: form.scorersTexto.trim(),
    status: 'finished' as const,
  }
}

function AdminResultForm({
  match,
  predictions,
}: {
  match: Match
  predictions: Prediction[]
}) {
  const [form, setForm] = useState<ResultFormState>(resultStateFromMatch(match))
  const [saving, setSaving] = useState(false)
  const [togglingManualOpen, setTogglingManualOpen] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    setForm(resultStateFromMatch(match))
  }, [match])

  async function saveOfficialResult() {
    if (!db) {
      return buildOfficialResult(match, form)
    }

    const officialResult = buildOfficialResult(match, form)
    await setDoc(
      doc(db, 'matches', match.id),
      {
        ...officialResult,
        resultUpdatedAt: serverTimestamp(),
      },
      { merge: true },
    )
    return officialResult
  }

  async function handleSaveResult(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!db) {
      return
    }

    setSaving(true)
    setMessage(null)

    try {
      await saveOfficialResult()
      setMessage('Resultado oficial salvo para este jogo.')
    } catch (saveError) {
      setMessage(saveError instanceof Error ? saveError.message : 'Nao foi possivel salvar.')
    } finally {
      setSaving(false)
    }
  }

  async function handleApplyAutomaticScoring() {
    if (!db) {
      return
    }

    setSaving(true)
    setMessage(null)

    try {
      const officialResult = await saveOfficialResult()
      const firestore = db
      const batch = writeBatch(firestore)
      const affectedUsers = new Set<string>()

      predictions.forEach((prediction) => {
        const updatedScores = calculateAutomaticPredictionScores(prediction, officialResult)

        batch.update(doc(firestore, 'predictions', prediction.id), {
          ...updatedScores,
          totalPontos: calculateScoreTotal(updatedScores),
          pontuado: true,
          updatedAt: serverTimestamp(),
        })
        affectedUsers.add(prediction.userId)
      })

      await batch.commit()
      await Promise.all([...affectedUsers].map((userId) => recalculateUserTotal(userId)))
      setMessage(`Pontuacao automatica aplicada para ${predictions.length} palpites.`)
    } catch (saveError) {
      setMessage(saveError instanceof Error ? saveError.message : 'Nao foi possivel aplicar pontos.')
    } finally {
      setSaving(false)
    }
  }

  async function handleToggleManualOpen() {
    if (!db) {
      return
    }

    setTogglingManualOpen(true)
    setMessage(null)

    try {
      const nextManualOpen = !match.manualOpen
      await setDoc(
        doc(db, 'matches', match.id),
        {
          id: match.id,
          codigo: match.codigo,
          fase: match.fase,
          date: match.date,
          time: match.time,
          teamA: match.teamA,
          teamB: match.teamB,
          flagA: match.flagA,
          flagB: match.flagB,
          status: match.status,
          manualOpen: nextManualOpen,
          manualOpenUpdatedAt: serverTimestamp(),
        },
        { merge: true },
      )
      setMessage(
        nextManualOpen
          ? 'Palpites liberados manualmente para este jogo.'
          : 'Liberacao manual fechada para este jogo.',
      )
    } catch (saveError) {
      setMessage(saveError instanceof Error ? saveError.message : 'Nao foi possivel alterar a liberacao.')
    } finally {
      setTogglingManualOpen(false)
    }
  }

  return (
    <section className="panel mb-5 p-4">
      <div className="mb-4">
        <p className="text-sm font-bold uppercase text-betel-blue">Resultado oficial</p>
        <h2 className="mt-1 text-xl font-black text-slate-950">Atualize o jogo uma vez</h2>
        <p className="mt-1 text-sm text-slate-600">
          Esse resultado alimenta a tabela dinamica e calcula a pontuacao de todos os palpites
          deste jogo.
        </p>
      </div>

      <div className="mb-4 rounded-lg border border-blue-100 bg-blue-50 p-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-black text-slate-950">Liberacao manual de palpites</p>
            <p className="mt-1 text-sm text-slate-600">
              Use isto quando o jogo ja fechou, mas voce precisa cadastrar palpites recebidos por
              fora.
            </p>
          </div>
          <button
            type="button"
            onClick={handleToggleManualOpen}
            className={match.manualOpen ? 'btn-secondary' : 'btn-primary'}
            disabled={togglingManualOpen}
          >
            {match.manualOpen ? 'Fechar liberacao manual' : 'Liberar palpites manualmente'}
          </button>
        </div>
        {match.manualOpen ? (
          <p className="mt-2 text-sm font-bold text-green-800">
            Este jogo esta aberto agora, mesmo apos o horario original.
          </p>
        ) : null}
      </div>

      <form onSubmit={handleSaveResult} className="space-y-4">
        <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-3">
          <label>
            <span className="label">{match.teamA}</span>
            <input
              className="input mt-1 text-center text-lg font-black"
              type="number"
              min="0"
              value={form.scoreA}
              onChange={(event) => setForm({ ...form, scoreA: event.target.value })}
              required
            />
          </label>
          <span className="pb-2 text-lg font-black text-slate-400">x</span>
          <label>
            <span className="label">{match.teamB}</span>
            <input
              className="input mt-1 text-center text-lg font-black"
              type="number"
              min="0"
              value={form.scoreB}
              onChange={(event) => setForm({ ...form, scoreB: event.target.value })}
              required
            />
          </label>
        </div>

        <label className="block">
          <span className="label">Classificado real</span>
          <select
            className="input mt-1"
            value={form.winner}
            onChange={(event) => setForm({ ...form, winner: event.target.value })}
          >
            <option value={match.teamA}>{match.teamA}</option>
            <option value={match.teamB}>{match.teamB}</option>
          </select>
        </label>

        <label className="block">
          <span className="label">Jogadores que fizeram gol</span>
          <textarea
            className="input mt-1 min-h-20"
            value={form.scorersTexto}
            onChange={(event) => setForm({ ...form, scorersTexto: event.target.value })}
            placeholder="Exemplos: David; Vini Jr 2; Neymar x2"
          />
        </label>

        <div className="rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
          <p className="font-bold text-slate-950">Regra aplicada automaticamente</p>
          <p>
            Classificado correto: {scoringRules.classified} ponto. Placar exato:{' '}
            {scoringRules.exactScore} pontos. Gols: {scoringRules.goalOccurrence} ponto por gol
            correto de cada jogador.
          </p>
        </div>

        {message ? <p className="text-sm font-bold text-slate-700">{message}</p> : null}

        <div className="flex flex-wrap gap-3">
          <button type="submit" className="btn-secondary" disabled={saving}>
            <Save className="h-4 w-4" aria-hidden="true" />
            Salvar resultado oficial
          </button>
          <button
            type="button"
            onClick={handleApplyAutomaticScoring}
            className="btn-primary"
            disabled={saving || predictions.length === 0}
          >
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            Aplicar pontuacao automatica
          </button>
        </div>
      </form>
    </section>
  )
}

function ManualPredictionForm({ match }: { match: Match }) {
  const [form, setForm] = useState<ManualPredictionFormState>(emptyManualPredictionForm(match))
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    setForm(emptyManualPredictionForm(match))
  }, [match])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!db) {
      return
    }

    const participantName = form.userName.trim()
    if (!participantName) {
      setMessage('Informe o nome do participante.')
      return
    }

    setSaving(true)
    setMessage(null)

    try {
      const userId = participantIdFromName(participantName)
      const predictionId = `${userId}_${match.id}`
      const emptyScores = emptyScoreFields()

      await setDoc(
        doc(db, 'users', userId),
        {
          uid: userId,
          nome: participantName,
          email: authEmailFromParticipantId(userId),
          role: 'user',
          createdByAdmin: true,
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      )

      await setDoc(
        doc(db, 'predictions', predictionId),
        {
          id: predictionId,
          userId,
          userName: participantName,
          matchId: match.id,
          matchCode: match.codigo,
          teamA: match.teamA,
          teamB: match.teamB,
          palpiteA: Number(form.palpiteA),
          palpiteB: Number(form.palpiteB),
          classificado: form.classificado,
          jogadoresGolTexto: form.jogadoresGolTexto.trim(),
          ...emptyScores,
          totalPontos: 0,
          pontuado: false,
          observacaoAdmin: 'Palpite lancado pelo admin via WhatsApp.',
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      )

      setForm(emptyManualPredictionForm(match))
      setMessage(`Palpite de ${participantName} salvo.`)
    } catch (saveError) {
      setMessage(saveError instanceof Error ? saveError.message : 'Nao foi possivel salvar o palpite.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="panel mb-5 p-4">
      <div className="mb-4">
        <p className="text-sm font-bold uppercase text-betel-blue">WhatsApp</p>
        <h2 className="mt-1 text-xl font-black text-slate-950">Lancar palpite manual</h2>
        <p className="mt-1 text-sm text-slate-600">
          Use para cadastrar palpites que chegaram fora do app. Se o participante ainda nao existir,
          ele entra no ranking com esse nome.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block">
          <span className="label">Nome do participante</span>
          <input
            className="input mt-1"
            value={form.userName}
            onChange={(event) => setForm({ ...form, userName: event.target.value })}
            placeholder="Exemplo: Julia"
            required
          />
        </label>

        <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-3">
          <label>
            <span className="label">{match.teamA}</span>
            <input
              className="input mt-1 text-center text-lg font-black"
              type="number"
              min="0"
              value={form.palpiteA}
              onChange={(event) => setForm({ ...form, palpiteA: event.target.value })}
              required
            />
          </label>
          <span className="pb-2 text-lg font-black text-slate-400">x</span>
          <label>
            <span className="label">{match.teamB}</span>
            <input
              className="input mt-1 text-center text-lg font-black"
              type="number"
              min="0"
              value={form.palpiteB}
              onChange={(event) => setForm({ ...form, palpiteB: event.target.value })}
              required
            />
          </label>
        </div>

        <label className="block">
          <span className="label">Quem se classifica</span>
          <select
            className="input mt-1"
            value={form.classificado}
            onChange={(event) => setForm({ ...form, classificado: event.target.value })}
          >
            <option value={match.teamA}>{match.teamA}</option>
            <option value={match.teamB}>{match.teamB}</option>
          </select>
        </label>

        <label className="block">
          <span className="label">Jogadores que farao gol</span>
          <textarea
            className="input mt-1 min-h-20"
            value={form.jogadoresGolTexto}
            onChange={(event) => setForm({ ...form, jogadoresGolTexto: event.target.value })}
            placeholder="Exemplos: Neymar; Vini Jr 2"
          />
        </label>

        {message ? <p className="text-sm font-bold text-slate-700">{message}</p> : null}

        <button type="submit" className="btn-primary" disabled={saving}>
          <Save className="h-4 w-4" aria-hidden="true" />
          Salvar palpite manual
        </button>
      </form>
    </section>
  )
}

function AdminPredictionScore({ prediction }: { prediction: Prediction }) {
  const [form, setForm] = useState<AdminPredictionFormState>(stateFromPrediction(prediction))
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const total = useMemo(() => calculateScoreTotal(form), [form])

  useEffect(() => {
    setForm(stateFromPrediction(prediction))
  }, [prediction])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!db) {
      return
    }

    setSaving(true)
    setMessage(null)

    try {
      const updatedScores: ScoreFields = {
        pontosPlacar: Number(form.pontosPlacar || 0),
        pontosGols: Number(form.pontosGols || 0),
        pontosClassificado: Number(form.pontosClassificado || 0),
        pontosExtras: Number(form.pontosExtras || 0),
      }

      await updateDoc(doc(db, 'predictions', prediction.id), {
        ...updatedScores,
        totalPontos: calculateScoreTotal(updatedScores),
        pontuado: form.pontuado,
        observacaoAdmin: form.observacaoAdmin.trim(),
        updatedAt: serverTimestamp(),
      })
      await recalculateUserTotal(prediction.userId)
      setMessage('Pontuacao salva.')
    } catch (saveError) {
      setMessage(saveError instanceof Error ? saveError.message : 'Nao foi possivel salvar.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <article className="panel p-4">
      <div className="mb-4">
        <p className="text-lg font-black text-slate-950">{prediction.userName}</p>
        <p className="text-sm text-slate-600">
          Palpite: {prediction.palpiteA} x {prediction.palpiteB}, classifica{' '}
          {prediction.classificado}
        </p>
        <p className="mt-2 text-sm text-slate-600">
          Gols previstos: {prediction.jogadoresGolTexto || '-'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {scoreFieldLabels.map((item) => (
            <label key={item.field}>
              <span className="label">{item.label}</span>
              <input
                className="input mt-1"
                type="number"
                step="0.5"
                value={form[item.field]}
                onChange={(event) =>
                  setForm({ ...form, [item.field]: Number(event.target.value) })
                }
              />
            </label>
          ))}
        </div>
        <label className="block">
          <span className="label">Observacao opcional</span>
          <textarea
            className="input mt-1 min-h-20"
            value={form.observacaoAdmin}
            onChange={(event) => setForm({ ...form, observacaoAdmin: event.target.value })}
          />
        </label>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <label className="inline-flex items-center gap-2 text-sm font-bold text-slate-700">
            <input
              type="checkbox"
              checked={form.pontuado}
              onChange={(event) => setForm({ ...form, pontuado: event.target.checked })}
              className="h-4 w-4"
            />
            Marcar como pontuado
          </label>
          <p className="text-lg font-black text-slate-950">Total: {total}</p>
        </div>
        {message ? <p className="text-sm font-bold text-slate-700">{message}</p> : null}
        <button type="submit" className="btn-primary" disabled={saving}>
          <Save className="h-4 w-4" aria-hidden="true" />
          Salvar pontuacao
        </button>
      </form>
    </article>
  )
}

export function AdminMatchPage() {
  const { matchId } = useParams()
  const { matches } = useMatches()
  const match = matches.find((item) => item.id === matchId)
  const { predictions, loading, error } = useMatchPredictions(matchId)

  if (!match) {
    return (
      <div className="page-wrap">
        <div className="panel p-5">
          <h1 className="text-xl font-black text-slate-950">Jogo nao encontrado</h1>
          <Link to="/admin" className="btn-secondary mt-4">
            Voltar ao admin
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="page-wrap">
      <section className="mb-5">
        <p className="text-sm font-bold uppercase text-betel-blue">{match.fase}</p>
        <h1 className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-2">
          <span className="rounded-lg bg-betel-ink px-2 py-1 text-sm font-black text-white">
            {match.codigo}
          </span>
          <TeamLabel team={match.teamA} fallbackFlag={match.flagA} size="lg" />
          <span className="text-3xl font-black text-slate-400">x</span>
          <TeamLabel team={match.teamB} fallbackFlag={match.flagB} size="lg" />
        </h1>
        <p className="mt-2 text-sm font-bold text-slate-600">{formatMatchDateTime(match)}</p>
      </section>

      <AdminResultForm match={match} predictions={predictions} />
      <ManualPredictionForm match={match} />

      <section className="mb-3">
        <h2 className="text-xl font-black text-slate-950">Palpites deste jogo</h2>
        <p className="mt-1 text-sm text-slate-600">
          Use os campos abaixo so para ajustes manuais individuais, se precisar.
        </p>
      </section>

      {loading ? <p className="text-sm font-bold text-slate-600">Carregando palpites...</p> : null}
      {error ? <p className="text-sm font-bold text-red-700">{error}</p> : null}

      <div className="grid gap-3">
        {predictions.map((prediction) => (
          <AdminPredictionScore key={prediction.id} prediction={prediction} />
        ))}
      </div>

      {!loading && predictions.length === 0 ? (
        <div className="panel p-5 text-sm text-slate-600">Nenhum palpite enviado para este jogo.</div>
      ) : null}
    </div>
  )
}
