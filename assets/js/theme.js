// ============================================
// BUWAD Theme Manager - Simplified
// Works with header toggle button
// ============================================

const ThemeManager = {
    currentTheme: localStorage.getItem('buwad_theme') || 'system',
    
    init: function() {
        this.applyTheme(this.currentTheme);
        this.setupListeners();
    },
    
    applyTheme: function(theme) {
        const html = document.documentElement;
        const icon = document.getElementById('themeIcon');
        
        if (theme === 'light') {
            html.classList.remove('dark');
            if (icon) icon.className = 'fas fa-moon';
        } else if (theme === 'dark') {
            html.classList.add('dark');
            if (icon) icon.className = 'fas fa-sun';
        } else if (theme === 'system') {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            if (prefersDark) {
                html.classList.add('dark');
                if (icon) icon.className = 'fas fa-sun';
            } else {
                html.classList.remove('dark');
                if (icon) icon.className = 'fas fa-moon';
            }
        }
        
        this.updateSettingsButtons(theme);
    },
    
    setTheme: function(theme) {
        this.currentTheme = theme;
        localStorage.setItem('buwad_theme', theme);
        this.applyTheme(theme);
    },
    
    updateSettingsButtons: function(activeTheme) {
        const lightBtn = document.getElementById('themeLightBtn');
        const darkBtn = document.getElementById('themeDarkBtn');
        const systemBtn = document.getElementById('themeSystemBtn');
        
        if (lightBtn && darkBtn && systemBtn) {
            lightBtn.classList.remove('active');
            darkBtn.classList.remove('active');
            systemBtn.classList.remove('active');
            
            if (activeTheme === 'light') lightBtn.classList.add('active');
            else if (activeTheme === 'dark') darkBtn.classList.add('active');
            else if (activeTheme === 'system') systemBtn.classList.add('active');
        }
    },
    
    setupListeners: function() {
        const self = this;
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function(e) {
            if (self.currentTheme === 'system') {
                self.applyTheme('system');
            }
        });
    }
};

ThemeManager.init();
window.ThemeManager = ThemeManager;
window.setTheme = function(theme) { ThemeManager.setTheme(theme); };
window.toggleTheme = function() {
    const isDark = document.documentElement.classList.contains('dark');
    ThemeManager.setTheme(isDark ? 'light' : 'dark');
};