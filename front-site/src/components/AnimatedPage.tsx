import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { getVariantByName } from '../lib/animations';

interface AnimatedPageProps {
  children: React.ReactNode;
  id?: string;
  transitionType?: string;
}

// Wrap page-level content to animate mount/unmount transitions
export const AnimatedPage: React.FC<AnimatedPageProps> = ({ 
  children, 
  id = 'page',
  transitionType 
}) => {
  const variant = getVariantByName(transitionType);
  
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={id}
        initial={variant.initial}
        animate={variant.animate}
        exit={variant.exit}
        transition={{ duration: 0.3 }}
        style={{ willChange: 'opacity, transform' }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

export default AnimatedPage;
