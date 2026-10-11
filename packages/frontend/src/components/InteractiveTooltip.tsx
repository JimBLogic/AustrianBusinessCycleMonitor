/**
 * Interactive Tooltip System
 * ==========================
 * Makes EVERY element on the dashboard clickable and interactive.
 * Shows contextual information, Austrian theory, related metrics, and data sources.
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

interface TooltipContent {
  metric_key: string;
  current_value: number;
  interpretation: string;
  austrian_theory: {
    concept: string;
    summary: string;
    key_thinkers: string[];
    implications: string;
  };
  related_metrics: Array<{
    key: string;
    value: number;
    label: string;
  }>;
  historical_context: {
    historical_average?: number;
    recent_extremes?: Record<string, number>;
    current_percentile?: number;
  };
  data_sources: Array<{
    name: string;
    url: string;
  }>;
}

interface InteractiveTooltipProps {
  metricKey: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * Interactive Tooltip - wraps any element to make it clickable and show rich info
 */
export function InteractiveTooltip({ metricKey, children, className = '' }: InteractiveTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [content, setContent] = useState<TooltipContent | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchTooltipContent = async () => {
    if (content) return; // Already loaded
    
    setLoading(true);
    try {
      const response = await axios.get(`/api/metric-tooltip/${metricKey}`);
      setContent(response.data);
    } catch (error) {
      console.error(`Failed to fetch tooltip for ${metricKey}:`, error);
    } finally {
      setLoading(false);
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(true);
    fetchTooltipContent();
  };

  return (
    <>
      <div
        onClick={handleClick}
        className={`cursor-pointer transition-all hover:ring-2 hover:ring-orange-500/50 hover:shadow-lg ${className}`}
        title={`Click for detailed information about ${metricKey.replace(/_/g, ' ')}`}
      >
        {children}
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-orange-600/50 rounded-xl max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {loading ? (
                <div className="p-8 text-center">
                  <div className="animate-spin w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                  <p className="text-slate-300">Loading detailed information...</p>
                </div>
              ) : content ? (
                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-6 border-b border-slate-700 pb-4">
                    <div>
                      <h3 className="text-2xl font-bold text-orange-400 mb-1">
                        {content.metric_key.replace(/_/g, ' ').toUpperCase()}
                      </h3>
                      <p className="text-3xl font-bold text-white">
                        {typeof content.current_value === 'number' 
                          ? content.current_value.toFixed(2)
                          : content.current_value}
                      </p>
                    </div>
                    <button
                      onClick={() => setIsOpen(false)}
                      className="text-slate-400 hover:text-white text-3xl leading-none w-10 h-10 flex items-center justify-center rounded-lg hover:bg-slate-700/50 transition-all"
                    >
                      ×
                    </button>
                  </div>

                  {/* Current Interpretation */}
                  <div className="mb-6 bg-slate-900/50 rounded-lg p-4 border border-slate-700">
                    <h4 className="text-sm font-semibold text-blue-400 mb-2 flex items-center gap-2">
                      <span>📊</span> CURRENT INTERPRETATION
                    </h4>
                    <p className="text-slate-300 text-sm leading-relaxed">
                      {content.interpretation}
                    </p>
                  </div>

                  {/* Austrian Theory Context */}
                  {content.austrian_theory && (
                    <div className="mb-6 bg-gradient-to-br from-amber-900/20 to-slate-900/50 rounded-lg p-4 border border-amber-600/30">
                      <h4 className="text-sm font-semibold text-amber-400 mb-2 flex items-center gap-2">
                        <span>🏛️</span> AUSTRIAN ECONOMICS THEORY
                      </h4>
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs text-amber-300 font-semibold mb-1">Concept:</p>
                          <p className="text-slate-300 text-sm">{content.austrian_theory.concept}</p>
                        </div>
                        <div>
                          <p className="text-xs text-amber-300 font-semibold mb-1">Summary:</p>
                          <p className="text-slate-300 text-sm leading-relaxed">{content.austrian_theory.summary}</p>
                        </div>
                        <div>
                          <p className="text-xs text-amber-300 font-semibold mb-1">Key Thinkers:</p>
                          <p className="text-slate-300 text-sm">
                            {content.austrian_theory.key_thinkers.join(', ')}
                          </p>
                        </div>
                        <div className="bg-amber-950/30 rounded p-3 border-l-2 border-amber-500">
                          <p className="text-xs text-amber-300 font-semibold mb-1">Implications:</p>
                          <p className="text-slate-300 text-sm leading-relaxed italic">
                            {content.austrian_theory.implications}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Related Metrics */}
                  {content.related_metrics && content.related_metrics.length > 0 && (
                    <div className="mb-6 bg-slate-900/50 rounded-lg p-4 border border-slate-700">
                      <h4 className="text-sm font-semibold text-purple-400 mb-3 flex items-center gap-2">
                        <span>🔗</span> RELATED METRICS
                      </h4>
                      <div className="grid grid-cols-2 gap-3">
                        {content.related_metrics.map((metric) => (
                          <div
                            key={metric.key}
                            className="bg-slate-800/50 rounded p-3 border border-slate-600 hover:border-purple-500/50 transition-all cursor-pointer"
                            onClick={() => {
                              // Could open a new tooltip for this metric
                              setIsOpen(false);
                              setTimeout(() => {
                                // Trigger opening of related metric
                              }, 100);
                            }}
                          >
                            <p className="text-xs text-slate-400 mb-1">{metric.label}</p>
                            <p className="text-lg font-bold text-white">
                              {typeof metric.value === 'number' ? metric.value.toFixed(2) : metric.value}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Historical Context */}
                  {content.historical_context && content.historical_context.historical_average && (
                    <div className="mb-6 bg-slate-900/50 rounded-lg p-4 border border-slate-700">
                      <h4 className="text-sm font-semibold text-green-400 mb-3 flex items-center gap-2">
                        <span>📈</span> HISTORICAL CONTEXT
                      </h4>
                      <div className="space-y-2 text-sm">
                        {content.historical_context.historical_average && (
                          <div className="flex justify-between">
                            <span className="text-slate-400">Historical Average:</span>
                            <span className="text-white font-semibold">
                              {content.historical_context.historical_average.toFixed(2)}
                            </span>
                          </div>
                        )}
                        {content.historical_context.current_percentile && (
                          <div className="flex justify-between">
                            <span className="text-slate-400">Current Percentile:</span>
                            <span className="text-white font-semibold">
                              {content.historical_context.current_percentile.toFixed(1)}th
                            </span>
                          </div>
                        )}
                        {content.historical_context.recent_extremes && (
                          <div className="mt-3">
                            <p className="text-xs text-slate-400 mb-2">Recent Extremes:</p>
                            <div className="space-y-1">
                              {Object.entries(content.historical_context.recent_extremes).map(([event, value]) => (
                                <div key={event} className="flex justify-between text-xs">
                                  <span className="text-slate-500">{event.replace(/_/g, ' ')}:</span>
                                  <span className="text-slate-300">{value.toFixed(2)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Data Sources */}
                  {content.data_sources && content.data_sources.length > 0 && (
                    <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
                      <h4 className="text-sm font-semibold text-blue-400 mb-3 flex items-center gap-2">
                        <span>🔗</span> DATA SOURCES
                      </h4>
                      <div className="space-y-2">
                        {content.data_sources.map((source, idx) => (
                          <a
                            key={idx}
                            href={source.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-sm text-blue-300 hover:text-blue-200 transition-all group"
                          >
                            <svg className="w-4 h-4 flex-shrink-0 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                            <span>{source.name}</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Footer */}
                  <div className="mt-6 pt-4 border-t border-slate-700 flex justify-between items-center">
                    <p className="text-xs text-slate-500 italic">
                      Click related metrics to explore connections
                    </p>
                    <button
                      onClick={() => setIsOpen(false)}
                      className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all"
                    >
                      Close
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center">
                  <p className="text-red-400 mb-2">Failed to load content</p>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="text-slate-400 hover:text-white text-sm"
                  >
                    Close
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/**
 * Quick Info Badge - small interactive icon that can be added anywhere
 */
interface QuickInfoBadgeProps {
  metricKey: string;
  className?: string;
}

export function QuickInfoBadge({ metricKey, className = '' }: QuickInfoBadgeProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [content, setContent] = useState<TooltipContent | null>(null);

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(true);
    
    if (!content) {
      try {
        const response = await axios.get(`/api/metric-tooltip/${metricKey}`);
        setContent(response.data);
      } catch (error) {
        console.error(`Failed to fetch tooltip for ${metricKey}:`, error);
      }
    }
  };

  return (
    <>
      <button
        onClick={handleClick}
        className={`inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-500/20 hover:bg-blue-500/40 text-blue-300 hover:text-blue-100 transition-all duration-200 transform hover:scale-110 ${className}`}
        title="Click for detailed information"
      >
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      <AnimatePresence>
        {isOpen && content && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setIsOpen(false)}
          >
            <InteractiveTooltip metricKey={metricKey}>
              <div />
            </InteractiveTooltip>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
