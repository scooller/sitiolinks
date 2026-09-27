interface MetaTagsConfig {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: string;
  keywords?: string;
  author?: string;
  siteName?: string;
}

const DEFAULT_META: MetaTagsConfig = {
  title: 'Only Models - Creadores, Modelos, Escorts y Venta de Contenido Adulto',
  description: 'Directorio y plataforma internacional: modelos y creadores verificados, escorts y damas de compañía, links de venta de contenido para adulto (+18), galerías privadas con desnudos explícitos y guía de cafés con piernas.',
  image: 'https://only-models.online/logo500.png',
  url: 'https://only-models.online/',
  type: 'website',
  keywords: 'escorts, damas de compañía, acompañantes, venta de contenido para adulto, links de venta de contenido para adulto, contenido para adultos, galeria con desnudos explicitos, desnudos explicitos, fotos desnudas, modelos eroticas, only models, only-models, creadores de contenido, perfiles verificados adultos, packs de fotos, videos exclusivos, cafes con piernas, adult content creators',
  author: 'Only Models',
  siteName: 'Only Models',
};

function updateOrCreateMeta(attrName: 'name' | 'property', attrValue: string, content: string) {
  let element = document.querySelector(`meta[${attrName}="${attrValue}"]`);
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attrName, attrValue);
    document.head.appendChild(element);
  }
  element.setAttribute('content', content);
}

function updateOrCreateLink(rel: string, href: string) {
  let element = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
  if (!element) {
    element = document.createElement('link');
    element.setAttribute(rel, rel);
    document.head.appendChild(element);
  }
  element.setAttribute('href', href);
}

export function updatePageMeta(config: MetaTagsConfig) {
  const siteName = config.siteName || (typeof document !== 'undefined' && document.title ? document.title.split(' - ').pop()?.trim() : '') || DEFAULT_META.siteName!;
  const title = config.title || DEFAULT_META.title!;
  const description = config.description || DEFAULT_META.description!;
  const image = config.image || DEFAULT_META.image!;
  const url = config.url || (typeof window !== 'undefined' ? window.location.href : DEFAULT_META.url!);
  const type = config.type || 'website';
  const keywords = config.keywords || DEFAULT_META.keywords!;
  const author = config.author || siteName || DEFAULT_META.author!;

  if (typeof document === 'undefined') return;

  // 1. Document Title
  document.title = title;

  // 2. Primary Meta
  updateOrCreateMeta('name', 'description', description);
  updateOrCreateMeta('name', 'keywords', keywords);
  updateOrCreateMeta('name', 'author', author);

  // 3. Open Graph
  updateOrCreateMeta('property', 'og:title', title);
  updateOrCreateMeta('property', 'og:description', description);
  updateOrCreateMeta('property', 'og:image', image);
  updateOrCreateMeta('property', 'og:url', url);
  updateOrCreateMeta('property', 'og:type', type);
  updateOrCreateMeta('property', 'og:site_name', siteName);
  updateOrCreateMeta('property', 'og:locale', 'es');

  // 4. Twitter Cards
  updateOrCreateMeta('name', 'twitter:card', 'summary_large_image');
  updateOrCreateMeta('name', 'twitter:title', title);
  updateOrCreateMeta('name', 'twitter:description', description);
  updateOrCreateMeta('name', 'twitter:image', image);

  // 5. Canonical Link
  updateOrCreateLink('canonical', url);
}

export function resetPageMeta() {
  updatePageMeta(DEFAULT_META);
}
