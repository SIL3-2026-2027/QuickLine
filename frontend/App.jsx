import { Routes, Route, Navigate } from 'react-router-dom';

import ClientHome    from './pages/client/Home';
import TicketView    from './pages/client/Ticket';
import AgentLogin    from './pages/agent/Login';
import AgentDash     from './pages/agent/Dashboard';
import AdminRegister from './pages/admin/Register';
import AdminServices from './pages/admin/Services';
import AdminCounters from './pages/admin/Counters';
import AdminAgents   from './pages/admin/Agents';
import AdminStats    from './pages/admin/Stats';
import Display       from './pages/display/Display';

import AdminLayout   from './layouts/AdminLayout';
import AgentLayout   from './layouts/AgentLayout';

function RequireAuth({ role, children }) {
  const token = localStorage.getItem('quickline_token');
  let user = null;
  try { user = JSON.parse(localStorage.getItem('quickline_user') || 'null'); } catch { /* ignore */ }

  if (!token || !user) return <Navigate to="/agent/login" replace />;
  if (role && user.role !== role) {
    return <Navigate to={user.role === 'admin' ? '/admin/services' : '/agent/dashboard'} replace />;
  }
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/c/ma-banque" replace />} />

      <Route path="/c/:slug"         element={<ClientHome />} />
      <Route path="/ticket/:id"      element={<TicketView />} />
      <Route path="/agent/login"     element={<AgentLogin />} />

      <Route
        element={
          <RequireAuth role="agent">
            <AgentLayout />
          </RequireAuth>
        }
      >
        <Route path="/agent/dashboard" element={<AgentDash />} />
      </Route>

      <Route
        element={
          <RequireAuth role="admin">
            <AdminLayout />
          </RequireAuth>
        }
      >
        <Route path="/admin/services" element={<AdminServices />} />
        <Route path="/admin/counters" element={<AdminCounters />} />
        <Route path="/admin/agents"   element={<AdminAgents />} />
        <Route path="/admin/stats"    element={<AdminStats />} />
      </Route>

      <Route path="/admin/register"  element={<AdminRegister />} />
      <Route path="/display/:slug"   element={<Display />} />

      <Route path="*" element={
        <div className="min-h-screen flex items-center justify-center bg-slate-100">
          <div className="text-center">
            <h1 className="text-6xl font-black text-slate-900">404</h1>
            <p className="text-slate-500 mt-2">Page introuvable</p>
          </div>
        </div>
      } />
    </Routes>
  );
}
