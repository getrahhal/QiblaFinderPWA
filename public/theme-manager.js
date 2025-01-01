// Theme Constants
const THEMES = {
    LIGHT: 'light',
    DARK: 'dark',
    SYSTEM: 'system'
};

// Theme icons SVG paths
const THEME_ICONS = {
    system: '<path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707" stroke-linecap="round" stroke-linejoin="round"/>',
    light: '<circle cx="12" cy="12" r="5"/><path d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>',
    dark: '<path d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/>'
};

class ThemeManager {
    constructor() {
        this.currentTheme = localStorage.getItem('theme') || THEMES.SYSTEM;
        this.themeSwitcher = document.getElementById('themeSwitcher');
        this.themeMenu = document.getElementById('themeMenu');
        this.themeIcon = document.getElementById('themeIcon');
        this.themeOptions = document.querySelectorAll('.theme-option');
        this.kaabaIcon = document.getElementById('kaaba-icon');
        this.rahhalLogo = document.getElementById('rahhal-logo');
        
        this.init();
    }

    init() {
        // Initialize theme
        this.setTheme(this.currentTheme, true);
        
        // Event Listeners
        this.setupEventListeners();
        
        // Watch for system theme changes
        this.watchSystemTheme();
    }

    setupEventListeners() {
        // Theme switcher click
        this.themeSwitcher.addEventListener('click', (e) => {
            this.themeMenu.classList.add('visible');
            this.updateActiveTheme();
            e.stopPropagation();
        });

        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!this.themeSwitcher.contains(e.target) && !this.themeMenu.contains(e.target)) {
                this.themeMenu.classList.remove('visible');
            }
        });

        // Theme options click
        this.themeOptions.forEach(option => {
            option.addEventListener('click', () => {
                const newTheme = option.dataset.theme;
                this.setTheme(newTheme);
                this.themeMenu.classList.remove('visible');
            });
        });

        // Handle Escape key to close menu
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.themeMenu.classList.remove('visible');
            }
        });
    }

    setTheme(theme, isInitial = false) {
        const root = document.documentElement;
        const themeText = document.getElementById('themeText');
        this.themeIcon.innerHTML = THEME_ICONS[theme];
        
        // Remove existing theme classes
        root.classList.remove('light-theme', 'dark-theme');
        
        if (theme === THEMES.SYSTEM) {
            const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            this.updateThemeAssets(isDark);
            if (themeText) themeText.textContent = 'System';
            // Let the system preference handle it
            if (!isInitial) {
                root.classList.remove('light-theme', 'dark-theme');
            }
        } else {
            const isDark = theme === THEMES.DARK;
            root.classList.add(`${theme}-theme`);
            this.updateThemeAssets(isDark);
            if (themeText) themeText.textContent = theme.charAt(0).toUpperCase() + theme.slice(1);
        }
        
        this.currentTheme = theme;
        localStorage.setItem('theme', theme);
        this.updateActiveTheme();

        // Dispatch theme change event
        window.dispatchEvent(new CustomEvent('themechange', { 
            detail: { theme, isDark: this.isDarkMode() } 
        }));
    }

    isDarkMode() {
        if (this.currentTheme === THEMES.SYSTEM) {
            return window.matchMedia('(prefers-color-scheme: dark)').matches;
        }
        return this.currentTheme === THEMES.DARK;
    }

    updateThemeAssets(isDark) {
        if (this.kaabaIcon) {
            this.kaabaIcon.src = isDark ? './Assets/Kaaba-Compass-dark.svg' : './Assets/Kaaba-Compass-Icon.svg';
        }
        if (this.rahhalLogo) {
            this.rahhalLogo.src = isDark ? './Assets/rahhal-icon-dark.png' : './Assets/rahhal-icon-light.png';
        }

        // Update meta theme color
        const metaThemeColor = document.querySelector('meta[name="theme-color"]');
        if (metaThemeColor) {
            metaThemeColor.content = isDark ? '#000000' : '#ffffff';
        }
    }

    updateActiveTheme() {
        this.themeOptions.forEach(option => {
            option.classList.toggle('active', option.dataset.theme === this.currentTheme);
        });
    }

    watchSystemTheme() {
        const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleThemeChange = (e) => {
            if (this.currentTheme === THEMES.SYSTEM) {
                this.updateThemeAssets(e.matches);
            }
        };

        // Modern browsers
        if (darkModeMediaQuery.addEventListener) {
            darkModeMediaQuery.addEventListener('change', handleThemeChange);
        } else {
            // Fallback for older browsers
            darkModeMediaQuery.addListener(handleThemeChange);
        }
    }
}

// Initialize theme manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.themeManager = new ThemeManager();
}); 