import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { SidebarProvider } from '@/components/ui/sidebar';
import AdminNavbar from './AdminNavbar';
import MondaySidebar from './MondaySidebar';
import CommandPalette from './CommandPalette';
import ShortcutsHelp from './ShortcutsHelp';
import { TelemetryErrorBoundary } from '@/components/admin/TelemetryErrorBoundary';
import { useEnsureDefaultWorkspaces } from '@/hooks/useEnsureDefaultWorkspaces';
import { useGlobalShortcuts } from '@/hooks/useGlobalShortcuts';
import { TutorialProvider } from '@/components/tutorial/TutorialProvider';
import HelpButton from '@/components/tutorial/HelpButton';
import TourOverlay from '@/components/tutorial/TourOverlay';

export default function CrmLayout() {
  useEnsureDefaultWorkspaces();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  // Fallback para navegadores sem :has() — marca <html> com .crm-active
  // para que o scrollbar fino premium e as regras root sejam aplicados.
  useEffect(() => {
    const root = document.documentElement;
    root.classList.add('crm-active');
    return () => root.classList.remove('crm-active');
  }, []);

  useGlobalShortcuts({
    onOpenPalette: () => setPaletteOpen(true),
    onShowHelp: () => setHelpOpen(true),
    onNewLead: () => window.dispatchEvent(new CustomEvent('crm:new-lead')),
  });

  return (
    <SidebarProvider>
      <TutorialProvider>
        <div className="min-h-screen flex w-full bg-surface-sunken font-crm text-foreground overflow-x-hidden">
          {/* Sidebar fica fixa em viewport; documento todo é o scroller.
              No mobile, .crm-sidebar-shell anula o sticky/h-screen para
              não interferir com o scroll do documento (Sheet do shadcn assume). */}
          <div className="crm-sidebar-shell crm-sticky-layer sticky top-0 h-screen shrink-0 z-20">
            <MondaySidebar />
          </div>
          <div className="flex-1 flex flex-col min-w-0 bg-surface-1 crm-paper-bg">
            <AdminNavbar onOpenPalette={() => setPaletteOpen(true)} onShowHelp={() => setHelpOpen(true)} />
            <main className="flex-1 min-w-0">
              <div className="px-3 sm:px-5 lg:px-8 py-5 sm:py-7 max-w-[1600px] mx-auto w-full min-w-0 crm-stagger">
                <TelemetryErrorBoundary scope="admin-route">
                  <Outlet />
                </TelemetryErrorBoundary>
              </div>
            </main>
          </div>
        </div>
        <CommandPalette
          open={paletteOpen}
          onOpenChange={setPaletteOpen}
          onNewLead={() => window.dispatchEvent(new CustomEvent('crm:new-lead'))}
        />
        <ShortcutsHelp open={helpOpen} onOpenChange={setHelpOpen} />
        <TourOverlay />
      </TutorialProvider>
    </SidebarProvider>
  );
}

