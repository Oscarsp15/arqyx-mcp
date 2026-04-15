import { Moon, Sun } from 'lucide-react';
import { useTheme } from './theme-context.js';

export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const Icon = theme === 'light' ? Moon : Sun;
  const label = theme === 'light' ? 'Activar modo oscuro' : 'Activar modo claro';

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border text-foreground transition-colors hover:bg-muted"
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
    </button>
  );
}
