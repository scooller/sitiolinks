import React from 'react';
import { motion } from 'motion/react';
import { appleEase } from '../lib/animations';

interface Props {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  role?: string;
}

const AnimatedHover: React.FC<Props> = ({ children, className = '', style = {}, role }) => {
  return (
    <motion.span
      className={className}
      style={{ display: 'inline-block', ...style }}
      role={role}
      whileHover={{ scale: 1.02, y: -1 }}
      whileTap={{ scale: 0.96 }}
      transition={{ duration: 0.16, ease: appleEase }}
    >
      {children}
    </motion.span>
  );
};

export default AnimatedHover;
