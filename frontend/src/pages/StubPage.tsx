import { useParams, useLocation } from 'react-router-dom';
import { Construction } from 'lucide-react';
import { cn } from '../lib/utils';

const PAGE_TITLES: Record<string, { title: string; description: string }> = {
  '/pcap': { title: 'PCAP Analysis', description: 'Upload and analyze packet capture files' },
  '/applications': { title: 'Applications', description: 'Full application traffic breakdown' },
  '/domains': { title: 'Domains / SNI', description: 'Detected domain names and SNI hostnames' },
  '/flows': { title: 'Flows', description: 'All network flows from the last analysis' },
  '/rules': { title: 'Blocking / Rules', description: 'Manage DPI blocking rules' },
  '/reports': { title: 'Reports', description: 'Analysis reports and exports' },
  '/settings': { title: 'Settings', description: 'Dashboard preferences and configuration' },
};

interface StubPageProps {
  isLight: boolean;
}

export function StubPage({ isLight }: StubPageProps) {
  const { pathname } = useLocation();
  const info = PAGE_TITLES[pathname] ?? { title: 'Page', description: 'Coming soon' };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div
        className={cn(
          'w-16 h-16 rounded-2xl flex items-center justify-center mb-4',
          isLight ? 'bg-gray-100' : 'bg-white/5',
        )}
      >
        <Construction size={28} className="text-muted" />
      </div>
      <h2 className={cn('text-xl font-bold mb-2', isLight ? 'text-gray-900' : 'text-white')}>
        {info.title}
      </h2>
      <p className={cn('text-sm max-w-xs', isLight ? 'text-gray-500' : 'text-muted')}>
        {info.description}
      </p>
      <p className={cn('text-xs mt-3', isLight ? 'text-gray-400' : 'text-white/25')}>
        Full implementation coming in a future sprint.
      </p>
    </div>
  );
}
