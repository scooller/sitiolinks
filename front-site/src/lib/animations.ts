// Tipado flexible para objetos de animación usados con motion/react
type SimpleVariants = {
  initial?: Record<string, any>;
  animate?: Record<string, any>;
  exit?: Record<string, any>;
};

// Reusable animation variants
export const fadeIn: SimpleVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 }
};

export const slideLeft: SimpleVariants = {
  initial: { x: 40, opacity: 0 },
  animate: { x: 0, opacity: 1 },
  exit: { x: -40, opacity: 0 }
};

export const scaleIn: SimpleVariants = {
  initial: { scale: 0.95, opacity: 0 },
  animate: { scale: 1, opacity: 1 },
  exit: { scale: 0.95, opacity: 0 }
};

export const defaultTransition = {
  duration: 0.25,
  ease: 'easeOut'
};

// Mapa de variantes disponibles por nombre
export const variantsByName: Record<string, SimpleVariants> = {
  fade: fadeIn,
  slide: slideLeft,
  scale: scaleIn,
};

// Obtiene la variante según el nombre, con fallback a fadeIn
export function getVariantByName(name?: string): SimpleVariants {
  if (!name) return fadeIn;
  return variantsByName[name] || fadeIn;
}
