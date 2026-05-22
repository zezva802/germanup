import { TopStrip } from '@/components/layout/top-strip';
import { AppSidebar } from '@/components/layout/app-sidebar';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--bg)' }}>
      <TopStrip />
      <div className="flex flex-1 min-h-0">
        <AppSidebar />
        <main
          className="flex-1 min-w-0 overflow-y-auto p-8"
          style={{ color: 'var(--text)' }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
