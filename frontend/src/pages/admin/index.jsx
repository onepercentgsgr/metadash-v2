'use client';

import { useState, useEffect } from 'react';
import { Layout } from '../../components/Layout';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';

function StatCard({ label, value, icon, color }) {
  const colors = {
    indigo: 'from-indigo-600/20 to-indigo-900/10 border-indigo-700/50',
    green: 'from-green-600/20 to-green-900/10 border-green-700/50',
    yellow: 'from-yellow-600/20 to-yellow-900/10 border-yellow-700/50',
    red: 'from-red-600/20 to-red-900/10 border-red-700/50',
  };
  return (
    <div className={`bg-gradient-to-br ${colors[color]} border rounded-xl p-5`}>
      <div className="text-2xl mb-2">{icon}</div>
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="text-sm text-gray-400">{label}</div>
    </div>
  );
}

export default function AdminPage() {
  const { user, token } = useAuth();
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [updatingUser, setUpdatingUser] = useState(null);

  useEffect(() => {
    if (user?.role !== 'admin' || !token) return;
    loadData();
  }, [user, token]);

  async function loadData() {
    setLoading(true);
    try {
      const [usersData, statsData] = await Promise.allSettled([
        api.getUsers(),
        api.getStats(),
      ]);
      if (usersData.status === 'fulfilled') {
        setUsers(Array.isArray(usersData.value) ? usersData.value : []);
      } else {
        console.error('Failed to load users:', usersData.reason);
        setError('Error cargando usuarios: ' + (usersData.reason?.message || 'Error desconocido'));
      }
      if (statsData.status === 'fulfilled') {
        setStats(statsData.value);
      } else {
        console.error('Failed to load stats:', statsData.reason);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function toggleUser(userId) {
    setUpdatingUser(userId);
    try {
      await api.apiFetch(`/admin/users/${userId}/toggle`, { method: 'POST' });
      setSuccess('Usuario actualizado');
      await loadData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setUpdatingUser(null);
    }
  }

  async function extendTrial(userId) {
    setUpdatingUser(userId);
    try {
      await api.apiFetch(`/admin/users/${userId}/extend-trial`, { method: 'POST' });
      setSuccess('Trial extendido 7 dias');
      await loadData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setUpdatingUser(null);
    }
  }

  async function setPlan(userId, plan) {
    setUpdatingUser(userId);
    try {
      await api.apiFetch(`/admin/users/${userId}/set-plan`, {
        method: 'POST',
        body: JSON.stringify({ plan }),
      });
      setSuccess(`Plan cambiado a ${plan}`);
      await loadData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setUpdatingUser(null);
    }
  }

  if (user?.role !== 'admin') {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-gray-400">Acceso restringido a administradores</p>
        </div>
      </Layout>
    );
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </Layout>
    );
  }

  const filtered = users.filter(u => {
    if (filter === 'active' && !u.is_active) return false;
    if (filter === 'trial' && u.subscription_plan !== 'trial') return false;
    if (filter === 'paid' && u.subscription_plan === 'trial') return false;
    if (search && !u.email.toLowerCase().includes(search.toLowerCase()) && !(u.name || '').toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const planColors = {
    trial: 'bg-yellow-900/30 text-yellow-300 border-yellow-700/40',
    starter: 'bg-blue-900/30 text-blue-300 border-blue-700/40',
    pro: 'bg-purple-900/30 text-purple-300 border-purple-700/40',
    enterprise: 'bg-indigo-900/30 text-indigo-300 border-indigo-700/40',
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Panel Administrador</h1>
            <p className="text-gray-400 mt-1">Gestiona clientes, planes y metricas de la plataforma</p>
          </div>
          <button onClick={loadData} className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm border border-gray-700">Actualizar</button>
        </div>

        {error && <div className="bg-red-900/30 border border-red-700 rounded-xl p-4"><p className="text-red-200 text-sm">{error}</p></div>}
        {success && <div className="bg-green-900/30 border border-green-700 rounded-xl p-4"><p className="text-green-200 text-sm">{success}</p></div>}

        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon="👥" label="Total Usuarios" value={stats.total_users} color="indigo" />
            <StatCard icon="⏳" label="Trials Activos" value={stats.active_trials} color="yellow" />
            <StatCard icon="💰" label="Usuarios Pagos" value={stats.paid_users} color="green" />
            <StatCard icon="📈" label="Revenue" value={`$${(stats.revenue || 0).toLocaleString()}`} color="red" />
          </div>
        )}

        <div className="flex items-center gap-3 flex-wrap">
          <input
            type="text"
            placeholder="Buscar por email o nombre..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 min-w-[200px] bg-gray-800/80 border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-indigo-500"
          />
          {['all', 'active', 'trial', 'paid'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${filter === f ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
            >
              {f === 'all' ? 'Todos' : f === 'active' ? 'Activos' : f === 'trial' ? 'Trial' : 'Pagos'}
            </button>
          ))}
          <span className="text-xs text-gray-500">{filtered.length} de {users.length}</span>
        </div>

        <div className="bg-gray-900/80 border border-gray-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left p-4 text-xs font-semibold text-gray-400 uppercase">Usuario</th>
                  <th className="text-left p-4 text-xs font-semibold text-gray-400 uppercase">Plan</th>
                  <th className="text-left p-4 text-xs font-semibold text-gray-400 uppercase">Estado</th>
                  <th className="text-left p-4 text-xs font-semibold text-gray-400 uppercase">Registro</th>
                  <th className="text-left p-4 text-xs font-semibold text-gray-400 uppercase">Trial Expira</th>
                  <th className="text-right p-4 text-xs font-semibold text-gray-400 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => {
                  const trialEnd = u.trial_end ? new Date(u.trial_end) : null;
                  const isExpired = trialEnd && trialEnd < new Date();
                  return (
                    <tr key={u.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                            {(u.name || u.email)[0].toUpperCase()}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-white">{u.name || 'Sin nombre'}</div>
                            <div className="text-xs text-gray-500">{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${planColors[u.subscription_plan] || planColors.trial}`}>
                          {(u.subscription_plan || 'trial').toUpperCase()}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1.5 text-xs ${u.is_active ? 'text-green-400' : 'text-red-400'}`}>
                          <span className={`w-2 h-2 rounded-full ${u.is_active ? 'bg-green-400' : 'bg-red-400'}`}></span>
                          {u.is_active ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-gray-400">{new Date(u.created_at).toLocaleDateString('es-AR')}</td>
                      <td className="p-4">
                        {trialEnd ? (
                          <span className={`text-sm ${isExpired ? 'text-red-400' : 'text-gray-400'}`}>
                            {isExpired ? 'Expirado' : trialEnd.toLocaleDateString('es-AR')}
                          </span>
                        ) : <span className="text-sm text-gray-600">—</span>}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => toggleUser(u.id)}
                            disabled={updatingUser === u.id}
                            className={`text-xs px-3 py-1.5 rounded-lg transition-colors border ${u.is_active ? 'bg-red-900/30 text-red-300 border-red-700/40 hover:bg-red-900/50' : 'bg-green-900/30 text-green-300 border-green-700/40 hover:bg-green-900/50'}`}
                          >
                            {updatingUser === u.id ? '...' : u.is_active ? 'Desactivar' : 'Activar'}
                          </button>
                          {u.subscription_plan === 'trial' && (
                            <button
                              onClick={() => extendTrial(u.id)}
                              disabled={updatingUser === u.id}
                              className="text-xs px-3 py-1.5 rounded-lg bg-yellow-900/30 text-yellow-300 border border-yellow-700/40 hover:bg-yellow-900/50"
                            >
                              +7 dias
                            </button>
                          )}
                          <select
                            onChange={(e) => { if (e.target.value) setPlan(u.id, e.target.value); e.target.value = ''; }}
                            className="text-xs bg-gray-800 border border-gray-700 text-gray-300 rounded-lg px-2 py-1.5"
                            defaultValue=""
                          >
                            <option value="" disabled>Plan</option>
                            <option value="trial">Trial</option>
                            <option value="starter">Starter</option>
                            <option value="pro">Pro</option>
                            <option value="enterprise">Enterprise</option>
                          </select>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <div className="text-center py-12 text-gray-500"><p className="text-sm">No se encontraron usuarios</p></div>
          )}
        </div>
      </div>
    </Layout>
  );
}

export function getServerSideProps(context) {
  return { props: {} };
}
