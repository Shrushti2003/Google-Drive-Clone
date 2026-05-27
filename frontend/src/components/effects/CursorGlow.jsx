import { motion, useMotionValue, useSpring } from 'framer-motion';
import { useEffect } from 'react';

export function CursorGlow() {
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const springX = useSpring(x, { stiffness: 120, damping: 24 });
  const springY = useSpring(y, { stiffness: 120, damping: 24 });

  useEffect(() => {
    function onMove(event) {
      x.set(event.clientX - 160);
      y.set(event.clientY - 160);
    }
    window.addEventListener('pointermove', onMove);
    return () => window.removeEventListener('pointermove', onMove);
  }, [x, y]);

  return (
    <motion.div
      className="pointer-events-none fixed z-[80] hidden h-80 w-80 rounded-full bg-cyan-300/10 blur-3xl lg:block"
      style={{ x: springX, y: springY }}
    />
  );
}
