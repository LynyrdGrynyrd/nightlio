import { motion } from 'framer-motion';

const variants = {
    initial: { opacity: 0, y: 15 },
    enter: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -15 },
};

const PageTransition = ({ children, className = '', style = {} }) => {
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
