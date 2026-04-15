import type { FlowNodeColor } from '@arqyx/shared';

type ColorClasses = {
  container: string;
  headerBg: string;
  text: string;
};

const PALETTE: Record<FlowNodeColor, ColorClasses> = {
  neutral: {
    container: 'border-border bg-background',
    headerBg: 'bg-muted',
    text: 'text-foreground',
  },
  blue: {
    container: 'border-blue-400 bg-blue-50 dark:border-blue-500/60 dark:bg-blue-950/40',
    headerBg: 'bg-blue-100 dark:bg-blue-900/40',
    text: 'text-blue-950 dark:text-blue-100',
  },
  green: {
    container: 'border-emerald-400 bg-emerald-50 dark:border-emerald-500/60 dark:bg-emerald-950/40',
    headerBg: 'bg-emerald-100 dark:bg-emerald-900/40',
    text: 'text-emerald-950 dark:text-emerald-100',
  },
  amber: {
    container: 'border-amber-400 bg-amber-50 dark:border-amber-500/60 dark:bg-amber-950/40',
    headerBg: 'bg-amber-100 dark:bg-amber-900/40',
    text: 'text-amber-950 dark:text-amber-100',
  },
  red: {
    container: 'border-red-400 bg-red-50 dark:border-red-500/60 dark:bg-red-950/40',
    headerBg: 'bg-red-100 dark:bg-red-900/40',
    text: 'text-red-950 dark:text-red-100',
  },
  purple: {
    container: 'border-purple-400 bg-purple-50 dark:border-purple-500/60 dark:bg-purple-950/40',
    headerBg: 'bg-purple-100 dark:bg-purple-900/40',
    text: 'text-purple-950 dark:text-purple-100',
  },
};

export function colorClassesFor(color: FlowNodeColor): ColorClasses {
  return PALETTE[color];
}
