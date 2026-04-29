import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import CrmLayout from "@/components/crm/CrmLayout";

// Páginas críticas (eager) — landing + login + páginas mais usadas
import Index from "./pages/Index";
import AdminLogin from "./pages/AdminLogin";
import ResetPassword from "./pages/ResetPassword";
import DashboardPage from "./pages/admin/DashboardPage";
import LeadsPage from "./pages/admin/LeadsPage";
import NotFound from "./pages/NotFound";

// Páginas pesadas / raramente usadas — lazy
const PipelinePage = lazy(() => import("./pages/admin/PipelinePage"));
const ClientsPage = lazy(() => import("./pages/admin/ClientsPage"));
const IAHomePage = lazy(() => import("./pages/admin/ia/IAHomePage"));
const IAExcelImportPage = lazy(() => import("./pages/admin/ia/IAExcelImportPage"));
const IACsvImportPage = lazy(() => import("./pages/admin/ia/IACsvImportPage"));
const IAPasteImportPage = lazy(() => import("./pages/admin/ia/IAPasteImportPage"));
const IAWhatsAppImportPage = lazy(() => import("./pages/admin/ia/IAWhatsAppImportPage"));
const IADuplicatesPage = lazy(() => import("./pages/admin/ia/IADuplicatesPage"));
const IAClassifyPage = lazy(() => import("./pages/admin/ia/IAClassifyPage"));
const IAScorePage = lazy(() => import("./pages/admin/ia/IAScorePage"));
const IAInsightsPage = lazy(() => import("./pages/admin/ia/IAInsightsPage"));
const IAAssistantPage = lazy(() => import("./pages/admin/ia/IAAssistantPage"));
const AuditUiPage = lazy(() => import("./pages/admin/AuditUiPage"));
const TelemetryPage = lazy(() => import("./pages/admin/TelemetryPage"));
const TaskBoardPage = lazy(() => import("./pages/admin/TaskBoardPage"));
const MyWorkPage = lazy(() => import("./pages/admin/MyWorkPage"));
const WhatsAppPage = lazy(() => import("./pages/admin/WhatsAppPage"));
const SettingsLayout = lazy(() => import("./pages/admin/settings/SettingsLayout"));
const SettingsProfilePage = lazy(() => import("./pages/admin/settings/ProfilePage"));
const SettingsUsersPage = lazy(() => import("./pages/admin/settings/UsersPage"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,         // 30s — dados considerados frescos
      gcTime: 5 * 60_000,         // 5min — mantém cache mesmo sem assinantes
      refetchOnWindowFocus: false,
      retry: 1,
    },
    mutations: {
      retry: 0,
    },
  },
});

const RouteFallback = () => (
  <div className="flex h-[60vh] w-full items-center justify-center">
    <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <CrmLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="leads" element={<LeadsPage />} />
              <Route path="pipeline" element={<Suspense fallback={<RouteFallback />}><PipelinePage /></Suspense>} />
              <Route path="clients" element={<Suspense fallback={<RouteFallback />}><ClientsPage /></Suspense>} />
              <Route path="ia" element={<Suspense fallback={<RouteFallback />}><IAHomePage /></Suspense>} />
              <Route path="ia/excel" element={<Suspense fallback={<RouteFallback />}><IAExcelImportPage /></Suspense>} />
              <Route path="ia/csv" element={<Suspense fallback={<RouteFallback />}><IACsvImportPage /></Suspense>} />
              <Route path="ia/paste" element={<Suspense fallback={<RouteFallback />}><IAPasteImportPage /></Suspense>} />
              <Route path="ia/whatsapp" element={<Suspense fallback={<RouteFallback />}><IAWhatsAppImportPage /></Suspense>} />
              <Route path="ia/duplicates" element={<Suspense fallback={<RouteFallback />}><IADuplicatesPage /></Suspense>} />
              <Route path="ia/classify" element={<Suspense fallback={<RouteFallback />}><IAClassifyPage /></Suspense>} />
              <Route path="ia/score" element={<Suspense fallback={<RouteFallback />}><IAScorePage /></Suspense>} />
              <Route path="ia/insights" element={<Suspense fallback={<RouteFallback />}><IAInsightsPage /></Suspense>} />
              <Route path="ia/assistant" element={<Suspense fallback={<RouteFallback />}><IAAssistantPage /></Suspense>} />
              <Route path="audit-ui" element={<Suspense fallback={<RouteFallback />}><AuditUiPage /></Suspense>} />
              <Route path="telemetry" element={<Suspense fallback={<RouteFallback />}><TelemetryPage /></Suspense>} />
              <Route path="my-work" element={<Suspense fallback={<RouteFallback />}><MyWorkPage /></Suspense>} />
              <Route path="whatsapp" element={<Suspense fallback={<RouteFallback />}><WhatsAppPage /></Suspense>} />
              <Route path="boards/:boardId" element={<Suspense fallback={<RouteFallback />}><TaskBoardPage /></Suspense>} />
              <Route path="settings" element={<Suspense fallback={<RouteFallback />}><SettingsLayout /></Suspense>}>
                <Route index element={<Navigate to="profile" replace />} />
                <Route path="profile" element={<Suspense fallback={<RouteFallback />}><SettingsProfilePage /></Suspense>} />
                <Route path="users" element={<Suspense fallback={<RouteFallback />}><SettingsUsersPage /></Suspense>} />
              </Route>
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
