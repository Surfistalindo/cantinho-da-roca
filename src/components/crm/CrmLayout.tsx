import { Outlet } from 'react-router-dom';
import { SidebarProvider } from '@/components/ui/sidebar';
import AdminNavbar from './AdminNavbar';
import AdminSidebar from './AdminSidebar';

export default function CrmLayout() {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-muted font-crm">
        <AdminSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <AdminNavbar />
          <main className="flex-1 overflow-y-auto p-4 sm:p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
