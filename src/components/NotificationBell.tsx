import { Bell, BellRing, CheckCheck } from 'lucide-react'
import { useState } from 'react'
import { useSmartNotifications } from '../hooks/useSmartNotifications'

function formatNotificationTime(createdAtMs: number) {
  return new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(createdAtMs))
}

export function NotificationBell() {
  const {
    notifications,
    unreadCount,
    permission,
    markAllRead,
    openNotification,
    requestBrowserPermission,
  } = useSmartNotifications()
  const [open, setOpen] = useState(false)
  const Icon = unreadCount > 0 ? BellRing : Bell

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="relative grid h-10 w-10 place-items-center rounded-lg border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50"
        title="Notificacoes"
      >
        <Icon className="h-5 w-5" aria-hidden="true" />
        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-betel-red px-1 text-[10px] font-black text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 top-12 z-40 w-[min(22rem,calc(100vw-2rem))] rounded-lg border border-slate-200 bg-white p-3 shadow-xl">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-black text-slate-950">Avisos do bolao</p>
              <p className="text-xs text-slate-500">Gols, ranking e lembretes de palpite.</p>
            </div>
            {unreadCount > 0 ? (
              <button
                type="button"
                onClick={markAllRead}
                className="grid h-8 w-8 place-items-center rounded-lg text-slate-500 hover:bg-slate-100"
                title="Marcar tudo como lido"
              >
                <CheckCheck className="h-4 w-4" aria-hidden="true" />
              </button>
            ) : null}
          </div>

          {permission === 'default' ? (
            <button
              type="button"
              onClick={requestBrowserPermission}
              className="mb-3 w-full rounded-lg bg-blue-50 px-3 py-2 text-left text-xs font-bold text-betel-blue hover:bg-blue-100"
            >
              Ativar notificacoes do navegador
            </button>
          ) : null}

          <div className="max-h-80 space-y-2 overflow-y-auto">
            {notifications.length > 0 ? (
              notifications.map((notification) => (
                <button
                  key={notification.id}
                  type="button"
                  onClick={() => openNotification(notification)}
                  className={[
                    'w-full rounded-lg border p-3 text-left transition hover:bg-slate-50',
                    notification.read
                      ? 'border-slate-200 bg-white'
                      : 'border-blue-100 bg-blue-50',
                  ].join(' ')}
                >
                  <span className="flex items-start justify-between gap-3">
                    <span className="text-sm font-black text-slate-950">{notification.title}</span>
                    <span className="shrink-0 text-xs font-bold text-slate-500">
                      {formatNotificationTime(notification.createdAtMs)}
                    </span>
                  </span>
                  <span className="mt-1 block text-sm text-slate-600">{notification.body}</span>
                </button>
              ))
            ) : (
              <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
                Nenhum aviso ainda.
              </p>
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}
