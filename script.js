document.addEventListener('DOMContentLoaded', () => {
    // Elementy DOM
    const levelButtons = document.querySelectorAll('.level-button');

    // Zmienne stanu
    let selectedLevel = localStorage.getItem('selectedLevel') || 'pp'; // Domyślnie podstawowy

    // --- Inicjalizacja ---
    /**
     * Ustawia początkowy stan interfejsu użytkownika i ładuje postępy.
     */
    function initializeHomepage() {
        updateLevelButtonsUI();
        loadAllProgress();
        setupEventListeners();
        console.log('Strona główna zainicjalizowana.');
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
        // Nie logujemy tutaj, bo jest logowane w handleLevelButtonClick i przy inicjalizacji
        // console.log(`Wybrano poziom: ${selectedLevel}`);
    }

    /**
     * Obsługuje kliknięcie przycisku wyboru poziomu.
     * @param {Event} event - Zdarzenie kliknięcia.
     */
    function handleLevelButtonClick(event) {
        const button = event.target;
        selectedLevel = button.getAttribute('data-level');
        localStorage.setItem('selectedLevel', selectedLevel);
        console.log(`Zmieniono i zapisano poziom na: ${selectedLevel}`);
        updateLevelButtonsUI();
        // Można dodać odświeżanie opisów, jeśli zależą od poziomu (na razie nie)
    }

    // --- Ładowanie Postępów ---
    /**
     * Ładuje zapisane postępy ze wszystkich sekcji z localStorage.
     * @returns {object} Obiekt z danymi postępów lub pusty obiekt.
     */
    function getProgressData() {
        try {
            const dataString = localStorage.getItem('maturaProgress');
            // Sprawdź, czy dane istnieją i nie są puste
            if (dataString) {
                const data = JSON.parse(dataString);
                // Podstawowa walidacja, czy to obiekt
                if (typeof data === 'object' && data !== null) {
                    return data;
                } else {
                    console.warn('Dane postępów w localStorage nie są poprawnym obiektem JSON.');
                    return {};
                }
            }
            return {}; // Zwróć pusty obiekt, jeśli nic nie ma w localStorage
        } catch (error) {
            console.error('Błąd podczas parsowania danych postępów z localStorage:', error);
            // W przypadku błędu można rozważyć usunięcie błędnych danych
            // localStorage.removeItem('maturaProgress');
            return {}; // Zwróć pusty obiekt w razie błędu
        }
    }

    /**
     * Ładuje i wyświetla postępy dla wszystkich sekcji kursu.
     */
    function loadAllProgress() {
        const progressData = getProgressData();
        console.log('Ładowanie postępów z localStorage:', progressData);

        for (let i = 1; i <= 10; i++) {
            const weekId = `week-${i}`;
            // Używamy bezpiecznego dostępu i domyślnych wartości
            const sectionProgress = progressData[weekId] || { theoryRead: false, quizScore: null };

            let totalProgress = 0;
            // Sprawdzamy, czy theoryRead jest true
            if (sectionProgress.theoryRead === true) {
                totalProgress += 20;
            }
            // Sprawdzamy, czy quizScore jest liczbą i nie jest NaN
            if (typeof sectionProgress.quizScore === 'number' && !isNaN(sectionProgress.quizScore)) {
                 // quizScore to procent (0-100), stanowi 80% całości
                totalProgress += sectionProgress.quizScore * 0.8;
            }

            // Upewnij się, że wynik jest liczbą całkowitą
            updateProgressBar(weekId, Math.round(totalProgress));
        }
    }

    /**
     * Aktualizuje wizualnie pasek postępu dla danej sekcji.
     * @param {string} weekId - ID sekcji (np. 'week-1').
     * @param {number} percentage - Procent postępu (0-100).
     */
    function updateProgressBar(weekId, percentage) {
        // Upewnij się, że procent jest w zakresie 0-100
        const validPercentage = Math.max(0, Math.min(100, Math.round(percentage))); // Zaokrąglij i ogranicz
        const progressBar = document.getElementById(`progress-${weekId}`);
        const progressLabel = document.getElementById(`label-${weekId}`);

        if (progressBar && progressLabel) {
            progressBar.style.width = `${validPercentage}%`;
            progressLabel.textContent = `${validPercentage}%`;
        } else {
            // Ten log może być zbyt częsty, jeśli nie wszystkie elementy istnieją
            // console.warn(`Nie znaleziono elementów paska postępu dla ${weekId}`);
        }
    }

    // --- Nawigacja ---
    /**
     * Obsługuje kliknięcie linku do sekcji, zapisując wybrany poziom.
     * @param {Event} event - Zdarzenie kliknięcia.
     */
    function handleSectionLinkClick(event) {
        // Nie przerywamy domyślnej akcji (przejścia do linku)
        // Ale upewniamy się, że aktualnie wybrany poziom jest zapisany
        localStorage.setItem('selectedLevel', selectedLevel);
        console.log(`Przechodzenie do sekcji ${event.currentTarget.id}, zapisano poziom: ${selectedLevel}`);
        // Nie ma potrzeby odświeżania postępów tutaj, bo strona i tak się przeładuje
    }

    // --- Ustawienie Event Listenerów ---
    /**
     * Dodaje nasłuchiwanie zdarzeń do przycisków i linków.
     */
    function setupEventListeners() {
        // Nasłuchiwanie na przyciski poziomu
        levelButtons.forEach(button => {
            button.addEventListener('click', handleLevelButtonClick);
        });

        // Nasłuchiwanie na linki do sekcji kursu
        const sectionLinks = document.querySelectorAll('.grid-item[href^="section.html"]');
        sectionLinks.forEach(link => {
            link.addEventListener('click', handleSectionLinkClick);
        });

        // Można dodać listenery dla Kompendium i Matury Próbnej, jeśli potrzebne
        // const compendiumLink = document.getElementById('compendium');
        // const mockExamLink = document.getElementById('mock-exam');
        // if (compendiumLink) compendiumLink.addEventListener('click', () => console.log('Kliknięto Kompendium'));
        // if (mockExamLink) mockExamLink.addEventListener('click', () => console.log('Kliknięto Maturę Próbną'));
    }

    // --- Inicjalizacja po załadowaniu DOM ---
    initializeHomepage();

}); // Koniec DOMContentLoaded listener
