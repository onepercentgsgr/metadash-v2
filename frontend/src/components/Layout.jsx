import { useAuth } from '../context/AuthContext';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { Icon } from './Icons';

const NAV = [
  { label: 'Dashboard',      path: '/dashboard',    icon: 'dashboard'   },
  { label: 'Lanzar',         path: '/lanzar',       icon: 'rocket'      },
  { label: 'Campañas',       path: '/campaigns',    icon: 'campaigns'   },
  { label: 'TikTok Orgánico',path: '/tiktok',       icon: 'tiktok'      },
  { label: 'Videos del Día', path: '/videos',       icon: 'videos'      },
  { label: 'Spy de Ads',     path: '/spy',          icon: 'audit'       },
  { label: 'Infoproducto',   path: '/infoproducto', icon: 'rocket'      },
  { label: 'Agentes IA',     path: '/agents',       icon: 'agents'      },
  { label: 'Decisiones',     path: '/decisiones',   icon: 'financials'  },
  { label: 'Auditoría',      path: '/audit',        icon: 'audit'       },
  { label: 'Finanzas',       path: '/financials',   icon: 'financials'  },
  { label: 'Configuración',  path: '/settings',     icon: 'settings'    },
];

export function Layout({ children }) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(true);

  const active = (path) => router.pathname === path;
  const initial = user?.email?.[0]?.toUpperCase() || 'U';

  return (
    <div className="flex h-screen font-sans" style={{ background: '#09090b' }}>

      {/* ── Sidebar ─────────────────────────────────────────────────── */}
      <aside
        className="flex flex-col shrink-0 transition-all duration-200"
        style={{
          width: open ? 232 : 64,
          background: '#0f0f12',
          borderRight: '1px solid rgba(255,255,255,0.05)',
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div
            className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-black tracking-tight select-none"
            style={{
              background: 'linear-gradient(135deg,#4f46e5 0%,#7c3aed 100%)',
              boxShadow: '0 0 20px rgba(79,70,229,0.4), inset 0 1px 0 rgba(255,255,255,0.15)',
            }}
          >
            MD
          </div>
          {open && (
            <div className="min-w-0">
              <div className="text-sm font-extrabold text-white tracking-tight leading-none">MetaDash</div>
              <div className="text-[10px] font-semibold tracking-widest uppercase mt-0.5"
                style={{ color: '#6366f1' }}>v3.5</div>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
          {open && (
            <div className="px-2 pt-1 pb-2">
              <span className="text-[9px] font-bold uppercase tracking-[0.12em]"
                style={{ color: 'rgba(255,255,255,0.2)' }}>
                Principal
              </span>
            </div>
          )}
          {NAV.map((item) => {
            const on = active(item.path);
            const isLanzar = item.path === '/lanzar';
            return (
              <Link key={item.path} href={item.path}
                className="flex items-center gap-3 rounded-lg transition-all duration-150 group relative"
                style={{
                  padding: open ? '8px 10px' : '10px',
                  justifyContent: open ? 'flex-start' : 'center',
                  color: on ? (isLanzar ? '#fff' : '#a5b4fc') : (isLanzar ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.38)'),
                  background: on
                    ? (isLanzar ? 'linear-gradient(135deg,#4f46e5,#7c3aed)' : 'rgba(99,102,241,0.1)')
                    : (isLanzar ? 'linear-gradient(135deg,rgba(79,70,229,0.18),rgba(124,58,237,0.18))' : 'transparent'),
                  boxShadow: on
                    ? (isLanzar ? '0 2px 12px rgba(99,102,241,0.35), inset 0 0 0 1px rgba(255,255,255,0.1)' : 'inset 0 0 0 1px rgba(99,102,241,0.2)')
                    : (isLanzar ? 'inset 0 0 0 1px rgba(99,102,241,0.2)' : 'none'),
                }}
                onMouseEnter={(e) => {
                  if (!on) {
                    if (isLanzar) {
                      e.currentTarget.style.background = 'linear-gradient(135deg,rgba(79,70,229,0.3),rgba(124,58,237,0.3))';
                      e.currentTarget.style.color = '#fff';
                    } else {
                      e.currentTarget.style.color = 'rgba(255,255,255,0.75)';
                      e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                    }
                  }
                }}
                onMouseLeave={(e) => {
                  if (!on) {
                    if (isLanzar) {
                      e.currentTarget.style.background = 'linear-gradient(135deg,rgba(79,70,229,0.18),rgba(124,58,237,0.18))';
                      e.currentTarget.style.color = 'rgba(255,255,255,0.85)';
                    } else {
                      e.currentTarget.style.color = 'rgba(255,255,255,0.38)';
                      e.currentTarget.style.background = 'transparent';
                    }
                  }
                }}
              >
                {on && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 rounded-r"
                    style={{ background: 'linear-gradient(180deg,#818cf8,#6366f1)' }} />
                )}
                <Icon name={item.icon} size={16} strokeWidth={on ? 2 : 1.75} />
                {open && (
                  <span className="text-[13px] font-medium leading-none truncate"
                    style={{ fontWeight: on ? 600 : 450 }}>
                    {item.label}
                  </span>
                )}
              </Link>
            );
          })}

          {user?.role === 'admin' && (
            <>
              {open && (
                <div className="px-2 pt-4 pb-2">
                  <span className="text-[9px] font-bold uppercase tracking-[0.12em]"
                    style={{ color: 'rgba(255,255,255,0.2)' }}>
                    Admin
                  </span>
                </div>
              )}
              <Link href="/admin"
                className="flex items-center gap-3 rounded-lg transition-all"
                style={{
                  padding: open ? '8px 10px' : '10px',
                  justifyContent: open ? 'flex-start' : 'center',
                  color: active('/admin') ? '#a5b4fc' : 'rgba(255,255,255,0.38)',
                  background: active('/admin') ? 'rgba(99,102,241,0.1)' : 'transparent',
                }}
              >
                <Icon name="crown" size={16} />
                {open && <span className="text-[13px] font-medium">Admin</span>}
              </Link>
            </>
          )}
        </nav>

        {/* User */}
        <div className="p-2" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          {open ? (
            <div className="rounded-lg p-3 space-y-3"
              style={{ background: 'rgba(255,255,255,0.03)' }}>
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-md flex items-center justify-center text-xs font-bold flex-shrink-0"
                  style={{
                    background: 'linear-gradient(135deg,#312e81,#4c1d95)',
                    color: '#a5b4fc',
                    border: '1px solid rgba(99,102,241,0.3)',
                  }}>
                  {initial}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] font-semibold text-white truncate leading-none">{user?.email}</div>
                  {user?.subscription_status && (
                    <div className="text-[9px] font-bold uppercase tracking-widest mt-0.5"
                      style={{ color: '#6366f1' }}>
                      {user.subscription_status}
                    </div>
                  )}
                </div>
              </div>
              <button onClick={logout}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-md text-[11px] font-medium transition-all"
                style={{ color: 'rgba(255,255,255,0.35)', background: 'rgba(255,255,255,0.04)' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'rgba(255,255,255,0.7)';
                  e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'rgba(255,255,255,0.35)';
                  e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                }}
              >
                <Icon name="logout" size={12} />
                Cerrar sesión
              </button>
            </div>
          ) : (
            <button onClick={logout} title="Cerrar sesión"
              className="w-full flex items-center justify-center p-2.5 rounded-lg transition-all"
              style={{ color: 'rgba(255,255,255,0.3)' }}
              onMouseEnter={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.3)'; }}
            >
              <Icon name="logout" size={15} />
            </button>
          )}

          {/* Toggle */}
          <button onClick={() => setOpen(!open)}
            className="w-full flex items-center justify-center mt-1 py-1.5 rounded-md transition-all"
            style={{ color: 'rgba(255,255,255,0.2)' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.2)'; }}
          >
            <Icon name={open ? 'chevronLeft' : 'chevronRight'} size={14} />
          </button>
        </div>
      </aside>

      {/* ── Main ────────────────────────────────────────────────────── */}
      <main className="flex-1 overflow-auto" style={{ background: '#09090b' }}>
        <div className="px-6 py-7 lg:px-10 lg:py-8 max-w-[1280px]">
          {children}
        </div>
      </main>
    </div>
  );
}
