/**
 * 🏛️ AUSTRIAN ECONOMICS × BITCOIN TEMPLE - THEME SYSTEM
 * 
 * A 20-year UX designer's masterpiece combining:
 * - Austrian Economics principles (sound money, time preference, honest accounting)
 * - Bitcoin Maximalist philosophy (21M cap, Proof of Work, Fix the money fix the world)
 * - Cypherpunk heritage (privacy, cryptography, digital sovereignty)
 * 
 * Color Psychology:
 * - Bitcoin Orange (#F7931A): Energy, revolution, hope
 * - Gold (#FFD700): Sound money, value, timelessness
 * - Dark Slate (#1a1a1a): Sophistication, depth, cypherpunk aesthetic
 * - White Marble (#F8F8FF): Purity, clarity, temple architecture
 * 
 * Design Philosophy:
 * "In Code We Trust. In Math We Verify. In Freedom We Believe."
 */

export const templeTheme = {
  // Primary Palette - Bitcoin × Austrian Gold
  colors: {
    // Bitcoin Core
    bitcoinOrange: '#F7931A',
    bitcoinOrangeDark: '#E07A00',
    bitcoinOrangeLight: '#FFB347',
    
    // Austrian Gold (Sound Money)
    austrianGold: '#FFD700',
    austrianGoldDark: '#DAA520',
    austrianGoldLight: '#FFF8DC',
    
    // Temple Architecture
    marbleWhite: '#F8F8FF',
    marbleGray: '#D3D3D3',
    templeStone: '#8B8680',
    
    // Cypherpunk Depths
    cypherpunkBlack: '#0A0A0A',
    cypherpunkDark: '#1a1a1a',
    cypherpunkGray: '#2d2d2d',
    
    // Liberty Green (Austrian School)
    libertyGreen: '#228B22',
    libertyGreenDark: '#006400',
    
    // Alert Colors (Austrian Analysis)
    soundMoney: '#00FF00',      // Green: Healthy economics
    inflation: '#FF6347',        // Tomato: Monetary inflation warning
    boom: '#FFA500',             // Orange: Credit expansion phase
    bust: '#DC143C',             // Crimson: Bust/correction phase
    
    // Proof of Work (Energy Security)
    proofOfWorkGold: '#DAA520',
    energySecurity: '#FF8C00',
    
    // Text Hierarchy
    text: {
      primary: '#F8F8FF',        // Marble white
      secondary: '#D3D3D3',      // Light gray
      tertiary: '#8B8680',       // Stone
      accent: '#F7931A',         // Bitcoin orange
      gold: '#FFD700',           // Austrian gold
      muted: '#666666',
    },
    
    // Backgrounds
    bg: {
      temple: '#0A0A0A',         // Deep cypherpunk black
      panel: '#1a1a1a',          // Dark panel
      card: '#2d2d2d',           // Card background
      hover: '#3a3a3a',          // Hover state
      pillar: '#8B8680',         // Stone pillar accent
      marble: '#F8F8FF',         // Marble accent
    },
    
    // Borders & Dividers
    border: {
      gold: '#FFD700',
      orange: '#F7931A',
      stone: '#8B8680',
      subtle: '#2d2d2d',
      glow: 'rgba(247, 147, 26, 0.3)', // Bitcoin orange glow
    }
  },
  
  // Typography - Elegant yet Readable
  typography: {
    fonts: {
      heading: '"Cinzel", "Playfair Display", Georgia, serif',  // Classical elegance
      body: '"Inter", "SF Pro Display", system-ui, sans-serif',  // Modern readability
      mono: '"JetBrains Mono", "Fira Code", "Courier New", monospace',  // Code/addresses
      quote: '"Cormorant Garamond", Georgia, serif',  // Philosophical quotes
    },
    
    sizes: {
      hero: '3.5rem',      // 56px - Main dashboard title
      h1: '2.5rem',        // 40px - Section headers
      h2: '2rem',          // 32px - Card titles
      h3: '1.5rem',        // 24px - Subsections
      h4: '1.25rem',       // 20px - Card subtitles
      body: '1rem',        // 16px - Body text
      small: '0.875rem',   // 14px - Captions
      tiny: '0.75rem',     // 12px - Footnotes
    },
    
    weights: {
      light: 300,
      regular: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      black: 900,
    },
    
    lineHeights: {
      tight: 1.2,
      normal: 1.5,
      relaxed: 1.75,
      loose: 2,
    }
  },
  
  // Spacing System (Golden Ratio inspired: 1.618)
  spacing: {
    xs: '0.25rem',    // 4px
    sm: '0.5rem',     // 8px
    md: '1rem',       // 16px
    lg: '1.618rem',   // ~26px (golden ratio)
    xl: '2.618rem',   // ~42px
    '2xl': '4.236rem', // ~68px
    '3xl': '6.854rem', // ~110px
  },
  
  // Border Radius (Elegant curves)
  radius: {
    sm: '0.25rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem',
    pill: '9999px',
    temple: '0.125rem', // Slight radius for temple aesthetic
  },
  
  // Shadows (Depth & Elevation)
  shadows: {
    none: 'none',
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
    '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    
    // Special: Bitcoin orange glow
    bitcoinGlow: '0 0 20px rgba(247, 147, 26, 0.5)',
    goldGlow: '0 0 20px rgba(255, 215, 0, 0.4)',
    
    // Temple pillar effect
    pillar: '0 10px 30px rgba(0, 0, 0, 0.3), inset 0 -2px 4px rgba(255, 215, 0, 0.2)',
  },
  
  // Gradients (Austrian × Bitcoin aesthetic)
  gradients: {
    bitcoinSunset: 'linear-gradient(135deg, #F7931A 0%, #FFD700 100%)',
    austrianGold: 'linear-gradient(135deg, #FFD700 0%, #DAA520 100%)',
    cypherpunkDepth: 'linear-gradient(180deg, #0A0A0A 0%, #1a1a1a 100%)',
    templeMarble: 'linear-gradient(135deg, #F8F8FF 0%, #D3D3D3 100%)',
    soundMoney: 'linear-gradient(135deg, #228B22 0%, #006400 100%)',
    proofOfWork: 'linear-gradient(135deg, #FF8C00 0%, #DAA520 100%)',
    
    // Subtle overlays
    overlay: 'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.3) 100%)',
    glassEffect: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
  },
  
  // Animations (Smooth, elegant, purposeful)
  animations: {
    timing: {
      fast: '150ms',
      normal: '300ms',
      slow: '500ms',
      verySlow: '1000ms',
    },
    
    easing: {
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
      temple: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)', // Smooth temple entrance
      bitcoin: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)', // Energetic bitcoin bounce
    },
    
    keyframes: {
      // Bitcoin pulse (for live price updates)
      bitcoinPulse: `
        @keyframes bitcoinPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
      `,
      
      // Gold shimmer (Austrian gold effect)
      goldShimmer: `
        @keyframes goldShimmer {
          0% { background-position: -100% 0; }
          100% { background-position: 200% 0; }
        }
      `,
      
      // Temple pillar rise
      pillarRise: `
        @keyframes pillarRise {
          from { transform: translateY(100%) scaleY(0); }
          to { transform: translateY(0) scaleY(1); }
        }
      `,
      
      // Proof of Work mining animation
      proofOfWork: `
        @keyframes proofOfWork {
          0% { opacity: 0.3; }
          50% { opacity: 1; }
          100% { opacity: 0.3; }
        }
      `,
    }
  },
  
  // Breakpoints (Responsive temple)
  breakpoints: {
    xs: '320px',
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
    '3xl': '1920px',
  },
  
  // Z-index layers (Information hierarchy)
  zIndex: {
    base: 0,
    content: 10,
    card: 20,
    dropdown: 30,
    sticky: 40,
    modal: 50,
    tooltip: 60,
    toast: 70,
    cypherpunkOverlay: 100,
  }
};

