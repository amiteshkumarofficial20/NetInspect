// ============================================================================
// App Brand Icon Map
// Maps AppType strings → react-icons/si (Simple Icons) components.
// Unmapped types fall back to lucide-react Globe icon.
// ============================================================================

import type { IconType } from 'react-icons';
import {
  SiYoutube,
  SiSpotify,
  SiDiscord,
  SiGoogle,
  SiNetflix,
  SiFacebook,
  SiX,
  SiInstagram,
  SiGithub,
  SiTwitch,
  SiSteam,
  SiDropbox,
  SiWhatsapp,
  SiTelegram,
  SiReddit,
  SiZoom,
  SiCloudflare,
  SiApple,
} from 'react-icons/si';

// Use a loose icon type that accepts both react-icons and lucide components
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyIcon = IconType | any;

// Brand icon map — keyed by AppType string from the C++ engine
const APP_ICON_MAP: Record<string, AnyIcon> = {
  YouTube: SiYoutube,
  Spotify: SiSpotify,
  Discord: SiDiscord,
  Google: SiGoogle,
  Netflix: SiNetflix,
  Facebook: SiFacebook,
  'Twitter/X': SiX,
  Instagram: SiInstagram,
  Apple: SiApple,
  GitHub: SiGithub,
  Twitch: SiTwitch,
  Steam: SiSteam,
  Dropbox: SiDropbox,
  WhatsApp: SiWhatsapp,
  Telegram: SiTelegram,
  Reddit: SiReddit,
  Zoom: SiZoom,
  Cloudflare: SiCloudflare,
};

/** Color accents for brand icons (matches brand palettes) */
export const APP_COLOR_MAP: Record<string, string> = {
  YouTube: '#FF0000',
  Spotify: '#1DB954',
  Discord: '#5865F2',
  Google: '#4285F4',
  Netflix: '#E50914',
  Facebook: '#1877F2',
  'Twitter/X': '#e7e9ea',
  Instagram: '#E4405F',
  Amazon: '#FF9900',
  Microsoft: '#00A4EF',
  Apple: '#a3a3a3',
  GitHub: '#e2e2e2',
  Twitch: '#9146FF',
  Steam: '#00adee',
  Dropbox: '#0061FF',
  WhatsApp: '#25D366',
  Telegram: '#2AABEE',
  Reddit: '#FF4500',
  LinkedIn: '#0A66C2',
  Zoom: '#2D8CFF',
  Cloudflare: '#F38020',
  HTTPS: '#38bdf8',
  HTTP: '#94a3b8',
  DNS: '#f59e0b',
  TLS: '#38bdf8',
  QUIC: '#a855f7',
  Unknown: '#64748b',
  Other: '#64748b',
};

interface AppIconProps {
  name: string;
  size?: number;
  className?: string;
}

/**
 * Renders the appropriate brand icon for a given AppType name.
 * Falls back to a colored dot for any unrecognized app name.
 */
export function AppIcon({ name, size = 16, className }: AppIconProps) {
  const Icon: AnyIcon = APP_ICON_MAP[name];
  const color = APP_COLOR_MAP[name] ?? '#94a3b8';

  if (Icon) {
    return <Icon size={size} className={className} color={color} />;
  }

  // Fallback: colored rounded square SVG that matches brand color
  const initials = name.slice(0, 2).toUpperCase();
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      className={className}
      aria-label={name}
    >
      <rect width="16" height="16" rx="3" fill={color} fillOpacity="0.2" />
      <text
        x="8"
        y="11.5"
        textAnchor="middle"
        fill={color}
        fontSize="7"
        fontWeight="700"
        fontFamily="monospace"
      >
        {initials}
      </text>
    </svg>
  );
}

/** Get the brand color for an app, with a muted fallback */
export function getAppColor(name: string): string {
  return APP_COLOR_MAP[name] ?? '#94a3b8';
}
