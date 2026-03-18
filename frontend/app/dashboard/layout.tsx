'use client';
import { useEffect, ReactNode, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import Link from 'next/link';

const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: '📊', roles: ['admin', 'supervisor', 'technician', 'user'] },
  { label: 'Chamados', href: '/dashboard/tickets', icon: '🎫', roles: ['admin', 'supervisor', 'technician'] },
  { label: 'Meus Chamados', href: '/dashboard/tickets/my', icon: '📋', roles: ['admin', 'supervisor', 'technician', 'user'] },
];

const adminItems = [
  { label: 'Usuários', href: '/dashboard/users', icon: '👥' },
  { label: 'SLA', href: '/dashboard/sla', icon: '⏱️' },
  { label: 'Automação', href: '/dashboard/automation', icon: '⚡' },
  { label: 'Auditoria', href: '/dashboard/audit', icon: '📝' },
];

const systemItems = [
  { label: 'Notificações', href: '/dashboard/notifications', icon: '🔔' },
];

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, loading, logout, isAdmin } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="loading-spinner" style={{ minHeight: '100vh' }}>
        <div className="spinner" />
      </div>
    );
  }

  const initials = user.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="app-layout">
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
          <img src="/logo.png" alt="Conextravel" style={{ height: 36 }} />
          <div>
            <h1>CONEXTRAVEL</h1>
            <span>TI - Service Desk</span>
          </div>
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
              <span className="nav-item-icon">{item.icon}</span>
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
                  <span className="nav-item-icon">{item.icon}</span>
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
              <span className="nav-item-icon">{item.icon}</span>
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
              fontSize: 18,
              padding: 4,
            }}
          >
            🚪
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="main-content">
        <header className="header">
          <div className="header-left">
            <button
              className="header-btn"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              style={{ display: 'none' }} // hidden on desktop
            >
              ☰
            </button>
            <span className="header-title" suppressHydrationWarning>
              {navItems.find((i) => i.href === pathname)?.label ||
                adminItems.find((i) => i.href === pathname)?.label ||
                systemItems.find((i) => i.href === pathname)?.label ||
                'ITSM'}
            </span>
          </div>
          <div className="header-right">
            <Link href="/dashboard/notifications" className="header-btn">
              🔔
            </Link>
          </div>
        </header>

        <div className="page-content">{children}</div>
      </main>
    </div>
  );
}
