"use client";
import { useEffect, useRef, useState, useId } from 'react';
import type { SectionAxis } from '@/lib/section-analysis';

export function SectionAnalysisMenu({ section, flipped, onSectionChange, onFlip }: {
  section: SectionAxis; flipped: boolean;
  onSectionChange: (axis: SectionAxis) => void; onFlip: () => void;
}) {
  const menu = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const menuId = useId();
  useEffect(() => {
    function dismiss(event: PointerEvent) {
      if (menu.current && !menu.current.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener('pointerdown', dismiss);
    return () => document.removeEventListener('pointerdown', dismiss);
  }, []);
  useEffect(() => {
    if (!open) return;
    const toolbar = menu.current?.closest('.viewer-tools') as HTMLElement | null;
    if (toolbar && menu.current) toolbar.scrollLeft = Math.max(0, menu.current.offsetLeft + menu.current.offsetWidth - toolbar.clientWidth);
  }, [open]);
  return <div ref={menu} className="section-analysis-menu" onKeyDown={event => {
    if (event.key === 'Escape' && open) {
      setOpen(false);
      menu.current?.querySelector('button')?.focus();
      event.stopPropagation();
    }
  }}>
    <button type="button" className="section-analysis-trigger" data-active={section !== 'none'} title="Section Analysis" aria-label={`Section Analysis — ${section === 'none' ? 'model utuh' : section}`} aria-expanded={open} aria-controls={menuId} onClick={() => setOpen(!open)}>
      <svg width="22" height="22" viewBox="0 0 28 28" fill="none" aria-hidden="true">
        <path d="M7 5h17v18H7zM7 14h17" stroke="currentColor" strokeWidth="1.3"/>
        <path d="M4 3h9v22H4z" fill="#39b9ff" fillOpacity=".25" stroke="#39b9ff" strokeWidth="1.5"/>
        <path d="M2 8V1h7M2 20v7h7M16 1v26" stroke="#39b9ff" strokeWidth="1.5"/>
      </svg>
    </button>
    <div id={menuId} className="section-analysis-inline" hidden={!open} role="group" aria-label="Pilihan Section Analysis">
      <div className="section-plane-options">{(['none', 'XY', 'XZ', 'YZ'] as const).map(axis => <button type="button" key={axis} aria-pressed={section === axis} onClick={() => onSectionChange(axis)}>{axis === 'none' ? 'Utuh' : axis}</button>)}</div>
      <button type="button" className="section-flip" disabled={section === 'none'} aria-pressed={flipped} onClick={onFlip}>Balik sisi</button>
    </div>
  </div>;
}
