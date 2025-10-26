/**
 * Situation Overview Panel
 * =========================
 * Prominent AI-generated overview of current economic situation.
 * Provides actionable insights, warnings, opportunities, and specific recommendations.
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';

interface Warning {
  severity: string;
  title: string;
  message: string;
  action: string;
}

interface Opportunity {
  title: string;
  description: string;
  assets: string[];
}

interface Action {
  category: string;
  priority: string;
  recommendations: string[];
}

interface KeyCorrelation {
  severity?: string;
  description?: string;
  implication?: string;
}

interface TimelineContext {
  current_phase: string;
  phase_description: string;
  estimated_duration: string;
  next_phase: string;
  key_triggers: string[];
}

interface SituationOverview {
  headline: string;
  narrative: string;
  risk_level: string;
  risk_score: number;
  cycle_phase: string;
  warnings: Warning[];
  opportunities: Opportunity[];
  recommended_actions: Action[];
  timeline_context: TimelineContext;
  key_correlations: Record<string, KeyCorrelation | null>;
  last_updated: string;
}

export function SituationOverviewPanel() {
  const [overview, setOverview] = useState<SituationOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(true);

  useEffect(() => {
    fetchOverview();
    // Refresh every 5 minutes
    const interval = setInterval(fetchOverview, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchOverview = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/situation-overview');
      setOverview(response.data);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch situation overview:', err);
      setError('Failed to load situation overview');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !overview) {
    return (
      <div className="bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 border-2 border-purple-600/50 rounded-xl p-8 mb-8 shadow-2xl">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-700 rounded w-3/4"></div>
          <div className="h-4 bg-slate-700 rounded w-full"></div>
          <div className="h-4 bg-slate-700 rounded w-5/6"></div>
        </div>
      </div>
    );
  }

  if (error && !overview) {
    return (
      <div className="bg-gradient-to-br from-slate-800 to-red-900/20 border-2 border-red-600/50 rounded-xl p-6 mb-8">
        <p className="text-red-400">⚠️ {error}</p>
        <button
          onClick={fetchOverview}
          className="mt-3 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm transition-all"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!overview) return null;

  const getRiskColor = () => {
    switch (overview.risk_level) {
      case 'extreme': return 'from-red-900 to-red-800 border-red-500';
      case 'high': return 'from-orange-900 to-red-900 border-orange-500';
      case 'elevated': return 'from-yellow-900 to-orange-900 border-yellow-500';
      case 'moderate': return 'from-blue-900 to-slate-900 border-blue-500';
      case 'low': return 'from-green-900 to-slate-900 border-green-500';
      default: return 'from-slate-800 to-slate-900 border-slate-600';
    }
  };

  const getRiskEmoji = () => {
    switch (overview.risk_level) {
      case 'extreme': return '🚨';
      case 'high': return '⚠️';
      case 'elevated': return '🟡';
      case 'moderate': return '🔵';
      case 'low': return '✅';
      default: return '📊';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-gradient-to-br ${getRiskColor()} border-2 rounded-xl shadow-2xl mb-8 overflow-hidden`}
    >
      {/* Header */}
      <div
        className="p-6 cursor-pointer hover:bg-white/5 transition-all"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-4xl">{getRiskEmoji()}</span>
              <h2 className="text-2xl font-bold text-white">
                {overview.headline}
              </h2>
            </div>
            <div className="flex items-center gap-4 text-sm text-slate-300">
              <span className="flex items-center gap-1">
                <span className="font-semibold text-white">{overview.risk_score.toFixed(1)}/10</span> Risk Score
              </span>
              <span>•</span>
              <span className="capitalize">{overview.cycle_phase?.replace(/_/g, ' ') || 'unknown'}</span>
              <span>•</span>
              <span className="text-xs text-slate-400">
                Updated {new Date(overview.last_updated).toLocaleTimeString()}
              </span>
            </div>
          </div>
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </motion.div>
        </div>
      </div>

      {/* Expandable Content */}
      <motion.div
        initial={false}
        animate={{ height: isExpanded ? 'auto' : 0 }}
        transition={{ duration: 0.3 }}
        className="overflow-hidden"
      >
        <div className="p-6 pt-0 space-y-6">
          {/* Narrative */}
          <div className="bg-black/20 rounded-lg p-4 border border-white/10">
            <h3 className="text-sm font-semibold text-orange-400 mb-2 flex items-center gap-2">
              <span>📖</span> SITUATION ANALYSIS
            </h3>
            <p className="text-slate-200 text-sm leading-relaxed">
              {overview.narrative}
            </p>
          </div>

          {/* Warnings */}
          {overview.warnings && overview.warnings.length > 0 && (
            <div className="bg-red-950/30 rounded-lg p-4 border border-red-500/30">
              <h3 className="text-sm font-semibold text-red-400 mb-3 flex items-center gap-2">
                <span>⚠️</span> WARNINGS ({overview.warnings.length})
              </h3>
              <div className="space-y-3">
                {overview.warnings.map((warning, idx) => (
                  <div key={idx} className="bg-black/20 rounded p-3 border border-red-500/20">
                    <div className="flex items-start gap-2 mb-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                        warning.severity === 'extreme' ? 'bg-red-600 text-white' :
                        warning.severity === 'high' ? 'bg-orange-600 text-white' :
                        'bg-yellow-600 text-black'
                      }`}>
                        {warning.severity.toUpperCase()}
                      </span>
                      <h4 className="text-sm font-semibold text-red-300 flex-1">{warning.title}</h4>
                    </div>
                    <p className="text-xs text-slate-300 mb-2">{warning.message}</p>
                    <p className="text-xs text-red-200 italic">→ {warning.action}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Key Correlations */}
          {overview.key_correlations && Object.values(overview.key_correlations).some(c => c !== null) && (
            <div className="bg-purple-950/30 rounded-lg p-4 border border-purple-500/30">
              <h3 className="text-sm font-semibold text-purple-400 mb-3 flex items-center gap-2">
                <span>🔗</span> KEY CORRELATIONS DETECTED
              </h3>
              <div className="space-y-2">
                {Object.entries(overview.key_correlations).map(([key, corr]) => {
                  if (!corr) return null;
                  return (
                    <div key={key} className="bg-black/20 rounded p-3 border border-purple-500/20">
                      <p className="text-xs text-purple-300 font-semibold mb-1">
                        {key.replace(/_/g, ' ').toUpperCase()}
                      </p>
                      <p className="text-xs text-slate-300">{corr.description}</p>
                      {corr.implication && (
                        <p className="text-xs text-purple-200 mt-1 italic">→ {corr.implication}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Recommended Actions */}
          {overview.recommended_actions && overview.recommended_actions.length > 0 && (
            <div className="bg-green-950/30 rounded-lg p-4 border border-green-500/30">
              <h3 className="text-sm font-semibold text-green-400 mb-3 flex items-center gap-2">
                <span>✅</span> RECOMMENDED ACTIONS
              </h3>
              <div className="space-y-3">
                {overview.recommended_actions.map((action, idx) => (
                  <div key={idx} className="bg-black/20 rounded p-3 border border-green-500/20">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="text-sm font-semibold text-green-300">{action.category}</h4>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                        action.priority === 'immediate' ? 'bg-red-600 text-white' :
                        action.priority === 'high' ? 'bg-orange-600 text-white' :
                        'bg-blue-600 text-white'
                      }`}>
                        {action.priority.toUpperCase()}
                      </span>
                    </div>
                    <ul className="space-y-1">
                      {action.recommendations.map((rec, ridx) => (
                        <li key={ridx} className="text-xs text-slate-300 flex items-start gap-2">
                          <span className="text-green-400 mt-0.5">•</span>
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Opportunities */}
          {overview.opportunities && overview.opportunities.length > 0 && (
            <div className="bg-blue-950/30 rounded-lg p-4 border border-blue-500/30">
              <h3 className="text-sm font-semibold text-blue-400 mb-3 flex items-center gap-2">
                <span>💎</span> OPPORTUNITIES
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {overview.opportunities.map((opp, idx) => (
                  <div key={idx} className="bg-black/20 rounded p-3 border border-blue-500/20">
                    <h4 className="text-sm font-semibold text-blue-300 mb-1">{opp.title}</h4>
                    <p className="text-xs text-slate-300 mb-2">{opp.description}</p>
                    <div className="flex flex-wrap gap-1">
                      {opp.assets.map((asset, aidx) => (
                        <span
                          key={aidx}
                          className="text-xs bg-blue-600/20 text-blue-300 px-2 py-0.5 rounded-full"
                        >
                          {asset}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Timeline */}
          {overview.timeline_context && (
            <div className="bg-slate-950/50 rounded-lg p-4 border border-slate-600">
              <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                <span>⏱️</span> CYCLE TIMELINE
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Current Phase:</span>
                  <span className="text-white font-semibold capitalize">
                    {overview.timeline_context?.current_phase?.replace(/_/g, ' ') || 'unknown'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Estimated Duration:</span>
                  <span className="text-white font-semibold">
                    {overview.timeline_context.estimated_duration}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Next Phase:</span>
                  <span className="text-white font-semibold capitalize">
                    {overview.timeline_context?.next_phase?.replace(/_/g, ' ') || 'unknown'}
                  </span>
                </div>
                <div className="mt-3 pt-3 border-t border-slate-700">
                  <p className="text-xs text-slate-400 mb-2">Key Triggers to Watch:</p>
                  <ul className="space-y-1">
                    {overview.timeline_context.key_triggers.map((trigger, idx) => (
                      <li key={idx} className="text-xs text-slate-300 flex items-start gap-2">
                        <span className="text-orange-400 mt-0.5">▸</span>
                        <span>{trigger}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Refresh Button */}
          <div className="flex justify-end">
            <button
              onClick={(e) => {
                e.stopPropagation();
                fetchOverview();
              }}
              disabled={loading}
              className="bg-orange-600 hover:bg-orange-700 disabled:bg-slate-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                  <span>Updating...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>Refresh Analysis</span>
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
