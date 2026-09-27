export interface SocialPlatformConfig {
  id: string;
  name: string;
  icon: string;
  color: string;
  prefix: string;
  placeholder: string;
  helperText?: string;
  isAdultDefault?: boolean;
  toCanonicalUrl: (input: string) => string;
  extractHandle: (url: string) => string;
  urlMatcher: RegExp;
}

export const SOCIAL_PLATFORMS: SocialPlatformConfig[] = [
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    icon: 'fab-whatsapp',
    color: '#25D366',
    prefix: 'wa.me/',
    placeholder: '+56 9 1234 5678',
    helperText: 'Ingresa tu número con código de país (ej. +569...)',
    toCanonicalUrl: (input: string) => {
      const cleanDigits = input.replace(/\D/g, '');
      return cleanDigits ? `https://wa.me/${cleanDigits}` : '';
    },
    extractHandle: (url: string) => {
      const match = url.match(/(?:wa\.me\/|api\.whatsapp\.com\/send\?phone=)(\+?\d+)/i);
      return match ? match[1] : url.replace(/\D/g, '');
    },
    urlMatcher: /(?:wa\.me|api\.whatsapp\.com|whatsapp\.com)/i,
  },
  {
    id: 'telegram',
    name: 'Telegram',
    icon: 'fab-telegram',
    color: '#229ED9',
    prefix: 't.me/',
    placeholder: 'usuario',
    helperText: 'Ingresa tu usuario sin @ o enlace t.me',
    toCanonicalUrl: (input: string) => {
      const clean = input.replace(/^@+/, '').replace(/^https?:\/\/t\.me\//i, '').trim();
      return clean ? `https://t.me/${clean}` : '';
    },
    extractHandle: (url: string) => {
      const match = url.match(/t\.me\/([a-zA-Z0-9_]+)/i);
      return match ? match[1] : url.replace(/^@+/, '').trim();
    },
    urlMatcher: /t\.me\//i,
  },
  {
    id: 'instagram',
    name: 'Instagram',
    icon: 'fab-instagram',
    color: '#E1306C',
    prefix: 'instagram.com/',
    placeholder: 'usuario',
    helperText: 'Ingresa tu nombre de usuario',
    toCanonicalUrl: (input: string) => {
      const clean = input.replace(/^@+/, '').replace(/^https?:\/\/(www\.)?instagram\.com\//i, '').replace(/\/$/, '').trim();
      return clean ? `https://instagram.com/${clean}` : '';
    },
    extractHandle: (url: string) => {
      const match = url.match(/instagram\.com\/([a-zA-Z0-9_.]+)/i);
      return match ? match[1] : url.replace(/^@+/, '').trim();
    },
    urlMatcher: /instagram\.com/i,
  },
  {
    id: 'twitter',
    name: 'X (Twitter)',
    icon: 'fab-x-twitter',
    color: '#111827',
    prefix: 'x.com/',
    placeholder: 'usuario',
    helperText: 'Ingresa tu @ de X / Twitter',
    toCanonicalUrl: (input: string) => {
      const clean = input.replace(/^@+/, '').replace(/^https?:\/\/(www\.)?(x|twitter)\.com\//i, '').replace(/\/$/, '').trim();
      return clean ? `https://x.com/${clean}` : '';
    },
    extractHandle: (url: string) => {
      const match = url.match(/(?:x|twitter)\.com\/([a-zA-Z0-9_]+)/i);
      return match ? match[1] : url.replace(/^@+/, '').trim();
    },
    urlMatcher: /(?:twitter\.com|x\.com)/i,
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    icon: 'fab-tiktok',
    color: '#000000',
    prefix: 'tiktok.com/@',
    placeholder: 'usuario',
    helperText: 'Ingresa tu nombre de usuario en TikTok',
    toCanonicalUrl: (input: string) => {
      const clean = input.replace(/^@+/, '').replace(/^https?:\/\/(www\.)?tiktok\.com\/@?/i, '').replace(/\/$/, '').trim();
      return clean ? `https://tiktok.com/@${clean}` : '';
    },
    extractHandle: (url: string) => {
      const match = url.match(/tiktok\.com\/@?([a-zA-Z0-9_.]+)/i);
      return match ? match[1] : url.replace(/^@+/, '').trim();
    },
    urlMatcher: /tiktok\.com/i,
  },
  {
    id: 'discord',
    name: 'Discord',
    icon: 'fab-discord',
    color: '#5865F2',
    prefix: 'discord.gg/',
    placeholder: 'código o enlace de invitación',
    helperText: 'Código de invitación o enlace completo del servidor',
    toCanonicalUrl: (input: string) => {
      const trimmed = input.trim();
      if (!trimmed) return '';
      if (/^https?:\/\//i.test(trimmed)) return trimmed;
      const clean = trimmed.replace(/^discord\.gg\//i, '');
      return `https://discord.gg/${clean}`;
    },
    extractHandle: (url: string) => {
      const match = url.match(/discord(?:\.gg|\.com\/invite)\/([a-zA-Z0-9_-]+)/i);
      return match ? match[1] : url;
    },
    urlMatcher: /discord(?:\.gg|\.com)/i,
  },
  {
    id: 'snapchat',
    name: 'Snapchat',
    icon: 'fab-snapchat',
    color: '#FFFC00',
    prefix: 'snapchat.com/add/',
    placeholder: 'usuario',
    helperText: 'Tu nombre de usuario en Snapchat',
    toCanonicalUrl: (input: string) => {
      const clean = input.replace(/^@+/, '').replace(/^https?:\/\/(www\.)?snapchat\.com\/add\//i, '').replace(/\/$/, '').trim();
      return clean ? `https://snapchat.com/add/${clean}` : '';
    },
    extractHandle: (url: string) => {
      const match = url.match(/snapchat\.com\/add\/([a-zA-Z0-9_.]+)/i);
      return match ? match[1] : url.replace(/^@+/, '').trim();
    },
    urlMatcher: /snapchat\.com/i,
  },
  {
    id: 'signal',
    name: 'Signal',
    icon: 'fas-comment-dots',
    color: '#3A76F0',
    prefix: 'signal.me/#p/',
    placeholder: '+569... o usuario',
    helperText: 'Número con código de país o enlace de Signal',
    toCanonicalUrl: (input: string) => {
      const trimmed = input.trim();
      if (!trimmed) return '';
      if (/^https?:\/\//i.test(trimmed)) return trimmed;
      return `https://signal.me/#p/${trimmed.replace(/^\+/, '')}`;
    },
    extractHandle: (url: string) => {
      const match = url.match(/signal\.me\/#p\/(.+)/i);
      return match ? match[1] : url;
    },
    urlMatcher: /signal\.me/i,
  },
  {
    id: 'youtube',
    name: 'YouTube',
    icon: 'fab-youtube',
    color: '#FF0000',
    prefix: 'youtube.com/@',
    placeholder: 'canal',
    helperText: 'Nombre de canal (@canal) o URL de YouTube',
    toCanonicalUrl: (input: string) => {
      const trimmed = input.trim();
      if (!trimmed) return '';
      if (/^https?:\/\//i.test(trimmed)) return trimmed;
      const clean = trimmed.replace(/^@+/, '').replace(/^youtube\.com\/@?/i, '');
      return `https://youtube.com/@${clean}`;
    },
    extractHandle: (url: string) => {
      const match = url.match(/youtube\.com\/@?([a-zA-Z0-9_-]+)/i);
      return match ? match[1] : url;
    },
    urlMatcher: /youtube\.com/i,
  },
  {
    id: 'facebook',
    name: 'Facebook',
    icon: 'fab-facebook',
    color: '#1877F2',
    prefix: 'facebook.com/',
    placeholder: 'usuario o página',
    helperText: 'Nombre de usuario o URL de tu perfil',
    toCanonicalUrl: (input: string) => {
      const trimmed = input.trim();
      if (!trimmed) return '';
      if (/^https?:\/\//i.test(trimmed)) return trimmed;
      const clean = trimmed.replace(/^facebook\.com\//i, '').replace(/\/$/, '');
      return `https://facebook.com/${clean}`;
    },
    extractHandle: (url: string) => {
      const match = url.match(/facebook\.com\/([a-zA-Z0-9_.]+)/i);
      return match ? match[1] : url;
    },
    urlMatcher: /facebook\.com/i,
  },
  {
    id: 'onlyfans',
    name: 'OnlyFans',
    icon: 'fas-fire',
    color: '#00AFF0',
    prefix: 'onlyfans.com/',
    placeholder: 'usuario',
    helperText: 'Usuario de OnlyFans (marcado +18 por defecto)',
    isAdultDefault: true,
    toCanonicalUrl: (input: string) => {
      const clean = input.replace(/^@+/, '').replace(/^https?:\/\/(www\.)?onlyfans\.com\//i, '').replace(/\/$/, '').trim();
      return clean ? `https://onlyfans.com/${clean}` : '';
    },
    extractHandle: (url: string) => {
      const match = url.match(/onlyfans\.com\/([a-zA-Z0-9_.]+)/i);
      return match ? match[1] : url.replace(/^@+/, '').trim();
    },
    urlMatcher: /onlyfans\.com/i,
  },
  {
    id: 'twitch',
    name: 'Twitch',
    icon: 'fab-twitch',
    color: '#9146FF',
    prefix: 'twitch.tv/',
    placeholder: 'canal',
    helperText: 'Nombre de usuario o canal en Twitch',
    toCanonicalUrl: (input: string) => {
      const clean = input.replace(/^@+/, '').replace(/^https?:\/\/(www\.)?twitch\.tv\//i, '').replace(/\/$/, '').trim();
      return clean ? `https://twitch.tv/${clean}` : '';
    },
    extractHandle: (url: string) => {
      const match = url.match(/twitch\.tv\/([a-zA-Z0-9_]+)/i);
      return match ? match[1] : url;
    },
    urlMatcher: /twitch\.tv/i,
  },
  {
    id: 'spotify',
    name: 'Spotify',
    icon: 'fab-spotify',
    color: '#1DB954',
    prefix: 'open.spotify.com/',
    placeholder: 'enlace o id de artista',
    helperText: 'Enlace de Spotify a perfil, álbum o playlist',
    toCanonicalUrl: (input: string) => {
      const trimmed = input.trim();
      if (!trimmed) return '';
      if (/^https?:\/\//i.test(trimmed)) return trimmed;
      return `https://open.spotify.com/${trimmed.replace(/^open\.spotify\.com\//i, '')}`;
    },
    extractHandle: (url: string) => {
      const match = url.match(/open\.spotify\.com\/(.+)/i);
      return match ? match[1] : url;
    },
    urlMatcher: /spotify\.com/i,
  },
  {
    id: 'custom',
    name: 'Sitio Web / Enlace Libre',
    icon: 'fas-globe',
    color: '#6366F1',
    prefix: 'https://',
    placeholder: 'ejemplo.com/tu-enlace',
    helperText: 'Cualquier enlace externo o sitio web propio',
    toCanonicalUrl: (input: string) => {
      const trimmed = input.trim();
      if (!trimmed) return '';
      if (/^https?:\/\//i.test(trimmed)) return trimmed;
      return `https://${trimmed}`;
    },
    extractHandle: (url: string) => url,
    urlMatcher: /.*/,
  },
];

export function detectSocialPlatform(urlOrInput: string): { platform: SocialPlatformConfig; handle: string } {
  const trimmed = urlOrInput.trim();
  if (!trimmed) {
    return { platform: SOCIAL_PLATFORMS[0], handle: '' };
  }

  // Check matching predefined platforms (excluding 'custom')
  for (const plat of SOCIAL_PLATFORMS) {
    if (plat.id !== 'custom' && plat.urlMatcher.test(trimmed)) {
      return {
        platform: plat,
        handle: plat.extractHandle(trimmed),
      };
    }
  }

  // If starts with phone number (+ or digits only), default to whatsapp
  if (/^\+?\d{7,15}$/.test(trimmed.replace(/\s+/g, ''))) {
    return {
      platform: SOCIAL_PLATFORMS.find((p) => p.id === 'whatsapp')!,
      handle: trimmed,
    };
  }

  return {
    platform: SOCIAL_PLATFORMS.find((p) => p.id === 'custom')!,
    handle: trimmed,
  };
}

export function getPlatformById(id: string): SocialPlatformConfig {
  return SOCIAL_PLATFORMS.find((p) => p.id === id) || SOCIAL_PLATFORMS[SOCIAL_PLATFORMS.length - 1];
}
