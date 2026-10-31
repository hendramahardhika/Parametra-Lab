"use client";
import { BookOpen, Box, ChartNoAxesCombined, LayoutDashboard, Menu } from 'lucide-react';
import { useSidebar } from '@/components/ui/sidebar';

const shortcuts = [
  { path: '', label: 'Beranda', icon: LayoutDashboard },
  { path: 'modul', label: 'Modul', icon: BookOpen },
  { path: 'lab', label: 'Lab 3D', icon: Box },
  { path: 'progres', label: 'Progres', icon: ChartNoAxesCombined },
];

export function MobileNavigation({ route }: { route: string }) {
  const { openMobile, setOpenMobile } = useSidebar();
  const current = route.split('/')[0];
  return <nav className="mobile-navigation" aria-label="Navigasi utama ponsel">
    {shortcuts.map(({ path, label, icon: Icon }) => <a key={path} href={`#${path}`} aria-current={current === path ? 'page' : undefined} onClick={() => setOpenMobile(false)}>
      <Icon size={21} aria-hidden="true"/><span>{label}</span>
    </a>)}
    <button type="button" aria-label="Buka semua menu" aria-haspopup="dialog" aria-expanded={openMobile} onClick={() => setOpenMobile(true)}><Menu size={21} aria-hidden="true"/><span>Menu</span></button>
  </nav>;
}
