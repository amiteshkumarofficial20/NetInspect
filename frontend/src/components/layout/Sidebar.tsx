import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  FileSearch,
  Grid3X3,
  Globe,
  Share2,
  Shield,
  FileBarChart2,
  Settings,
  Activity,
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface NavItem {
  id: string;
  label: string;
  path: string;
  icon: React.ReactNode;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', path: '/', icon: <LayoutDashboard size={18} /> },
  { id: 'pcap', label: 'PCAP Analysis', path: '/pcap', icon: <FileSearch size={18} /> },
  { id: 'applications', label: 'Applications', path: '/applications', icon: <Grid3X3 size={18} /> },
  { id: 'domains', label: 'Domains / SNI', path: '/domains', icon: <Globe size={18} /> },
  { id: 'flows', label: 'Flows', path: '/flows', icon: <Share2 size={18} /> },
  { id: 'rules', label: 'Blocking / Rules', path: '/rules', icon: <Shield size={18} /> },
  { id: 'reports', label: 'Reports', path: '/reports', icon: <FileBarChart2 size={18} /> },
  { id: 'settings', label: 'Settings', path: '/settings', icon: <Settings size={18} /> },
];

interface SidebarProps {
  isLight: boolean;
}

export function Sidebar({ isLight }: SidebarProps) {
  const location = useLocation();

  return (
    <aside
      className={cn(
        'fixed left-0 top-16 bottom-0 w-60 z-30 flex flex-col',
        'border-r border-white/5',
        isLight ? 'bg-white border-gray-200' : 'bg-navy-800',
      )}
    >
      {/* Nav Items */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto no-scrollbar">
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.path === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(item.path);

          return (
            <NavLink
              key={item.id}
              to={item.path}
              className={cn(
                'nav-item',
                isActive && 'active',
              )}
            >
              <span
                className={cn(
                  'transition-colors',
                  isActive
                    ? 'text-accent-light'
                    : isLight
                    ? 'text-gray-500'
                    : 'text-muted',
                )}
              >
                {item.icon}
              </span>
              <span
                className={cn(
                  'text-sm font-medium',
                  isActive
                    ? isLight ? 'text-blue-600' : 'text-white'
                    : isLight ? 'text-gray-600' : 'text-muted',
                )}
              >
                {item.label}
              </span>
            </NavLink>
          );
        })}
      </nav>

      {/* Footer Brand Card */}
      <div
        className={cn(
          'mx-3 mb-4 p-3 rounded-xl border',
          isLight
            ? 'bg-blue-50 border-blue-100'
            : 'bg-accent/5 border-accent/15',
        )}
      >
        {/* Logo row */}
        <div className="flex items-center gap-2 mb-2">
          <div
            className={cn(
              'w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0',
              isLight ? 'bg-blue-100' : 'bg-accent/20',
            )}
          >
            <Activity size={14} className="text-accent-light" />
          </div>
          <span
            className={cn(
              'font-bold text-sm',
              isLight ? 'text-gray-900' : 'text-white',
            )}
          >
            NetInspect
          </span>
        </div>

        {/* Tagline */}
        <div className="space-y-0.5 pl-9">
          {['Inspect.', 'Analyze.', 'Secure.', 'Your Network.'].map((line) => (
            <p
              key={line}
              className={cn(
                'text-[10px] leading-tight',
                isLight ? 'text-gray-500' : 'text-muted',
              )}
            >
              {line}
            </p>
          ))}
        </div>

        {/* Version */}
        <div className="mt-2 pl-9">
          <span
            className={cn(
              'text-[10px]',
              isLight ? 'text-gray-400' : 'text-white/25',
            )}
          >
            v1.0.0
          </span>
        </div>
      </div>
    </aside>
  );
}
