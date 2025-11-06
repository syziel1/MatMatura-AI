/**
 * Utility functions for MatMatura-AI
 * Wspólne funkcje pomocnicze używane w całej aplikacji
 */

const Utils = {
    /**
     * Oblicza datę matury (drugi wtorek maja danego roku)
     * @param {number} year - Rok matury
     * @returns {Date} Obiekt Date z datą matury
     */
    calculateMaturaDate(year) {
        const mayFirst = new Date(year, CONSTANTS.EXAM_MONTH, 1);
        let dayOfWeek = mayFirst.getDay(); // 0 = Niedziela, 1 = Pon, ..., 6 = Sobota

        // Znajdź pierwszy wtorek (dayOfWeek === 2)
        let firstTuesdayDate = 1;
        if (dayOfWeek === 0) { // Niedziela
            firstTuesdayDate = 3;
        } else if (dayOfWeek === 1) { // Poniedziałek
            firstTuesdayDate = 2;
        } else if (dayOfWeek === 2) { // Wtorek
            firstTuesdayDate = 1;
        } else { // Środa-Sobota
            firstTuesdayDate = 1 + (7 - dayOfWeek) + 2;
        }

        // Drugi wtorek to 7 dni później
        const secondTuesdayDate = firstTuesdayDate + 7;

        return new Date(year, CONSTANTS.EXAM_MONTH, secondTuesdayDate);
    },

    /**
     * Formatuje datę do formatu YYYY-MM-DD
     * @param {Date} date - Obiekt Date
     * @returns {string} Data w formacie YYYY-MM-DD
     */
    formatDateToISO(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    },

    /**
     * Oblicza liczbę dni między dwiema datami
     * @param {Date} date1 - Pierwsza data
     * @param {Date} date2 - Druga data
     * @returns {number} Liczba dni (może być ujemna)
     */
    daysBetween(date1, date2) {
        const oneDay = 1000 * 60 * 60 * 24;
        const diffTime = date2.getTime() - date1.getTime();
        return Math.ceil(diffTime / oneDay);
    },

    /**
     * Normalizuje datę do początku dnia (00:00:00)
     * @param {Date} date - Data do normalizacji
     * @returns {Date} Znormalizowana data
     */
    normalizeDate(date) {
        const normalized = new Date(date);
        normalized.setHours(0, 0, 0, 0);
        return normalized;
    },

    /**
     * Pobiera nazwę tematu dla danego tygodnia
     * @param {number} weekNumber - Numer tygodnia (1-10)
     * @returns {string} Nazwa tematu
     */
    getTopicForWeek(weekNumber) {
        if (weekNumber >= 1 && weekNumber <= CONSTANTS.WEEK_TOPICS.length) {
            return CONSTANTS.WEEK_TOPICS[weekNumber - 1];
        }
        return "Nieznany temat";
    },

    /**
     * Pobiera pełny tytuł dla tygodnia
     * @param {number} weekNumber - Numer tygodnia
     * @param {string} level - Poziom ('pp' lub 'pr')
     * @returns {string} Pełny tytuł
     */
    getWeekTitle(weekNumber, level = null) {
        const topic = this.getTopicForWeek(weekNumber);
        let title = `Tydzień ${weekNumber}: ${topic}`;
        if (level) {
            title += ` (${level.toUpperCase()})`;
        }
        return title;
    },

    /**
     * Oblicza bieżący tydzień nauki na podstawie daty matury
     * @param {Date} maturaDate - Data matury
     * @param {Date} currentDate - Bieżąca data (opcjonalnie, domyślnie dziś)
     * @returns {number} Numer bieżącego tygodnia (0 = przed startem, 11+ = po maturze)
     */
    getCurrentWeek(maturaDate, currentDate = new Date()) {
        const today = this.normalizeDate(currentDate);
        const matura = this.normalizeDate(maturaDate);
        
        const totalStudyDays = CONSTANTS.WEEKS_TOTAL * CONSTANTS.DAYS_PER_WEEK;
        const studyStartDate = new Date(matura);
        studyStartDate.setDate(matura.getDate() - totalStudyDays);

        if (today < studyStartDate) {
            return 0; // Przed rozpoczęciem planu
        } else if (today >= matura) {
            return CONSTANTS.WEEKS_TOTAL + 1; // Po maturze
        } else {
            const daysPassedSinceStart = this.daysBetween(studyStartDate, today);
            return Math.min(CONSTANTS.WEEKS_TOTAL, Math.floor(daysPassedSinceStart / CONSTANTS.DAYS_PER_WEEK) + 1);
        }
    },

    /**
     * Oblicza oczekiwany postęp na podstawie daty
     * @param {Date} maturaDate - Data matury
     * @param {Date} currentDate - Bieżąca data (opcjonalnie)
     * @returns {number} Oczekiwany postęp w procentach (0-100)
     */
    getExpectedProgress(maturaDate, currentDate = new Date()) {
        const today = this.normalizeDate(currentDate);
        const matura = this.normalizeDate(maturaDate);
        
        const totalStudyDays = CONSTANTS.WEEKS_TOTAL * CONSTANTS.DAYS_PER_WEEK;
        const studyStartDate = new Date(matura);
        studyStartDate.setDate(matura.getDate() - totalStudyDays);

        if (today < studyStartDate) {
            return 0;
        } else if (today >= matura) {
            return 100;
        } else {
            const daysPassedTotal = this.daysBetween(studyStartDate, today);
            return Math.min(100, Math.round((daysPassedTotal / totalStudyDays) * 100));
        }
    },

    /**
     * Oblicza kolor paska postępu na podstawie wartości
     * @param {number} progress - Postęp w procentach (0-100)
     * @returns {object} Obiekt z klasą CSS i kolorem
     */
    getProgressColor(progress) {
        const colors = CONSTANTS.PROGRESS_COLORS;
        
        if (progress >= colors.DARK_GREEN.threshold) return colors.DARK_GREEN;
        if (progress >= colors.GREEN.threshold) return colors.GREEN;
        if (progress >= colors.LIGHT_GREEN.threshold) return colors.LIGHT_GREEN;
        if (progress >= colors.YELLOW.threshold) return colors.YELLOW;
        if (progress >= colors.ORANGE.threshold) return colors.ORANGE;
        return colors.RED;
    },

    /**
     * Debounce function - opóźnia wykonanie funkcji
     * @param {Function} func - Funkcja do wykonania
     * @param {number} wait - Czas oczekiwania w ms
     * @returns {Function} Funkcja z debounce
     */
    debounce(func, wait = CONSTANTS.UI.DEBOUNCE_DELAY_MS) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    /**
     * Escape HTML to prevent XSS
     * @param {string} text - Tekst do escape'owania
     * @returns {string} Bezpieczny tekst
     */
    escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    },

    /**
     * Generuje unikalny ID
     * @returns {string} Unikalny ID
     */
    generateId() {
        return `id-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    },

    /**
     * Sprawdza czy urządzenie jest mobilne
     * @returns {boolean} True jeśli urządzenie mobilne
     */
    isMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    },

    /**
     * Sprawdza czy przeglądarka wspiera dane API
     * @param {string} feature - Nazwa feature do sprawdzenia
     * @returns {boolean} True jeśli wspierane
     */
    isSupported(feature) {
        const features = {
            'localStorage': () => {
                try {
                    return 'localStorage' in window && window.localStorage !== null;
                } catch (e) {
                    return false;
                }
            },
            'serviceWorker': () => 'serviceWorker' in navigator,
            'notification': () => 'Notification' in window,
            'clipboard': () => navigator.clipboard !== undefined
        };

        return features[feature] ? features[feature]() : false;
    },

    /**
     * Kopiuje tekst do schowka
     * @param {string} text - Tekst do skopiowania
     * @returns {Promise<boolean>} Promise z wynikiem operacji
     */
    async copyToClipboard(text) {
        if (this.isSupported('clipboard')) {
            try {
                await navigator.clipboard.writeText(text);
                return true;
            } catch (err) {
                console.error('Failed to copy text:', err);
                return false;
            }
        } else {
            // Fallback dla starszych przeglądarek
            try {
                const textArea = document.createElement('textarea');
                textArea.value = text;
                textArea.style.position = 'fixed';
                textArea.style.left = '-999999px';
                document.body.appendChild(textArea);
                textArea.select();
                const successful = document.execCommand('copy');
                document.body.removeChild(textArea);
                return successful;
            } catch (err) {
                console.error('Fallback copy failed:', err);
                return false;
            }
        }
    },

    /**
     * Pobiera parametr z URL
     * @param {string} param - Nazwa parametru
     * @returns {string|null} Wartość parametru lub null
     */
    getUrlParameter(param) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(param);
    },

    /**
     * Formatuje liczbę do postaci z separatorami tysięcy
     * @param {number} num - Liczba do sformatowania
     * @returns {string} Sformatowana liczba
     */
    formatNumber(num) {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    },

    /**
     * Animuje zmianę liczby
     * @param {HTMLElement} element - Element do animacji
     * @param {number} start - Wartość początkowa
     * @param {number} end - Wartość końcowa
     * @param {number} duration - Czas trwania w ms
     */
    animateNumber(element, start, end, duration = 1000) {
        const range = end - start;
        const increment = range / (duration / 16); // ~60fps
        let current = start;

        const timer = setInterval(() => {
            current += increment;
            if ((increment > 0 && current >= end) || (increment < 0 && current <= end)) {
                current = end;
                clearInterval(timer);
            }
            element.textContent = Math.round(current);
        }, 16);
    },

    /**
     * Sprawdza czy element jest widoczny w viewport
     * @param {HTMLElement} element - Element do sprawdzenia
     * @returns {boolean} True jeśli widoczny
     */
    isInViewport(element) {
        const rect = element.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    }
};

// Freeze the object
Object.freeze(Utils);

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Utils;
}
