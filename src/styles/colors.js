export const Colors = {
  light: {
    background: '#E8EDF3',
    cardBackground: '#FFFFFF',
    primaryText: '#00386D',
    secondaryText: '#4A5568',
    primary: '#6699CC',
    primaryGradient: ['#6699CC', '#4A7BA8'],
    accent: '#F4A261',
    success: '#10B981',
    successLight: 'rgba(16,185,129,0.1)',
    danger: '#EF4444',
    dangerLight: 'rgba(239,68,68,0.1)',
    warning: '#F59E0B',
    warningLight: 'rgba(245,158,11,0.1)',
    border: '#E2E8F0',
    white: '#FFFFFF',
    inputBackground: '#F8FAFC',
    inputBorder: '#E2E8F0',
    placeholder: '#94A3B8',
    iconBackground: 'rgba(102,153,204,0.08)',
    fabShadow: 'rgba(102,153,204,0.4)',
    navBackground: '#FFFFFF',
    navBorder: '#E2E8F0',
    activeNavBg: 'rgba(102,153,204,0.06)',
    skeletonBase: '#F1F5F9',
    skeletonHighlight: '#E2E8F0',
    overlay: 'rgba(15,23,42,0.6)',
  },
};

export const theme = Colors.light;

export const Typography = {
  heading: { fontFamily: 'SpaceGrotesk-Bold', fontWeight: '900' },
  dataValue: { fontFamily: 'SpaceGrotesk-Bold', fontWeight: '800' },
  label: { fontFamily: 'Inter-Bold', fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  body: { fontFamily: 'Inter-Regular', fontWeight: '500' },
  bodyBold: { fontFamily: 'Inter-SemiBold', fontWeight: '600' },
};

export const Spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 9999,
};

export const TouchTargets = {
  minimum: 44,
};

export const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 5,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 10,
  },
};