/**
 * Notification system for MatMatura-AI
 * Wyświetla powiadomienia, toasty i komunikaty dla użytkownika
 */

const NotificationManager = {
    /**
     * Inicjalizuje system powiadomień
     */
    init() {
        // Utwórz kontener na powiadomienia jeśli nie istnieje
        if (!document.getElementById('notification-container')) {
            const container = document.createElement('div');
            container.id = 'notification-container';
            container.className = 'notification-container';
            document.body.appendChild(container);
        }
    },

    /**
     * Wyświetla powiadomienie toast
     * @param {string} message - Treść powiadomienia
     * @param {string} type - Typ: 'success', 'error', 'warning', 'info'
     * @param {number} duration - Czas wyświetlania w ms (0 = nie znika automatycznie)
     */
    show(message, type = 'info', duration = CONSTANTS.UI.TOAST_DURATION_MS) {
        this.init();

        const container = document.getElementById('notification-container');
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        
        // Ikona w zależności od typu
        const icons = {
            success: '✓',
            error: '✗',
            warning: '⚠',
            info: 'ℹ'
        };
        
        notification.innerHTML = `
            <span class="notification-icon">${icons[type] || icons.info}</span>
            <span class="notification-message">${Utils.escapeHtml(message)}</span>
            <button class="notification-close" aria-label="Zamknij">&times;</button>
        `;

        // Dodaj event listener do przycisku zamknięcia
        const closeButton = notification.querySelector('.notification-close');
        closeButton.addEventListener('click', () => {
            this.remove(notification);
        });

        container.appendChild(notification);

        // Animacja wejścia
        setTimeout(() => {
            notification.classList.add('notification-show');
        }, 10);

        // Automatyczne usunięcie po czasie
        if (duration > 0) {
            setTimeout(() => {
                this.remove(notification);
            }, duration);
        }

        return notification;
    },

    /**
     * Usuwa powiadomienie z animacją
     * @param {HTMLElement} notification - Element powiadomienia
     */
    remove(notification) {
        notification.classList.remove('notification-show');
        notification.classList.add('notification-hide');
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, CONSTANTS.UI.ANIMATION_DURATION_MS);
    },

    /**
     * Wyświetla powiadomienie sukcesu
     * @param {string} message - Treść powiadomienia
     * @param {number} duration - Czas wyświetlania w ms
     */
    showSuccess(message, duration) {
        return this.show(message, 'success', duration);
    },

    /**
     * Wyświetla powiadomienie błędu
     * @param {string} message - Treść powiadomienia
     * @param {number} duration - Czas wyświetlania w ms
     */
    showError(message, duration = 5000) {
        return this.show(message, 'error', duration);
    },

    /**
     * Wyświetla ostrzeżenie
     * @param {string} message - Treść powiadomienia
     * @param {number} duration - Czas wyświetlania w ms
     */
    showWarning(message, duration) {
        return this.show(message, 'warning', duration);
    },

    /**
     * Wyświetla informację
     * @param {string} message - Treść powiadomienia
     * @param {number} duration - Czas wyświetlania w ms
     */
    showInfo(message, duration) {
        return this.show(message, 'info', duration);
    },

    /**
     * Wyświetla dialog z potwierdzeniem
     * @param {string} message - Treść pytania
     * @param {string} confirmText - Tekst przycisku potwierdzenia
     * @param {string} cancelText - Tekst przycisku anulowania
     * @returns {Promise<boolean>} Promise z wynikiem (true = potwierdzono)
     */
    confirm(message, confirmText = 'Potwierdź', cancelText = 'Anuluj') {
        return new Promise((resolve) => {
            // Utwórz overlay
            const overlay = document.createElement('div');
            overlay.className = 'dialog-overlay';

            // Utwórz dialog
            const dialog = document.createElement('div');
            dialog.className = 'dialog-box';
            dialog.innerHTML = `
                <div class="dialog-content">
                    <p class="dialog-message">${Utils.escapeHtml(message)}</p>
                    <div class="dialog-buttons">
                        <button class="dialog-button dialog-button-cancel">${Utils.escapeHtml(cancelText)}</button>
                        <button class="dialog-button dialog-button-confirm">${Utils.escapeHtml(confirmText)}</button>
                    </div>
                </div>
            `;

            overlay.appendChild(dialog);
            document.body.appendChild(overlay);

            // Animacja wejścia
            setTimeout(() => {
                overlay.classList.add('dialog-show');
            }, 10);

            // Funkcja zamykania
            const close = (result) => {
                overlay.classList.remove('dialog-show');
                setTimeout(() => {
                    document.body.removeChild(overlay);
                    resolve(result);
                }, CONSTANTS.UI.ANIMATION_DURATION_MS);
            };

            // Event listenery
            dialog.querySelector('.dialog-button-confirm').addEventListener('click', () => close(true));
            dialog.querySelector('.dialog-button-cancel').addEventListener('click', () => close(false));
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    close(false);
                }
            });

            // Escape key
            const escapeHandler = (e) => {
                if (e.key === 'Escape') {
                    close(false);
                    document.removeEventListener('keydown', escapeHandler);
                }
            };
            document.addEventListener('keydown', escapeHandler);
        });
    },

    /**
     * Wyświetla loader/spinner
     * @param {string} message - Opcjonalna wiadomość
     * @returns {object} Obiekt z metodą hide() do ukrycia loadera
     */
    showLoader(message = 'Ładowanie...') {
        const overlay = document.createElement('div');
        overlay.className = 'loader-overlay';
        overlay.innerHTML = `
            <div class="loader-container">
                <div class="loader-spinner"></div>
                <p class="loader-message">${Utils.escapeHtml(message)}</p>
            </div>
        `;

        document.body.appendChild(overlay);

        setTimeout(() => {
            overlay.classList.add('loader-show');
        }, 10);

        return {
            hide: () => {
                overlay.classList.remove('loader-show');
                setTimeout(() => {
                    if (overlay.parentNode) {
                        document.body.removeChild(overlay);
                    }
                }, CONSTANTS.UI.ANIMATION_DURATION_MS);
            },
            updateMessage: (newMessage) => {
                const messageEl = overlay.querySelector('.loader-message');
                if (messageEl) {
                    messageEl.textContent = newMessage;
                }
            }
        };
    },

    /**
     * Usuwa wszystkie powiadomienia
     */
    clearAll() {
        const container = document.getElementById('notification-container');
        if (container) {
            container.innerHTML = '';
        }
    }
};

// Freeze the object
Object.freeze(NotificationManager);

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NotificationManager;
}
