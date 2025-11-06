/**
 * Export module for MatMatura-AI
 * Umożliwia eksport danych i raportów w różnych formatach
 */

const ExportManager = {
    /**
     * Eksportuje dane do pliku JSON
     */
    exportToJSON() {
        try {
            const data = StorageManager.exportData();
            this.downloadFile(data, 'matmatura-backup.json', 'application/json');
            NotificationManager.showSuccess('Dane wyeksportowane do JSON!');
        } catch (error) {
            console.error('Error exporting to JSON:', error);
            NotificationManager.showError('Błąd podczas eksportu danych.');
        }
    },

    /**
     * Eksportuje raport postępów do pliku tekstowego
     */
    exportProgressReport() {
        try {
            const report = Statistics.generateTextReport();
            this.downloadFile(report, 'raport-postepow.txt', 'text/plain');
            NotificationManager.showSuccess('Raport wyeksportowany!');
        } catch (error) {
            console.error('Error exporting progress report:', error);
            NotificationManager.showError('Błąd podczas eksportu raportu.');
        }
    },

    /**
     * Eksportuje statystyki do pliku JSON
     */
    exportStatistics() {
        try {
            const stats = Statistics.exportStatistics();
            this.downloadFile(stats, 'statystyki.json', 'application/json');
            NotificationManager.showSuccess('Statystyki wyeksportowane!');
        } catch (error) {
            console.error('Error exporting statistics:', error);
            NotificationManager.showError('Błąd podczas eksportu statystyk.');
        }
    },

    /**
     * Eksportuje dane do formatu CSV
     */
    exportToCSV() {
        try {
            const weeklyProgress = Statistics.getProgressByWeek();
            
            // Nagłówki CSV
            let csv = 'Tydzień,Temat,Postęp (%),Teoria przeczytana,Wynik quizu (%)\n';
            
            // Dane
            weeklyProgress.forEach(week => {
                csv += `${week.weekNumber},"${week.topic}",${week.progress},`;
                csv += `${week.theoryRead ? 'Tak' : 'Nie'},`;
                csv += `${week.quizScore !== null ? week.quizScore : 'Brak'}\n`;
            });

            this.downloadFile(csv, 'postep-tygodniowy.csv', 'text/csv');
            NotificationManager.showSuccess('Dane wyeksportowane do CSV!');
        } catch (error) {
            console.error('Error exporting to CSV:', error);
            NotificationManager.showError('Błąd podczas eksportu do CSV.');
        }
    },

    /**
     * Generuje i eksportuje certyfikat ukończenia
     */
    exportCertificate() {
        try {
            const userConfig = StorageManager.getUserConfig();
            const overallStats = Statistics.calculateOverallProgress();

            if (!userConfig) {
                NotificationManager.showError('Brak danych użytkownika.');
                return;
            }

            if (overallStats.averageProgress < 100) {
                NotificationManager.showWarning('Certyfikat dostępny po ukończeniu 100% kursu.');
                return;
            }

            const certificate = this.generateCertificateHTML(userConfig, overallStats);
            this.downloadFile(certificate, 'certyfikat.html', 'text/html');
            NotificationManager.showSuccess('Certyfikat wygenerowany! Gratulacje!');
        } catch (error) {
            console.error('Error exporting certificate:', error);
            NotificationManager.showError('Błąd podczas generowania certyfikatu.');
        }
    },

    /**
     * Generuje HTML certyfikatu
     * @param {object} userConfig - Konfiguracja użytkownika
     * @param {object} stats - Statystyki
     * @returns {string} HTML certyfikatu
     */
    generateCertificateHTML(userConfig, stats) {
        const completionDate = new Date().toLocaleDateString('pl-PL');
        
        return `<!DOCTYPE html>
<html lang="pl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Certyfikat Ukończenia - Matura Master</title>
    <style>
        body {
            font-family: 'Georgia', serif;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        .certificate {
            background: white;
            padding: 60px;
            max-width: 800px;
            text-align: center;
            border: 10px solid #0056b3;
            box-shadow: 0 10px 40px rgba(0,0,0,0.3);
        }
        .certificate h1 {
            color: #0056b3;
            font-size: 3em;
            margin: 0 0 20px 0;
            text-transform: uppercase;
            letter-spacing: 2px;
        }
        .certificate h2 {
            color: #333;
            font-size: 1.5em;
            margin: 30px 0;
            font-weight: normal;
        }
        .certificate .name {
            font-size: 2.5em;
            color: #0056b3;
            font-weight: bold;
            margin: 30px 0;
            border-bottom: 2px solid #0056b3;
            padding-bottom: 10px;
            display: inline-block;
        }
        .certificate .details {
            margin: 30px 0;
            font-size: 1.1em;
            line-height: 1.8;
            color: #555;
        }
        .certificate .stats {
            display: flex;
            justify-content: space-around;
            margin: 40px 0;
        }
        .certificate .stat {
            text-align: center;
        }
        .certificate .stat-value {
            font-size: 2em;
            color: #0056b3;
            font-weight: bold;
        }
        .certificate .stat-label {
            font-size: 0.9em;
            color: #777;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        .certificate .footer {
            margin-top: 50px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            color: #999;
            font-size: 0.9em;
        }
        @media print {
            body { background: white; }
            .certificate { box-shadow: none; }
        }
    </style>
</head>
<body>
    <div class="certificate">
        <h1>Certyfikat Ukończenia</h1>
        <h2>Matura Master - Matematyka</h2>
        
        <p class="details">Niniejszym poświadcza się, że</p>
        
        <div class="name">${Utils.escapeHtml(userConfig.name)}</div>
        
        <p class="details">
            z sukcesem ukończył/a 10-tygodniowy kurs przygotowawczy<br>
            do matury z matematyki na poziomie <strong>${userConfig.level.toUpperCase()}</strong>
        </p>
        
        <div class="stats">
            <div class="stat">
                <div class="stat-value">${stats.completedWeeks}/${stats.totalWeeks}</div>
                <div class="stat-label">Ukończone tygodnie</div>
            </div>
            <div class="stat">
                <div class="stat-value">${stats.averageQuizScore}%</div>
                <div class="stat-label">Średnia z quizów</div>
            </div>
            <div class="stat">
                <div class="stat-value">${stats.averageProgress}%</div>
                <div class="stat-label">Całkowity postęp</div>
            </div>
        </div>
        
        <p class="details">
            Data ukończenia: <strong>${completionDate}</strong><br>
            Data matury: <strong>${new Date(userConfig.maturaDate).toLocaleDateString('pl-PL')}</strong>
        </p>
        
        <div class="footer">
            Matura Master © ${new Date().getFullYear()}<br>
            Certyfikat wygenerowany automatycznie
        </div>
    </div>
</body>
</html>`;
    },

    /**
     * Importuje dane z pliku JSON
     * @param {File} file - Plik do zaimportowania
     */
    async importFromJSON(file) {
        try {
            const text = await file.text();
            const success = StorageManager.importData(text);
            
            if (success) {
                NotificationManager.showSuccess('Dane zaimportowane pomyślnie!');
                // Odśwież stronę po 1 sekundzie
                setTimeout(() => {
                    window.location.reload();
                }, 1000);
            } else {
                NotificationManager.showError('Błąd podczas importu danych.');
            }
        } catch (error) {
            console.error('Error importing data:', error);
            NotificationManager.showError('Nieprawidłowy format pliku.');
        }
    },

    /**
     * Pobiera plik na dysk użytkownika
     * @param {string} content - Zawartość pliku
     * @param {string} filename - Nazwa pliku
     * @param {string} mimeType - Typ MIME
     */
    downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    },

    /**
     * Tworzy przycisk eksportu w interfejsie
     * @param {string} containerId - ID kontenera dla przycisków
     */
    createExportButtons(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const exportSection = document.createElement('div');
        exportSection.className = 'export-section';
        exportSection.innerHTML = `
            <h3>Eksport danych</h3>
            <div class="export-buttons">
                <button id="export-json-btn" class="export-button">
                    📦 Eksportuj dane (JSON)
                </button>
                <button id="export-report-btn" class="export-button">
                    📄 Eksportuj raport (TXT)
                </button>
                <button id="export-csv-btn" class="export-button">
                    📊 Eksportuj postęp (CSV)
                </button>
                <button id="export-stats-btn" class="export-button">
                    📈 Eksportuj statystyki (JSON)
                </button>
                <button id="export-certificate-btn" class="export-button">
                    🏆 Generuj certyfikat
                </button>
            </div>
            <div class="import-section" style="margin-top: 20px;">
                <h3>Import danych</h3>
                <input type="file" id="import-file-input" accept=".json" style="display: none;">
                <button id="import-json-btn" class="export-button">
                    📥 Importuj dane (JSON)
                </button>
            </div>
        `;

        container.appendChild(exportSection);

        // Event listeners
        document.getElementById('export-json-btn').addEventListener('click', () => this.exportToJSON());
        document.getElementById('export-report-btn').addEventListener('click', () => this.exportProgressReport());
        document.getElementById('export-csv-btn').addEventListener('click', () => this.exportToCSV());
        document.getElementById('export-stats-btn').addEventListener('click', () => this.exportStatistics());
        document.getElementById('export-certificate-btn').addEventListener('click', () => this.exportCertificate());
        
        const importBtn = document.getElementById('import-json-btn');
        const fileInput = document.getElementById('import-file-input');
        
        importBtn.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.importFromJSON(e.target.files[0]);
            }
        });
    },

    /**
     * Kopiuje raport do schowka
     */
    async copyReportToClipboard() {
        try {
            const report = Statistics.generateTextReport();
            const success = await Utils.copyToClipboard(report);
            
            if (success) {
                NotificationManager.showSuccess('Raport skopiowany do schowka!');
            } else {
                NotificationManager.showError('Nie udało się skopiować raportu.');
            }
        } catch (error) {
            console.error('Error copying report:', error);
            NotificationManager.showError('Błąd podczas kopiowania raportu.');
        }
    }
};

// Freeze the object
Object.freeze(ExportManager);

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ExportManager;
}
