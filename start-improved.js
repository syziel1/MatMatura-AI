/**
 * Improved start page logic for MatMatura-AI
 * Ulepszona wersja z lepszą obsługą błędów i UX
 */
document.addEventListener('DOMContentLoaded', () => {
    console.log('Start page script loaded (improved version).');

    const welcomeNewDiv = document.getElementById('welcome-new');
    const welcomeBackDiv = document.getElementById('welcome-back');
    const greetingElement = document.getElementById('greeting');
    const currentTopicElement = document.getElementById('current-topic');
    const startLessonButton = document.getElementById('start-lesson-button');

    /**
     * Inicjalizuje stronę startową
     */
    function initStartPage() {
        // Sprawdź dostępność localStorage
        if (!StorageManager.isAvailable()) {
            showError('Twoja przeglądarka nie obsługuje localStorage. Aplikacja może nie działać poprawnie.');
            displayWelcomeNew();
            return;
        }

        // Pobierz konfigurację użytkownika
        const userConfig = StorageManager.getUserConfig();

        // Sprawdź czy konfiguracja jest kompletna
        if (userConfig && userConfig.configComplete && userConfig.name && userConfig.maturaDate && userConfig.level) {
            displayWelcomeBack(userConfig);
        } else {
            displayWelcomeNew();
        }
    }

    /**
     * Wyświetla sekcję dla nowych użytkowników
     */
    function displayWelcomeNew() {
        if (welcomeNewDiv) {
            welcomeNewDiv.classList.remove('js-hidden');
            console.log('Wyświetlono sekcję dla nowego użytkownika.');
        }
        if (welcomeBackDiv) {
            welcomeBackDiv.classList.add('js-hidden');
        }
    }

    /**
     * Wyświetla sekcję dla powracających użytkowników
     * @param {object} config - Obiekt konfiguracji użytkownika
     */
    function displayWelcomeBack(config) {
        if (!welcomeBackDiv || !greetingElement || !currentTopicElement || !startLessonButton) {
            console.error('Nie znaleziono wszystkich elementów dla sekcji powitalnej.');
            displayWelcomeNew();
            return;
        }

        try {
            // Ustaw powitanie
            greetingElement.textContent = `Witaj ponownie, ${Utils.escapeHtml(config.name)}!`;

            // Oblicz bieżący tydzień
            const maturaDate = new Date(config.maturaDate);
            const currentWeek = Utils.getCurrentWeek(maturaDate);

            // Sprawdź status nauki
            let weekToDisplay = currentWeek;
            let topicText = '';

            if (currentWeek === 0) {
                // Przed rozpoczęciem planu
                weekToDisplay = 1;
                topicText = `${Utils.getTopicForWeek(1)} (Plan rozpocznie się wkrótce)`;
            } else if (currentWeek > CONSTANTS.WEEKS_TOTAL) {
                // Po zakończeniu planu
                weekToDisplay = CONSTANTS.WEEKS_TOTAL;
                topicText = 'Gratulacje! Ukończyłeś/aś cały plan nauki!';
                
                // Zmień tekst przycisku
                startLessonButton.textContent = 'Przejdź do kokpitu';
                startLessonButton.href = 'kokpit.html';
            } else {
                // W trakcie planu
                topicText = Utils.getTopicForWeek(currentWeek);
            }

            currentTopicElement.textContent = topicText;

            // Ustaw link przycisku "Rozpocznij lekcję"
            if (currentWeek <= CONSTANTS.WEEKS_TOTAL) {
                startLessonButton.href = `section.html?week=${weekToDisplay}`;
            }

            // Pokaż sekcję
            welcomeBackDiv.classList.remove('js-hidden');
            console.log(`Wyświetlono sekcję dla powracającego użytkownika. Bieżący tydzień: ${currentWeek}`);

            // Pokaż statystyki postępu
            displayProgressSummary(config);

            // Pokaż rekomendacje jeśli są dostępne
            displayRecommendations();

        } catch (error) {
            console.error('Błąd podczas wyświetlania sekcji powitalnej:', error);
            showError('Wystąpił błąd podczas ładowania danych. Spróbuj odświeżyć stronę.');
            displayWelcomeNew();
        }

        if (welcomeNewDiv) {
            welcomeNewDiv.classList.add('js-hidden');
        }
    }

    /**
     * Wyświetla podsumowanie postępu
     * @param {object} config - Konfiguracja użytkownika
     */
    function displayProgressSummary(config) {
        const timeStats = Statistics.calculateTimeStats();
        const overallStats = Statistics.calculateOverallProgress();

        if (!timeStats) return;

        // Utwórz element z podsumowaniem jeśli nie istnieje
        let summaryDiv = document.getElementById('progress-summary');
        if (!summaryDiv) {
            summaryDiv = document.createElement('div');
            summaryDiv.id = 'progress-summary';
            summaryDiv.className = 'progress-summary';
            welcomeBackDiv.appendChild(summaryDiv);
        }

        // Oblicz różnicę postępu
        const progressDelta = Statistics.calculateProgressDelta();
        const deltaClass = progressDelta.status === 'ahead' ? 'ahead' : 
                          progressDelta.status === 'behind' ? 'behind' : 'on-track';

        summaryDiv.innerHTML = `
            <div class="summary-stats">
                <div class="summary-stat">
                    <span class="stat-value">${timeStats.daysUntilMatura}</span>
                    <span class="stat-label">dni do matury</span>
                </div>
                <div class="summary-stat">
                    <span class="stat-value">${overallStats.averageProgress}%</span>
                    <span class="stat-label">postęp</span>
                </div>
                <div class="summary-stat">
                    <span class="stat-value">${overallStats.completedWeeks}/${overallStats.totalWeeks}</span>
                    <span class="stat-label">ukończone tygodnie</span>
                </div>
            </div>
            <div class="progress-status ${deltaClass}">
                ${progressDelta.message}
            </div>
        `;
    }

    /**
     * Wyświetla rekomendacje dla użytkownika
     */
    function displayRecommendations() {
        const recommendations = Statistics.generateRecommendations();
        
        if (recommendations.length === 0) return;

        // Pokaż tylko najważniejszą rekomendację
        const topRecommendation = recommendations[0];
        
        // Użyj systemu powiadomień jeśli dostępny
        if (window.NotificationManager) {
            const notifType = topRecommendation.type;
            NotificationManager.show(topRecommendation.message, notifType, 5000);
        }
    }

    /**
     * Wyświetla komunikat o błędzie
     * @param {string} message - Treść błędu
     */
    function showError(message) {
        if (window.NotificationManager) {
            NotificationManager.showError(message, 0);
        } else {
            console.error(message);
            alert(message);
        }
    }

    /**
     * Sprawdza czy użytkownik wrócił po dłuższej nieobecności
     */
    function checkLastVisit() {
        const lastVisit = StorageManager.getItem('lastVisit', null);
        const now = new Date().toISOString();

        if (lastVisit) {
            const lastVisitDate = new Date(lastVisit);
            const daysSinceLastVisit = Utils.daysBetween(lastVisitDate, new Date());

            if (daysSinceLastVisit > 7) {
                if (window.NotificationManager) {
                    NotificationManager.showInfo(
                        `Witaj z powrotem! Minęło ${daysSinceLastVisit} dni od ostatniej wizyty. Czas wrócić do nauki!`
                    );
                }
            }
        }

        // Zapisz bieżącą wizytę
        StorageManager.setItem('lastVisit', now);
    }

    /**
     * Dodaje animacje do elementów
     */
    function addAnimations() {
        // Animacja fade-in dla widocznej sekcji
        const visibleSection = welcomeNewDiv?.classList.contains('js-hidden') 
            ? welcomeBackDiv 
            : welcomeNewDiv;

        if (visibleSection) {
            visibleSection.classList.add('fade-in');
        }
    }

    /**
     * Konfiguruje keyboard shortcuts
     */
    function setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Enter na przycisku "Rozpocznij lekcję"
            if (e.key === 'Enter' && startLessonButton && !startLessonButton.classList.contains('js-hidden')) {
                startLessonButton.click();
            }

            // 'c' dla konfiguracji (tylko dla nowych użytkowników)
            if (e.key === 'c' && !welcomeNewDiv?.classList.contains('js-hidden')) {
                const configButton = document.getElementById('config-button');
                if (configButton) {
                    configButton.click();
                }
            }

            // 'k' dla kokpitu (tylko dla powracających użytkowników)
            if (e.key === 'k' && !welcomeBackDiv?.classList.contains('js-hidden')) {
                window.location.href = 'kokpit.html';
            }
        });
    }

    // --- Inicjalizacja ---
    try {
        initStartPage();
        checkLastVisit();
        addAnimations();
        setupKeyboardShortcuts();

        // Sprawdź wykorzystanie storage
        const storageUsage = StorageManager.getUsagePercentage();
        if (storageUsage > 90) {
            if (window.NotificationManager) {
                NotificationManager.showWarning(
                    `Pamięć przeglądarki jest prawie pełna (${storageUsage}%). Rozważ eksport i wyczyszczenie danych.`
                );
            }
        }
    } catch (error) {
        console.error('Błąd podczas inicjalizacji strony startowej:', error);
        showError('Wystąpił nieoczekiwany błąd. Spróbuj odświeżyć stronę.');
    }
});
