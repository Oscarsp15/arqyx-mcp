import type { ConnectionStatus } from '../../ws/client.js';

type ConnectionIndicatorProps = {
  status: ConnectionStatus;
};

const STATUS_LABEL: Record<ConnectionStatus, string> = {
  connecting: 'Conectando…',
  open: 'Conectado',
  closed: 'Sin conexión',
};

const STATUS_DOT_CLASS: Record<ConnectionStatus, string> = {
  connecting: 'bg-amber-500',
  open: 'bg-emerald-500',
  closed: 'bg-red-500',
};

export function ConnectionIndicator({ status }: ConnectionIndicatorProps) {
  return (
    <span
      className="inline-flex items-center gap-2 text-muted-foreground text-xs"
      aria-live="polite"
    >
      <span
        aria-hidden="true"
        className={`inline-block h-2 w-2 rounded-full ${STATUS_DOT_CLASS[status]}`}
      />
      {STATUS_LABEL[status]}
    </span>
  );
}
