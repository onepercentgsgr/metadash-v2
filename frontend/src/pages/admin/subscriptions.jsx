'use client';

import { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { AdminRoute } from '@/components/ProtectedRoute';
import { api } from '@/lib/api';

const PLAN_PRICES = {
  trial: 0,
  starter: 29,
  pro: 99,
  enterprise: 299,
};

const PLAN_COLORS = {
  trial: 'bg-gray-700',
  starter: 'bg-blue-700',
  pro: 'bg-purple-700',
  enterprise: 'bg-indigo-700',
};

const PLAN_FEATURES = {
  trial: ['7 días de prueba gratuita', 'Acceso a todos los agentes', 'Soporte por email'],
  starter: ['1 usuario', 'Campañas ilimitadas', 'Agentes IA básicos', 'Soporte por email'],
  pro: ['Hasta 5 usuarios', 'Campañas ilimitadas', 'Todos los agentes IA', 'Prioridad en soporte'],
  enterprise: [
    'Usuarios ilimitados',
    'API personalizada',
    'Agentes IA avanzados',
    'Soporte dedicado 24/7',
    'Integraciones personalizadas',
  ],
};

export default function AdminSubscriptionsPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [bulkAction, setBulkAction] = useState('');
  const [bulkPlan, setBulkPlan] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    try {
      setLoading(true);
      const data = await api.getUsers();
      setUsers(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function toggleUserSelection(userId) {
    setSelectedUsers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  }

  function toggleAllUsers() {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.map((u) => u.id));
    }
  }

  async function performBulkAction() {
    if (selectedUsers.length === 0) {
      setError('Selecciona al menos un usuario');
      return;
    }

    if (!bulkAction) {
      setError('Selecciona una acción');
      return;
    }

    setError('');
    setSuccess('');

    try {
      const results = [];

      for (const userId of selectedUsers) {
        try {
          if (bulkAction === 'extend-trial') {
            await api.extendTrial(userId);
          } else if (bulkAction === 'change-plan') {
            if (!bulkPlan) {
              throw new Error('Selecciona un plan');
            }
            await api.setPlan(userId, bulkPlan);
          } else if (bulkAction === 'activate') {
            await api.toggleUser(userId, true);
          } else if (bulkAction === 'deactivate') {
            await api.toggleUser(userId, false);
          }
          results.push({ userId, success: true });
        } catch (err) {
          results.push({ userId, success: false, error: err.message });
        }
      }

      const successCount = results.filter((r) => r.success).length;
      setSuccess(`${successCount} de ${selectedUsers.length} usuarios actualizados`);
      setSelectedUsers([]);
      setBulkAction('');
      setBulkPlan('');
      await fetchUsers();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    }
  }

  // Group users by plan
  const usersByPlan = {
    trial: users.filter((u) => u.subscription_plan === 'trial'),
    starter: users.filter((u) => u.subscription_plan === 'starter'),
    pro: users.filter((u) => u.subscription_plan === 'pro'),
    enterprise: users.filter((u) => u.subscription_plan === 'enterprise'),
  };

  // Calculate metrics
  const metrics = {
    totalUsers: users.length,
    totalRevenue: users.reduce((sum, u) => {
      const plan = u.subscription_plan;
      return sum + (PLAN_PRICES[plan] || 0);
    }, 0),
    avgMrr:
      users.length > 0
        ? users.reduce((sum, u) => {
            const plan = u.subscription_plan;
            return sum + (PLAN_PRICES[plan] || 0);
          }, 0) / users.length
        : 0,
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">💳 Gestión de Suscripciones</h1>
          <p className="text-gray-400">Administra planes y suscripciones de usuarios</p>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <div className="text-sm text-gray-400 mb-2">Usuarios Totales</div>
            <div className="text-3xl font-bold text-white">{metrics.totalUsers}</div>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <div className="text-sm text-gray-400 mb-2">Revenue Total</div>
            <div className="text-3xl font-bold text-green-400">${metrics.totalRevenue.toFixed(0)}/mes</div>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <div className="text-sm text-gray-400 mb-2">MRR Promedio</div>
            <div className="text-3xl font-bold text-indigo-400">${metrics.avgMrr.toFixed(2)}</div>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="bg-red-900/30 border border-red-700 rounded-lg p-4">
            <p className="text-red-200">{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-green-900/30 border border-green-700 rounded-lg p-4">
            <p className="text-green-200">{success}</p>
          </div>
        )}

        {/* Bulk Actions */}
        {selectedUsers.length > 0 && (
          <div className="bg-indigo-900/20 border border-indigo-700 rounded-lg p-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="text-sm text-indigo-300">
                {selectedUsers.length} usuario(s) seleccionado(s)
              </div>

              <div className="flex flex-col md:flex-row gap-3">
                <select
                  value={bulkAction}
                  onChange={(e) => setBulkAction(e.target.value)}
                  className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
                >
                  <option value="">Selecciona acción</option>
                  <option value="extend-trial">Extender Prueba (7 días)</option>
                  <option value="change-plan">Cambiar Plan</option>
                  <option value="activate">Activar</option>
                  <option value="deactivate">Desactivar</option>
                </select>

                {bulkAction === 'change-plan' && (
                  <select
                    value={bulkPlan}
                    onChange={(e) => setBulkPlan(e.target.value)}
                    className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">Selecciona plan</option>
                    <option value="trial">Trial</option>
                    <option value="starter">Starter</option>
                    <option value="pro">Pro</option>
                    <option value="enterprise">Enterprise</option>
                  </select>
                )}

                <button
                  onClick={performBulkAction}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium"
                >
                  Aplicar
                </button>

                <button
                  onClick={() => setSelectedUsers([])}
                  className="px-4 py-2 border border-gray-700 text-gray-300 hover:text-white rounded-lg text-sm font-medium"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Plans Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {['trial', 'starter', 'pro', 'enterprise'].map((plan) => (
            <div
              key={plan}
              className={`${PLAN_COLORS[plan]} rounded-lg p-4 text-white`}
            >
              <div className="text-sm font-medium opacity-90 capitalize">{plan}</div>
              <div className="text-2xl font-bold mt-2">${PLAN_PRICES[plan]}</div>
              <div className="text-xs opacity-75 mt-1">{usersByPlan[plan].length} usuarios</div>
            </div>
          ))}
        </div>

        {/* Users by Plan */}
        <div className="space-y-6">
          {['trial', 'starter', 'pro', 'enterprise'].map((plan) => (
            <div
              key={plan}
              className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden"
            >
              {/* Plan Header */}
              <div className={`${PLAN_COLORS[plan]} px-6 py-4`}>
                <h3 className="text-lg font-semibold text-white capitalize">
                  {plan} - ${PLAN_PRICES[plan]}/mes ({usersByPlan[plan].length} usuarios)
                </h3>
              </div>

              {/* Plan Features */}
              {PLAN_FEATURES[plan] && (
                <div className="px-6 py-3 bg-gray-800/50 text-xs text-gray-400">
                  {PLAN_FEATURES[plan].join(' • ')}
                </div>
              )}

              {/* Users Table */}
              {usersByPlan[plan].length === 0 ? (
                <div className="px-6 py-8 text-center text-gray-500">
                  No hay usuarios en este plan
                </div>
              ) : (
                <table className="w-full text-sm">
                  <tbody>
                    {usersByPlan[plan].map((user, idx) => (
                      <tr
                        key={user.id}
                        className="border-t border-gray-800 hover:bg-gray-800/50 transition-colors"
                      >
                        <td className="px-6 py-3">
                          <input
                            type="checkbox"
                            checked={selectedUsers.includes(user.id)}
                            onChange={() => toggleUserSelection(user.id)}
                            className="w-4 h-4 rounded cursor-pointer"
                          />
                        </td>
                        <td className="px-6 py-3 text-white">{user.email}</td>
                        <td className="px-6 py-3 text-gray-400">{user.name}</td>
                        <td className="px-6 py-3">
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              user.subscription_status === 'active'
                                ? 'bg-green-900 text-green-300'
                                : 'bg-gray-800 text-gray-300'
                            }`}
                          >
                            {user.subscription_status}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-gray-400 text-xs">
                          {user.trial_end
                            ? new Date(user.trial_end).toLocaleDateString('es-ES')
                            : '—'}
                        </td>
                        <td className="px-6 py-3 text-right">
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              user.is_active
                                ? 'bg-green-900 text-green-300'
                                : 'bg-red-900 text-red-300'
                            }`}
                          >
                            {user.is_active ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-gray-300 mb-3">Planes Disponibles</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {['trial', 'starter', 'pro', 'enterprise'].map((plan) => (
              <div key={plan} className="text-xs">
                <div className="font-semibold text-white capitalize mb-2">{plan}</div>
                <ul className="space-y-1 text-gray-400">
                  {PLAN_FEATURES[plan].map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-green-400 mt-0.5">✓</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
