/**
 * 🔐 CYPHERPUNK HALL OF FAME
 * 
 * An immersive learning module celebrating the legends who made Bitcoin possible.
 * "We are the cypherpunks. We write code." - Eric Hughes
 * 
 * Design: 20-year UX designer craftsmanship
 * Theme: Austrian Economics × Bitcoin Maximalist × Cypherpunk Temple
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cypherpunkLegends, cypherpunkTimeline, iconicQuotes, cypherpunkLibrary } from '../data/cypherpunkLegends';
import { templeTheme } from '../styles/templeTheme';

type TabType = 'legends' | 'timeline' | 'library' | 'quotes';

export const CypherpunkHallOfFame: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('legends');
  const [selectedLegend, setSelectedLegend] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'cryptography' | 'economics' | 'philosophy' | 'code'>('all');

  // Filter legends by category
  const filteredLegends = Object.values(cypherpunkLegends).filter(legend => 
    filter === 'all' || legend.categories.includes(filter)
  );

  return (
    <section 
      className="cypherpunk-hall-of-fame"
      style={{
        background: templeTheme.gradients.cypherpunkDepth,
        borderTop: `2px solid ${templeTheme.colors.bitcoinOrange}`,
        padding: '4rem 2rem',
        marginTop: '4rem'
      }}
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="hall-header"
        style={{ textAlign: 'center', marginBottom: '3rem' }}
      >
        <h2 style={{
          fontSize: templeTheme.typography.sizes.hero,
          fontFamily: templeTheme.typography.fonts.heading,
          background: templeTheme.gradients.bitcoinSunset,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          marginBottom: '1rem'
        }}>
          🔐 Cypherpunk Hall of Fame
        </h2>
        <p style={{
          fontSize: templeTheme.typography.sizes.h4,
          color: templeTheme.colors.text.secondary,
          fontFamily: templeTheme.typography.fonts.quote,
          fontStyle: 'italic',
          maxWidth: '800px',
          margin: '0 auto'
        }}>
          "Privacy is necessary for an open society in the electronic age... Cypherpunks write code."
          <br />
          <span style={{ color: templeTheme.colors.bitcoinOrange, fontSize: '0.9em' }}>
            - Eric Hughes, A Cypherpunk's Manifesto (1993)
          </span>
        </p>
      </motion.div>

      {/* Tab Navigation */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '1rem',
        marginBottom: '3rem',
        flexWrap: 'wrap'
      }}>
        {[
          { id: 'legends' as TabType, label: '👥 The Legends', icon: '🏛️' },
          { id: 'timeline' as TabType, label: '📅 Timeline', icon: '⏳' },
          { id: 'library' as TabType, label: '📚 Library', icon: '📖' },
          { id: 'quotes' as TabType, label: '💬 Quotes', icon: '✨' }
        ].map(tab => (
          <motion.button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            style={{
              background: activeTab === tab.id 
                ? templeTheme.gradients.bitcoinSunset 
                : templeTheme.colors.bg.panel,
              border: `2px solid ${activeTab === tab.id 
                ? templeTheme.colors.bitcoinOrange 
                : templeTheme.colors.border.stone}`,
              color: activeTab === tab.id 
                ? templeTheme.colors.cypherpunkBlack 
                : templeTheme.colors.text.primary,
              padding: '0.75rem 1.5rem',
              borderRadius: templeTheme.radius.lg,
              fontSize: templeTheme.typography.sizes.body,
              fontWeight: templeTheme.typography.weights.semibold,
              fontFamily: templeTheme.typography.fonts.body,
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: activeTab === tab.id ? templeTheme.shadows.bitcoinGlow : 'none'
            }}
          >
            {tab.icon} {tab.label}
          </motion.button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'legends' && <LegendsTab 
            legends={filteredLegends}
            filter={filter}
            setFilter={setFilter}
            selectedLegend={selectedLegend}
            setSelectedLegend={setSelectedLegend}
          />}
          {activeTab === 'timeline' && <TimelineTab />}
          {activeTab === 'library' && <LibraryTab />}
          {activeTab === 'quotes' && <QuotesTab />}
        </motion.div>
      </AnimatePresence>

      {/* Call to Action */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        style={{
          marginTop: '4rem',
          padding: '2rem',
          background: templeTheme.gradients.glassEffect,
          border: `2px solid ${templeTheme.colors.border.gold}`,
          borderRadius: templeTheme.radius.xl,
          textAlign: 'center'
        }}
      >
        <h3 style={{
          fontSize: templeTheme.typography.sizes.h3,
          color: templeTheme.colors.austrianGold,
          marginBottom: '1rem',
          fontFamily: templeTheme.typography.fonts.heading
        }}>
          Join the Revolution
        </h3>
        <p style={{
          color: templeTheme.colors.text.secondary,
          marginBottom: '1.5rem',
          fontSize: templeTheme.typography.sizes.body
        }}>
          Bitcoin is not just technology. It's a continuation of the cypherpunk dream.
          <br />
          Sound money. Privacy. Freedom. Sovereignty.
        </p>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          style={{
            background: templeTheme.gradients.bitcoinSunset,
            color: templeTheme.colors.cypherpunkBlack,
            padding: '1rem 2rem',
            border: 'none',
            borderRadius: templeTheme.radius.pill,
            fontSize: templeTheme.typography.sizes.h4,
            fontWeight: templeTheme.typography.weights.bold,
            cursor: 'pointer',
            boxShadow: templeTheme.shadows.bitcoinGlow,
            fontFamily: templeTheme.typography.fonts.body
          }}
        >
          ₿ Start Your Bitcoin Journey
        </motion.button>
      </motion.div>
    </section>
  );
};

// ==============================================================
// LEGENDS TAB - Interactive Grid of Cypherpunk Pioneers
// ==============================================================

interface LegendsTabProps {
  legends: typeof cypherpunkLegends[keyof typeof cypherpunkLegends][];
  filter: string;
  setFilter: (filter: 'all' | 'cryptography' | 'economics' | 'philosophy' | 'code') => void;
  selectedLegend: string | null;
  setSelectedLegend: (id: string | null) => void;
}

const LegendsTab: React.FC<LegendsTabProps> = ({ legends, filter, setFilter, selectedLegend, setSelectedLegend }) => {
  const categories = ['all', 'cryptography', 'economics', 'philosophy', 'code'] as const;
  
  return (
    <div>
      {/* Category Filter */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '0.5rem',
        marginBottom: '2rem',
        flexWrap: 'wrap'
      }}>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            style={{
              background: filter === cat 
                ? templeTheme.colors.bitcoinOrange 
                : templeTheme.colors.bg.card,
              color: filter === cat 
                ? templeTheme.colors.cypherpunkBlack 
                : templeTheme.colors.text.secondary,
              border: `1px solid ${templeTheme.colors.border.subtle}`,
              padding: '0.5rem 1rem',
              borderRadius: templeTheme.radius.pill,
              fontSize: templeTheme.typography.sizes.small,
              cursor: 'pointer',
              textTransform: 'capitalize',
              transition: 'all 0.2s ease'
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Legends Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '1.5rem',
        maxWidth: '1400px',
        margin: '0 auto'
      }}>
        {legends.map(legend => (
          <LegendCard
            key={legend.id}
            legend={legend}
            isSelected={selectedLegend === legend.id}
            onClick={() => setSelectedLegend(selectedLegend === legend.id ? null : legend.id)}
          />
        ))}
      </div>
    </div>
  );
};

