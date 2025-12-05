import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';

const buttonVariants = {
  initial: {
    gap: 0,
    paddingLeft: '.5rem',
    paddingRight: '.5rem',
  },
  animate: (selected) => ({
    gap: selected ? '.5rem' : 0,
    paddingLeft: selected ? '1rem' : '.5rem',
    paddingRight: selected ? '1rem' : '.5rem',
  }),
};

const spanVariants = {
  initial: { width: 0, opacity: 0 },
  animate: { width: 'auto', opacity: 1 },
  exit: { width: 0, opacity: 0 },
};

const transition = { delay: 0.1, type: 'spring', bounce: 0, duration: 0.35 };

const NavTab = ({ item, isSelected, onClick }) => {
  const Icon = item.icon;
  
  return (
    <motion.button
      variants={buttonVariants}
      initial="initial"
      animate="animate"
      custom={isSelected}
      onClick={onClick}
      transition={transition}
      className={`${
        isSelected
          ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400'
          : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-100'
      } relative flex items-center justify-center rounded-full px-2 py-2.5 text-sm font-medium transition-colors duration-300 min-w-[48px] min-h-[48px]`}
    >
      <Icon className="w-5 h-5 flex-shrink-0" />
      <AnimatePresence>
        {isSelected && (
          <motion.span
            variants={spanVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={transition}
            className="overflow-hidden whitespace-nowrap font-semibold"
          >
            {item.label}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
};

export default function BottomNav({ navigationItems }) {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-4 pt-2">
      <div className="max-w-lg mx-auto bg-white dark:bg-gray-900 rounded-[28px] shadow-[0_8px_32px_rgba(0,0,0,0.12)] border border-gray-200/50 dark:border-gray-700/50 px-2 py-2 backdrop-blur-xl">
        <div className="flex justify-around items-center gap-1">
          {navigationItems.map((item) => {
            const isSelected = location.pathname === item.path;
            
            return (
              <Link key={item.path} to={item.path} className="flex-1 flex justify-center">
                <NavTab 
                  item={item} 
                  isSelected={isSelected}
                  onClick={() => {}}
                />
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}