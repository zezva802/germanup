import { TopStrip } from '@/components/layout/top-strip';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { ThemeAccent } from '@/components/layout/theme-accent';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen theme-transition" style={{ background: 'var(--tint-main)' }}>
      <ThemeAccent />
      <TopStrip />
      <div className="flex flex-1 min-h-0">
        <AppSidebar />
        <main
          className="flex-1 min-w-0 overflow-y-auto p-8 theme-transition"
          style={{ color: 'var(--text)', background: 'var(--tint-main)' }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
