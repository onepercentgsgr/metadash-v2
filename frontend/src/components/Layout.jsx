import { useAuth } from '../context/AuthContext';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState } from 'react';

export function Layout({ children }) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const isActive = (path) => router.pathname === path;

  const navItems = [
    { label: 'Dashboard',      path: '/dashboard',     icon: '◈',  emoji: '📊' },
    { label: 'Campañas',       path: '/campaigns',     icon: '◎',  emoji: '🎯' },
    { label: 'TikTok Orgánico',path: '/tiktok',        icon: '◉',  emoji: '🎵' },
    { label: 'Videos del Día', path: '/videos',        icon: '◐',  emoji: '🎬' },
    { label: 'Infoproducto',   path: '/infoproducto',  icon: '◆',  emoji: '🚀' },
    { label: 'Agentes IA',     path: '/agents',        icon: '◇',  emoji: '🤖' },
    { label: 'Auditoría',      path: '/audit',         icon: '◻',  emoji: '🔍' },
    { label: 'Finanzas',       path: '/financials',    icon: '◑',  emoji: '💰' },
    { label: 'Configuración',  path: '/settings',      icon: '◌',  emoji: '⚙️' },
  ];

  const adminItems = user?.role === 'admin' ? [
    { label: 'Admin', path: '/admin', emoji: '👑' },
  ] : [];

  return (
    <div className="flex h-screen" style={{ background: '#09090b' }}>
      {/* Sidebar */}
      <div
        className={`flex flex-col transition-all duration-300 border-r ${
          sidebarOpen ? 'w-64' : 'w-[72px]'
        }`}
        style={{ background: '#0c0c0f', borderColor: '#1e1e24' }}
      >
        {/* Logo */}
        <div className="p-5 border-b" style={{ borderColor: '#1e1e24' }}>
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-xs shadow-lg flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)', boxShadow: '0 0 20px rgba(79,70,229,0.35)' }}
            >
              MD
            </div>
            {sidebarOpen && (
              <div>
                <div className="text-white font-extrabold text-base tracking-tight leading-none">MetaDash</div>
                <div className="text-[10px] font-semibold tracking-widest uppercase mt-0.5" style={{ color: '#6366f1' }}>v3.5</div>
              </div>
            )}
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {sidebarOpen && (
            <div className="px-3 pb-3">
              <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: '#3f3f50' }}>
                Principal
              </span>
            </div>
          )}
          {navItems.map((item) => {
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm font-medium group relative ${
                  active ? '' : 'hover:text-gray-200'
                }`}
                style={
                  active
                    ? {
                        background: 'rgba(99,102,241,0.12)',
                        color: '#a5b4fc',
                        boxShadow: 'inset 0 0 0 1px rgba(99,102,241,0.25)',
                      }
                    : { color: '#6b7280' }
                }
              >
                {active && (
                  <span
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r"
                    style={{ background: 'linear-gradient(180deg,#6366f1,#8b5cf6)' }}
                  />
                )}
                <span className="text-base flex-shrink-0 w-5 text-center">{item.emoji}</span>
                {sidebarOpen && <span>{item.label}</span>}
              </Link>
            );
          })}

          {adminItems.length > 0 && (
            <>
              {sidebarOpen && (
                <div className="px-3 pb-2 pt-4">
                  <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: '#3f3f50' }}>
                    Admin
                  </span>
                </div>
              )}
              {adminItems.map((item) => (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm font-medium ${
                    isActive(item.path) ? '' : 'hover:text-gray-200'
                  }`}
                  style={
                    isActive(item.path)
                      ? { background: 'rgba(99,102,241,0.12)', color: '#a5b4fc', boxShadow: 'inset 0 0 0 1px rgba(99,102,241,0.25)' }
                      : { color: '#6b7280' }
                  }
                >
                  <span className="text-base">{item.emoji}</span>
                  {sidebarOpen && <span>{item.label}</span>}
                </Link>
              ))}
            </>
          )}
        </nav>

        {/* User Info */}
        <div className="p-3 border-t" style={{ borderColor: '#1e1e24' }}>
          {sidebarOpen ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3 px-1">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg,#1e1e2e,#2d2d3f)', color: '#a5b4fc', border: '1px solid #2a2a35' }}
                >
                  {user?.email?.[0]?.toUpperCase() || 'U'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-300 truncate">{user?.email}</div>
                  {user?.subscription_status && (
                    <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#6366f1' }}>
                      {user.subscription_status}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={logout}
                className="w-full px-3 py-2 rounded-lg transition-colors text-xs font-medium"
                style={{ background: '#16161a', color: '#6b7280', border: '1px solid #1e1e24' }}
                onMouseEnter={(e) => { e.target.style.color = '#e5e7eb'; e.target.style.background = '#1e1e24'; }}
                onMouseLeave={(e) => { e.target.style.color = '#6b7280'; e.target.style.background = '#16161a'; }}
              >
                Cerrar sesión
              </button>
            </div>
          ) : (
            <button
              onClick={logout}
              className="w-full p-2 rounded-lg transition-colors text-xs"
              style={{ background: '#16161a', color: '#6b7280' }}
              title="Cerrar sesión"
            >
              ↩
            </button>
          )}
        </div>

        {/* Toggle */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-3 transition-colors border-t text-xs font-mono"
          style={{ borderColor: '#1e1e24', color: '#3f3f50' }}
          onMouseEnter={(e) => { e.target.style.color = '#6b7280'; }}
          onMouseLeave={(e) => { e.target.style.color = '#3f3f50'; }}
        >
          {sidebarOpen ? '‹‹' : '››'}
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-auto" style={{ background: '#09090b' }}>
          <div className="p-6 lg:p-8 max-w-[1400px]">{children}</div>
        </div>
      </div>
    </div>
  );
}
