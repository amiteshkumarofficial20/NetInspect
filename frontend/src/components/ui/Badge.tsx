import { cn } from '../../lib/utils';

type BadgeVariant =
  | 'allowed'
  | 'blocked'
  | 'tcp'
  | 'udp'
  | 'icmp'
  | 'other'
  | 'yes'
  | 'no'
  | 'complete'
  | 'info';

interface BadgeProps {
  variant: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  allowed: 'bg-success/15 text-success border border-success/30',
  blocked: 'bg-danger/15 text-danger border border-danger/30',
  tcp: 'bg-accent/15 text-accent-light border border-accent/20',
  udp: 'bg-success/15 text-success border border-success/20',
  icmp: 'bg-warn/15 text-warn border border-warn/20',
  other: 'bg-muted/15 text-muted border border-muted/20',
  yes: 'bg-accent/15 text-accent-light border border-accent/20',
  no: 'bg-white/5 text-muted border border-white/10',
  complete: 'bg-success/15 text-success border border-success/30',
  info: 'bg-accent/10 text-accent-light border border-accent/20',
};

export function Badge({ variant, children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold tracking-wide uppercase',
        VARIANT_CLASSES[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function ProtocolBadge({ protocol }: { protocol: string }) {
  const p = protocol.toUpperCase();
  const variant =
    p === 'TCP' ? 'tcp' : p === 'UDP' ? 'udp' : p === 'ICMP' ? 'icmp' : 'other';
  return <Badge variant={variant}>{p}</Badge>;
}

export function StatusBadge({ blocked }: { blocked: boolean }) {
  return (
    <Badge variant={blocked ? 'blocked' : 'allowed'}>
      {blocked ? 'BLOCKED' : 'ALLOWED'}
    </Badge>
  );
}

export function ClassifiedBadge({ classified }: { classified: boolean }) {
  return (
    <Badge variant={classified ? 'yes' : 'no'}>
      {classified ? 'YES' : 'NO'}
    </Badge>
  );
}
