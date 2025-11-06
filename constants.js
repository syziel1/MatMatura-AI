/**
 * Centralized constants for MatMatura-AI application
 * Zawiera wszystkie stałe konfiguracyjne używane w aplikacji
 */

const CONSTANTS = {
    // Study plan configuration
    WEEKS_TOTAL: 10,
    DAYS_PER_WEEK: 7,
    
    // Progress weights
    THEORY_PROGRESS_WEIGHT: 20, // 20% for reading theory
    QUIZ_PROGRESS_WEIGHT: 80,   // 80% for quiz completion
    
    // LocalStorage keys
    STORAGE_KEYS: {
        USER_CONFIG: 'maturaUserConfig',
        PROGRESS_DATA: 'maturaProgress',
        SELECTED_LEVEL: 'selectedLevel',
        THEME_PREFERENCE: 'themePreference'
    },
    
    // Exam levels
    LEVELS: {
        PODSTAWOWY: 'pp',
        ROZSZERZONY: 'pr'
    },
    
    // Week topics (for both levels)
    WEEK_TOPICS: [
        "Liczby Rzeczywiste i Zbiory",           // Week 1
        "Wyrażenia Algebraiczne i Funkcje",      // Week 2
        "Funkcja Liniowa i Kwadratowa",          // Week 3
        "Wielomiany i Funkcje Wymierne",         // Week 4
        "Funkcje Wykładnicze i Logarytmiczne",   // Week 5
        "Trygonometria",                         // Week 6
        "Ciągi Liczbowe",                        // Week 7
        "Planimetria",                           // Week 8
        "Geometria Analityczna i Stereometria",  // Week 9
        "Statystyka i Rachunek Prawdopodobieństwa" // Week 10
    ],
    
    // Progress bar color thresholds
    PROGRESS_COLORS: {
        DARK_GREEN: { threshold: 95, class: 'dark-green', color: '#198754' },
        GREEN: { threshold: 85, class: 'green', color: '#28a745' },
        LIGHT_GREEN: { threshold: 70, class: 'light-green', color: '#6fbf73' },
        YELLOW: { threshold: 50, class: 'yellow', color: '#ffc107' },
        ORANGE: { threshold: 30, class: 'orange', color: '#fd7e14' },
        RED: { threshold: 0, class: 'red', color: '#dc3545' }
    },
    
    // MathJax configuration
    MATHJAX: {
        MAX_LOAD_ATTEMPTS: 60,
        CHECK_INTERVAL_MS: 100,
        TIMEOUT_MS: 6000
    },
    
    // Date configuration
    EXAM_MONTH: 4, // May (0-indexed)
    EXAM_DAY_OF_WEEK: 2, // Tuesday
    EXAM_WEEK_NUMBER: 2, // Second Tuesday of May
    
    // Validation rules
    VALIDATION: {
        MIN_NAME_LENGTH: 2,
        MAX_NAME_LENGTH: 50,
        MIN_YEAR_OFFSET: 0, // Current year
        MAX_YEAR_OFFSET: 2  // Two years ahead
    },
    
    // UI Configuration
    UI: {
        ANIMATION_DURATION_MS: 300,
        DEBOUNCE_DELAY_MS: 300,
        TOAST_DURATION_MS: 3000
    }
};

// Freeze the object to prevent modifications
Object.freeze(CONSTANTS);

// Export for module usage (if using modules in the future)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONSTANTS;
}
