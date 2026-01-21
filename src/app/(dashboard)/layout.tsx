import { ReactNode } from 'react';
import ThemeToggler from '@/components/theme/toggler';

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-background relative">
      <header className="absolute top-4 right-4 z-50">
        <ThemeToggler />
      </header>
      <main className="flex-1 overflow-y-auto relative flex flex-col">
        {children}
      </main>
    </div>
  )
}