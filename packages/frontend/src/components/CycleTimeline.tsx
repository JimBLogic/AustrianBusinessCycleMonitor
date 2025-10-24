/**
 * Historical Cycle Timeline Component
 * 
 * Visualizes Austrian Business Cycle phases over time with key economic events
 */
import React from 'react';
import { motion } from 'framer-motion';

interface CycleEvent {
  date: string;
  phase: 'boom' | 'bust' | 'recovery' | 'expansion';
  label: string;
  description: string;
  austrianScore?: number;
}

interface CycleTimelineProps {
  events: CycleEvent[];
  currentPhase?: string;
}

const phaseColors = {
  boom: {
    bg: 'from-red-900/40 to-orange-900/40',
    border: 'border-red-600/50',
    text: 'text-red-400',
    icon: '🔥',
  },
  bust: {
    bg: 'from-blue-900/40 to-purple-900/40',
    border: 'border-blue-600/50',
    text: 'text-blue-400',
    icon: '❄️',
  },
  recovery: {
    bg: 'from-green-900/40 to-teal-900/40',
    border: 'border-green-600/50',
    text: 'text-green-400',
    icon: '🌱',
  },
  expansion: {
    bg: 'from-yellow-900/40 to-orange-900/40',
    border: 'border-yellow-600/50',
    text: 'text-yellow-400',
    icon: '📈',
  },
};

