/**
 * Storage utility module for MatMatura-AI
 * Centralizuje operacje na localStorage z obsługą błędów i walidacją
 */

const StorageManager = {
    /**
     * Sprawdza dostępność localStorage
     * @returns {boolean} True jeśli localStorage jest dostępny
     */
    isAvailable() {
        try {
            const test = '__storage_test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (e) {
            console.error('localStorage is not available:', e);
            return false;
        }
    },

    /**
     * Sprawdza dostępne miejsce w localStorage
     * @returns {number} Przybliżony procent wykorzystania (0-100)
     */
    getUsagePercentage() {
        if (!this.isAvailable()) return 100;
        
        try {
            let total = 0;
            for (let key in localStorage) {
                if (localStorage.hasOwnProperty(key)) {
                    total += localStorage[key].length + key.length;
                }
            }
            // Zakładamy limit 5MB (5 * 1024 * 1024 znaków)
            const limit = 5 * 1024 * 1024;
            return Math.round((total / limit) * 100);
        } catch (e) {
            console.error('Error calculating storage usage:', e);
            return 0;
        }
    },

    /**
     * Zapisuje dane do localStorage z obsługą błędów
     * @param {string} key - Klucz
     * @param {any} value - Wartość do zapisania (zostanie automatycznie serializowana)
     * @returns {boolean} True jeśli zapis się powiódł
     */
    setItem(key, value) {
        if (!this.isAvailable()) {
            console.error('Cannot save: localStorage not available');
            return false;
        }

        try {
            const serialized = JSON.stringify(value);
            localStorage.setItem(key, serialized);
            console.log(`Successfully saved to localStorage: ${key}`);
            return true;
        } catch (e) {
            if (e.name === 'QuotaExceededError') {
                console.error('Storage quota exceeded. Consider clearing old data.');
                this.showStorageWarning();
            } else {
                console.error(`Error saving to localStorage (${key}):`, e);
            }
            return false;
        }
    },

    /**
     * Odczytuje dane z localStorage
     * @param {string} key - Klucz
     * @param {any} defaultValue - Wartość domyślna jeśli klucz nie istnieje
     * @returns {any} Odczytana wartość lub defaultValue
     */
    getItem(key, defaultValue = null) {
        if (!this.isAvailable()) {
            console.error('Cannot read: localStorage not available');
            return defaultValue;
        }

        try {
            const item = localStorage.getItem(key);
            if (item === null) {
                return defaultValue;
            }
            return JSON.parse(item);
        } catch (e) {
            console.error(`Error reading from localStorage (${key}):`, e);
            // Jeśli dane są uszkodzone, usuń je
            this.removeItem(key);
            return defaultValue;
        }
    },

    /**
     * Usuwa element z localStorage
     * @param {string} key - Klucz do usunięcia
     * @returns {boolean} True jeśli usunięcie się powiodło
     */
    removeItem(key) {
        if (!this.isAvailable()) {
            return false;
        }

        try {
            localStorage.removeItem(key);
            console.log(`Removed from localStorage: ${key}`);
            return true;
        } catch (e) {
            console.error(`Error removing from localStorage (${key}):`, e);
            return false;
        }
    },

    /**
     * Czyści wszystkie dane aplikacji z localStorage
     * @returns {boolean} True jeśli czyszczenie się powiodło
     */
    clearAll() {
        if (!this.isAvailable()) {
            return false;
        }

        try {
            // Usuń tylko klucze aplikacji, nie wszystko w localStorage
            const appKeys = Object.values(CONSTANTS.STORAGE_KEYS);
            appKeys.forEach(key => {
                localStorage.removeItem(key);
            });
            console.log('Cleared all application data from localStorage');
            return true;
        } catch (e) {
            console.error('Error clearing localStorage:', e);
            return false;
        }
    },

    /**
     * Pobiera konfigurację użytkownika
     * @returns {object|null} Obiekt konfiguracji lub null
     */
    getUserConfig() {
        return this.getItem(CONSTANTS.STORAGE_KEYS.USER_CONFIG, null);
    },

    /**
     * Zapisuje konfigurację użytkownika
     * @param {object} config - Obiekt konfiguracji
     * @returns {boolean} True jeśli zapis się powiódł
     */
    saveUserConfig(config) {
        return this.setItem(CONSTANTS.STORAGE_KEYS.USER_CONFIG, config);
    },

    /**
     * Pobiera dane postępów
     * @returns {object} Obiekt z danymi postępów
     */
    getProgressData() {
        return this.getItem(CONSTANTS.STORAGE_KEYS.PROGRESS_DATA, {});
    },

    /**
     * Zapisuje dane postępów
     * @param {object} progressData - Obiekt z danymi postępów
     * @returns {boolean} True jeśli zapis się powiódł
     */
    saveProgressData(progressData) {
        return this.setItem(CONSTANTS.STORAGE_KEYS.PROGRESS_DATA, progressData);
    },

    /**
     * Pobiera postęp dla konkretnej sekcji
     * @param {string} sectionId - ID sekcji (np. 'week-1')
     * @returns {object} Obiekt postępu sekcji
     */
    getSectionProgress(sectionId) {
        const allProgress = this.getProgressData();
        return allProgress[sectionId] || {
            theoryRead: false,
            quizScore: null,
            incorrectQuestions: []
        };
    },

    /**
     * Zapisuje postęp dla konkretnej sekcji
     * @param {string} sectionId - ID sekcji
     * @param {object} sectionProgress - Obiekt postępu sekcji
     * @returns {boolean} True jeśli zapis się powiódł
     */
    saveSectionProgress(sectionId, sectionProgress) {
        const allProgress = this.getProgressData();
        allProgress[sectionId] = sectionProgress;
        return this.saveProgressData(allProgress);
    },

    /**
     * Pobiera wybrany poziom
     * @returns {string} 'pp' lub 'pr'
     */
    getSelectedLevel() {
        return this.getItem(CONSTANTS.STORAGE_KEYS.SELECTED_LEVEL, CONSTANTS.LEVELS.PODSTAWOWY);
    },

    /**
     * Zapisuje wybrany poziom
     * @param {string} level - 'pp' lub 'pr'
     * @returns {boolean} True jeśli zapis się powiódł
     */
    saveSelectedLevel(level) {
        return this.setItem(CONSTANTS.STORAGE_KEYS.SELECTED_LEVEL, level);
    },

    /**
     * Wyświetla ostrzeżenie o braku miejsca w storage
     */
    showStorageWarning() {
        const message = 'Brak miejsca w pamięci przeglądarki. Niektóre dane mogą nie zostać zapisane. Rozważ wyczyszczenie danych przeglądarki.';
        
        // Użyj systemu powiadomień jeśli istnieje, w przeciwnym razie alert
        if (window.NotificationManager && typeof window.NotificationManager.showError === 'function') {
            window.NotificationManager.showError(message);
        } else {
            alert(message);
        }
    },

    /**
     * Eksportuje wszystkie dane aplikacji do JSON
     * @returns {string} JSON string z danymi
     */
    exportData() {
        const data = {
            userConfig: this.getUserConfig(),
            progressData: this.getProgressData(),
            selectedLevel: this.getSelectedLevel(),
            exportDate: new Date().toISOString()
        };
        return JSON.stringify(data, null, 2);
    },

    /**
     * Importuje dane z JSON string
     * @param {string} jsonString - JSON string z danymi
     * @returns {boolean} True jeśli import się powiódł
     */
    importData(jsonString) {
        try {
            const data = JSON.parse(jsonString);
            
            if (data.userConfig) {
                this.saveUserConfig(data.userConfig);
            }
            if (data.progressData) {
                this.saveProgressData(data.progressData);
            }
            if (data.selectedLevel) {
                this.saveSelectedLevel(data.selectedLevel);
            }
            
            console.log('Data imported successfully');
            return true;
        } catch (e) {
            console.error('Error importing data:', e);
            return false;
        }
    }
};

// Freeze the object to prevent modifications
Object.freeze(StorageManager);

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StorageManager;
}
