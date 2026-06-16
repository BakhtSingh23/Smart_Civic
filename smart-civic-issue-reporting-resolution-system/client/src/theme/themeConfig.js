export const themeConfig = {
  // Light Mode Colors
  light: {
    primary: {
      blue: '#1E40AF',
      green: '#059669',
    },
    accent: {
      amber: '#F59E0B',
    },
    secondary: {
      purple: '#7C3AED',
      cyan: '#06B6D4',
    },
    neutral: {
      white: '#FFFFFF',
      offWhite: '#F8FAFC',
      lightGray: '#F1F5F9',
      mediumGray: '#CBD5E1',
      darkGray: '#475569',
      charcoal: '#1E293B',
    },
    semantic: {
      success: '#10B981',
      warning: '#F97316',
      error: '#EF4444',
      info: '#3B82F6',
    },
    gradient: {
      primary: 'linear-gradient(135deg, #1E40AF 0%, #7C3AED 100%)',
      civic: 'linear-gradient(135deg, #1E40AF 0%, #059669 100%)',
      warm: 'linear-gradient(135deg, #F59E0B 0%, #F97316 100%)',
      cool: 'linear-gradient(135deg, #06B6D4 0%, #3B82F6 100%)',
      premium: 'linear-gradient(135deg, #7C3AED 0%, #3B82F6 50%, #06B6D4 100%)'
    }
  },

  // Dark Mode Colors
  dark: {
    background: {
      primary: '#050A14',
      secondary: '#0F172A',
      tertiary: '#1E2947',
      hover: '#293555',
    },
    text: {
      primary: '#F0F9FF',
      secondary: '#CBD5E1',
      tertiary: '#94A3B8',
    },
    accent: {
      primaryBlue: '#3B82F6',
      primaryGreen: '#10B981',
      amber: '#FBBF24',
      secondary: '#A78BFA',
    },
    gradient: {
      primary: 'linear-gradient(135deg, #3B82F6 0%, #A78BFA 100%)',
      civic: 'linear-gradient(135deg, #3B82F6 0%, #10B981 100%)',
      warm: 'linear-gradient(135deg, #FBBF24 0%, #FB923C 100%)',
      cool: 'linear-gradient(135deg, #22D3EE 0%, #3B82F6 100%)'
    }
  },

  // Typography
  typography: {
    fontFamily: {
      display: "'Inter', sans-serif",
      body: "'Inter', sans-serif",
      mono: "'Fira Code', monospace",
    },
    sizes: {
      h1: { size: '3.5rem', weight: 800, letterSpacing: '-0.02em', lineHeight: 1.2, color: '#F0F9FF' },
      h2: { size: '2.5rem', weight: 700, letterSpacing: '-0.01em', lineHeight: 1.2, color: '#F0F9FF' },
      h3: { size: '2rem', weight: 700, lineHeight: 1.2, color: '#F0F9FF' },
      h4: { size: '1.5rem', weight: 600, lineHeight: 1.2, color: '#CBD5E1' },
      h5: { size: '1.25rem', weight: 600, lineHeight: 1.2, color: '#CBD5E1' },
      h6: { size: '1rem', weight: 600, lineHeight: 1.2, color: '#94A3B8' },
      bodyLg: { size: '1.125rem', weight: 400, lineHeight: 1.6, color: '#CBD5E1' },
      body: { size: '1rem', weight: 400, lineHeight: 1.6, color: '#CBD5E1' },
      bodySm: { size: '0.875rem', weight: 400, lineHeight: 1.5, color: '#94A3B8' },
      label: { size: '0.875rem', weight: 500, letterSpacing: '0.01em', lineHeight: 1.5, color: '#CBD5E1' },
      caption: { size: '0.75rem', weight: 400, opacity: 0.7, lineHeight: 1.5, color: '#94A3B8' },
    }
  }
};