/**
 * Theme variants for different states
 */
export const themeVariants = {
  // Cycle Phase Themes
  cyclePhases: {
    monitoring: {
      primary: templeTheme.colors.libertyGreen,
      gradient: templeTheme.gradients.soundMoney,
      icon: '🟢',
      message: 'Sound Money Principles Maintained'
    },
    boom: {
      primary: templeTheme.colors.bitcoinOrange,
      gradient: templeTheme.gradients.bitcoinSunset,
      icon: '🟠',
      message: 'Credit Expansion Detected'
    },
    lateBoom: {
      primary: templeTheme.colors.inflation,
      gradient: 'linear-gradient(135deg, #FFA500 0%, #FF6347 100%)',
      icon: '🔴',
      message: 'Malinvestment Phase - Exercise Caution'
    },
    bust: {
      primary: templeTheme.colors.bust,
      gradient: 'linear-gradient(135deg, #DC143C 0%, #8B0000 100%)',
      icon: '⚠️',
      message: 'Market Correction - Return to Sound Money'
    }
  },
  
  // Bitcoin Sentiment
  bitcoinSentiment: {
    hyperbitcoinization: {
      primary: templeTheme.colors.bitcoinOrange,
      effect: 'glow',
      message: 'In Bitcoin We Trust 🧡⚡'
    },
    accumulation: {
      primary: templeTheme.colors.austrianGold,
      effect: 'shimmer',
      message: 'HODL Strong 💎🙌'
    },
    distribution: {
      primary: templeTheme.colors.templeStone,
      effect: 'subtle',
      message: 'Weak Hands Shaken Out'
    }
  }
};

/**
 * Iconography system - Bitcoin × Austrian × Cypherpunk
 */
export const templeIcons = {
  // Bitcoin Core
  bitcoin: '₿',
  satoshi: '⚡',
  block: '⛓️',
  mining: '⛏️',
  hodl: '💎',
  
  // Austrian Economics
  soundMoney: '🏛️',
  goldStandard: '🥇',
  timePreference: '⏳',
  entrepreneurship: '🚀',
  freeMarket: '🗽',
  
  // Cypherpunk
  encryption: '🔐',
  privacy: '🕵️',
  cryptography: '🔑',
  digitalSovereignty: '👑',
  freedom: '🦅',
  
  // Economic Indicators
  inflation: '📈',
  deflation: '📉',
  liquidation: '💧',
  malinvestment: '⚠️',
  
  // Cycle Phases
  expansion: '🌱',
  boom: '🔥',
  peak: '⚡',
  bust: '❄️',
  recovery: '🌅',
};

/**
 * Accessibility features (WCAG 2.1 AA compliant)
 */
export const accessibility = {
  // Color contrast ratios
  contrastRatios: {
    large: 3,     // Large text (18pt+)
    normal: 4.5,  // Normal text
    enhanced: 7,  // Enhanced (AAA)
  },
  
  // Focus indicators
  focusRing: {
    width: '3px',
    color: templeTheme.colors.bitcoinOrange,
    offset: '2px',
    style: 'solid',
  },
  
  // Reduced motion
  prefersReducedMotion: '@media (prefers-reduced-motion: reduce)',
};

export default templeTheme;
