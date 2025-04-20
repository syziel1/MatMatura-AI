/**
 * Logika dla nowej strony startowej (start.html).
 * Sprawdza, czy użytkownik jest nowy, czy powracający,
 * i wyświetla odpowiednią treść.
 */
document.addEventListener('DOMContentLoaded', () => {
    console.log('Start page script loaded.');

    const welcomeNewDiv = document.getElementById('welcome-new');
    const welcomeBackDiv = document.getElementById('welcome-back');
    const greetingElement = document.getElementById('greeting');
    const currentTopicElement = document.getElementById('current-topic');
    const startLessonButton = document.getElementById('start-lesson-button');

    // Sprawdź, czy istnieje konfiguracja użytkownika w localStorage
    let userConfig = null;
    try {
        const configString = localStorage.getItem('maturaUserConfig');
        if (configString) {
            userConfig = JSON.parse(configString);
            console.log('Znaleziono konfigurację użytkownika:', userConfig);
        } else {
            console.log('Brak konfiguracji użytkownika w localStorage.');
        }
    } catch (error) {
        console.error('Błąd podczas odczytu konfiguracji użytkownika:', error);
        // W razie błędu traktuj jak nowego użytkownika
        localStorage.removeItem('maturaUserConfig'); // Usuń błędne dane
    }

    // Wyświetl odpowiednią sekcję
    if (userConfig && userConfig.name && userConfig.maturaDate && userConfig.level) {
        // Użytkownik powracający - ma konfigurację
        displayWelcomeBack(userConfig);
    } else {
        // Użytkownik nowy lub niepełna konfiguracja
        displayWelcomeNew();
    }

    /**
     * Wyświetla sekcję dla nowych użytkowników.
     */
    function displayWelcomeNew() {
        if (welcomeNewDiv) {
            welcomeNewDiv.classList.remove('js-hidden'); // Pokaż sekcję
            console.log('Wyświetlono sekcję dla nowego użytkownika.');
        }
         if (welcomeBackDiv) {
            welcomeBackDiv.classList.add('js-hidden'); // Ukryj sekcję dla powracających
        }
    }

    /**
     * Wyświetla sekcję dla powracających użytkowników i ustawia dynamiczne treści.
     * @param {object} config - Obiekt konfiguracji użytkownika.
     */
    function displayWelcomeBack(config) {
        if (welcomeBackDiv && greetingElement && currentTopicElement && startLessonButton) {
            // Ustaw powitanie
            greetingElement.textContent = `Witaj ponownie, ${config.name}!`;

            // --- Logika wyznaczania bieżącego tematu (PROTOTYP) ---
            // TODO: W przyszłości zaimplementować logikę obliczania
            //       aktualnego tygodnia/tematu na podstawie daty matury i bieżącej daty.
            // Na razie, dla prototypu, zawsze pokazujemy Tydzień 1.
            const currentWeek = 1;
            const currentTopic = getTopicForWeek(currentWeek, config.level); // Pobierz nazwę tematu
            // --- Koniec logiki prototypu ---

            currentTopicElement.textContent = currentTopic;

            // Ustaw link przycisku "Rozpocznij lekcję"
            startLessonButton.href = `section.html?week=${currentWeek}`;

            welcomeBackDiv.classList.remove('js-hidden'); // Pokaż sekcję
            console.log(`Wyświetlono sekcję dla powracającego użytkownika. Bieżący tydzień (prototyp): ${currentWeek}`);

        } else {
             console.error('Nie znaleziono wszystkich elementów dla sekcji powitalnej powracającego użytkownika.');
             // W razie problemu, pokaż sekcję dla nowego użytkownika jako fallback
             displayWelcomeNew();
             return; // Zakończ, aby uniknąć błędów poniżej
        }

        if (welcomeNewDiv) {
            welcomeNewDiv.classList.add('js-hidden'); // Ukryj sekcję dla nowych
        }
    }

    /**
     * Zwraca nazwę tematu dla danego tygodnia (PROTOTYP).
     * @param {number} week - Numer tygodnia (1-10).
     * @param {string} level - Poziom ('pp' lub 'pr').
     * @returns {string} Nazwa tematu.
     */
    function getTopicForWeek(week, level) {
        // TODO: Rozbudować o tematy dla wszystkich tygodni
        const topics = [
            "Liczby Rzeczywiste i Zbiory", // Tydzień 1
            "Wyrażenia Algebraiczne i Funkcje", // Tydzień 2
            "Funkcja Liniowa i Kwadratowa", // Tydzień 3
            "Wielomiany i Funkcje Wymierne", // Tydzień 4
            "Funkcje Wykładnicze i Logarytmiczne", // Tydzień 5
            "Trygonometria", // Tydzień 6
            "Ciągi Liczbowe", // Tydzień 7
            "Planimetria", // Tydzień 8
            "Geometria Analityczna i Stereometria", // Tydzień 9
            "Statystyka i Rachunek Prawdopodobieństwa" // Tydzień 10
        ];
        if (week >= 1 && week <= topics.length) {
            return `${topics[week - 1]} (Tydzień ${week})`;
        } else {
            return "Nieznany temat";
        }
        // Można dodać różnicowanie tematów dla PP/PR jeśli jest taka potrzeba w nazwie
    }

});
