/**
 * Improved configuration page logic for MatMatura-AI
 * Ulepszona wersja z lepszą walidacją, obsługą błędów i UX
 */
document.addEventListener('DOMContentLoaded', () => {
    console.log('Config page script loaded (improved version).');

    const configForm = document.getElementById('config-form');
    const nameInput = document.getElementById('name');
    const maturaYearGroup = document.getElementById('matura-year-group');

    /**
     * Generuje opcje wyboru roku matury
     */
    function populateMaturaYearOptions() {
        if (!maturaYearGroup) return;

        maturaYearGroup.innerHTML = '';

        const currentYear = new Date().getFullYear();
        const currentMonth = new Date().getMonth();

        let firstOptionYear, secondOptionYear;

        // Jeśli jest przed majem bieżącego roku, pierwsza opcja to ten rok
        if (currentMonth < 4) {
            firstOptionYear = currentYear;
            secondOptionYear = currentYear + 1;
        } else {
            firstOptionYear = currentYear + 1;
            secondOptionYear = currentYear + 2;
        }

        const options = [
            { year: firstOptionYear, label: `Maj ${firstOptionYear}` },
            { year: secondOptionYear, label: `Maj ${secondOptionYear}` }
        ];

        options.forEach(opt => {
            const label = document.createElement('label');
            const radio = document.createElement('input');
            radio.type = 'radio';
            radio.name = 'maturaYear';
            radio.value = opt.year;
            radio.required = true;

            label.appendChild(radio);
            label.appendChild(document.createTextNode(` ${opt.label}`));
            maturaYearGroup.appendChild(label);
            maturaYearGroup.appendChild(document.createElement('br'));
        });

        console.log(`Wygenerowano opcje roku matury: ${firstOptionYear}, ${secondOptionYear}`);
    }

    /**
     * Waliduje formularz konfiguracji
     * @returns {object} { valid: boolean, errors: object }
     */
    function validateForm() {
        const errors = {};

        // Walidacja imienia
        const nameValidation = Validator.validateName(nameInput.value);
        if (!nameValidation.valid) {
            errors.name = nameValidation.error;
        }

        // Walidacja roku matury
        const selectedMaturaYear = configForm.querySelector('input[name="maturaYear"]:checked');
        if (!selectedMaturaYear) {
            errors.maturaYear = 'Musisz wybrać rok matury.';
        } else {
            const yearValidation = Validator.validateMaturaYear(selectedMaturaYear.value);
            if (!yearValidation.valid) {
                errors.maturaYear = yearValidation.error;
            }
        }

        // Walidacja poziomu
        const selectedLevel = configForm.querySelector('input[name="level"]:checked');
        if (!selectedLevel) {
            errors.level = 'Musisz wybrać poziom matury.';
        } else {
            const levelValidation = Validator.validateLevel(selectedLevel.value);
            if (!levelValidation.valid) {
                errors.level = levelValidation.error;
            }
        }

        return {
            valid: Object.keys(errors).length === 0,
            errors: errors
        };
    }

    /**
     * Obsługuje wysłanie formularza konfiguracji
     * @param {Event} event - Zdarzenie submit
     */
    async function handleFormSubmit(event) {
        event.preventDefault();
        console.log('Próba zapisu konfiguracji...');

        // Wyczyść poprzednie błędy
        Validator.clearFormErrors('config-form');

        // Waliduj formularz
        const validation = validateForm();

        if (!validation.valid) {
            console.log('Formularz zawiera błędy:', validation.errors);
            Validator.displayFormErrors(validation.errors, 'config-form');
            NotificationManager.showError('Proszę poprawić błędy w formularzu.');
            return;
        }

        // Pokaż loader
        const loader = NotificationManager.showLoader('Zapisywanie konfiguracji...');

        try {
            // Zbierz dane
            const name = Validator.sanitizeInput(nameInput.value);
            const maturaYear = parseInt(configForm.querySelector('input[name="maturaYear"]:checked').value, 10);
            const level = configForm.querySelector('input[name="level"]:checked').value;

            // Oblicz dokładną datę matury
            const maturaDateObj = Utils.calculateMaturaDate(maturaYear);
            const maturaDate = Utils.formatDateToISO(maturaDateObj);

            // Stwórz obiekt konfiguracji
            const userConfig = {
                name: name,
                maturaYear: maturaYear,
                maturaDate: maturaDate,
                level: level,
                configComplete: true,
                createdAt: new Date().toISOString()
            };

            // Zapisz w localStorage
            const saveSuccess = StorageManager.saveUserConfig(userConfig);

            if (!saveSuccess) {
                throw new Error('Nie udało się zapisać konfiguracji.');
            }

            // Zapisz również wybrany poziom
            StorageManager.saveSelectedLevel(level);

            console.log('Konfiguracja zapisana pomyślnie:', userConfig);

            // Ukryj loader
            loader.hide();

            // Pokaż sukces
            NotificationManager.showSuccess('Konfiguracja zapisana pomyślnie!');

            // Poczekaj chwilę i przekieruj
            setTimeout(() => {
                window.location.href = 'start.html';
            }, 1000);

        } catch (error) {
            console.error('Błąd podczas zapisu konfiguracji:', error);
            loader.hide();
            NotificationManager.showError('Wystąpił błąd podczas zapisywania konfiguracji. Spróbuj ponownie.');
        }
    }

    /**
     * Konfiguruje walidację w czasie rzeczywistym
     */
    function setupRealtimeValidation() {
        // Walidacja imienia
        nameInput.addEventListener('blur', () => {
            const validation = Validator.validateName(nameInput.value);
            const errorElement = document.getElementById('name-error');
            
            if (!validation.valid) {
                errorElement.textContent = validation.error;
                errorElement.style.display = 'block';
                nameInput.classList.add('error');
            } else {
                errorElement.style.display = 'none';
                nameInput.classList.remove('error');
            }
        });

        // Usuń błąd przy rozpoczęciu edycji
        nameInput.addEventListener('focus', () => {
            const errorElement = document.getElementById('name-error');
            errorElement.style.display = 'none';
            nameInput.classList.remove('error');
        });

        // Walidacja wyboru roku
        const yearRadios = configForm.querySelectorAll('input[name="maturaYear"]');
        yearRadios.forEach(radio => {
            radio.addEventListener('change', () => {
                const errorElement = document.getElementById('matura-year-error');
                errorElement.style.display = 'none';
            });
        });

        // Walidacja wyboru poziomu
        const levelRadios = configForm.querySelectorAll('input[name="level"]');
        levelRadios.forEach(radio => {
            radio.addEventListener('change', () => {
                const errorElement = document.getElementById('level-error');
                errorElement.style.display = 'none';
            });
        });
    }

    /**
     * Sprawdza czy użytkownik ma już konfigurację
     */
    function checkExistingConfig() {
        const existingConfig = StorageManager.getUserConfig();
        
        if (existingConfig && existingConfig.configComplete) {
            // Użytkownik ma już konfigurację - zapytaj czy chce ją zmienić
            const message = `Masz już zapisaną konfigurację dla ${existingConfig.name}. Czy chcesz ją zmienić?`;
            
            NotificationManager.confirm(message, 'Tak, zmień', 'Nie, wróć').then(confirmed => {
                if (!confirmed) {
                    // Przekieruj z powrotem
                    window.location.href = 'start.html';
                } else {
                    // Wypełnij formularz istniejącymi danymi
                    prefillForm(existingConfig);
                }
            });
        }
    }

    /**
     * Wypełnia formularz istniejącymi danymi
     * @param {object} config - Obiekt konfiguracji
     */
    function prefillForm(config) {
        if (config.name) {
            nameInput.value = config.name;
        }

        if (config.maturaYear) {
            const yearRadio = configForm.querySelector(`input[name="maturaYear"][value="${config.maturaYear}"]`);
            if (yearRadio) {
                yearRadio.checked = true;
            }
        }

        if (config.level) {
            const levelRadio = configForm.querySelector(`input[name="level"][value="${config.level}"]`);
            if (levelRadio) {
                levelRadio.checked = true;
            }
        }

        NotificationManager.showInfo('Formularz został wypełniony istniejącymi danymi.');
    }

    // --- Inicjalizacja ---
    populateMaturaYearOptions();
    setupRealtimeValidation();
    checkExistingConfig();
    
    // Dodaj listener do formularza
    if (configForm) {
        configForm.addEventListener('submit', handleFormSubmit);
    }

    // Sprawdź dostępność localStorage
    if (!StorageManager.isAvailable()) {
        NotificationManager.showError(
            'Twoja przeglądarka nie obsługuje localStorage. Aplikacja może nie działać poprawnie.',
            0 // Nie znikaj automatycznie
        );
    }

    // Sprawdź wykorzystanie storage
    const storageUsage = StorageManager.getUsagePercentage();
    if (storageUsage > 80) {
        NotificationManager.showWarning(
            `Pamięć przeglądarki jest zapełniona w ${storageUsage}%. Rozważ wyczyszczenie danych.`
        );
    }
});
