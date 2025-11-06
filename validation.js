/**
 * Validation utilities for MatMatura-AI
 * Centralizuje logikę walidacji formularzy i danych
 */

const Validator = {
    /**
     * Waliduje imię użytkownika
     * @param {string} name - Imię do walidacji
     * @returns {object} { valid: boolean, error: string|null }
     */
    validateName(name) {
        if (!name || typeof name !== 'string') {
            return { valid: false, error: 'Imię jest wymagane.' };
        }

        const trimmedName = name.trim();

        if (trimmedName.length < CONSTANTS.VALIDATION.MIN_NAME_LENGTH) {
            return { 
                valid: false, 
                error: `Imię musi mieć co najmniej ${CONSTANTS.VALIDATION.MIN_NAME_LENGTH} znaki.` 
            };
        }

        if (trimmedName.length > CONSTANTS.VALIDATION.MAX_NAME_LENGTH) {
            return { 
                valid: false, 
                error: `Imię nie może być dłuższe niż ${CONSTANTS.VALIDATION.MAX_NAME_LENGTH} znaków.` 
            };
        }

        // Sprawdź czy zawiera tylko litery, spacje i polskie znaki
        const nameRegex = /^[a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ\s-]+$/;
        if (!nameRegex.test(trimmedName)) {
            return { 
                valid: false, 
                error: 'Imię może zawierać tylko litery, spacje i myślniki.' 
            };
        }

        return { valid: true, error: null };
    },

    /**
     * Waliduje rok matury
     * @param {number|string} year - Rok do walidacji
     * @returns {object} { valid: boolean, error: string|null }
     */
    validateMaturaYear(year) {
        const currentYear = new Date().getFullYear();
        const yearNum = parseInt(year, 10);

        if (isNaN(yearNum)) {
            return { valid: false, error: 'Rok matury musi być liczbą.' };
        }

        const minYear = currentYear + CONSTANTS.VALIDATION.MIN_YEAR_OFFSET;
        const maxYear = currentYear + CONSTANTS.VALIDATION.MAX_YEAR_OFFSET;

        if (yearNum < minYear || yearNum > maxYear) {
            return { 
                valid: false, 
                error: `Rok matury musi być między ${minYear} a ${maxYear}.` 
            };
        }

        return { valid: true, error: null };
    },

    /**
     * Waliduje poziom matury
     * @param {string} level - Poziom do walidacji ('pp' lub 'pr')
     * @returns {object} { valid: boolean, error: string|null }
     */
    validateLevel(level) {
        const validLevels = Object.values(CONSTANTS.LEVELS);
        
        if (!level || !validLevels.includes(level)) {
            return { 
                valid: false, 
                error: 'Musisz wybrać poziom matury (Podstawowy lub Rozszerzony).' 
            };
        }

        return { valid: true, error: null };
    },

    /**
     * Waliduje kompletną konfigurację użytkownika
     * @param {object} config - Obiekt konfiguracji
     * @returns {object} { valid: boolean, errors: object }
     */
    validateUserConfig(config) {
        const errors = {};
        let valid = true;

        // Walidacja imienia
        const nameValidation = this.validateName(config.name);
        if (!nameValidation.valid) {
            errors.name = nameValidation.error;
            valid = false;
        }

        // Walidacja roku matury
        const yearValidation = this.validateMaturaYear(config.maturaYear);
        if (!yearValidation.valid) {
            errors.maturaYear = yearValidation.error;
            valid = false;
        }

        // Walidacja poziomu
        const levelValidation = this.validateLevel(config.level);
        if (!levelValidation.valid) {
            errors.level = levelValidation.error;
            valid = false;
        }

        // Walidacja daty matury (jeśli podana)
        if (config.maturaDate) {
            const dateValidation = this.validateDate(config.maturaDate);
            if (!dateValidation.valid) {
                errors.maturaDate = dateValidation.error;
                valid = false;
            }
        }

        return { valid, errors };
    },

    /**
     * Waliduje datę
     * @param {string|Date} date - Data do walidacji
     * @returns {object} { valid: boolean, error: string|null }
     */
    validateDate(date) {
        let dateObj;

        if (date instanceof Date) {
            dateObj = date;
        } else if (typeof date === 'string') {
            dateObj = new Date(date);
        } else {
            return { valid: false, error: 'Nieprawidłowy format daty.' };
        }

        if (isNaN(dateObj.getTime())) {
            return { valid: false, error: 'Nieprawidłowa data.' };
        }

        // Sprawdź czy data nie jest w przeszłości
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (dateObj < today) {
            return { valid: false, error: 'Data matury nie może być w przeszłości.' };
        }

        return { valid: true, error: null };
    },

    /**
     * Waliduje wynik quizu
     * @param {number} score - Wynik do walidacji (0-100)
     * @returns {object} { valid: boolean, error: string|null }
     */
    validateQuizScore(score) {
        const scoreNum = parseFloat(score);

        if (isNaN(scoreNum)) {
            return { valid: false, error: 'Wynik musi być liczbą.' };
        }

        if (scoreNum < 0 || scoreNum > 100) {
            return { valid: false, error: 'Wynik musi być między 0 a 100.' };
        }

        return { valid: true, error: null };
    },

    /**
     * Waliduje numer tygodnia
     * @param {number|string} weekNumber - Numer tygodnia
     * @returns {object} { valid: boolean, error: string|null }
     */
    validateWeekNumber(weekNumber) {
        const weekNum = parseInt(weekNumber, 10);

        if (isNaN(weekNum)) {
            return { valid: false, error: 'Numer tygodnia musi być liczbą.' };
        }

        if (weekNum < 1 || weekNum > CONSTANTS.WEEKS_TOTAL) {
            return { 
                valid: false, 
                error: `Numer tygodnia musi być między 1 a ${CONSTANTS.WEEKS_TOTAL}.` 
            };
        }

        return { valid: true, error: null };
    },

    /**
     * Sanityzuje tekst wejściowy (usuwa niebezpieczne znaki)
     * @param {string} input - Tekst do sanityzacji
     * @returns {string} Sanityzowany tekst
     */
    sanitizeInput(input) {
        if (typeof input !== 'string') {
            return '';
        }
        // Usuń tagi HTML i niebezpieczne znaki
        return input.trim().replace(/<[^>]*>/g, '');
    },

    /**
     * Wyświetla błędy walidacji w formularzu
     * @param {object} errors - Obiekt z błędami { fieldName: errorMessage }
     * @param {string} formId - ID formularza
     */
    displayFormErrors(errors, formId = 'config-form') {
        // Ukryj wszystkie poprzednie błędy
        this.clearFormErrors(formId);

        // Wyświetl nowe błędy
        Object.keys(errors).forEach(fieldName => {
            const errorElement = document.getElementById(`${fieldName}-error`);
            if (errorElement) {
                errorElement.textContent = errors[fieldName];
                errorElement.style.display = 'block';
            }

            // Dodaj klasę error do pola
            const fieldElement = document.getElementById(fieldName) || 
                                document.querySelector(`[name="${fieldName}"]`);
            if (fieldElement) {
                fieldElement.classList.add('error');
            }
        });
    },

    /**
     * Czyści wszystkie błędy walidacji w formularzu
     * @param {string} formId - ID formularza
     */
    clearFormErrors(formId = 'config-form') {
        const form = document.getElementById(formId);
        if (!form) return;

        // Ukryj wszystkie elementy z błędami
        const errorElements = form.querySelectorAll('[id$="-error"]');
        errorElements.forEach(element => {
            element.style.display = 'none';
            element.textContent = '';
        });

        // Usuń klasę error ze wszystkich pól
        const fields = form.querySelectorAll('.error');
        fields.forEach(field => {
            field.classList.remove('error');
        });
    },

    /**
     * Waliduje formularz w czasie rzeczywistym
     * @param {string} formId - ID formularza
     * @param {object} validationRules - Reguły walidacji { fieldName: validationFunction }
     */
    setupRealtimeValidation(formId, validationRules) {
        const form = document.getElementById(formId);
        if (!form) return;

        Object.keys(validationRules).forEach(fieldName => {
            const field = form.querySelector(`[name="${fieldName}"]`) || 
                         document.getElementById(fieldName);
            
            if (field) {
                // Waliduj przy zmianie wartości
                field.addEventListener('blur', () => {
                    const validation = validationRules[fieldName](field.value);
                    const errorElement = document.getElementById(`${fieldName}-error`);
                    
                    if (errorElement) {
                        if (!validation.valid) {
                            errorElement.textContent = validation.error;
                            errorElement.style.display = 'block';
                            field.classList.add('error');
                        } else {
                            errorElement.style.display = 'none';
                            errorElement.textContent = '';
                            field.classList.remove('error');
                        }
                    }
                });

                // Usuń błąd przy rozpoczęciu edycji
                field.addEventListener('focus', () => {
                    const errorElement = document.getElementById(`${fieldName}-error`);
                    if (errorElement) {
                        errorElement.style.display = 'none';
                        field.classList.remove('error');
                    }
                });
            }
        });
    }
};

// Freeze the object
Object.freeze(Validator);

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Validator;
}
