
import React from 'react';
import { motion } from 'framer-motion';

interface AnimatedIconProps {
  children: React.ReactNode;
  className?: string;
  isClicked?: boolean;
}

/**
 * AnimatedIcon wraps Lucide icons to provide a consistent spinning hover effect.
 * rule: "all icons have a spinning effect when hovered over apart from the icon in a div that is clicked"
 */
const AnimatedIcon: React.FC<AnimatedIconProps> = ({ children, className = "", isClicked = false }) => {
  return (
    <motion.div
      className={`inline-flex items-center justify-center ${className}`}
      whileHover={!isClicked ? { 
        rotate: 360,
        transition: { duration: 0.8, ease: "easeInOut", repeat: Infinity }
      } : {}}
      animate={isClicked ? { 
        scale: [1, 1.2, 1],
        rotate: 0,
        transition: { duration: 0.3 }
      } : {}}
    >
      {children}
    </motion.div>
  );
};

export default AnimatedIcon;
