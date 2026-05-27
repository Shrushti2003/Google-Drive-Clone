import { motion, useMotionTemplate, useMotionValue, useSpring } from 'framer-motion';
import { useEffect } from 'react';

export function AmbientBackground({ dense = false }) {
  const x = useMotionValue(50);
  const y = useMotionValue(20);
  const springX = useSpring(x, { stiffness: 90, damping: 28 });
  const springY = useSpring(y, { stiffness: 90, damping: 28 });
  const spotlight = useMotionTemplate`radial-gradient(circle at ${springX}% ${springY}%, rgba(103,232,249,.18), transparent 34%)`;

  useEffect(() => {
    function onMove(event) {
      x.set((event.clientX / window.innerWidth) * 100);
      y.set((event.clientY / window.innerHeight) * 100);
    }
    window.addEventListener('pointermove', onMove);
    return () => window.removeEventListener('pointermove', onMove);
  }, [x, y]);

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[#05070B]">
      <motion.div className="absolute inset-0" style={{ background: spotlight }} />
      <motion.div
        className="absolute inset-0 opacity-70"
        animate={{ backgroundPosition: ['0% 0%', '100% 40%', '30% 100%', '0% 0%'] }}
        transition={{ duration: 24, repeat: Infinity, ease: 'linear' }}
        style={{
          backgroundImage:
            'radial-gradient(circle at 12% 20%, rgba(29,78,216,.22), transparent 28%), radial-gradient(circle at 80% 0%, rgba(8,145,178,.18), transparent 30%), linear-gradient(135deg, #05070B 0%, #0B1018 38%, #10131F 100%)',
          backgroundSize: '160% 160%'
        }}
      />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.025)_1px,transparent_1px)] bg-[size:72px_72px] opacity-30" />
      <div className="absolute inset-0 opacity-[0.055] [background-image:url('data:image/svg+xml,%3Csvg_viewBox=%220_0_256_256%22_xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter_id=%22n%22%3E%3CfeTurbulence_type=%22fractalNoise%22_baseFrequency=%220.9%22_numOctaves=%224%22_stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect_width=%22256%22_height=%22256%22_filter=%22url(%23n)%22_opacity=%220.65%22/%3E%3C/svg%3E')]" />
      <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-cyan-300/10 to-transparent" />
      {Array.from({ length: dense ? 34 : 18 }).map((_, index) => (
        <motion.span
          key={index}
          className="absolute h-1 w-1 rounded-full bg-cyan-200/45 shadow-[0_0_18px_rgba(103,232,249,.75)]"
          style={{ left: `${(index * 29) % 100}%`, top: `${12 + ((index * 47) % 80)}%` }}
          animate={{ opacity: [0.18, 0.9, 0.18], y: [0, -18, 0], scale: [0.7, 1.4, 0.7] }}
          transition={{ duration: 4 + (index % 6), delay: index * 0.12, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}
    </div>
  );
}
