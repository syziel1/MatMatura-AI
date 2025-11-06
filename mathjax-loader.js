/**
 * MathJax Loader for MatMatura-AI
 * Ulepszona obsługa ładowania i renderowania MathJax
 */

const MathJaxLoader = {
    isLoaded: false,
    loadPromise: null,

    /**
     * Inicjalizuje i ładuje MathJax
     * @returns {Promise} Promise rozwiązywana gdy MathJax jest gotowy
     */
    init() {
        // Jeśli już jest załadowany, zwróć rozwiązaną obietnicę
        if (this.isLoaded) {
            return Promise.resolve();
        }

        // Jeśli ładowanie jest w toku, zwróć istniejącą obietnicę
        if (this.loadPromise) {
            return this.loadPromise;
        }

        console.log('Inicjalizacja ładowania MathJax...');

        // Utwórz nową obietnicę ładowania
        this.loadPromise = new Promise((resolve, reject) => {
            let checkCounter = 0;
            const maxChecks = CONSTANTS.MATHJAX.MAX_LOAD_ATTEMPTS;
            const checkInterval = CONSTANTS.MATHJAX.CHECK_INTERVAL_MS;

            const check = () => {
                checkCounter++;

                // Sprawdź czy MathJax jest dostępny
                if (typeof MathJax !== 'undefined' && MathJax.startup?.promise) {
                    console.log(`MathJax wykryty po ${checkCounter} próbach.`);
                    
                    // Poczekaj na startup.promise
                    MathJax.startup.promise
                        .then(() => {
                            console.log('MathJax gotowy do użycia.');
                            this.isLoaded = true;
                            resolve();
                        })
                        .catch(err => {
                            console.error('Błąd podczas inicjalizacji MathJax:', err);
                            reject(new Error('MathJax initialization failed'));
                        });
                } else if (checkCounter >= maxChecks) {
                    const error = new Error(`MathJax nie załadował się w ciągu ${CONSTANTS.MATHJAX.TIMEOUT_MS}ms`);
                    console.error(error.message);
                    reject(error);
                } else {
                    // Spróbuj ponownie
                    setTimeout(check, checkInterval);
                }
            };

            // Rozpocznij sprawdzanie
            check();
        });

        return this.loadPromise;
    },

    /**
     * Renderuje MathJax w podanym kontenerze
     * @param {HTMLElement|Array<HTMLElement>} elements - Element lub tablica elementów
     * @returns {Promise} Promise rozwiązywana po zakończeniu renderowania
     */
    async render(elements) {
        try {
            // Poczekaj aż MathJax będzie gotowy
            await this.init();

            // Normalizuj do tablicy
            const elementsArray = Array.isArray(elements) ? elements : [elements];

            // Sprawdź czy są elementy do renderowania
            if (elementsArray.length === 0 || !elementsArray[0]) {
                console.log('Brak elementów do renderowania MathJax.');
                return;
            }

            console.log(`Renderowanie MathJax dla ${elementsArray.length} elementów...`);

            // Użyj typesetPromise dla asynchronicznego renderowania
            if (typeof MathJax.typesetPromise === 'function') {
                await MathJax.typesetPromise(elementsArray);
                console.log('Renderowanie MathJax zakończone pomyślnie.');
            } else {
                throw new Error('MathJax.typesetPromise nie jest dostępne');
            }
        } catch (error) {
            console.error('Błąd podczas renderowania MathJax:', error);
            
            // Pokaż komunikat użytkownikowi
            if (window.NotificationManager) {
                NotificationManager.showWarning(
                    'Problemy z renderowaniem formuł matematycznych. Spróbuj odświeżyć stronę.'
                );
            }
            
            throw error;
        }
    },

    /**
     * Renderuje MathJax w całym dokumencie
     * @returns {Promise} Promise rozwiązywana po zakończeniu renderowania
     */
    async renderAll() {
        return this.render([document.body]);
    },

    /**
     * Ponownie renderuje MathJax w podanym kontenerze
     * Przydatne gdy zawartość została dynamicznie zmieniona
     * @param {HTMLElement} element - Element do ponownego renderowania
     * @returns {Promise} Promise rozwiązywana po zakończeniu
     */
    async rerender(element) {
        try {
            await this.init();

            if (!element) {
                console.warn('Brak elementu do ponownego renderowania.');
                return;
            }

            console.log('Ponowne renderowanie MathJax...');

            // Wyczyść poprzednie renderowanie
            if (typeof MathJax.typesetClear === 'function') {
                MathJax.typesetClear([element]);
            }

            // Renderuj ponownie
            await this.render(element);
        } catch (error) {
            console.error('Błąd podczas ponownego renderowania MathJax:', error);
            throw error;
        }
    },

    /**
     * Sprawdza czy MathJax jest załadowany i gotowy
     * @returns {boolean} True jeśli MathJax jest gotowy
     */
    isReady() {
        return this.isLoaded && 
               typeof MathJax !== 'undefined' && 
               typeof MathJax.typesetPromise === 'function';
    },

    /**
     * Resetuje stan loadera (przydatne do testów)
     */
    reset() {
        this.isLoaded = false;
        this.loadPromise = null;
        console.log('MathJax loader zresetowany.');
    },

    /**
     * Konwertuje tekst LaTeX na HTML z MathJax
     * @param {string} latex - Tekst LaTeX
     * @returns {Promise<string>} Promise z HTML
     */
    async convertLatexToHTML(latex) {
        try {
            await this.init();

            if (typeof MathJax.tex2svg === 'function') {
                const svg = MathJax.tex2svg(latex);
                return svg.outerHTML;
            } else if (typeof MathJax.tex2chtml === 'function') {
                const chtml = MathJax.tex2chtml(latex);
                return chtml.outerHTML;
            } else {
                throw new Error('MathJax conversion functions not available');
            }
        } catch (error) {
            console.error('Błąd podczas konwersji LaTeX:', error);
            return latex; // Zwróć oryginalny tekst w przypadku błędu
        }
    },

    /**
     * Dodaje obsługę błędów renderowania
     * @param {Function} callback - Funkcja wywoływana przy błędzie
     */
    onError(callback) {
        if (typeof callback !== 'function') {
            console.warn('onError callback must be a function');
            return;
        }

        // Dodaj listener do błędów MathJax
        if (typeof MathJax !== 'undefined' && MathJax.startup) {
            MathJax.startup.promise.catch(callback);
        }
    },

    /**
     * Konfiguruje MathJax (musi być wywołane przed załadowaniem skryptu)
     * @param {object} config - Obiekt konfiguracji MathJax
     */
    configure(config) {
        if (typeof MathJax !== 'undefined') {
            console.warn('MathJax już załadowany. Konfiguracja może nie zadziałać.');
        }

        window.MathJax = {
            ...window.MathJax,
            ...config
        };

        console.log('MathJax skonfigurowany:', config);
    },

    /**
     * Ładuje skrypt MathJax dynamicznie
     * @param {string} url - URL do skryptu MathJax
     * @returns {Promise} Promise rozwiązywana gdy skrypt zostanie załadowany
     */
    loadScript(url = 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js') {
        return new Promise((resolve, reject) => {
            // Sprawdź czy skrypt już istnieje
            const existingScript = document.querySelector(`script[src="${url}"]`);
            if (existingScript) {
                console.log('Skrypt MathJax już załadowany.');
                resolve();
                return;
            }

            // Utwórz nowy element script
            const script = document.createElement('script');
            script.src = url;
            script.async = true;
            script.id = 'MathJax-script';

            script.onload = () => {
                console.log('Skrypt MathJax załadowany.');
                resolve();
            };

            script.onerror = (error) => {
                console.error('Błąd podczas ładowania skryptu MathJax:', error);
                reject(new Error('Failed to load MathJax script'));
            };

            document.head.appendChild(script);
        });
    }
};

// Freeze the object
Object.freeze(MathJaxLoader);

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MathJaxLoader;
}

// Auto-inicjalizacja jeśli MathJax jest już w dokumencie
if (typeof MathJax !== 'undefined') {
    MathJaxLoader.init().catch(err => {
        console.error('Auto-inicjalizacja MathJax nie powiodła się:', err);
    });
}
