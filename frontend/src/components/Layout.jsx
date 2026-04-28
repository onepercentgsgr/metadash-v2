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
    { label: 'Dashboard', path: '/dashboard', icon: '📊' },
    { label: 'Campañas', path: '/campaigns', icon: '🎯' },
    { label: 'TikTok Orgánico', path: '/tiktok', icon: '🎵' },
    { label: 'Videos del Día', path: '/videos', icon: '🎬' },
    { label: 'Infoproducto', path: '/infoproducto', icon: '🚀' },
    { label: 'Agentes IA', path: '/agents', icon: '🤖' },
    { label: 'Playbook Nivel Dios', path: '/playbook', icon: '📚' },
    { label: 'Auditoría', path: '/audit', icon: '🔍' },
    { label: 'Finanzas', path: '/financials', icon: '💰' },
    { label: 'Configuración', path: '/settings', icon: '⚙️' },
  ];

  const adminItems = user?.role === 'admin' ? [
    { label: 'Admin', path: '/admin', icon: '👑' },
  ] : [];

  return (
    <div className="flex h-screen bg-gray-950">
      {/* Sidebar */}
      <div
        className={`bg-gray-900 border-r border-gray-800 flex flex-col transition-all duration-300 ${
          sidebarOpen ? 'w-64' : 'w-20'
        }`}
      >
        {/* Logo */}
        <div className="p-5 border-b border-gray-800">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-indigo-900/30">
              MD
            </div>
            {sidebarOpen && (
              <div>
                <span className="text-white font-bold text-lg">MetaDash</span>
                <div className="text-[10px] text-indigo-400 font-medium -mt-0.5">v3.5</div>
              </div>
            )}
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1">
          <div className="px-3 py-2">
            {sidebarOpen && <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Principal</span>}
          </div>
          {navItems.map((item) => (
            <Link
              key={item.path + item.label}
              href={item.path}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all text-sm ${
                isActive(item.path)
                  ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-700/30'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/60'
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              {sidebarOpen && <span className="font-medium">{item.label}</span>}
            </Link>
          ))}
          {adminItems.length > 0 && (
            <>
              <div className="px-3 py-2 mt-3">
                {sidebarOpen && <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Admin</span>}
              </div>
              {adminItems.map((item) => (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all text-sm ${
                    isActive(item.path)
                      ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-700/30'
                      : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/60'
                  }`}
                >
                  <span className="text-lg">{item.icon}</span>
                  {sidebarOpen && <span className="font-medium">{item.label}</span>}
                </Link>
              ))}
            </>
          )}
        </nav>

        {/* User Info */}
        <div className="p-4 border-t border-gray-800">
          {sidebarOpen ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-700 rounded-lg flex items-center justify-center text-sm text-gray-300">
                  {user?.email?.[0]?.toUpperCase() || 'U'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-gray-300 truncate">{user?.email}</div>
                  {user?.subscription_status && (
                    <span className="text-[10px] text-indigo-400 font-medium">
                      {user.subscription_status}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={logout}
                className="w-full px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-gray-200 rounded-lg transition-colors text-xs font-medium"
              >
                Cerrar sesión
              </button>
            </div>
          ) : (
            <button
              onClick={logout}
              className="w-full p-2 bg-gray-800 hover:bg-gray-700 text-gray-400 rounded-lg transition-colors text-xs"
              title="Cerrar sesión"
            >
              ↩
            </button>
          )}
        </div>

        {/* Toggle */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-3 text-gray-500 hover:text-gray-300 transition-colors border-t border-gray-800"
        >
          {sidebarOpen ? '‹' : '›'}
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Content Area */}
        <div className="flex-1 overflow-auto bg-gray-950">
          <div className="p-6 lg:p-8">{children}</div>
        </div>
      </div>
    </div>
  );
}
