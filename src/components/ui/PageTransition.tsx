import { ReactNode, CSSProperties } from 'react';
import { motion } from 'framer-motion';

// ========== Types ==========

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}

// ========== Constants ==========

const variants = {
  initial: { opacity: 0, y: 15 },
  enter: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -15 },
};

// ========== Component ==========

const PageTransition = ({ children, className = '', style = {} }: PageTransitionProps) => {
  return (
    <motion.div
      initial="initial"
      animate="enter"
      exit="exit"
      variants={variants}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={className}
      style={style}
    >
      {children}
    </motion.div>
  );
};

export default PageTransition;
