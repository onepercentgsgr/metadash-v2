import { useAuth } from '@/context/AuthContext';
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
    { label: 'Agents', path: '/agents', icon: '🤖' },
    { label: 'Full Audit', path: '/audit', icon: '🔍' },
    { label: 'Settings', path: '/settings', icon: '⚙️' },
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
        <div className="p-6 border-b border-gray-800">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">
              MD
            </div>
            {sidebarOpen && <span className="text-white font-bold text-lg">MetaDash</span>}
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {[...navItems, ...adminItems].map((item) => (
            <Link
              key={item.path}
              href={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive(item.path)
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              {sidebarOpen && <span>{item.label}</span>}
            </Link>
          ))}
        </nav>

        {/* User Info */}
        <div className="p-4 border-t border-gray-800">
          {sidebarOpen && (
            <>
              <div className="text-sm text-gray-300 mb-3 truncate">{user?.email}</div>
              {user?.subscription_status && (
                <div className="text-xs mb-3">
                  <span className="inline-block px-2 py-1 bg-indigo-900 text-indigo-200 rounded">
                    {user.subscription_status}
                  </span>
                </div>
              )}
              <button
                onClick={logout}
                className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm"
              >
                Logout
              </button>
            </>
          )}
        </div>

        {/* Toggle Button */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-4 text-gray-400 hover:text-white transition-colors"
        >
          {sidebarOpen ? '‹' : '›'}
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <div className="bg-gray-900 border-b border-gray-800 px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-white">MetaDash</h1>
            <div className="text-gray-400 text-sm">{new Date().toLocaleDateString()}</div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto">
          <div className="p-6">{children}</div>
        </div>
      </div>
    </div>
  );
}
