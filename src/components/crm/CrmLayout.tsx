import { Outlet } from 'react-router-dom';
import { SidebarProvider } from '@/components/ui/sidebar';
import AdminNavbar from './AdminNavbar';
import MondaySidebar from './MondaySidebar';
import { TelemetryErrorBoundary } from '@/components/admin/TelemetryErrorBoundary';
import { useEnsureDefaultWorkspaces } from '@/hooks/useEnsureDefaultWorkspaces';

export default function CrmLayout() {
  useEnsureDefaultWorkspaces();
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background font-crm text-foreground">
        <MondaySidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <AdminNavbar />
          <main className="flex-1 overflow-y-auto bg-background">
            <div className="px-3 sm:px-5 py-4 sm:py-5 animate-fade-in-up">
              <TelemetryErrorBoundary scope="admin-route">
                <Outlet />
              </TelemetryErrorBoundary>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

