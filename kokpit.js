/**
 * Logika dla strony kokpitu (kokpit.html).
 * Wyświetla statystyki, postępy i zarządza nawigacją.
 */
document.addEventListener('DOMContentLoaded', () => {
    console.log('Kokpit script loaded.');

    // --- Elementy DOM ---
    const levelButtons = document.querySelectorAll('.level-button');
    const daysLeftValueElement = document.getElementById('days-left-value');
    const currentWeekValueElement = document.getElementById('current-week-value');
    const overallProgressValueElement = document.getElementById('overall-progress-value');
    const progressExpectedElement = document.getElementById('progress-expected');
    const progressActualElement = document.getElementById('progress-actual');
    const progressActualLabelElement = document.getElementById('progress-actual-label');
    const progressExpectedLabelElement = document.getElementById('progress-expected-label');
    const progressActualValueLegendElement = document.getElementById('progress-actual-value-legend');
    const actualLabelLegendElement = document.getElementById('actual-label-legend')?.querySelector('.actual-label::before'); // Celuj w ::before

    // --- Stan ---
    let selectedLevel = localStorage.getItem('selectedLevel') || 'pp';
    let userConfig = null;
    const WEEKS_TOTAL = 10; // Całkowita liczba tygodni planu
    const DAYS_PER_WEEK = 7;
    const TOTAL_STUDY_DAYS = WEEKS_TOTAL * DAYS_PER_WEEK;

    // --- Inicjalizacja ---
    function initializeKokpit() {
        loadUserConfig(); // Załaduj konfigurację użytkownika
        if (!userConfig || !userConfig.configComplete) {
            // Jeśli brak konfiguracji, przekieruj lub pokaż komunikat
            console.warn('Brak pełnej konfiguracji użytkownika. Przekierowanie do config.html');
            // Można pokazać komunikat zamiast przekierowania
            document.querySelector('main').innerHTML = `
                <h1>Witaj!</h1>
                <p>Aby zobaczyć kokpit, musisz najpierw skonfigurować swój plan.</p>
                <a href="config.html" class="start-button" style="display: inline-block; width: auto;">Przejdź do konfiguracji</a>`;
            // Ukryj selektor poziomu, jeśli nie ma konfiguracji
             const levelSelector = document.querySelector('.level-selector');
             if (levelSelector) levelSelector.style.display = 'none';
            return; // Zatrzymaj dalszą inicjalizację
        }

        updateLevelButtonsUI(); // Ustaw aktywny przycisk poziomu
        displayDashboardStats(); // Oblicz i wyświetl statystyki
        loadAllSectionProgress(); // Załaduj postępy dla siatki tygodni
        setupEventListeners(); // Ustaw listenery
        console.log('Kokpit zainicjalizowany.');
    }

    // --- Ładowanie Konfiguracji ---
    function loadUserConfig() {
         try {
            const configString = localStorage.getItem('maturaUserConfig');
            if (configString) {
                userConfig = JSON.parse(configString);
                console.log('Załadowano konfigurację użytkownika:', userConfig);
                // Ustaw poziom na podstawie konfiguracji, jeśli istnieje
                if (userConfig.level) {
                    selectedLevel = userConfig.level;
                    localStorage.setItem('selectedLevel', selectedLevel); // Upewnij się, że jest zapisany
                }
            } else {
                console.log('Brak konfiguracji użytkownika w localStorage.');
            }
        } catch (error) {
            console.error('Błąd podczas odczytu konfiguracji użytkownika:', error);
            localStorage.removeItem('maturaUserConfig'); // Usuń błędne dane
            userConfig = null;
        }
    }

    // --- Obliczenia i Wyświetlanie Statystyk ---
    function displayDashboardStats() {
        if (!userConfig || !userConfig.maturaDate) {
            console.error('Brak daty matury w konfiguracji do obliczenia statystyk.');
            return;
        }

        // 1. Dni do matury
        const maturaDate = new Date(userConfig.maturaDate);
        const today = new Date();
        // Ustaw czas na początek dnia, aby uniknąć problemów z godzinami
        today.setHours(0, 0, 0, 0);
        maturaDate.setHours(0, 0, 0, 0);

        const timeLeft = maturaDate.getTime() - today.getTime();
        const daysLeft = Math.max(0, Math.ceil(timeLeft / (1000 * 60 * 60 * 24))); // Zaokrąglij w górę

        if (daysLeftValueElement) {
            daysLeftValueElement.textContent = daysLeft;
        }

        // 2. Bieżący tydzień nauki
        // Założenie: Plan 10-tygodniowy startuje TOTAL_STUDY_DAYS dni przed maturą
        const studyStartDate = new Date(maturaDate);
        studyStartDate.setDate(maturaDate.getDate() - TOTAL_STUDY_DAYS);

        let currentWeek = 0;
        if (today >= studyStartDate && today < maturaDate) {
            const daysPassedSinceStart = Math.floor((today.getTime() - studyStartDate.getTime()) / (1000 * 60 * 60 * 24));
            currentWeek = Math.min(WEEKS_TOTAL, Math.floor(daysPassedSinceStart / DAYS_PER_WEEK) + 1);
        } else if (today >= maturaDate) {
            currentWeek = WEEKS_TOTAL + 1; // Po maturze
        } // Jeśli today < studyStartDate, currentWeek = 0 (przed startem)

        if (currentWeekValueElement) {
            if (currentWeek === 0) {
                 currentWeekValueElement.textContent = "-"; // Przed startem
                 currentWeekValueElement.parentElement.querySelector('.label').textContent = "Przed rozpoczęciem planu";
            } else if (currentWeek > WEEKS_TOTAL) {
                 currentWeekValueElement.textContent = "✓"; // Po maturze
                 currentWeekValueElement.parentElement.querySelector('.label').textContent = "Matura zakończona";
            } else {
                currentWeekValueElement.textContent = currentWeek;
                currentWeekValueElement.parentElement.querySelector('.label').textContent = "Bieżący tydzień nauki";
            }
        }

        // 3. Oczekiwany postęp
        let expectedProgress = 0;
        if (today >= studyStartDate && today < maturaDate) {
             const daysPassedTotal = Math.floor((today.getTime() - studyStartDate.getTime()) / (1000 * 60 * 60 * 24));
             expectedProgress = Math.min(100, Math.round((daysPassedTotal / TOTAL_STUDY_DAYS) * 100));
        } else if (today >= maturaDate) {
            expectedProgress = 100;
        } // Jeśli today < studyStartDate, expectedProgress = 0

        if (progressExpectedElement) {
            progressExpectedElement.style.width = `${expectedProgress}%`;
        }
         if (progressExpectedLabelElement) {
            progressExpectedLabelElement.textContent = `${expectedProgress}%`;
        }

        // 4. Rzeczywisty postęp (średnia ważona ze wszystkich tygodni)
        const progressData = getProgressData(); // Użyj funkcji pomocniczej
        let actualProgressSum = 0;
        let weeksWithProgress = 0; // Liczba tygodni z jakimkolwiek postępem

        for (let i = 1; i <= WEEKS_TOTAL; i++) {
            const weekId = `week-${i}`;
            const sectionProgress = progressData[weekId] || { theoryRead: false, quizScore: null };
            let weekTotalProgress = 0;

            if (sectionProgress.theoryRead === true) {
                weekTotalProgress += 20;
            }
            if (typeof sectionProgress.quizScore === 'number' && !isNaN(sectionProgress.quizScore)) {
                weekTotalProgress += sectionProgress.quizScore * 0.8;
            }

            if (weekTotalProgress > 0) { // Licz tylko tygodnie, w których coś zrobiono
                 actualProgressSum += weekTotalProgress;
                 weeksWithProgress++; // Można by też liczyć średnią tylko z rozpoczętych tygodni
            }
        }

        // Oblicz średni rzeczywisty postęp (np. średnia ze wszystkich 10 tygodni)
        const actualOverallProgress = (WEEKS_TOTAL > 0) ? Math.round(actualProgressSum / WEEKS_TOTAL) : 0;
        // Alternatywa: Średnia tylko z tygodni do bieżącego włącznie?
        // const relevantWeeks = Math.min(WEEKS_TOTAL, currentWeek > 0 ? currentWeek : 1);
        // const actualOverallProgress = (relevantWeeks > 0) ? Math.round(actualProgressSum / relevantWeeks) : 0; // Wymagałoby sumowania tylko do relevantWeeks

        // Wyświetl całkowity postęp
        if (overallProgressValueElement) {
             overallProgressValueElement.textContent = `${actualOverallProgress}%`;
        }

        // Ustaw pasek rzeczywistego postępu i jego kolor
        if (progressActualElement && progressActualLabelElement) {
            progressActualElement.style.width = `${actualOverallProgress}%`;
            progressActualLabelElement.textContent = `${actualOverallProgress}%`;

            // Usuń stare klasy kolorów
            progressActualElement.classList.remove('red', 'orange', 'yellow', 'light-green', 'green', 'dark-green');
            let colorClass = 'red'; // Domyślnie
            let legendColor = '#dc3545';

            if (actualOverallProgress >= 95) { colorClass = 'dark-green'; legendColor = '#198754'; }
            else if (actualOverallProgress >= 85) { colorClass = 'green'; legendColor = '#28a745'; }
            else if (actualOverallProgress >= 70) { colorClass = 'light-green'; legendColor = '#6fbf73'; }
            else if (actualOverallProgress >= 50) { colorClass = 'yellow'; legendColor = '#ffc107'; }
            else if (actualOverallProgress >= 30) { colorClass = 'orange'; legendColor = '#fd7e14'; }

            progressActualElement.classList.add(colorClass);

            // Aktualizuj legendę
             if (progressActualValueLegendElement) {
                 progressActualValueLegendElement.textContent = `${actualOverallProgress}%`;
             }
             // Zaktualizuj kolor kropki w legendzie (jeśli element ::before istnieje)
             // To wymagałoby dynamicznego tworzenia stylów lub użycia zmiennych CSS
             // Prostsze obejście: ustawić kolor tła bezpośrednio na elemencie span
             const legendSpan = document.getElementById('actual-label-legend');
             if (legendSpan) {
                 const beforeElement = legendSpan.querySelector('.actual-label::before'); // To nie zadziała bezpośrednio
                 // Zamiast tego, można by dodać mały span wewnątrz legendy i ustawić jego tło:
                 // <span class="actual-label"><span class="color-dot"></span> Postęp...</span>
                 // LUB ustawić zmienną CSS: legendSpan.style.setProperty('--legend-color', legendColor);
                 // i użyć jej w CSS: background-color: var(--legend-color);
                 // Na razie zostawiamy statyczny kolor w CSS
             }
        }
    }


    // --- Ładowanie Postępów dla Siatki Tygodni ---
    /**
     * Ładuje zapisane postępy ze wszystkich sekcji z localStorage.
     * @returns {object} Obiekt z danymi postępów lub pusty obiekt.
     */
    function getProgressData() {
        try {
            const dataString = localStorage.getItem('maturaProgress');
            if (dataString) {
                const data = JSON.parse(dataString);
                if (typeof data === 'object' && data !== null) return data;
            }
            return {};
        } catch (error) {
            console.error('Błąd parsowania danych postępów:', error);
            return {};
        }
    }

    /**
     * Ładuje i wyświetla postępy dla poszczególnych tygodni w siatce.
     */
    function loadAllSectionProgress() {
        const progressData = getProgressData();
        console.log('Ładowanie postępów dla siatki tygodni:', progressData);

        for (let i = 1; i <= WEEKS_TOTAL; i++) {
            const weekId = `week-${i}`;
            const sectionProgress = progressData[weekId] || { theoryRead: false, quizScore: null };
            let totalProgress = 0;

            if (sectionProgress.theoryRead === true) totalProgress += 20;
            if (typeof sectionProgress.quizScore === 'number' && !isNaN(sectionProgress.quizScore)) {
                totalProgress += sectionProgress.quizScore * 0.8;
            }
            updateSectionProgressBar(weekId, Math.round(totalProgress));
        }
    }

    /**
     * Aktualizuje wizualnie pasek postępu dla danego tygodnia w siatce.
     * @param {string} weekId - ID sekcji (np. 'week-1').
     * @param {number} percentage - Procent postępu (0-100).
     */
    function updateSectionProgressBar(weekId, percentage) {
        const validPercentage = Math.max(0, Math.min(100, Math.round(percentage)));
        const progressBar = document.getElementById(`progress-${weekId}`); // Pasek w siatce
        const progressLabel = document.getElementById(`label-${weekId}`);   // Etykieta w siatce

        if (progressBar && progressLabel) {
            progressBar.style.width = `${validPercentage}%`;
            progressLabel.textContent = `${validPercentage}%`;
            // Zmieniamy kolor paska w siatce w zależności od postępu
            let color = '#28a745'; // Zielony
            if (validPercentage < 30) color = '#dc3545'; // Czerwony
            else if (validPercentage < 70) color = '#ffc107'; // Żółty
            progressBar.style.backgroundColor = color;
        }
    }


    // --- Obsługa Wyboru Poziomu ---
    /**
     * Aktualizuje interfejs przycisków wyboru poziomu.
     */
    function updateLevelButtonsUI() {
        levelButtons.forEach(btn => {
            if (btn.getAttribute('data-level') === selectedLevel) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }

    /**
     * Obsługuje kliknięcie przycisku wyboru poziomu.
     * @param {Event} event - Zdarzenie kliknięcia.
     */
    function handleLevelButtonClick(event) {
        selectedLevel = event.target.getAttribute('data-level');
        localStorage.setItem('selectedLevel', selectedLevel);
        console.log(`Zmieniono poziom na: ${selectedLevel}`);
        updateLevelButtonsUI();
        // TODO: W przyszłości może odświeżać statystyki lub dostępne sekcje
    }

    // --- Ustawienie Event Listenerów ---
    function setupEventListeners() {
        levelButtons.forEach(button => {
            button.addEventListener('click', handleLevelButtonClick);
        });

        // Listenery dla linków sekcji (jeśli potrzebne dodatkowe akcje)
        const sectionLinks = document.querySelectorAll('.grid-item[href^="section.html"]');
        sectionLinks.forEach(link => {
            link.addEventListener('click', () => {
                // Zapisz poziom przed przejściem (już jest w localStorage, ale dla pewności)
                localStorage.setItem('selectedLevel', selectedLevel);
            });
        });
    }

    // --- Inicjalizacja Kokpitu ---
    initializeKokpit();

}); // Koniec DOMContentLoaded listener