import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { SidebarProvider } from '@/components/ui/sidebar';
import AdminNavbar from './AdminNavbar';
import MondaySidebar from './MondaySidebar';
import CommandPalette from './CommandPalette';
import ShortcutsHelp from './ShortcutsHelp';
import { TelemetryErrorBoundary } from '@/components/admin/TelemetryErrorBoundary';
import { useEnsureDefaultWorkspaces } from '@/hooks/useEnsureDefaultWorkspaces';
import { useGlobalShortcuts } from '@/hooks/useGlobalShortcuts';

export default function CrmLayout() {
  useEnsureDefaultWorkspaces();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  useGlobalShortcuts({
    onOpenPalette: () => setPaletteOpen(true),
    onShowHelp: () => setHelpOpen(true),
    onNewLead: () => window.dispatchEvent(new CustomEvent('crm:new-lead')),
  });

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background font-crm text-foreground">
        <MondaySidebar />
        <div className="flex-1 flex flex-col min-w-0 crm-paper-bg">
          <AdminNavbar onOpenPalette={() => setPaletteOpen(true)} />
          <main className="flex-1 overflow-y-auto">
            <div className="px-3 sm:px-5 lg:px-7 py-4 sm:py-6 max-w-[1600px] mx-auto w-full crm-stagger">
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
    </SidebarProvider>
  );
}

