import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/router';

const StatCard = ({ icon, label, value, subtext, color = 'indigo' }) => (
  <div className={`bg-gray-900/60 border border-gray-800 rounded-lg p-6 hover:border-${color}-500/50 transition`}>
    <div className="flex items-start justify-between">
      <div>
        <p className="text-gray-400 text-sm mb-2">{label}</p>
        <p className={`text-3xl font-bold text-${color}-400`}>{value}</p>
        {subtext && <p className="text-xs text-gray-500 mt-2">{subtext}</p>}
      </div>
      <div className={`text-3xl text-${color}-400/50`}>{icon}</div>
    </div>
  </div>
);

export default function AdminAnalytics() {
  const { user } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState(null);
  const [detailed, setDetailed] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user && user.role !== 'admin') {
      router.push('/dashboard');
    }
  }, [user]);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const [statsRes, detailedRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/stats`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/analytics/detailed`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (!statsRes.ok || !detailedRes.ok) {
          throw new Error('Failed to fetch analytics');
        }

        setStats(await statsRes.json());
        setDetailed(await detailedRes.json());
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (user?.role === 'admin') {
      fetchAnalytics();
      const interval = setInterval(fetchAnalytics, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <p className="text-gray-300">Acceso no autorizado</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4"></div>
          <p className="text-gray-300">Cargando analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded text-white"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Dashboard de Análisis</h1>
          <p className="text-gray-400">Métricas de negocio, usuarios y generación de contenido</p>
          <Link href="/admin" className="text-indigo-400 hover:text-indigo-300 text-sm mt-4 inline-block">
            ← Volver a Admin
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard icon="👥" label="Total de Usuarios" value={stats?.total_users || 0} subtext={`${stats?.paid_users || 0} pagos`} color="blue" />
          <StatCard icon="💳" label="Ingresos (ARS)" value={`$${(stats?.revenue_ars || 0).toLocaleString('es-AR', { maximumFractionDigits: 0 })}`} subtext={`~USD $${(stats?.revenue_usd || 0).toLocaleString('es-AR', { maximumFractionDigits: 0 })}`} color="green" />
          <StatCard icon="📈" label="MRR (ARS)" value={`$${(stats?.mrr || 0).toLocaleString('es-AR', { maximumFractionDigits: 0 })}`} subtext="Mensual Recurr. Revenue" color="purple" />
          <StatCard icon="💰" label="ARPU (ARS)" value={`$${(stats?.avg_arpu || 0).toLocaleString('es-AR', { maximumFractionDigits: 0 })}`} subtext="Por usuario pagado" color="yellow" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard icon="🎯" label="Pruebas Activas" value={stats?.active_trials || 0} subtext={`${stats?.trial_expiring_soon || 0} próximas a vencer`} color="orange" />
          <StatCard icon="⏰" label="Pruebas Expiradas" value={stats?.expired_trials || 0} subtext={`Churn: ${(stats?.churn_rate || 0).toFixed(1)}%`} color="red" />
          <StatCard icon="📹" label="Videos Generados" value={stats?.videos_generated || 0} subtext="Total histórico" color="cyan" />
          <StatCard icon="🤖" label="Ejecuciones de Agentes" value={stats?.agents_runs || 0} subtext="Análisis + optimización" color="pink" />
        </div>

        {detailed?.plans_breakdown && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-6">Desglose por Plan</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {Object.entries(detailed.plans_breakdown).map(([plan, data]) => (
                <div key={plan} className="bg-gray-900/60 border border-gray-800 rounded-lg p-6">
                  <h3 className="text-xl font-bold capitalize mb-4">
                    {plan === 'starter' && '🚀 Starter'}
                    {plan === 'pro' && '⭐ Pro'}
                    {plan === 'enterprise' && '🏢 Enterprise'}
                  </h3>
                  <div className="space-y-3">
                    <div><p className="text-gray-400 text-sm">Suscriptores</p><p className="text-3xl font-bold text-indigo-400">{data.count}</p></div>
                    <div><p className="text-gray-400 text-sm">Ingresos (ARS)</p><p className="text-2xl font-bold text-green-400">${data.revenue_ars.toLocaleString('es-AR', { maximumFractionDigits: 0 })}</p></div>
                    <div><p className="text-gray-400 text-sm">Ingresos (USD)</p><p className="text-sm text-gray-300">~USD ${data.revenue_usd.toLocaleString('es-AR', { maximumFractionDigits: 0 })}</p></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {detailed?.top_users && detailed.top_users.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-6">Usuarios Más Activos</h2>
            <div className="bg-gray-900/60 border border-gray-800 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-800 bg-gray-800/30">
                    <th className="px-6 py-4 text-left text-sm font-semibold">Usuario</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Email</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold">Videos Generados</th>
                  </tr>
                </thead>
                <tbody>
                  {detailed.top_users.map((u, idx) => (
                    <tr key={u.user_id} className="border-b border-gray-800 hover:bg-gray-800/20">
                      <td className="px-6 py-4"><div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-indigo-600/30 flex items-center justify-center text-sm">{idx + 1}</div>{u.name}</div></td>
                      <td className="px-6 py-4 text-gray-400 text-sm">{u.email}</td>
                      <td className="px-6 py-4 text-right"><span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm">{u.videos_generated}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {detailed?.usage_metrics && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-6">Resumen de Uso</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gray-900/60 border border-gray-800 rounded-lg p-6"><p className="text-gray-400 text-sm mb-2">Videos Generados</p><p className="text-4xl font-bold text-cyan-400">{detailed.usage_metrics.total_videos}</p></div>
              <div className="bg-gray-900/60 border border-gray-800 rounded-lg p-6"><p className="text-gray-400 text-sm mb-2">Ejecuciones Agentes</p><p className="text-4xl font-bold text-pink-400">{detailed.usage_metrics.total_agent_runs}</p></div>
              <div className="bg-gray-900/60 border border-gray-800 rounded-lg p-6"><p className="text-gray-400 text-sm mb-2">Ejecuciones Exitosas</p><p className="text-4xl font-bold text-green-400">{detailed.usage_metrics.successful_runs}</p><p className="text-xs text-gray-500 mt-2">{((detailed.usage_metrics.successful_runs / (detailed.usage_metrics.total_agent_runs || 1)) * 100).toFixed(1)}% tasa de éxito</p></div>
            </div>
          </div>
        )}

        <div className="text-center text-gray-500 text-sm">
          <p>Actualizado: {new Date(detailed?.timestamp).toLocaleString('es-AR')}</p>
        </div>
      </div>
    </div>
  );
}
