export const DesignTokens = {
  colors: {
    primary: '#2563EB',
    primaryLight: '#2563EB15',
    secondary: '#F97316',
    secondaryLight: '#F9731615',
    tertiary: '#BC4800',
    dark: '#0F172A',
    medium: '#757681',
    border: '#E2E8F0',
    background: '#F8FAFC',
    surface: '#FFFFFF',
    success: '#10B981',
    successLight: '#10B98115',
    danger: '#EF4444',
    dangerLight: '#EF444415',
    warning: '#F59E0B',
    white: '#FFFFFF',
    overlay: 'rgba(15,23,42,0.5)',
  },
  typography: {
    display: { fontFamily: 'SpaceGrotesk-Bold', fontWeight: '700' },
    displayBold: { fontFamily: 'SpaceGrotesk-Bold', fontWeight: '800' },
    metrics: { fontFamily: 'SpaceGrotesk-Bold', fontWeight: '700' },
    body: { fontFamily: 'Inter-Regular', fontWeight: '400' },
    bodyMedium: { fontFamily: 'Inter-Medium', fontWeight: '500' },
    bodyBold: { fontFamily: 'Inter-SemiBold', fontWeight: '600' },
    label: { fontFamily: 'Inter-Bold', fontWeight: '700' },
  },
  radius: {
    card: 16,
    input: 12,
    button: 12,
    modal: 24,
    pill: 999,
  },
  spacing: {
    xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32,
  },
  shadows: {
    sm: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 2, elevation: 1 },
    md: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 3 },
    lg: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 5 },
  },
};

export const t = DesignTokens;