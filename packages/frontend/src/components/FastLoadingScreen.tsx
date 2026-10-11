/**
 * Fast Loading Screen Component
 * Shows immediately while app initializes
 */
import { motion } from 'framer-motion';

export function FastLoadingScreen() {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center z-50">
      <div className="text-center">
        {/* Logo/Icon */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="mb-8"
        >
          <div className="text-6xl mb-4">🏛️</div>
          <h1 className="text-3xl font-bold text-amber-400 mb-2">
            Austrian Business Cycle Monitor
          </h1>
          <p className="text-slate-400 text-sm">
            Sound Money • Free Markets
          </p>
        </motion.div>

        {/* Loading Animation */}
        <motion.div
          className="flex justify-center items-center space-x-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-3 h-3 bg-amber-500 rounded-full"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                delay: i * 0.2,
              }}
            />
          ))}
        </motion.div>

        {/* Loading Text */}
        <motion.p
          className="mt-6 text-slate-500 text-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          Loading economic data...
        </motion.p>
      </div>
    </div>
  );
}
