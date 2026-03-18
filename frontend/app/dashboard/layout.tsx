'use client';
import { useEffect, ReactNode, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import Link from 'next/link';

const navItems = [
  { label: 'Dashboard', href: '/dashboard', roles: ['admin', 'supervisor', 'technician'] },
  { label: 'Chamados', href: '/dashboard/tickets', roles: ['admin', 'supervisor', 'technician'] },
  { label: 'Meus Chamados', href: '/dashboard/tickets/my', roles: ['admin', 'supervisor', 'technician', 'user'] },
];

const adminItems = [
  { label: 'Usuários', href: '/dashboard/users' },
  { label: 'SLA', href: '/dashboard/sla' },
  { label: 'Automação', href: '/dashboard/automation' },
  { label: 'Auditoria', href: '/dashboard/audit' },
];

const systemItems = [
  { label: 'Notificações', href: '/dashboard/notifications' },
];

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, loading, logout, isAdmin } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  if (loading || !user) {
    return (
      <div className="loading-spinner" style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
        <div className="spinner" />
      </div>
    );
  }

  const initials = user.name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();

  return (
    <div className="app-layout fade-in">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 45,
          }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <img 
            src="/logo.png" 
            alt="Conextravel" 
            style={{ 
              height: 32, 
              filter: theme === 'dark' ? 'brightness(0) invert(1)' : 'none' 
            }} 
          />
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-label">Principal</div>
          {navItems.filter(i => !i.roles || i.roles.some(r => user.roles.includes(r))).map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-item ${pathname === item.href ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <div className="nav-dot"></div>
              {item.label}
            </Link>
          ))}

          {isAdmin && (
            <>
              <div className="nav-section-label">Administração</div>
              {adminItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`nav-item ${pathname === item.href ? 'active' : ''}`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <div className="nav-dot"></div>
                  {item.label}
                </Link>
              ))}
            </>
          )}

          <div className="nav-section-label">Sistema</div>
          {systemItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-item ${pathname === item.href ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <div className="nav-dot"></div>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="sidebar-user">
          <div className="sidebar-user-avatar">{initials}</div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{user.name}</div>
            <div className="sidebar-user-role">{user.roles?.[0] || 'user'}</div>
          </div>
          <button
            onClick={logout}
            title="Sair"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: 4,
              fontSize: 13,
              fontWeight: 600
            }}
          >
            Sair
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        <header className="header" style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div className="header-left">
            <button
              className="header-btn"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              style={{ display: 'none' }} // hidden on desktop
            >
              |||
            </button>
            <span className="header-title" suppressHydrationWarning>
              {navItems.find((i) => i.href === pathname)?.label ||
                adminItems.find((i) => i.href === pathname)?.label ||
                systemItems.find((i) => i.href === pathname)?.label ||
                'CONEXTRAVEL TI'}
            </span>
          </div>

          <div className="header-right">
            <button 
              onClick={toggleTheme} 
              className="header-btn"
              title="Trocar Tema"
              style={{ padding: '0 12px', fontSize: 12, fontWeight: 600, width: 'auto' }}
            >
              {theme === 'dark' ? 'CLARO' : 'ESCURO'}
            </button>
            <Link href="/dashboard/notifications" className="header-btn" title="Notificações" style={{ width: '40px' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--status-progress)' }}></div>
            </Link>
          </div>
        </header>

        <div className="page-content slide-up">
          {children}
        </div>
      </main>

      <style jsx>{`
        .nav-dot {
          width: 8px;
          height: 8px;
          background: currentColor;
          border-radius: 50%;
          opacity: 0.5;
          margin: 0 4px;
        }
        .nav-item.active .nav-dot {
          opacity: 1;
        }
      `}</style>
    </div>
  );
}
