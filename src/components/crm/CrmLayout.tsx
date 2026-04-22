import { Outlet } from 'react-router-dom';
import { SidebarProvider } from '@/components/ui/sidebar';
import AdminNavbar from './AdminNavbar';
import AdminSidebar from './AdminSidebar';

export default function CrmLayout() {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background font-crm text-foreground">
        <AdminSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <AdminNavbar />
          <main className="flex-1 overflow-y-auto">
            <div className="px-4 sm:px-8 py-6 sm:py-8 animate-fade-in-up">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
