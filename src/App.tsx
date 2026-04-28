import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import CrmLayout from "@/components/crm/CrmLayout";
import Index from "./pages/Index";
import AdminLogin from "./pages/AdminLogin";
import ResetPassword from "./pages/ResetPassword";
import DashboardPage from "./pages/admin/DashboardPage";
import LeadsPage from "./pages/admin/LeadsPage";
import PipelinePage from "./pages/admin/PipelinePage";
import ClientsPage from "./pages/admin/ClientsPage";
import IAHomePage from "./pages/admin/ia/IAHomePage";
import IAExcelImportPage from "./pages/admin/ia/IAExcelImportPage";
import IACsvImportPage from "./pages/admin/ia/IACsvImportPage";
import IAPasteImportPage from "./pages/admin/ia/IAPasteImportPage";
import IAWhatsAppImportPage from "./pages/admin/ia/IAWhatsAppImportPage";
import IADuplicatesPage from "./pages/admin/ia/IADuplicatesPage";
import IAClassifyPage from "./pages/admin/ia/IAClassifyPage";
import IAScorePage from "./pages/admin/ia/IAScorePage";
import IAInsightsPage from "./pages/admin/ia/IAInsightsPage";
import IAAssistantPage from "./pages/admin/ia/IAAssistantPage";
import AuditUiPage from "./pages/admin/AuditUiPage";
import TelemetryPage from "./pages/admin/TelemetryPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

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
              <Route path="pipeline" element={<PipelinePage />} />
              <Route path="clients" element={<ClientsPage />} />
              <Route path="ia" element={<IAHomePage />} />
              <Route path="ia/excel" element={<IAExcelImportPage />} />
              <Route path="ia/csv" element={<IACsvImportPage />} />
              <Route path="ia/paste" element={<IAPasteImportPage />} />
              <Route path="ia/whatsapp" element={<IAWhatsAppImportPage />} />
              <Route path="ia/duplicates" element={<IADuplicatesPage />} />
              <Route path="ia/classify" element={<IAClassifyPage />} />
              <Route path="ia/score" element={<IAScorePage />} />
              <Route path="ia/insights" element={<IAInsightsPage />} />
              <Route path="ia/assistant" element={<IAAssistantPage />} />
              <Route path="audit-ui" element={<AuditUiPage />} />
              <Route path="telemetry" element={<TelemetryPage />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
