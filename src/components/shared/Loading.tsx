import { motion } from 'framer-motion';
import { eandColors } from '../../constants/eandColors';
import { Gamepad2 } from 'lucide-react';

export function Loading({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const outerSizes = { sm: 40, md: 64, lg: 80 };
  const iconSizes = { sm: 16, md: 24, lg: 32 };
  const s = outerSizes[size];
  const r = (s - 6) / 2;
  const circumference = r * 2 * Math.PI;

  return (
    <div className="flex flex-col items-center justify-center p-8 gap-3">
      <div className="relative" style={{ width: s, height: s }}>
        <svg width={s} height={s} className="absolute inset-0">
          <circle cx={s/2} cy={s/2} r={r} fill="none" stroke={`${eandColors.oceanBlue}15`} strokeWidth={3} />
        </svg>
        <motion.svg
          width={s} height={s}
          className="absolute inset-0"
          animate={{ rotate: 360 }}
          transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
        >
          <circle
            cx={s/2} cy={s/2} r={r}
            fill="none"
            stroke={eandColors.red}
            strokeWidth={3}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * 0.7}
          />
        </motion.svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Gamepad2 style={{ width: iconSizes[size], height: iconSizes[size], color: eandColors.oceanBlue }} />
          </motion.div>
        </div>
      </div>
      {size !== 'sm' && (
        <motion.p
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="text-sm font-medium"
          style={{ color: eandColors.grey }}
        >
          Loading...
        </motion.p>
      )}
    </div>
  );
}
