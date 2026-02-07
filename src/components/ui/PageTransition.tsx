import { ReactNode, CSSProperties } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}

const variants = {
  initial: { opacity: 0, y: 15 },
  enter: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -15 },
};

const instantVariants = {
  initial: { opacity: 1, y: 0 },
  enter: { opacity: 1, y: 0 },
  exit: { opacity: 1, y: 0 },
};

const PageTransition = ({ children, className = '', style = {} }: PageTransitionProps) => {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      initial="initial"
      animate="enter"
      exit="exit"
      variants={prefersReducedMotion ? instantVariants : variants}
      transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.3, ease: 'easeOut' }}
      className={className}
      style={style}
    >
      {children}
    </motion.div>
  );
};

export default PageTransition;
