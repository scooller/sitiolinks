import React, { useState } from 'react';
import { Placeholder } from 'react-bootstrap';

type OptimizedImageProps = {
  // URLs WebP en diferentes tamaños (responsive)
  webpUrl?: string;
  smallWebpUrl?: string;
  mediumWebpUrl?: string;
  
  // URL fallback (JPEG/PNG)
  fallbackUrl?: string;
  
  // Atributos básicos
  alt: string;
  className?: string;
  style?: React.CSSProperties;
  
  // Tamaño base para skeleton y UI Avatars fallback
  size?: number;
  width?: number;
  height?: number;
  
  // Comportamiento
  loading?: 'lazy' | 'eager';
  fetchPriority?: 'high' | 'low' | 'auto';
  priority?: boolean; // Shortcut para loading=eager + fetchPriority=high
  
  // UI states
  showSkeleton?: boolean;
  placeholderFallback?: boolean; // Usar UI Avatars si no hay imagen
  
  // Handlers
  onClick?: () => void;
  onLoad?: () => void;
};

/**
 * Componente optimizado para renderizar imágenes con:
 * - Soporte WebP con múltiples tamaños (srcset responsive)
 * - Fallback a JPEG/PNG
 * - Skeleton loader opcional
 * - UI Avatars fallback para avatares sin imagen
 * - Atributos width/height para prevenir CLS
 * - fetchPriority para optimizar LCP
 */
export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  webpUrl,
  smallWebpUrl,
  mediumWebpUrl,
  fallbackUrl,
  alt,
  className,
  style,
  size,
  width,
  height,
  loading = 'lazy',
  fetchPriority = 'auto',
  priority = false,
  showSkeleton = false,
  placeholderFallback = false,
  onClick,
  onLoad,
}) => {
  const [loaded, setLoaded] = useState(false);

  const handleLoad = () => {
    setLoaded(true);
    onLoad?.();
  };

  // Si no hay imágenes y placeholderFallback está habilitado, usar UI Avatars
  const hasImages = webpUrl || fallbackUrl || smallWebpUrl || mediumWebpUrl;
  
  if (!hasImages && placeholderFallback && size) {
    const placeholderUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(alt)}&size=${size}`;
    return (
      <img 
        src={placeholderUrl} 
        alt={alt} 
        className={className} 
        style={style} 
        width={width || size}
        height={height || size}
        loading="lazy" 
        onLoad={handleLoad} 
        onClick={onClick}
      />
    );
  }

  // Determinar estrategia de carga
  const loadingStrategy = priority ? 'eager' : loading;
  const fetchPriorityValue = priority ? 'high' : fetchPriority;
  
  // Construir srcset responsive con los diferentes tamaños WebP
  const buildSrcSet = (): string | undefined => {
    const srcsetParts: string[] = [];
    if (smallWebpUrl) srcsetParts.push(`${smallWebpUrl} 120w`);
    if (mediumWebpUrl) srcsetParts.push(`${mediumWebpUrl} 240w`);
    if (webpUrl) srcsetParts.push(`${webpUrl} 500w`);
    return srcsetParts.length > 0 ? srcsetParts.join(', ') : undefined;
  };

  const srcSet = buildSrcSet();
  const sizes = "(max-width: 576px) 120px, (max-width: 992px) 240px, 500px";
  
  // Determinar dimensiones (usar width/height si están definidos, sino size)
  const imgWidth = width || size;
  const imgHeight = height || size;
  
  // Construir elemento de imagen con srcset o simple
  const imageElement = srcSet && fallbackUrl ? (
    <picture onClick={onClick} style={{ cursor: onClick ? 'pointer' : undefined }}>
      <source srcSet={srcSet} sizes={sizes} type="image/webp" />
      <img 
        src={fallbackUrl} 
        alt={alt} 
        className={className} 
        style={{
          ...style,
          opacity: showSkeleton && !loaded ? 0 : 1,
          transition: 'opacity 0.3s ease'
        }} 
        width={imgWidth}
        height={imgHeight}
        loading={loadingStrategy}
        {...{ fetchpriority: fetchPriorityValue }}
        decoding="async"
        onLoad={handleLoad} 
      />
    </picture>
  ) : webpUrl && fallbackUrl ? (
    <picture onClick={onClick} style={{ cursor: onClick ? 'pointer' : undefined }}>
      <source srcSet={webpUrl} type="image/webp" />
      <img 
        src={fallbackUrl} 
        alt={alt} 
        className={className} 
        style={{
          ...style,
          opacity: showSkeleton && !loaded ? 0 : 1,
          transition: 'opacity 0.3s ease'
        }} 
        width={imgWidth}
        height={imgHeight}
        loading={loadingStrategy}
        {...{ fetchpriority: fetchPriorityValue }}
        decoding="async"
        onLoad={handleLoad} 
      />
    </picture>
  ) : (
    <img 
      src={webpUrl || fallbackUrl || smallWebpUrl || mediumWebpUrl || ''} 
      alt={alt} 
      className={className} 
      style={{
        ...style,
        opacity: showSkeleton && !loaded ? 0 : 1,
        transition: 'opacity 0.3s ease'
      }} 
      width={imgWidth}
      height={imgHeight}
      loading={loadingStrategy}
      {...{ fetchpriority: fetchPriorityValue }}
      decoding="async"
      onClick={onClick}
      onLoad={handleLoad} 
    />
  );

  // Si skeleton está habilitado, envolver con placeholder
  if (showSkeleton && size) {
    return (
      <div className="position-relative mx-auto" style={{ width: size, height: size }}>
        {!loaded && (
          <Placeholder 
            as="div" 
            animation="wave" 
            className="position-absolute top-0 start-0 rounded-circle w-100 h-100" 
            style={{ backgroundColor: '#e9ecef' }}
          />
        )}
        {imageElement}
      </div>
    );
  }

  return imageElement;
};

export default OptimizedImage;
