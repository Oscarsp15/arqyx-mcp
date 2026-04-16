import { X } from 'lucide-react';
import { useEffect, useRef } from 'react';

type ConfirmDialogProps = {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmLabel?: string;
};

export function ConfirmDialog({
  message,
  onConfirm,
  onCancel,
  confirmLabel = 'Eliminar',
}: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onCancel]);

  useEffect(() => {
    cancelRef.current?.focus();
  }, []);

  return (
    <dialog
      open
      aria-modal="true"
      className="fixed inset-0 z-50 m-0 flex h-full w-full max-w-none items-center justify-center bg-black/50 p-0"
    >
      <div className="nodrag nowheel mx-4 w-full max-w-sm rounded-lg border border-border bg-background p-5 shadow-xl">
        <div className="mb-4 flex items-start justify-between gap-3">
          <p className="text-sm text-foreground">{message}</p>
          <button
            type="button"
            className="shrink-0 text-muted-foreground hover:text-foreground"
            onClick={onCancel}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex justify-end gap-2">
          <button
            ref={cancelRef}
            type="button"
            className="rounded-md border border-border px-3 py-1.5 text-sm text-foreground hover:bg-muted transition-colors"
            onClick={onCancel}
          >
            Cancelar
          </button>
          <button
            type="button"
            // color semáforo: acción destructiva
            className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 transition-colors"
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </dialog>
  );
}
