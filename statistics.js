/**
 * Statistics module for MatMatura-AI
 * Oblicza i generuje szczegółowe statystyki nauki
 */

const Statistics = {
    /**
     * Oblicza całkowity postęp użytkownika
     * @returns {object} Obiekt ze statystykami postępu
     */
    calculateOverallProgress() {
        const progressData = StorageManager.getProgressData();
        let totalProgress = 0;
        let completedWeeks = 0;
        let theoryReadCount = 0;
        let quizzesCompletedCount = 0;
        let totalQuizScore = 0;
        let quizCount = 0;

        for (let i = 1; i <= CONSTANTS.WEEKS_TOTAL; i++) {
            const weekId = `week-${i}`;
            const sectionProgress = progressData[weekId] || { 
                theoryRead: false, 
                quizScore: null 
            };

            let weekProgress = 0;

            // Teoria (20%)
            if (sectionProgress.theoryRead === true) {
                weekProgress += CONSTANTS.THEORY_PROGRESS_WEIGHT;
                theoryReadCount++;
            }

            // Quiz (80%)
            if (typeof sectionProgress.quizScore === 'number' && !isNaN(sectionProgress.quizScore)) {
                const quizContribution = sectionProgress.quizScore * (CONSTANTS.QUIZ_PROGRESS_WEIGHT / 100);
                weekProgress += quizContribution;
                quizzesCompletedCount++;
                totalQuizScore += sectionProgress.quizScore;
                quizCount++;
            }

            totalProgress += weekProgress;

            // Tydzień uznajemy za ukończony jeśli ma 100%
            if (weekProgress >= 100) {
                completedWeeks++;
            }
        }

        const averageProgress = CONSTANTS.WEEKS_TOTAL > 0 
            ? Math.round(totalProgress / CONSTANTS.WEEKS_TOTAL) 
            : 0;

        const averageQuizScore = quizCount > 0 
            ? Math.round(totalQuizScore / quizCount) 
            : 0;

        return {
            averageProgress,
            completedWeeks,
            totalWeeks: CONSTANTS.WEEKS_TOTAL,
            theoryReadCount,
            quizzesCompletedCount,
            averageQuizScore,
            progressByWeek: this.getProgressByWeek()
        };
    },

    /**
     * Pobiera postęp dla każdego tygodnia
     * @returns {Array} Tablica z postępem dla każdego tygodnia
     */
    getProgressByWeek() {
        const progressData = StorageManager.getProgressData();
        const weeklyProgress = [];

        for (let i = 1; i <= CONSTANTS.WEEKS_TOTAL; i++) {
            const weekId = `week-${i}`;
            const sectionProgress = progressData[weekId] || { 
                theoryRead: false, 
                quizScore: null 
            };

            let weekProgress = 0;

            if (sectionProgress.theoryRead === true) {
                weekProgress += CONSTANTS.THEORY_PROGRESS_WEIGHT;
            }

            if (typeof sectionProgress.quizScore === 'number' && !isNaN(sectionProgress.quizScore)) {
                weekProgress += sectionProgress.quizScore * (CONSTANTS.QUIZ_PROGRESS_WEIGHT / 100);
            }

            weeklyProgress.push({
                weekNumber: i,
                topic: Utils.getTopicForWeek(i),
                progress: Math.round(weekProgress),
                theoryRead: sectionProgress.theoryRead,
                quizScore: sectionProgress.quizScore,
                incorrectQuestions: sectionProgress.incorrectQuestions || []
            });
        }

        return weeklyProgress;
    },

    /**
     * Oblicza statystyki czasowe
     * @returns {object} Obiekt ze statystykami czasowymi
     */
    calculateTimeStats() {
        const userConfig = StorageManager.getUserConfig();
        
        if (!userConfig || !userConfig.maturaDate) {
            return null;
        }

        const maturaDate = new Date(userConfig.maturaDate);
        const today = new Date();
        const normalizedToday = Utils.normalizeDate(today);
        const normalizedMatura = Utils.normalizeDate(maturaDate);

        const daysUntilMatura = Utils.daysBetween(normalizedToday, normalizedMatura);
        const currentWeek = Utils.getCurrentWeek(maturaDate, today);
        const expectedProgress = Utils.getExpectedProgress(maturaDate, today);

        const totalStudyDays = CONSTANTS.WEEKS_TOTAL * CONSTANTS.DAYS_PER_WEEK;
        const studyStartDate = new Date(normalizedMatura);
        studyStartDate.setDate(normalizedMatura.getDate() - totalStudyDays);

        const daysIntoStudy = currentWeek > 0 
            ? Utils.daysBetween(studyStartDate, normalizedToday)
            : 0;

        return {
            daysUntilMatura: Math.max(0, daysUntilMatura),
            currentWeek,
            expectedProgress,
            daysIntoStudy: Math.max(0, daysIntoStudy),
            totalStudyDays,
            studyStartDate: Utils.formatDateToISO(studyStartDate),
            maturaDate: Utils.formatDateToISO(maturaDate)
        };
    },

    /**
     * Oblicza różnicę między rzeczywistym a oczekiwanym postępem
     * @returns {object} Obiekt z informacją o różnicy
     */
    calculateProgressDelta() {
        const overallStats = this.calculateOverallProgress();
        const timeStats = this.calculateTimeStats();

        if (!timeStats) {
            return null;
        }

        const actualProgress = overallStats.averageProgress;
        const expectedProgress = timeStats.expectedProgress;
        const delta = actualProgress - expectedProgress;

        let status = 'on-track';
        let message = 'Jesteś na dobrej drodze!';

        if (delta > 10) {
            status = 'ahead';
            message = 'Świetna robota! Jesteś przed planem!';
        } else if (delta < -10) {
            status = 'behind';
            message = 'Musisz przyspieszyć, aby nadrobić zaległości.';
        }

        return {
            actualProgress,
            expectedProgress,
            delta,
            status,
            message
        };
    },

    /**
     * Generuje rekomendacje dla użytkownika
     * @returns {Array} Tablica z rekomendacjami
     */
    generateRecommendations() {
        const recommendations = [];
        const overallStats = this.calculateOverallProgress();
        const timeStats = this.calculateTimeStats();
        const progressDelta = this.calculateProgressDelta();

        // Rekomendacja 1: Zaległości w postępie
        if (progressDelta && progressDelta.delta < -10) {
            recommendations.push({
                type: 'warning',
                priority: 'high',
                title: 'Jesteś w tyle z planem',
                message: `Twój postęp (${progressDelta.actualProgress}%) jest niższy od oczekiwanego (${progressDelta.expectedProgress}%). Poświęć więcej czasu na naukę.`,
                action: 'Przejdź do kokpitu',
                actionUrl: 'kokpit.html'
            });
        }

        // Rekomendacja 2: Nieukończone tygodnie
        const weeklyProgress = overallStats.progressByWeek;
        const incompleteWeeks = weeklyProgress.filter(w => w.progress < 100 && w.weekNumber <= timeStats.currentWeek);
        
        if (incompleteWeeks.length > 0) {
            const weekNumbers = incompleteWeeks.map(w => w.weekNumber).join(', ');
            recommendations.push({
                type: 'info',
                priority: 'medium',
                title: 'Nieukończone tygodnie',
                message: `Masz nieukończone tygodnie: ${weekNumbers}. Rozważ ich dokończenie.`,
                action: 'Zobacz szczegóły',
                actionUrl: 'kokpit.html'
            });
        }

        // Rekomendacja 3: Słabe wyniki w quizach
        if (overallStats.averageQuizScore > 0 && overallStats.averageQuizScore < 70) {
            recommendations.push({
                type: 'warning',
                priority: 'high',
                title: 'Niskie wyniki w quizach',
                message: `Twoja średnia z quizów to ${overallStats.averageQuizScore}%. Powtórz materiał i spróbuj ponownie.`,
                action: 'Powtórz błędne zadania',
                actionUrl: 'kokpit.html'
            });
        }

        // Rekomendacja 4: Brak aktywności w teorii
        if (overallStats.theoryReadCount < timeStats.currentWeek) {
            recommendations.push({
                type: 'info',
                priority: 'medium',
                title: 'Przeczytaj teorię',
                message: `Nie przeczytałeś/aś teorii dla wszystkich bieżących tygodni. Teoria to fundament!`,
                action: 'Przejdź do nauki',
                actionUrl: 'kokpit.html'
            });
        }

        // Rekomendacja 5: Gratulacje za dobre wyniki
        if (progressDelta && progressDelta.delta > 10 && overallStats.averageQuizScore >= 80) {
            recommendations.push({
                type: 'success',
                priority: 'low',
                title: 'Świetna robota!',
                message: `Jesteś przed planem i masz wysokie wyniki! Tak trzymaj!`,
                action: null,
                actionUrl: null
            });
        }

        // Rekomendacja 6: Zbliżająca się matura
        if (timeStats.daysUntilMatura > 0 && timeStats.daysUntilMatura <= 14) {
            recommendations.push({
                type: 'warning',
                priority: 'high',
                title: 'Matura już niedługo!',
                message: `Do matury zostało tylko ${timeStats.daysUntilMatura} dni. Skoncentruj się na powtórkach.`,
                action: 'Zobacz postępy',
                actionUrl: 'kokpit.html'
            });
        }

        // Sortuj według priorytetu
        const priorityOrder = { high: 1, medium: 2, low: 3 };
        recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

        return recommendations;
    },

    /**
     * Generuje raport postępów w formacie tekstowym
     * @returns {string} Raport tekstowy
     */
    generateTextReport() {
        const overallStats = this.calculateOverallProgress();
        const timeStats = this.calculateTimeStats();
        const progressDelta = this.calculateProgressDelta();
        const userConfig = StorageManager.getUserConfig();

        let report = '=== RAPORT POSTĘPÓW - MATURA MASTER ===\n\n';
        
        if (userConfig) {
            report += `Imię: ${userConfig.name}\n`;
            report += `Poziom: ${userConfig.level.toUpperCase()}\n`;
            report += `Data matury: ${userConfig.maturaDate}\n\n`;
        }

        if (timeStats) {
            report += '--- STATYSTYKI CZASOWE ---\n';
            report += `Dni do matury: ${timeStats.daysUntilMatura}\n`;
            report += `Bieżący tydzień: ${timeStats.currentWeek}/${CONSTANTS.WEEKS_TOTAL}\n`;
            report += `Oczekiwany postęp: ${timeStats.expectedProgress}%\n\n`;
        }

        report += '--- POSTĘP OGÓLNY ---\n';
        report += `Średni postęp: ${overallStats.averageProgress}%\n`;
        report += `Ukończone tygodnie: ${overallStats.completedWeeks}/${overallStats.totalWeeks}\n`;
        report += `Przeczytana teoria: ${overallStats.theoryReadCount}/${overallStats.totalWeeks}\n`;
        report += `Ukończone quizy: ${overallStats.quizzesCompletedCount}/${overallStats.totalWeeks}\n`;
        report += `Średnia z quizów: ${overallStats.averageQuizScore}%\n\n`;

        if (progressDelta) {
            report += '--- ANALIZA POSTĘPU ---\n';
            report += `Status: ${progressDelta.status}\n`;
            report += `Różnica: ${progressDelta.delta > 0 ? '+' : ''}${progressDelta.delta}%\n`;
            report += `${progressDelta.message}\n\n`;
        }

        report += '--- POSTĘP TYGODNIOWY ---\n';
        overallStats.progressByWeek.forEach(week => {
            const status = week.progress >= 100 ? '✓' : 
                          week.progress >= 50 ? '◐' : '○';
            report += `${status} Tydzień ${week.weekNumber}: ${week.topic} - ${week.progress}%\n`;
        });

        report += `\n\nWygenerowano: ${new Date().toLocaleString('pl-PL')}\n`;

        return report;
    },

    /**
     * Eksportuje statystyki do JSON
     * @returns {string} JSON string ze statystykami
     */
    exportStatistics() {
        const stats = {
            overall: this.calculateOverallProgress(),
            time: this.calculateTimeStats(),
            delta: this.calculateProgressDelta(),
            recommendations: this.generateRecommendations(),
            userConfig: StorageManager.getUserConfig(),
            exportDate: new Date().toISOString()
        };

        return JSON.stringify(stats, null, 2);
    },

    /**
     * Pobiera słabe obszary wymagające poprawy
     * @returns {Array} Tablica z tematami wymagającymi uwagi
     */
    getWeakAreas() {
        const weeklyProgress = this.getProgressByWeek();
        const timeStats = this.calculateTimeStats();

        // Filtruj tygodnie, które powinny być już ukończone ale mają niski postęp
        const weakAreas = weeklyProgress.filter(week => {
            return week.weekNumber <= timeStats.currentWeek && week.progress < 70;
        });

        return weakAreas.map(week => ({
            weekNumber: week.weekNumber,
            topic: week.topic,
            progress: week.progress,
            suggestion: week.theoryRead 
                ? 'Powtórz teorię i spróbuj ponownie rozwiązać quiz.'
                : 'Zacznij od przeczytania teorii.'
        }));
    },

    /**
     * Oblicza przewidywaną datę ukończenia przy obecnym tempie
     * @returns {object|null} Obiekt z przewidywaną datą lub null
     */
    predictCompletionDate() {
        const overallStats = this.calculateOverallProgress();
        const timeStats = this.calculateTimeStats();

        if (!timeStats || timeStats.daysIntoStudy === 0) {
            return null;
        }

        const currentProgress = overallStats.averageProgress;
        const daysElapsed = timeStats.daysIntoStudy;
        const progressPerDay = currentProgress / daysElapsed;

        if (progressPerDay === 0) {
            return null;
        }

        const remainingProgress = 100 - currentProgress;
        const daysNeeded = Math.ceil(remainingProgress / progressPerDay);

        const today = new Date();
        const predictedDate = new Date(today);
        predictedDate.setDate(today.getDate() + daysNeeded);

        const maturaDate = new Date(timeStats.maturaDate);
        const willFinishOnTime = predictedDate <= maturaDate;

        return {
            predictedDate: Utils.formatDateToISO(predictedDate),
            daysNeeded,
            willFinishOnTime,
            message: willFinishOnTime 
                ? 'Przy obecnym tempie ukończysz plan przed maturą!'
                : 'Musisz przyspieszyć, aby ukończyć plan przed maturą.'
        };
    }
};

// Freeze the object
Object.freeze(Statistics);

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Statistics;
}