export const CycleTimeline: React.FC<CycleTimelineProps> = ({ events, currentPhase = 'expansion' }) => {
  // Default events if none provided
  const defaultEvents: CycleEvent[] = [
    {
      date: '2008-Q4',
      phase: 'bust',
      label: 'Financial Crisis',
      description: 'Credit bubble burst, malinvestments liquidated',
      austrianScore: 9.5,
    },
    {
      date: '2009-Q2',
      phase: 'recovery',
      label: 'QE1 Begins',
      description: 'Fed starts quantitative easing',
      austrianScore: 4.2,
    },
    {
      date: '2012-Q1',
      phase: 'expansion',
      label: 'Early Expansion',
      description: 'Credit begins expanding again',
      austrianScore: 5.1,
    },
    {
      date: '2015-Q3',
      phase: 'expansion',
      label: 'Mid Expansion',
      description: 'Asset prices inflating',
      austrianScore: 6.3,
    },
    {
      date: '2019-Q4',
      phase: 'boom',
      label: 'Late Boom',
      description: 'Malinvestment accumulating',
      austrianScore: 7.8,
    },
    {
      date: '2020-Q2',
      phase: 'bust',
      label: 'COVID Shock',
      description: 'Sudden credit contraction',
      austrianScore: 8.9,
    },
    {
      date: '2020-Q3',
      phase: 'recovery',
      label: 'Massive Stimulus',
      description: 'Unprecedented monetary expansion',
      austrianScore: 5.5,
    },
    {
      date: '2023-Q1',
      phase: 'expansion',
      label: 'Rate Hikes Begin',
      description: 'Fed tightening cycle',
      austrianScore: 6.8,
    },
    {
      date: '2025-Q4',
      phase: 'expansion',
      label: 'Current Position',
      description: 'Monitoring for late-stage boom indicators',
      austrianScore: 5.0,
    },
  ];

  const timelineEvents = events.length > 0 ? events : defaultEvents;
  const currentIndex = timelineEvents.length - 1;

  return (
    <div className="w-full bg-gradient-to-br from-slate-900/80 to-slate-800/80 border-2 border-orange-600/30 rounded-xl p-6 backdrop-blur-sm shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-2xl font-bold text-orange-400 flex items-center gap-3">
            <span>📊</span>
            <span>Austrian Business Cycle Timeline</span>
          </h3>
          <p className="text-sm text-slate-400 mt-1">
            Historical phases and key economic events from Austrian perspective
          </p>
        </div>
        <div className="flex items-center gap-2 bg-slate-900/50 px-4 py-2 rounded-lg border border-slate-700">
          <div className="w-3 h-3 bg-orange-500 rounded-full animate-pulse" />
          <span className="text-xs text-slate-300 font-semibold">
            Current: {currentPhase.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mb-6 pb-6 border-b border-slate-700">
        {Object.entries(phaseColors).map(([phase, style]) => (
          <div
            key={phase}
            className="flex items-center gap-2 bg-slate-900/50 px-3 py-2 rounded-lg border border-slate-700"
          >
            <span className="text-lg">{style.icon}</span>
            <span className={`text-xs font-semibold ${style.text} capitalize`}>
              {phase}
            </span>
          </div>
        ))}
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Vertical Line */}
        <div className="absolute left-8 top-0 bottom-0 w-1 bg-gradient-to-b from-orange-600 via-slate-700 to-orange-600"></div>

        {/* Events */}
        <div className="space-y-6">
          {timelineEvents.map((event, index) => {
            const style = phaseColors[event.phase];
            const isCurrent = index === currentIndex;

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="relative flex gap-6"
              >
                {/* Timeline Node */}
                <div className="relative z-10">
                  <div
                    className={`w-16 h-16 rounded-full border-4 flex items-center justify-center text-2xl ${
                      isCurrent
                        ? 'bg-orange-600 border-orange-400 animate-pulse shadow-lg shadow-orange-500/50'
                        : `bg-slate-900 ${style.border}`
                    }`}
                  >
                    {style.icon}
                  </div>
                  {/* Date Label */}
                  <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
                    <span className="text-xs font-mono text-slate-500">
                      {event.date}
                    </span>
                  </div>
                </div>

                {/* Event Card */}
                <div
                  className={`flex-1 bg-gradient-to-br ${style.bg} border-2 ${style.border} rounded-xl p-4 ${
                    isCurrent ? 'shadow-2xl ring-2 ring-orange-500/30' : ''
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className={`text-lg font-bold ${style.text}`}>
                      {event.label}
                      {isCurrent && (
                        <span className="ml-2 text-xs bg-orange-600 text-white px-2 py-1 rounded-full">
                          NOW
                        </span>
                      )}
                    </h4>
                    {event.austrianScore !== undefined && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500">Austrian Score:</span>
                        <span
                          className={`text-sm font-bold font-mono ${
                            event.austrianScore >= 7
                              ? 'text-red-400'
                              : event.austrianScore >= 5
                              ? 'text-yellow-400'
                              : 'text-green-400'
                          }`}
                        >
                          {event.austrianScore.toFixed(1)}/10
                        </span>
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    {event.description}
                  </p>

                  {/* Phase Badge */}
                  <div className="mt-3 inline-flex items-center gap-2 bg-slate-900/50 px-3 py-1 rounded-full">
                    <span className="text-xs text-slate-500">Phase:</span>
                    <span className={`text-xs font-bold ${style.text} capitalize`}>
                      {event.phase}
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Austrian Theory Note */}
      <div className="mt-8 pt-6 border-t border-slate-700">
        <div className="bg-gradient-to-r from-yellow-900/20 to-orange-900/20 border-l-4 border-yellow-600 rounded-r-lg p-4">
          <div className="flex items-start gap-3">
            <span className="text-2xl">🏛️</span>
            <div>
              <h4 className="text-sm font-bold text-yellow-400 mb-1">
                Austrian Business Cycle Theory (ABCT)
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                According to Ludwig von Mises and Friedrich Hayek, business cycles are caused by 
                <strong className="text-yellow-400"> artificial credit expansion</strong> from central banks. 
                When interest rates are held below the natural rate, entrepreneurs are misled into 
                making unsustainable investments. The <strong className="text-orange-400">boom</strong> inevitably 
                leads to a <strong className="text-blue-400">bust</strong> as malinvestments are liquidated 
                and the economy restructures toward sustainable production.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CycleTimeline;
