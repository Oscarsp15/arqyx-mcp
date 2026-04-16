import { useEffect, useId, useMemo, useRef, useState } from 'react';

export type CanvasDropdownOption = {
  id: string;
};

export type CanvasDropdownState = {
  labelId: string;
  buttonId: string;
  menuId: string;
  rootRef: React.MutableRefObject<HTMLDivElement | null>;
  buttonRef: React.MutableRefObject<HTMLButtonElement | null>;
  getOptionRef: (index: number) => (element: HTMLButtonElement | null) => void;
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
  activeIndex: number;
  setActiveIndex: (index: number) => void;
};

function clampIndex(length: number, index: number): number {
  if (length <= 0) return 0;
  const last = length - 1;
  return Math.max(0, Math.min(last, index));
}

export function useCanvasDropdown(args: {
  options: readonly CanvasDropdownOption[];
  selectedId: string | null;
}): CanvasDropdownState {
  const { options, selectedId } = args;
  const dropdownId = useId();

  const [isOpen, setIsOpen] = useState(false);

  const selectedIndex = useMemo(() => {
    const index = options.findIndex((option) => option.id === selectedId);
    return index === -1 ? 0 : index;
  }, [options, selectedId]);

  const [activeIndex, setActiveIndexState] = useState(selectedIndex);

  const rootRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const labelId = `${dropdownId}-label`;
  const buttonId = `${dropdownId}-button`;
  const menuId = `${dropdownId}-menu`;

  useEffect(() => {
    if (!isOpen) return;

    const onPointerDown = (event: PointerEvent) => {
      const root = rootRef.current;
      if (!root) return;
      if (event.target instanceof Node && root.contains(event.target)) return;
      setIsOpen(false);
    };

    window.addEventListener('pointerdown', onPointerDown, { capture: true });
    return () => window.removeEventListener('pointerdown', onPointerDown, { capture: true });
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    optionRefs.current[activeIndex]?.focus();
  }, [isOpen, activeIndex]);

  useEffect(() => {
    if (!isOpen) return;
    setActiveIndexState(selectedIndex);
  }, [isOpen, selectedIndex]);

  const getOptionRef = (index: number) => (element: HTMLButtonElement | null) => {
    optionRefs.current[index] = element;
  };

  const open = () => setIsOpen(true);
  const close = () => setIsOpen(false);
  const toggle = () => setIsOpen((open) => !open);

  const setActiveIndex = (index: number) => {
    setActiveIndexState(clampIndex(options.length, index));
  };

  return {
    labelId,
    buttonId,
    menuId,
    rootRef,
    buttonRef,
    getOptionRef,
    isOpen,
    open,
    close,
    toggle,
    activeIndex,
    setActiveIndex,
  };
}
