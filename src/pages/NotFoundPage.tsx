import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <main className="grid min-h-svh place-items-center bg-betel-paper px-4">
      <section className="panel max-w-sm p-6 text-center">
        <h1 className="text-2xl font-black text-slate-950">Página não encontrada</h1>
        <p className="mt-2 text-sm text-slate-600">Volte para o painel principal do bolão.</p>
        <Link to="/home" className="btn-primary mt-5">
          Ir para home
        </Link>
      </section>
    </main>
  )
}
