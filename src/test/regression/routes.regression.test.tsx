import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import './_supabaseMock';

// Mock dos hooks de auth/role para isolar o teste do ProtectedRoute.
const authState = { session: null as null | { user: { id: string } }, loading: false };
const roleState = { role: null as null | string, isAdmin: false, loading: false };

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    session: authState.session,
    loading: authState.loading,
    signOut: vi.fn(),
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('@/hooks/useUserRole', () => ({
  useUserRole: () => roleState,
}));

import ProtectedRoute from '@/components/ProtectedRoute';

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/admin/login" element={<div>LOGIN_PAGE</div>} />
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <div>ADMIN_DASHBOARD</div>
            </ProtectedRoute>
          }
        />
      </Routes>
    </MemoryRouter>
  );
}

describe('Regressão: rotas e permissões (ProtectedRoute)', () => {
  beforeEach(() => {
    authState.session = null;
    authState.loading = false;
    roleState.role = null;
    roleState.isAdmin = false;
    roleState.loading = false;
  });

  it('sem sessão → redireciona para /admin/login', () => {
    renderAt('/admin');
    expect(screen.getByText('LOGIN_PAGE')).toBeInTheDocument();
  });

  it('logado mas sem role admin → mostra "Acesso restrito"', () => {
    authState.session = { user: { id: 'u1' } };
    roleState.role = 'vendedor';
    roleState.isAdmin = false;
    renderAt('/admin');
    expect(screen.getByText(/acesso restrito/i)).toBeInTheDocument();
    expect(screen.queryByText('ADMIN_DASHBOARD')).not.toBeInTheDocument();
  });

  it('logado como admin → renderiza children do dashboard', () => {
    authState.session = { user: { id: 'u1' } };
    roleState.role = 'admin';
    roleState.isAdmin = true;
    renderAt('/admin');
    expect(screen.getByText('ADMIN_DASHBOARD')).toBeInTheDocument();
  });

  it('em loading → não vaza dashboard nem redireciona', () => {
    authState.loading = true;
    renderAt('/admin');
    expect(screen.queryByText('ADMIN_DASHBOARD')).not.toBeInTheDocument();
    expect(screen.queryByText('LOGIN_PAGE')).not.toBeInTheDocument();
  });
});
