import { AnimatePresence, motion } from 'framer-motion';
import { Eye, EyeOff } from 'lucide-react';

export function PasswordToggle({ visible, onToggle }) {
  return (
    <button
      type="button"
      className="absolute right-3 top-3 cursor-pointer rounded-md p-1 text-slate-400 transition hover:bg-white/10 hover:text-cyan-100 focus:outline-none focus:ring-2 focus:ring-cyan-300/40"
      onClick={onToggle}
      aria-label={visible ? 'Hide password' : 'Show password'}
      title={visible ? 'Hide password' : 'Show password'}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={visible ? 'visible' : 'hidden'}
          initial={{ opacity: 0, scale: 0.78, rotate: -10 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          exit={{ opacity: 0, scale: 0.78, rotate: 10 }}
          transition={{ duration: 0.16 }}
          className="block"
        >
          {visible ? <Eye size={18} /> : <EyeOff size={18} />}
        </motion.span>
      </AnimatePresence>
    </button>
  );
}
