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
          <main className="flex-1 overflow-y-auto bg-background">
            <div className="px-3 sm:px-5 py-4 sm:py-5 animate-fade-in-up">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
