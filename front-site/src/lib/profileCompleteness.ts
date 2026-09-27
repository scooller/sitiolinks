import type { User, Link as UserLink, Tag } from '../types';

export interface CompletenessCheckItem {
  id: string;
  label: string;
  shortLabel: string;
  isComplete: boolean;
  weight: number;
  icon: string;
  actionPath?: string;
  targetTab?: 'general' | 'creator' | 'links' | 'tags';
}

export interface ProfileCompletenessResult {
  percentage: number;
  isComplete: boolean;
  items: CompletenessCheckItem[];
  pendingItems: CompletenessCheckItem[];
}

export function calculateProfileCompleteness(
  user: User | null | undefined,
  defaultAvatarUrl?: string | null
): ProfileCompletenessResult {
  if (!user) {
    return {
      percentage: 0,
      isComplete: false,
      items: [],
      pendingItems: [],
    };
  }

  // 1. Avatar check (not null, not empty, not equal to default avatar)
  const hasAvatar = Boolean(
    (user.avatar_url || (user as any).avatar_thumb) &&
    (!defaultAvatarUrl || (user.avatar_url !== defaultAvatarUrl && (user as any).avatar_thumb !== defaultAvatarUrl))
  );

  // 2. Description check (at least 15 chars)
  const hasDescription = Boolean(user.description && user.description.trim().length >= 15);

  // 3. Links check (at least 1 valid link)
  const userLinks = (user as any).links as UserLink[] | undefined;
  const hasLinks = Boolean(userLinks && userLinks.length > 0 && userLinks.some((l) => l.url && l.url.trim()));

  // 4. Galleries check (at least 1 gallery or galleries_count > 0)
  const galleriesCount = (user as any).galleries_count ?? (user as any).galleries?.length ?? 0;
  const hasGalleries = galleriesCount > 0;

  // 5. Tags check (at least 1 tag assigned)
  const userTags = (user as any).tags as Tag[] | undefined;
  const hasTags = Boolean(userTags && userTags.length > 0);

  // 6. Rates / Location (price_from > 0 or country defined)
  const hasPrice = Boolean(user.price_from && Number(user.price_from) > 0);
  const hasLocation = Boolean(user.country && user.country.trim().length > 0);
  const hasRateAndLocation = hasPrice || hasLocation;

  const items: CompletenessCheckItem[] = [
    {
      id: 'avatar',
      label: 'Foto de perfil / Avatar',
      shortLabel: 'Subir avatar',
      isComplete: hasAvatar,
      weight: 20,
      icon: 'fas-camera',
      actionPath: '/profile/edit',
      targetTab: 'general',
    },
    {
      id: 'description',
      label: 'Biografía descriptiva (mín. 15 letras)',
      shortLabel: 'Completar biografía',
      isComplete: hasDescription,
      weight: 20,
      icon: 'fas-pen-nib',
      actionPath: '/profile/edit',
      targetTab: 'general',
    },
    {
      id: 'links',
      label: 'Redes sociales o WhatsApp de contacto',
      shortLabel: 'Agregar redes / links',
      isComplete: hasLinks,
      weight: 20,
      icon: 'fas-link',
      actionPath: '/profile/edit',
      targetTab: 'links',
    },
    {
      id: 'galleries',
      label: 'Al menos 1 galería de fotos o contenido',
      shortLabel: 'Publicar galería',
      isComplete: hasGalleries,
      weight: 20,
      icon: 'fas-images',
      actionPath: '/galleries/new',
    },
    {
      id: 'tags',
      label: 'Categorías y etiquetas de perfil',
      shortLabel: 'Asignar etiquetas',
      isComplete: hasTags,
      weight: 10,
      icon: 'fas-tags',
      actionPath: '/profile/edit',
      targetTab: 'tags',
    },
    {
      id: 'location_price',
      label: 'Tarifa y ubicación (país/ciudad)',
      shortLabel: 'Tarifa y ubicación',
      isComplete: hasRateAndLocation,
      weight: 10,
      icon: 'fas-dollar-sign',
      actionPath: '/profile/edit',
      targetTab: 'creator',
    },
  ];

  const totalScore = items.reduce((acc, item) => acc + (item.isComplete ? item.weight : 0), 0);
  const percentage = Math.min(100, Math.max(0, totalScore));
  const pendingItems = items.filter((item) => !item.isComplete);

  return {
    percentage,
    isComplete: percentage >= 100,
    items,
    pendingItems,
  };
}
