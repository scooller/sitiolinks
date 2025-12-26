import React from 'react';
import { motion } from 'motion/react';

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
      whileHover={{ scale: 1.03, y: -2 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.12, ease: 'easeOut' }}
    >
      {children}
    </motion.span>
  );
};

export default AnimatedHover;
