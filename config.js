/**
 * Logika dla strony konfiguracji (config.html).
 * Zbiera dane od użytkownika, waliduje je, zapisuje w localStorage
 * i przekierowuje na stronę startową.
 */
document.addEventListener('DOMContentLoaded', () => {
    console.log('Config page script loaded.');

    const configForm = document.getElementById('config-form');
    const nameInput = document.getElementById('name');
    const maturaYearGroup = document.getElementById('matura-year-group');
    const nameError = document.getElementById('name-error');
    const maturaYearError = document.getElementById('matura-year-error');
    const levelError = document.getElementById('level-error');

    /**
     * Generuje opcje wyboru roku matury.
     * Zakłada maturę w maju.
     */
    function populateMaturaYearOptions() {
        if (!maturaYearGroup) return;

        maturaYearGroup.innerHTML = ''; // Wyczyść placeholder

        const currentYear = new Date().getFullYear();
        const currentMonth = new Date().getMonth(); // 0 = Styczeń, 4 = Maj

        let firstOptionYear, secondOptionYear;

        // Jeśli jest przed majem bieżącego roku, pierwsza opcja to ten rok
        if (currentMonth < 4) { // Miesiące 0-3 (Sty-Kwi)
            firstOptionYear = currentYear;
            secondOptionYear = currentYear + 1;
        } else { // Od maja włącznie
            firstOptionYear = currentYear + 1; // Najbliższa matura jest w przyszłym roku
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
            maturaYearGroup.appendChild(document.createElement('br')); // Nowa linia dla czytelności
        });
         console.log(`Wygenerowano opcje roku matury: ${firstOptionYear}, ${secondOptionYear}`);
    }

    /**
     * Oblicza datę matury (drugi wtorek maja danego roku).
     * @param {number} year - Rok matury.
     * @returns {string} Data w formacie YYYY-MM-DD.
     */
    function calculateMaturaDate(year) {
        const mayFirst = new Date(year, 4, 1); // 4 to Maj (indeks od 0)
        let dayOfWeek = mayFirst.getDay(); // 0 = Niedziela, 1 = Pon, ..., 6 = Sobota

        // Znajdź pierwszy wtorek (dayOfWeek === 2)
        let firstTuesdayDate = 1;
        if (dayOfWeek === 0) { // Niedziela
            firstTuesdayDate = 3;
        } else if (dayOfWeek === 1) { // Poniedziałek
            firstTuesdayDate = 2;
        } else if (dayOfWeek > 2) { // Środa-Sobota
            firstTuesdayDate = 1 + (7 - dayOfWeek) + 2;
        } // Jeśli dayOfWeek === 2 (Wtorek), to data = 1

        // Drugi wtorek to 7 dni później
        const secondTuesdayDate = firstTuesdayDate + 7;

        // Formatowanie daty na YYYY-MM-DD
        const month = '05'; // Maj
        const day = secondTuesdayDate < 10 ? `0${secondTuesdayDate}` : `${secondTuesdayDate}`;
        const maturaDate = `${year}-${month}-${day}`;
        console.log(`Obliczono datę matury dla roku ${year}: ${maturaDate}`);
        return maturaDate;
    }

    /**
     * Waliduje formularz konfiguracji.
     * @returns {boolean} True, jeśli formularz jest poprawny, false w przeciwnym razie.
     */
    function validateForm() {
        let isValid = true;
        // Ukryj wszystkie komunikaty o błędach
        nameError.style.display = 'none';
        maturaYearError.style.display = 'none';
        levelError.style.display = 'none';

        // Walidacja imienia
        if (nameInput.value.trim() === '') {
            nameError.style.display = 'block';
            isValid = false;
        }

        // Walidacja roku matury
        const selectedMaturaYear = configForm.querySelector('input[name="maturaYear"]:checked');
        if (!selectedMaturaYear) {
            maturaYearError.style.display = 'block';
            isValid = false;
        }

        // Walidacja poziomu
        const selectedLevel = configForm.querySelector('input[name="level"]:checked');
        if (!selectedLevel) {
            levelError.style.display = 'block';
            isValid = false;
        }

        return isValid;
    }

    /**
     * Obsługuje wysłanie formularza konfiguracji.
     * @param {Event} event - Zdarzenie submit.
     */
    function handleFormSubmit(event) {
        event.preventDefault(); // Zatrzymaj domyślne wysłanie formularza
        console.log('Próba zapisu konfiguracji...');

        if (validateForm()) {
            console.log('Formularz poprawny. Zbieranie danych...');
            const name = nameInput.value.trim();
            const maturaYear = parseInt(configForm.querySelector('input[name="maturaYear"]:checked').value, 10);
            const level = configForm.querySelector('input[name="level"]:checked').value;

            // Oblicz dokładną datę matury
            const maturaDate = calculateMaturaDate(maturaYear);

            // Stwórz obiekt konfiguracji
            const userConfig = {
                name: name,
                maturaYear: maturaYear, // Zapisujemy też sam rok
                maturaDate: maturaDate, // Dokładna data
                level: level,
                configComplete: true // Flaga oznaczająca zakończenie konfiguracji
                // Można tu dodać domyślne ustawienia planu nauki, jeśli będą
            };

            // Zapisz w localStorage
            try {
                localStorage.setItem('maturaUserConfig', JSON.stringify(userConfig));
                console.log('Konfiguracja zapisana w localStorage:', userConfig);

                // Przekieruj na stronę startową (która teraz powinna pokazać powitanie)
                window.location.href = 'start.html';
            } catch (error) {
                console.error('Błąd podczas zapisu konfiguracji do localStorage:', error);
                alert('Wystąpił błąd podczas zapisywania konfiguracji. Spróbuj ponownie.');
            }

        } else {
            console.log('Formularz zawiera błędy.');
        }
    }

    // --- Inicjalizacja ---
    populateMaturaYearOptions(); // Wypełnij opcje roku matury
    configForm.addEventListener('submit', handleFormSubmit); // Dodaj listener do formularza

});