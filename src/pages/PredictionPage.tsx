import { Save } from 'lucide-react'
import { doc, serverTimestamp, setDoc } from 'firebase/firestore'
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { TeamLabel } from '../components/TeamLabel'
import { useAuth } from '../context/auth'
import { useMatches } from '../hooks/useMatches'
import { useMatchPredictions, useUserPredictions } from '../hooks/usePredictions'
import { db } from '../lib/firebase'
import { formatPredictionScore, numberFromForm, winnerFromScores } from '../lib/matchResult'
import { formatMatchDateTime, getMatchAvailability } from '../lib/time'
import type { Prediction } from '../types'

interface PredictionFormState {
  palpiteA: string
  palpiteB: string
  palpitePenaltisA: string
  palpitePenaltisB: string
  classificado: string
  jogadoresGolTexto: string
}

function emptyForm(classificado = ''): PredictionFormState {
  return {
    palpiteA: '',
    palpiteB: '',
    palpitePenaltisA: '',
    palpitePenaltisB: '',
    classificado,
    jogadoresGolTexto: '',
  }
}

function scoreIsDraw(form: PredictionFormState) {
  return form.palpiteA !== '' && form.palpiteB !== '' && Number(form.palpiteA) === Number(form.palpiteB)
}

function PublicPredictionsList({
  predictions,
  show,
}: {
  predictions: Prediction[]
  show: boolean
}) {
  if (!show) {
    return null
  }

  return (
    <section className="panel mt-5 p-5">
      <h2 className="text-xl font-black text-slate-950">Palpites dos usuarios</h2>
      <p className="mt-1 text-sm text-slate-600">
        Os palpites ficam visiveis aqui depois que o prazo do jogo encerra.
      </p>

      <div className="mt-4 grid gap-3">
        {predictions.map((prediction) => (
          <article key={prediction.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-black text-slate-950">{prediction.userName}</p>
              <span className="rounded-lg bg-white px-2 py-1 text-xs font-black text-slate-700">
                {prediction.pontuado ? `${prediction.totalPontos} pts` : 'Aguardando'}
              </span>
            </div>
            <p className="mt-2 text-sm font-bold text-slate-700">
              {formatPredictionScore(prediction)}, classifica {prediction.classificado}
            </p>
            <p className="mt-1 text-sm text-slate-600">
              Gols: {prediction.jogadoresGolTexto || '-'}
            </p>
          </article>
        ))}
      </div>

      {predictions.length === 0 ? (
        <div className="mt-4 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
          Nenhum palpite enviado para este jogo.
        </div>
      ) : null}
    </section>
  )
}

export function PredictionPage() {
  const { matchId } = useParams()
  const navigate = useNavigate()
  const { profile } = useAuth()
  const { matches } = useMatches()
  const { predictions } = useUserPredictions(profile?.uid)
  const { predictions: matchPredictions } = useMatchPredictions(matchId)
  const match = matches.find((item) => item.id === matchId)
  const existingPrediction = predictions.find((prediction) => prediction.matchId === matchId)
  const availability = match ? getMatchAvailability(match) : null
  const [form, setForm] = useState<PredictionFormState>(emptyForm())
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (existingPrediction) {
      setForm({
        palpiteA: String(existingPrediction.palpiteA),
        palpiteB: String(existingPrediction.palpiteB),
        palpitePenaltisA:
          existingPrediction.palpitePenaltisA === null ||
          existingPrediction.palpitePenaltisA === undefined
            ? ''
            : String(existingPrediction.palpitePenaltisA),
        palpitePenaltisB:
          existingPrediction.palpitePenaltisB === null ||
          existingPrediction.palpitePenaltisB === undefined
            ? ''
            : String(existingPrediction.palpitePenaltisB),
        classificado: existingPrediction.classificado,
        jogadoresGolTexto: existingPrediction.jogadoresGolTexto,
      })
      return
    }

    if (match) {
      setForm(emptyForm(match.teamA))
    }
  }, [existingPrediction, match])

  const canSubmit = useMemo(() => Boolean(db && profile && match && availability?.isOpen), [
    availability?.isOpen,
    match,
    profile,
  ])
  const drawPrediction = scoreIsDraw(form)
  const predictedWinner = match
    ? winnerFromScores({
        teamA: match.teamA,
        teamB: match.teamB,
        scoreA: numberFromForm(form.palpiteA),
        scoreB: numberFromForm(form.palpiteB),
        penaltiesA: drawPrediction ? numberFromForm(form.palpitePenaltisA) : null,
        penaltiesB: drawPrediction ? numberFromForm(form.palpitePenaltisB) : null,
      })
    : ''
  const showPublicPredictions =
    Boolean(match && availability?.state === 'closed') || profile?.role === 'admin'

  if (!match) {
    return (
      <div className="page-wrap">
        <div className="panel p-5">
          <h1 className="text-xl font-black text-slate-950">Jogo não encontrado</h1>
          <Link to="/jogos" className="btn-secondary mt-4">
            Voltar aos jogos
          </Link>
        </div>
      </div>
    )
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!db || !profile || !match || !availability?.isOpen) {
      return
    }

    setSaving(true)
    setError(null)

    try {
      const palpiteA = Number(form.palpiteA)
      const palpiteB = Number(form.palpiteB)
      const needsPenalties = palpiteA === palpiteB
      const palpitePenaltisA = needsPenalties ? numberFromForm(form.palpitePenaltisA) : null
      const palpitePenaltisB = needsPenalties ? numberFromForm(form.palpitePenaltisB) : null
      const classificado = winnerFromScores({
        teamA: match.teamA,
        teamB: match.teamB,
        scoreA: palpiteA,
        scoreB: palpiteB,
        penaltiesA: palpitePenaltisA,
        penaltiesB: palpitePenaltisB,
      })

      if (!classificado || (needsPenalties && palpitePenaltisA === palpitePenaltisB)) {
        setError('Informe o placar e, em caso de empate, os penaltis com um vencedor.')
        setSaving(false)
        return
      }

      const predictionId = `${profile.uid}_${match.id}`
      const payload: Record<string, unknown> = {
        id: predictionId,
        userId: profile.uid,
        userName: profile.nome,
        matchId: match.id,
        matchCode: match.codigo,
        teamA: match.teamA,
        teamB: match.teamB,
        palpiteA,
        palpiteB,
        palpitePenaltisA,
        palpitePenaltisB,
        classificado,
        jogadoresGolTexto: form.jogadoresGolTexto.trim(),
        pontosPlacar: existingPrediction?.pontosPlacar || 0,
        pontosGols: existingPrediction?.pontosGols || 0,
        pontosClassificado: existingPrediction?.pontosClassificado || 0,
        pontosExtras: existingPrediction?.pontosExtras || 0,
        totalPontos: existingPrediction?.totalPontos || 0,
        pontuado: existingPrediction?.pontuado || false,
        observacaoAdmin: existingPrediction?.observacaoAdmin || '',
        updatedAt: serverTimestamp(),
      }

      if (!existingPrediction) {
        payload.createdAt = serverTimestamp()
      }

      await setDoc(doc(db, 'predictions', predictionId), payload, { merge: true })
      navigate('/jogos')
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Não foi possível salvar.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="page-wrap">
      <section className="panel p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-bold uppercase text-betel-blue">{match.fase}</p>
            <h1 className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-2">
              <TeamLabel team={match.teamA} fallbackFlag={match.flagA} size="lg" />
              <span className="text-3xl font-black text-slate-400">x</span>
              <TeamLabel team={match.teamB} fallbackFlag={match.flagB} size="lg" />
            </h1>
            <p className="mt-2 text-sm font-bold text-slate-600">{formatMatchDateTime(match)}</p>
          </div>
          <span
            className={[
              'status-pill',
              availability?.isOpen ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-900',
            ].join(' ')}
          >
            {availability?.message}
          </span>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
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
                disabled={!availability?.isOpen}
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
                disabled={!availability?.isOpen}
              />
            </label>
          </div>

          {drawPrediction ? (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p className="mb-2 text-sm font-black text-slate-950">Penaltis</p>
              <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-3">
                <label>
                  <span className="label">{match.teamA}</span>
                  <input
                    className="input mt-1 text-center text-lg font-black"
                    type="number"
                    min="0"
                    value={form.palpitePenaltisA}
                    onChange={(event) => setForm({ ...form, palpitePenaltisA: event.target.value })}
                    required={drawPrediction}
                    disabled={!availability?.isOpen}
                  />
                </label>
                <span className="pb-2 text-lg font-black text-slate-400">x</span>
                <label>
                  <span className="label">{match.teamB}</span>
                  <input
                    className="input mt-1 text-center text-lg font-black"
                    type="number"
                    min="0"
                    value={form.palpitePenaltisB}
                    onChange={(event) => setForm({ ...form, palpitePenaltisB: event.target.value })}
                    required={drawPrediction}
                    disabled={!availability?.isOpen}
                  />
                </label>
              </div>
            </div>
          ) : null}

          <label className="block">
            <span className="label">Quem se classifica</span>
            <div className="mt-1 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm font-black text-slate-950">
              {predictedWinner || 'Defina o placar para calcular'}
            </div>
          </label>

          <label className="block">
            <span className="label">Jogadores que farão gol</span>
            <textarea
              className="input mt-1 min-h-24"
              value={form.jogadoresGolTexto}
              onChange={(event) => setForm({ ...form, jogadoresGolTexto: event.target.value })}
              placeholder="Texto livre"
              disabled={!availability?.isOpen}
            />
          </label>

          {error ? <p className="text-sm font-bold text-red-700">{error}</p> : null}

          <div className="flex flex-wrap gap-3">
            <button type="submit" className="btn-primary" disabled={!canSubmit || saving}>
              <Save className="h-4 w-4" aria-hidden="true" />
              Salvar palpite
            </button>
            <Link to="/jogos" className="btn-secondary">
              Voltar
            </Link>
          </div>
        </form>
      </section>
      <PublicPredictionsList predictions={matchPredictions} show={showPublicPredictions} />
    </div>
  )
}