// Legend Card Component
interface LegendCardProps {
  legend: typeof cypherpunkLegends[keyof typeof cypherpunkLegends];
  isSelected: boolean;
  onClick: () => void;
}

const LegendCard: React.FC<LegendCardProps> = ({ legend, isSelected, onClick }) => {
  return (
    <motion.div
      layout
      onClick={onClick}
      whileHover={{ y: -5, boxShadow: templeTheme.shadows.bitcoinGlow }}
      style={{
        background: templeTheme.colors.bg.card,
        border: `2px solid ${isSelected ? templeTheme.colors.bitcoinOrange : templeTheme.colors.border.subtle}`,
        borderRadius: templeTheme.radius.xl,
        padding: '1.5rem',
        cursor: 'pointer',
        transition: 'all 0.3s ease'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
        <div style={{
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          background: templeTheme.gradients.bitcoinSunset,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '2rem'
        }}>
          {legend.id === 'satoshi-nakamoto' ? '₿' : 
           legend.id === 'hal-finney' ? '🕊️' :
           legend.id === 'adam-back' ? '⛏️' :
           legend.id === 'nick-szabo' ? '🏛️' :
           legend.id === 'wei-dai' ? '💰' : '🔐'}
        </div>
        <div style={{ flex: 1 }}>
          <h4 style={{
            fontSize: templeTheme.typography.sizes.h4,
            color: templeTheme.colors.text.primary,
            marginBottom: '0.25rem',
            fontFamily: templeTheme.typography.fonts.heading
          }}>
            {legend.name}
          </h4>
          <p style={{
            fontSize: templeTheme.typography.sizes.small,
            color: templeTheme.colors.bitcoinOrange,
            fontStyle: 'italic'
          }}>
            {legend.title}
          </p>
        </div>
      </div>

      <p style={{
        fontSize: templeTheme.typography.sizes.tiny,
        color: templeTheme.colors.text.tertiary,
        marginBottom: '1rem'
      }}>
        {legend.era}
      </p>

      {/* Key Contributions */}
      <div style={{ marginBottom: '1rem' }}>
        <strong style={{ color: templeTheme.colors.austrianGold, fontSize: templeTheme.typography.sizes.small }}>
          Key Contributions:
        </strong>
        <ul style={{
          listStyle: 'none',
          padding: 0,
          marginTop: '0.5rem'
        }}>
          {legend.contributions.slice(0, isSelected ? undefined : 3).map((contribution, i) => (
            <li key={i} style={{
              fontSize: templeTheme.typography.sizes.tiny,
              color: templeTheme.colors.text.secondary,
              marginBottom: '0.25rem',
              paddingLeft: '1rem',
              position: 'relative'
            }}>
              <span style={{
                position: 'absolute',
                left: 0,
                color: templeTheme.colors.bitcoinOrange
              }}>•</span>
              {contribution}
            </li>
          ))}
        </ul>
      </div>

      {/* Famous Quote */}
      {legend.famousQuotes.length > 0 && (
        <div style={{
          background: templeTheme.gradients.glassEffect,
          padding: '0.75rem',
          borderRadius: templeTheme.radius.md,
          borderLeft: `3px solid ${templeTheme.colors.bitcoinOrange}`,
          marginTop: '1rem'
        }}>
          <p style={{
            fontSize: templeTheme.typography.sizes.small,
            color: templeTheme.colors.text.primary,
            fontFamily: templeTheme.typography.fonts.quote,
            fontStyle: 'italic'
          }}>
            "{legend.famousQuotes[0]}"
          </p>
        </div>
      )}

      {/* Expand indicator */}
      <div style={{
        marginTop: '1rem',
        textAlign: 'center',
        color: templeTheme.colors.bitcoinOrange,
        fontSize: templeTheme.typography.sizes.small
      }}>
        {isSelected ? '▲ Click to collapse' : '▼ Click to learn more'}
      </div>

      {/* Expanded Content */}
      <AnimatePresence>
        {isSelected && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{ marginTop: '1rem' }}
          >
            {/* Timeline */}
            <div style={{ marginBottom: '1rem' }}>
              <strong style={{ color: templeTheme.colors.austrianGold }}>Timeline:</strong>
              <div style={{ marginTop: '0.5rem' }}>
                {legend.timeline.map((event, i) => (
                  <div key={i} style={{
                    fontSize: templeTheme.typography.sizes.tiny,
                    color: templeTheme.colors.text.secondary,
                    marginBottom: '0.5rem',
                    paddingLeft: '1rem',
                    borderLeft: `2px solid ${templeTheme.colors.border.orange}`
                  }}>
                    <span style={{ color: templeTheme.colors.bitcoinOrange, fontWeight: 'bold' }}>
                      {event.year}:
                    </span> {event.event}
                  </div>
                ))}
              </div>
            </div>

            {/* Legacy */}
            <div style={{
              background: templeTheme.colors.bg.hover,
              padding: '1rem',
              borderRadius: templeTheme.radius.md,
              borderTop: `2px solid ${templeTheme.colors.austrianGold}`
            }}>
              <strong style={{ color: templeTheme.colors.austrianGold }}>Legacy:</strong>
              <p style={{
                fontSize: templeTheme.typography.sizes.small,
                color: templeTheme.colors.text.primary,
                marginTop: '0.5rem',
                lineHeight: '1.6'
              }}>
                {legend.legacy}
              </p>
            </div>

            {/* Reading List */}
            {legend.readingList.length > 0 && (
              <div style={{ marginTop: '1rem' }}>
                <strong style={{ color: templeTheme.colors.austrianGold }}>Reading List:</strong>
                <div style={{ marginTop: '0.5rem' }}>
                  {legend.readingList.map((item, i) => (
                    <a
                      key={i}
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'block',
                        fontSize: templeTheme.typography.sizes.tiny,
                        color: templeTheme.colors.bitcoinOrange,
                        textDecoration: 'none',
                        marginBottom: '0.5rem',
                        padding: '0.5rem',
                        background: templeTheme.colors.bg.hover,
                        borderRadius: templeTheme.radius.sm,
                        transition: 'background 0.2s ease'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = templeTheme.colors.bg.panel}
                      onMouseLeave={(e) => e.currentTarget.style.background = templeTheme.colors.bg.hover}
                    >
                      📄 {item.title} ({item.difficulty})
                    </a>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// ==============================================================
// TIMELINE TAB - Visual History of Cypherpunk Movement
// ==============================================================

const TimelineTab: React.FC = () => {
  return (
    <div style={{
      maxWidth: '900px',
      margin: '0 auto',
      position: 'relative',
      paddingLeft: '2rem'
    }}>
      {/* Timeline line */}
      <div style={{
        position: 'absolute',
        left: '0.5rem',
        top: 0,
        bottom: 0,
        width: '2px',
        background: templeTheme.gradients.bitcoinSunset
      }} />

      {cypherpunkTimeline.map((event, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.05 }}
          style={{
            marginBottom: '2rem',
            position: 'relative'
          }}
        >
          {/* Timeline dot */}
          <div style={{
            position: 'absolute',
            left: '-1.75rem',
            top: '0.25rem',
            width: '1rem',
            height: '1rem',
            borderRadius: '50%',
            background: templeTheme.colors.bitcoinOrange,
            border: `3px solid ${templeTheme.colors.bg.temple}`,
            boxShadow: templeTheme.shadows.bitcoinGlow
          }} />

          {/* Event card */}
          <div style={{
            background: templeTheme.colors.bg.card,
            padding: '1rem',
            borderRadius: templeTheme.radius.lg,
            border: `1px solid ${templeTheme.colors.border.subtle}`
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontSize: '1.5rem' }}>{event.icon}</span>
              <div>
                <strong style={{
                  color: templeTheme.colors.bitcoinOrange,
                  fontSize: templeTheme.typography.sizes.h4
                }}>
                  {event.year}
                </strong>
                <p style={{
                  color: templeTheme.colors.text.primary,
                  fontSize: templeTheme.typography.sizes.body,
                  marginTop: '0.25rem'
                }}>
                  {event.event}
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

// ==============================================================
// LIBRARY TAB - Essential Reading Materials
// ==============================================================

const LibraryTab: React.FC = () => {
  return (
    <div style={{
      maxWidth: '1200px',
      margin: '0 auto',
      display: 'grid',
      gap: '2rem'
    }}>
      {/* Manifestos */}
      <LibrarySection
        title="📜 Manifestos - The Philosophy"
        items={cypherpunkLibrary.manifestos}
        icon="📜"
      />

      {/* Technical Papers */}
      <LibrarySection
        title="📄 Technical Papers - The Code"
        items={cypherpunkLibrary.technicalPapers}
        icon="📄"
      />

      {/* Books */}
      <LibrarySection
        title="📚 Books - Deep Dives"
        items={cypherpunkLibrary.books}
        icon="📚"
      />
    </div>
  );
};

interface LibrarySectionProps {
  title: string;
  items: any[];
  icon: string;
}

const LibrarySection: React.FC<LibrarySectionProps> = ({ title, items, icon }) => {
  return (
    <div>
      <h3 style={{
        fontSize: templeTheme.typography.sizes.h3,
        color: templeTheme.colors.austrianGold,
        marginBottom: '1.5rem',
        fontFamily: templeTheme.typography.fonts.heading
      }}>
        {title}
      </h3>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: '1rem'
      }}>
        {items.map((item, i) => (
          <motion.a
            key={i}
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ y: -5, boxShadow: templeTheme.shadows.goldGlow }}
            style={{
              background: templeTheme.colors.bg.card,
              padding: '1.5rem',
              borderRadius: templeTheme.radius.lg,
              border: `2px solid ${templeTheme.colors.border.subtle}`,
              textDecoration: 'none',
              display: 'block',
              transition: 'all 0.3s ease'
            }}
          >
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{icon}</div>
            <h4 style={{
              color: templeTheme.colors.text.primary,
              fontSize: templeTheme.typography.sizes.h4,
              marginBottom: '0.5rem'
            }}>
              {item.title}
            </h4>
            <p style={{
              color: templeTheme.colors.bitcoinOrange,
              fontSize: templeTheme.typography.sizes.small,
              marginBottom: '0.5rem'
            }}>
              {item.author} • {item.year}
            </p>
            <div style={{
              display: 'flex',
              gap: '0.5rem',
              fontSize: templeTheme.typography.sizes.tiny
            }}>
              <span style={{
                background: templeTheme.colors.bg.hover,
                padding: '0.25rem 0.5rem',
                borderRadius: templeTheme.radius.sm,
                color: templeTheme.colors.text.secondary
              }}>
                {item.difficulty}
              </span>
              {item.readTime && (
                <span style={{
                  background: templeTheme.colors.bg.hover,
                  padding: '0.25rem 0.5rem',
                  borderRadius: templeTheme.radius.sm,
                  color: templeTheme.colors.text.secondary
                }}>
                  ⏱️ {item.readTime}
                </span>
              )}
            </div>
          </motion.a>
        ))}
      </div>
    </div>
  );
};

// ==============================================================
// QUOTES TAB - Iconic Cypherpunk Wisdom
// ==============================================================

const QuotesTab: React.FC = () => {
  return (
    <div style={{
      maxWidth: '900px',
      margin: '0 auto',
      display: 'grid',
      gap: '1.5rem'
    }}>
      {iconicQuotes.map((quote, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.1 }}
          style={{
            background: templeTheme.gradients.glassEffect,
            border: `2px solid ${templeTheme.colors.border.gold}`,
            borderRadius: templeTheme.radius.xl,
            padding: '2rem',
            position: 'relative'
          }}
        >
          {/* Quote marks */}
          <div style={{
            position: 'absolute',
            top: '-10px',
            left: '20px',
            fontSize: '3rem',
            color: templeTheme.colors.bitcoinOrange,
            lineHeight: 1
          }}>
            "
          </div>
          
          <p style={{
            fontSize: templeTheme.typography.sizes.h4,
            color: templeTheme.colors.text.primary,
            fontFamily: templeTheme.typography.fonts.quote,
            fontStyle: 'italic',
            marginBottom: '1rem',
            lineHeight: '1.8'
          }}>
            {quote.quote}
          </p>
          
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingTop: '1rem',
            borderTop: `1px solid ${templeTheme.colors.border.subtle}`
          }}>
            <div>
              <p style={{
                color: templeTheme.colors.austrianGold,
                fontWeight: templeTheme.typography.weights.bold,
                fontSize: templeTheme.typography.sizes.body
              }}>
                — {quote.author}
              </p>
              <p style={{
                color: templeTheme.colors.text.tertiary,
                fontSize: templeTheme.typography.sizes.small
              }}>
                {quote.context} ({quote.year})
              </p>
            </div>
            <div style={{ fontSize: '2rem' }}>
              {quote.author === 'Satoshi Nakamoto' ? '₿' : '🔐'}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default CypherpunkHallOfFame;
