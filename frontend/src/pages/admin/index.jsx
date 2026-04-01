'use client';

import { useState, useEffect } from 'react';
import { Layout } from '../../components/Layout';
import { AdminRoute } from '../../components/ProtectedRoute';
import { api } from '../../lib/api';

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [updatingUser, setUpdatingUser] = useState(null);
  const [modalUser, setModalUser] = useState(null);
  const [newPlan, setNewPlan] = useState('');

  useEffect(() => {
    fetchUsers();
    fetchStats();
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

  async function fetchStats() {
    try {
      const data = await api.getStats();
      setStats(data);
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  }

  async function toggleUserActive(userId, currentStatus) {
    setError('');
    setSuccess('');
    setUpdatingUser(userId);

    try {
      await api.toggleUser(userId, !currentStatus);
      setSuccess('Usuario actualizado');
      await fetchUsers();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setUpdatingUser(null);
    }
  }

  async function extendUserTrial(userId) {
    setError('');
    setSuccess('');
    setUpdatingUser(userId);

    try {
      await api.extendTrial(userId);
      setSuccess('Prueba extendida por 7 días');
      await fetchUsers();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setUpdatingUser(null);
    }
  }

  async function changePlan(userId) {
    if (!newPlan) {
      setError('Selecciona un plan');
      return;
    }

    setError('');
    setSuccess('');
    setUpdatingUser(userId);

    try {
      await api.setPlan(userId, newPlan);
      setSuccess(`Plan cambiado a ${newPlan}`);
      setModalUser(null);
      setNewPlan('');
      await fetchUsers();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setUpdatingUser(null);
    }
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">👑 Panel Administrativo</h1>
          <p className="text-gray-400">Gestiona usuarios, suscripciones y planes</p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
              <div className="text-sm text-gray-400 mb-2">Usuarios Totales</div>
              <div className="text-3xl font-bold text-white">{stats.total_users}</div>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
              <div className="text-sm text-gray-400 mb-2">Pruebas Activas</div>
              <div className="text-3xl font-bold text-indigo-400">{stats.active_trials}</div>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
              <div className="text-sm text-gray-400 mb-2">Usuarios Pagos</div>
              <div className="text-3xl font-bold text-green-400">{stats.paid_users}</div>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
              <div className="text-sm text-gray-400 mb-2">Revenue</div>
              <div className="text-3xl font-bold text-yellow-400">${stats.revenue.toFixed(0)}</div>
            </div>
          </div>
        )}

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

        {/* Users Table */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center text-gray-400">Cargando usuarios...</div>
          ) : users.length === 0 ? (
            <div className="p-12 text-center text-gray-400">No hay usuarios</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="px-6 py-4 text-left text-gray-400 font-semibold">Email</th>
                  <th className="px-6 py-4 text-left text-gray-400 font-semibold">Nombre</th>
                  <th className="px-6 py-4 text-left text-gray-400 font-semibold">Plan</th>
                  <th className="px-6 py-4 text-left text-gray-400 font-semibold">Estado</th>
                  <th className="px-6 py-4 text-left text-gray-400 font-semibold">Prueba Vence</th>
                  <th className="px-6 py-4 text-left text-gray-400 font-semibold">Activo</th>
                  <th className="px-6 py-4 text-left text-gray-400 font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors"
                  >
                    <td className="px-6 py-4 text-white">{user.email}</td>
                    <td className="px-6 py-4 text-gray-300">{user.name}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 rounded text-xs font-medium bg-indigo-900 text-indigo-300">
                        {user.subscription_plan}
                      </span>
                    </td>
                    <td className="px-6 py-4">
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
                    <td className="px-6 py-4 text-gray-400 text-xs">
                      {user.trial_end
                        ? new Date(user.trial_end).toLocaleDateString('es-ES')
                        : '—'}
                    </td>
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={user.is_active}
                        onChange={() =>
                          toggleUserActive(user.id, user.is_active)
                        }
                        disabled={updatingUser === user.id}
                        className="w-4 h-4 rounded cursor-pointer"
                      />
                    </td>
                    <td className="px-6 py-4 space-x-2">
                      {user.subscription_plan === 'trial' && (
                        <button
                          onClick={() => extendUserTrial(user.id)}
                          disabled={updatingUser === user.id}
                          className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded text-xs font-medium"
                        >
                          Extender
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setModalUser(user);
                          setNewPlan(user.subscription_plan);
                        }}
                        className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded text-xs font-medium"
                      >
                        Plan
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Change Plan Modal */}
        {modalUser && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 max-w-md w-full">
              <h3 className="text-lg font-semibold text-white mb-4">
                Cambiar Plan - {modalUser.email}
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Nuevo Plan
                  </label>
                  <select
                    value={newPlan}
                    onChange={(e) => setNewPlan(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">Selecciona un plan</option>
                    <option value="trial">Trial (7 días)</option>
                    <option value="starter">Starter ($29/mes)</option>
                    <option value="pro">Pro ($99/mes)</option>
                    <option value="enterprise">Enterprise ($299/mes)</option>
                  </select>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setModalUser(null);
                      setNewPlan('');
                    }}
                    className="flex-1 px-4 py-2 border border-gray-700 rounded-lg text-gray-300 hover:text-white transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => changePlan(modalUser.id)}
                    disabled={updatingUser === modalUser.id || !newPlan}
                    className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg font-medium"
                  >
                    Cambiar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
