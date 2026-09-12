// Tipado flexible para objetos de animación usados con motion/react
type SimpleVariants = {
  initial?: Record<string, any>;
  animate?: Record<string, any>;
  exit?: Record<string, any>;
};

// Curvas de animación Apple Human Interface Guidelines
export const appleEase = [0.16, 1, 0.3, 1] as const;

export const appleSpring = {
  type: 'spring',
  stiffness: 380,
  damping: 30,
  mass: 0.8
} as const;

// Reusable animation variants con curvas Apple
export const fadeIn: SimpleVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -6 }
};

export const slideLeft: SimpleVariants = {
  initial: { x: 24, opacity: 0 },
  animate: { x: 0, opacity: 1 },
  exit: { x: -24, opacity: 0 }
};

export const scaleIn: SimpleVariants = {
  initial: { scale: 0.96, opacity: 0 },
  animate: { scale: 1, opacity: 1 },
  exit: { scale: 0.96, opacity: 0 }
};

export const defaultTransition = {
  duration: 0.24,
  ease: appleEase
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
