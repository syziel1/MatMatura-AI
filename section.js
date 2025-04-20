/**
 * Główny skrypt obsługujący logikę strony pojedynczej sekcji kursu.
 * Wersja z ulepszonym oczekiwaniem na MathJax.
 */
document.addEventListener('DOMContentLoaded', () => {
    // --- Pobieranie parametrów i elementów DOM ---
    const urlParams = new URLSearchParams(window.location.search);
    const weekNumber = urlParams.get('week');
    const sectionId = `week-${weekNumber}`;
    const selectedLevel = localStorage.getItem('selectedLevel') || 'pp';

    // Elementy strony
    const sectionTitleElement = document.getElementById('section-title');
    const theoryContentElement = document.getElementById('theory-content');
    const markReadButton = document.getElementById('mark-read-button');
    const theoryStatusElement = document.getElementById('theory-status');
    const quizContainer = document.getElementById('quiz-container');
    const submitQuizButton = document.getElementById('submit-quiz-button');
    const quizResultsElement = document.getElementById('quiz-results');
    const retryIncorrectButton = document.getElementById('retry-incorrect-button');

    // --- Stan aplikacji ---
    let progressData = JSON.parse(localStorage.getItem('maturaProgress')) || {};
    let sectionProgress = progressData[sectionId] || { theoryRead: false, quizScore: null, incorrectQuestions: [] };
    let currentQuizQuestions = [];
    let questionsToRetry = [];

    // --- Oczekiwanie na MathJax (Ulepszona logika) ---
    console.log('Inicjalizacja oczekiwania na MathJax...');
    const mathJaxLoadPromise = new Promise((resolve, reject) => {
        let checkCounter = 0;
        const maxChecks = 60; // Limit prób (6 sekund)

        // Funkcja sprawdzająca
        const check = () => {
            checkCounter++;
            // Sprawdź, czy MathJax i jego startup promise istnieją
            if (typeof MathJax !== 'undefined' && MathJax.startup?.promise) {
                console.log(`MathJax wykryty po ${checkCounter} próbach. Czekanie na startup.promise...`);
                MathJax.startup.promise.then(() => {
                    console.log('MathJax startup.promise rozwiązane. MathJax gotowy.');
                    resolve(); // Rozwiąż główną obietnicę
                }).catch(err => {
                    console.error('Błąd podczas MathJax.startup.promise:', err);
                    reject(err); // Odrzuć główną obietnicę w razie błędu MathJax
                });
            } else if (checkCounter > maxChecks) {
                console.error(`MathJax nie załadował się w ciągu ${maxChecks * 100}ms.`);
                reject(new Error('Timeout ładowania MathJax')); // Odrzuć główną obietnicę
            } else {
                // Jeśli nie jest gotowy, spróbuj ponownie za chwilę
                setTimeout(check, 100);
            }
        };
        // Rozpocznij sprawdzanie
        check();
    });

    // --- Funkcje Pomocnicze ---
    function saveProgress() {
        progressData[sectionId] = sectionProgress;
        try {
            localStorage.setItem('maturaProgress', JSON.stringify(progressData));
            console.log(`Zapisano postęp dla ${sectionId}.`);
        } catch (error) {
            console.error('Błąd zapisu do localStorage:', error);
        }
    }

    function updateTheoryStatus() {
        if (!markReadButton || !theoryStatusElement) return; // Sprawdzenie czy elementy istnieją
        if (sectionProgress.theoryRead) {
            markReadButton.disabled = true;
            markReadButton.textContent = 'Teoria przeczytana';
            theoryStatusElement.textContent = 'Zdobyto 20% postępu za teorię.';
        } else {
            markReadButton.disabled = false;
            markReadButton.textContent = 'Oznacz teorię jako przeczytaną (20%)';
            theoryStatusElement.textContent = '';
        }
    }

     function displayRetryButtonIfNeeded() {
         if (!retryIncorrectButton) return;
         questionsToRetry = sectionProgress.incorrectQuestions || [];
         if (questionsToRetry.length > 0) {
             retryIncorrectButton.textContent = `Powtórz błędne zadania (${questionsToRetry.length})`;
             retryIncorrectButton.classList.remove('hidden');
             retryIncorrectButton.classList.add('visible');
         } else {
             retryIncorrectButton.classList.add('hidden');
             retryIncorrectButton.classList.remove('visible');
         }
     }

    // --- Renderowanie MathJax ---
    /**
     * Asynchronicznie renderuje formuły w kontenerze quizu, czekając na MathJax.
     */
    async function typesetQuizContent() {
         if (!quizContainer || quizContainer.children.length === 0) {
            console.log('Brak treści quizu do renderowania.');
            return;
         }
         console.log('Funkcja typesetQuizContent wywołana. Oczekiwanie na MathJax...');
         try {
            await mathJaxLoadPromise; // Poczekaj aż MathJax będzie gotowy
            console.log('MathJax jest gotowy. Próba renderowania quizu...');

            if (typeof MathJax.typesetPromise === 'function') {
                await MathJax.typesetPromise([quizContainer]); // Poczekaj na zakończenie renderowania
                console.log('Renderowanie quizu zakończone pomyślnie.');
            } else {
                console.error('MathJax jest gotowy, ale MathJax.typesetPromise nie jest funkcją!');
            }
        } catch (error) {
            console.error('Błąd podczas oczekiwania na MathJax lub renderowania quizu:', error);
        }
    }

    // --- Ładowanie Treści Sekcji ---
    /**
     * Główna funkcja ładująca zawartość strony sekcji.
     */
    function loadSectionContent() {
        console.log('Rozpoczęto ładowanie treści sekcji...');
        // Ustaw tytuł strony i sekcji
        const titleBase = `Tydzień ${weekNumber}`;
        let sectionSpecificTitle = ": Ładowanie...";

        // Ładowanie teorii
        console.log('Próba załadowania teorii...');
        if (weekNumber === '1') {
            sectionSpecificTitle = ": Liczby Rzeczywiste i Zbiory";
            loadTheory_Week1(); // Ładuje HTML teorii
        } else {
           sectionSpecificTitle = ": Brak danych";
           if (theoryContentElement) {
                theoryContentElement.innerHTML = '<p>Brak teorii dla tej sekcji.</p>';
           } else {
                console.error('Element #theory-content nie został znaleziony!');
           }
        }
        const fullTitle = `${titleBase}${sectionSpecificTitle} (${selectedLevel.toUpperCase()})`;
        if(sectionTitleElement) sectionTitleElement.textContent = fullTitle;
        document.title = fullTitle;

        updateTheoryStatus();

        // Ładowanie quizu
        console.log('Próba załadowania quizu...');
        if (weekNumber === '1') {
             loadQuiz_Week1(); // Tworzy elementy quizu w DOM
             if(submitQuizButton) submitQuizButton.classList.remove('hidden');
             displayRetryButtonIfNeeded();
        } else {
              if(quizContainer) quizContainer.innerHTML = '<p>Brak quizu dla tej sekcji.</p>';
              if(submitQuizButton) submitQuizButton.classList.add('hidden');
              if(retryIncorrectButton) retryIncorrectButton.classList.add('hidden');
        }

        // Wywołaj renderowanie MathJax dla quizu (asynchronicznie)
        // Funkcja poczeka na gotowość MathJax wewnątrz
        typesetQuizContent();
        console.log('Zakończono ładowanie treści sekcji (bez czekania na MathJax).');
    }

    /**
     * Ładuje treść teorii dla Tygodnia 1.
     */
    function loadTheory_Week1() {
        if (!theoryContentElement) {
            console.error('Nie można załadować teorii - brak elementu #theory-content.');
            return;
        }
        console.log('Funkcja loadTheory_Week1 - rozpoczęto.');
        // Przykładowa, rozbudowana teoria dla Tygodnia 1
        let theoryHtml = `
            <h4>Podstawowe Zbiory Liczbowe</h4>
            <ul>
                <li><b>Liczby naturalne (N):</b> ${selectedLevel === 'pp' ? '{1, 2, 3, ...}' : '{0, 1, 2, 3, ...} (Uwaga: Na maturze PR często przyjmuje się 0 jako liczbę naturalną!)'}</li>
                <li><b>Liczby całkowite (C lub Z):</b> {..., -2, -1, 0, 1, 2, ...}</li>
                <li><b>Liczby wymierne (W lub Q):</b> Liczby postaci $\\frac{p}{q}$, gdzie $p, q \\in Z$ i $q \\neq 0$. Każda liczba wymierna ma rozwinięcie dziesiętne skończone lub nieskończone okresowe.</li>
                <li><b>Liczby niewymierne (NW lub IQ):</b> Liczby rzeczywiste, które nie są wymierne (np. $\\pi$, $\\sqrt{2}$, $\\sqrt{3}$, $log_2 3$). Mają rozwinięcia dziesiętne nieskończone nieokresowe.</li>
                <li><b>Liczby rzeczywiste (R):</b> Suma zbiorów liczb wymiernych i niewymiernych ($R = W \\cup NW$).</li>
            </ul>

            <h4>Potęgi i Pierwiastki (PP + PR)</h4>
            <p>Dla $a, b \\in R$, $n, m \\in Z$ (lub $Q$ przy odpowiednich założeniach):</p>
            <ul>
                <li>$a^n \\cdot a^m = a^{n+m}$</li>
                <li>$\\frac{a^n}{a^m} = a^{n-m}$ (dla $a \\neq 0$)</li>
                <li>$(a^n)^m = a^{n \\cdot m}$</li>
                <li>$(a \\cdot b)^n = a^n \\cdot b^n$</li>
                <li>$(\\frac{a}{b})^n = \\frac{a^n}{b^n}$ (dla $b \\neq 0$)</li>
                <li>$a^{-n} = \\frac{1}{a^n}$ (dla $a \\neq 0$)</li>
                <li>$a^0 = 1$ (dla $a \\neq 0$)</li>
                <li>$a^{\\frac{n}{m}} = \\sqrt[m]{a^n}$ (dla $a \\ge 0$, $m \\in N, m \\ge 2$)</li>
                <li>Pierwiastki: $\\sqrt{a \\cdot b} = \\sqrt{a} \\cdot \\sqrt{b}$, $\\sqrt{\\frac{a}{b}} = \\frac{\\sqrt{a}}{\\sqrt{b}}$ (dla $a, b \\ge 0, b \\neq 0$)</li>
            </ul>
             ${selectedLevel === 'pr' ? '<p><b>(PR)</b> Pamiętaj o dowodzeniu własności potęg i pierwiastków.</p>' : ''}


            <h4>Logarytmy (PP + PR)</h4>
            <p>Definicja: $log_a b = c \\iff a^c = b$ (założenia: $a > 0, a \\neq 1, b > 0$).</p>
            <p>Podstawowe wzory (dla $x, y > 0$):</p>
            <ul>
                <li>$log_a (x \\cdot y) = log_a x + log_a y$</li>
                <li>$log_a (\\frac{x}{y}) = log_a x - log_a y$</li>
                <li>$log_a (x^k) = k \\cdot log_a x$ (dla $k \\in R$)</li>
                <li>$log_a a = 1$, $log_a 1 = 0$</li>
                <li>$a^{log_a b} = b$</li>
            </ul>
             ${selectedLevel === 'pr' ? `
                <p><b>(PR) Wzór na zmianę podstawy logarytmu:</b></p>
                <ul><li>$log_a b = \\frac{log_c b}{log_c a}$ (dla $c > 0, c \\neq 1$)</li></ul>
             ` : ''}

            <h4>Wartość Bezwzględna (PP + PR)</h4>
            <p>Definicja: $|x| = \\begin{cases} x & \\text{dla } x \\ge 0 \\\\ -x & \\text{dla } x < 0 \\end{cases}$</p>
            <p>Interpretacja geometryczna: $|x|$ to odległość liczby $x$ od 0 na osi liczbowej. $|x - a|$ to odległość między $x$ a $a$.</p>
            <p>Podstawowe własności:</p>
            <ul>
                <li>$|x| \\ge 0$</li>
                <li>$|x| = |-x|$</li>
                <li>$|x \\cdot y| = |x| \\cdot |y|$</li>
                <li>$|\\frac{x}{y}| = \\frac{|x|}{|y|}$ (dla $y \\neq 0$)</li>
                <li>Rozwiązywanie równań typu $|x - a| = b$ (dla $b \\ge 0$) $\\implies x - a = b$ lub $x - a = -b$.</li>
                <li>Rozwiązywanie nierówności typu $|x - a| < b$ (dla $b > 0$) $\\implies -b < x - a < b \\implies a - b < x < a + b$.</li>
                <li>Rozwiązywanie nierówności typu $|x - a| > b$ (dla $b > 0$) $\\implies x - a > b$ lub $x - a < -b$.</li>
            </ul>
             ${selectedLevel === 'pr' ? `
                <p><b>(PR) Nierówność trójkąta:</b></p>
                <ul><li>$|x + y| \\le |x| + |y|$</li><li>$||x| - |y|| \\le |x - y|$</li></ul>
                <p><b>(PR)</b> Bardziej złożone równania i nierówności.</p>
             ` : ''}

            <h4>Zbiory (PP + PR)</h4>
            <p>Operacje na zbiorach:</p>
            <ul>
                <li>Suma: $A \\cup B = \\{x : x \\in A \\lor x \\in B\\}$</li>
                <li>Iloczyn (część wspólna): $A \\cap B = \\{x : x \\in A \\land x \\in B\\}$</li>
                <li>Różnica: $A \\setminus B = \\{x : x \\in A \\land x \\notin B\\}$</li>
                <li>Dopełnienie (względem przestrzeni $U$): $A' = U \\setminus A = \\{x \\in U : x \\notin A\\}$</li>
            </ul>
            <p>Przedziały liczbowe.</p>
             ${selectedLevel === 'pr' ? '<p><b>(PR)</b> Prawa de Morgana dla zbiorów: $(A \\cup B)\' = A\' \\cap B\'$, $(A \\cap B)\' = A\' \\cup B\'$.</p>' : ''}
        `;
        // Ustawienie HTML - to powinno być widoczne od razu
        theoryContentElement.innerHTML = theoryHtml;
        console.log(`Funkcja loadTheory_Week1 - zakończono. Długość HTML: ${theoryHtml.length}`);

        // Renderowanie MathJax dla TEORII - wywołujemy od razu,
        // bo teoria jest statyczna i MathJax w <head> mógł jej nie zdążyć przetworzyć.
        // Używamy tej samej globalnej obietnicy.
        typesetTheoryContent();
    }

    /**
     * Asynchronicznie renderuje formuły w kontenerze teorii, czekając na MathJax.
     */
    async function typesetTheoryContent() {
         if (!theoryContentElement || theoryContentElement.children.length === 0) {
            console.log('Brak treści teorii do renderowania.');
            return;
         }
         console.log('Próba renderowania treści teorii...');
         try {
            await mathJaxLoadPromise; // Poczekaj aż MathJax będzie gotowy
            console.log('MathJax gotowy dla teorii. Próba renderowania...');

            if (typeof MathJax.typesetPromise === 'function') {
                await MathJax.typesetPromise([theoryContentElement]); // Renderuj teorię
                console.log('Renderowanie teorii zakończone pomyślnie.');
            } else {
                console.error('MathJax jest gotowy, ale MathJax.typesetPromise nie jest funkcją!');
            }
        } catch (error) {
            console.error('Błąd podczas oczekiwania na MathJax lub renderowania teorii:', error);
        }
    }


    /**
     * Ładuje pytania quizowe dla Tygodnia 1.
     * @param {boolean} retryMode - Czy ładować tylko błędnie odpowiedziane pytania.
     */
    function loadQuiz_Week1(retryMode = false) {
        if (!quizContainer) {
             console.error('Nie można załadować quizu - brak elementu #quiz-container.');
             return;
        }
        console.log(`Funkcja loadQuiz_Week1 - rozpoczęto (retryMode: ${retryMode}).`);
        quizContainer.innerHTML = ''; // Wyczyść stary quiz
        if (quizResultsElement) quizResultsElement.innerHTML = ''; // Wyczyść wyniki
        if (submitQuizButton) submitQuizButton.classList.add('hidden'); // Ukryj przyciski
        if (retryIncorrectButton) retryIncorrectButton.classList.add('hidden');

        // Przykładowa pula zadań
         const allQuestions_Week1_PP = [
             { id: 'w1pp1', text: 'Liczba $2^{40} \\cdot 4^{20}$ jest równa:', type: 'radio', options: ['$8^{60}$', '$2^{80}$', '$8^{800}$', '$2^{60}$'], correct: '$2^{80}$'},
             { id: 'w1pp2', text: 'Liczba $log_{\\sqrt{2}} 2$ jest równa:', type: 'radio', options: ['2', '1/2', '4', '$\\sqrt{2}$'], correct: '2'},
             { id: 'w1pp3', text: 'Po usunięciu niewymierności z mianownika ułamka $\\frac{1}{ \\sqrt{3} - \\sqrt{2}}$ otrzymamy:', type: 'radio', options: ['$ \\sqrt{3} - \\sqrt{2}$', '$ \\sqrt{3} + \\sqrt{2}$', '$ \\frac{\\sqrt{3} + \\sqrt{2}}{5}$', '$ \\frac{\\sqrt{3} - \\sqrt{2}}{1}$'], correct: '$ \\sqrt{3} + \\sqrt{2}$'},
         ];
         const allQuestions_Week1_PR = [
             { id: 'w1pr1', text: 'Wartość wyrażenia $log_3 81 - log_3 27$ jest równa:', type: 'radio', options: ['1', '$log_3 54$', '3', '$log_3 (81/27)$'], correct: '1'},
             { id: 'w1pr2', text: 'Rozwiązaniem nierówności $|x - 3| \\geq 5$ jest zbiór:', type: 'radio', options: ['$(- \\infty, -2] \\cup [8, + \\infty)$', '$[-2, 8]$', '$(- \\infty, -2) \\cup (8, + \\infty)$', '$(-2, 8)$'], correct: '$(- \\infty, -2] \\cup [8, + \\infty)$'},
             { id: 'w1pr3', text: 'Wykaż (wpisz "tak"), że dla każdej liczby całkowitej $k$ liczba $(k+1)^2 - k^2$ jest nieparzysta.', type: 'text', correct: 'tak'},
         ];
        let questionsPool = selectedLevel === 'pr' ? allQuestions_Week1_PR : allQuestions_Week1_PP;

        // Wybór pytań
         questionsToRetry = sectionProgress.incorrectQuestions || []; // Upewnij się, że mamy listę
         if (retryMode && questionsToRetry.length > 0) {
            currentQuizQuestions = questionsPool.filter(q => questionsToRetry.includes(q.id));
             if (currentQuizQuestions.length === 0) {
                 quizContainer.innerHTML = '<p>Gratulacje! Brak pytań do powtórzenia w tym dziale.</p>';
                 return;
             }
             console.log("Tryb powtórki, pytania:", currentQuizQuestions.map(q=>q.id));
        } else {
            currentQuizQuestions = [...questionsPool];
            // questionsToRetry = []; // Nie resetuj tutaj, bo potrzebne w submit listenerze
            console.log("Tryb normalny, pytania:", currentQuizQuestions.map(q=>q.id));
        }

        // Generowanie HTML
        currentQuizQuestions.forEach((q, index) => {
            const questionElement = document.createElement('div');
            questionElement.classList.add('quiz-question');
            questionElement.setAttribute('data-question-id', q.id);

            const questionText = document.createElement('p');
            questionText.innerHTML = `<b>${index + 1}.</b> ${q.text}`;
            questionElement.appendChild(questionText);

            const optionsElement = document.createElement('div');
            optionsElement.classList.add('quiz-options');

            if (q.type === 'radio') {
                 q.options.forEach(option => {
                     const optionDiv = document.createElement('div'); // Używamy DIV
                     optionDiv.classList.add('quiz-option');
                     optionDiv.innerHTML = option;
                     optionDiv.setAttribute('data-value', option);
                     optionDiv.onclick = () => {
                         const siblings = optionsElement.querySelectorAll('.quiz-option');
                         siblings.forEach(sib => sib.classList.remove('selected'));
                         optionDiv.classList.add('selected');
                     };
                     optionsElement.appendChild(optionDiv);
                 });
            } else if (q.type === 'text') {
                 const input = document.createElement('input');
                 input.type = 'text';
                 input.placeholder = 'Wpisz odpowiedź...';
                 // Dodajemy klasy do stylizacji po sprawdzeniu
                 input.classList.add('quiz-input-text');
                 optionsElement.appendChild(input);
            }
            questionElement.appendChild(optionsElement);
            quizContainer.appendChild(questionElement);
        });

        // Pokaż przycisk sprawdzania
        if(submitQuizButton) submitQuizButton.classList.remove('hidden');
        console.log('Funkcja loadQuiz_Week1 - zakończono dodawanie elementów.');
        // Renderowanie MathJax zostanie wywołane przez typesetQuizContent()
    }

    // --- Obsługa Sprawdzenia Quizu ---
    if (submitQuizButton) {
        submitQuizButton.addEventListener('click', () => {
            console.log('Kliknięto "Sprawdź odpowiedzi".');
            let correctAnswers = 0;
            let answeredQuestions = 0;
            let newlyIncorrectQuestions = []; // Tu zbieramy ID błędnych z TEGO podejścia
            questionsToRetry = sectionProgress.incorrectQuestions || []; // Aktualna lista do powtórki

            currentQuizQuestions.forEach(q => {
                const questionElement = quizContainer.querySelector(`.quiz-question[data-question-id="${q.id}"]`);
                if (!questionElement) return;

                const optionsContainer = questionElement.querySelector('.quiz-options');
                let userAnswer = null;
                let isCorrect = false;

                if (q.type === 'radio') {
                    const selectedOptionDiv = optionsContainer.querySelector('div.quiz-option.selected');
                    if (selectedOptionDiv) {
                        userAnswer = selectedOptionDiv.getAttribute('data-value');
                        answeredQuestions++;
                        isCorrect = (userAnswer === q.correct);
                        optionsContainer.querySelectorAll('div.quiz-option').forEach(optDiv => {
                            optDiv.style.pointerEvents = 'none';
                            optDiv.onclick = null;
                            if (optDiv.getAttribute('data-value') === q.correct) optDiv.classList.add('correct');
                            if (optDiv === selectedOptionDiv && !isCorrect) optDiv.classList.add('incorrect');
                            optDiv.classList.remove('selected');
                        });
                    }
                } else if (q.type === 'text') {
                     const inputElement = optionsContainer.querySelector('input.quiz-input-text');
                     if (inputElement && inputElement.value.trim() !== '') {
                         userAnswer = inputElement.value.trim().toLowerCase();
                         answeredQuestions++;
                         isCorrect = (userAnswer === q.correct.toLowerCase());
                         inputElement.disabled = true;
                         inputElement.classList.add(isCorrect ? 'correct' : 'incorrect');
                     }
                }

                // Aktualizacja listy błędnych pytań
                 if (userAnswer !== null) { // Jeśli odpowiedziano
                     if (isCorrect) {
                        correctAnswers++;
                        // Jeśli pytanie było na liście do powtórki, usuń je z niej
                        const retryIndex = questionsToRetry.indexOf(q.id);
                        if (retryIndex > -1) {
                            questionsToRetry.splice(retryIndex, 1);
                            console.log(`Poprawiono pytanie do powtórki: ${q.id}. Usunięto z listy.`);
                        }
                     } else {
                        // Dodaj ID do listy błędnych z TEGO podejścia
                        newlyIncorrectQuestions.push(q.id);
                     }
                 }
            }); // Koniec pętli forEach po pytaniach

            // Oblicz wynik
            const totalAttemptedQuestions = currentQuizQuestions.length;
            const scorePercentage = (totalAttemptedQuestions > 0) ? Math.round((correctAnswers / totalAttemptedQuestions) * 100) : 0;

            // Wyświetl wynik
            if(quizResultsElement) {
                quizResultsElement.innerHTML = `Wynik quizu: ${correctAnswers} / ${totalAttemptedQuestions} (${scorePercentage}%)`;
                quizResultsElement.classList.remove('hidden');
            }

            // Aktualizuj postępy w localStorage
            sectionProgress.quizScore = scorePercentage; // Zawsze zapisuj ostatni wynik
            // Aktualizuj listę błędnych: połącz pozostałe z listy `questionsToRetry` z nowymi błędami `newlyIncorrectQuestions`
            sectionProgress.incorrectQuestions = [...new Set([...questionsToRetry, ...newlyIncorrectQuestions])];

            saveProgress(); // Zapisz zmiany

            // Zaktualizuj UI przycisków
            submitQuizButton.classList.add('hidden');
            displayRetryButtonIfNeeded();
        });
    } else {
         console.error('Przycisk #submit-quiz-button nie został znaleziony!');
    }


    // --- Obsługa Powtórki Błędów ---
     if (retryIncorrectButton) {
         retryIncorrectButton.addEventListener('click', () => {
             console.log('Kliknięto "Powtórz błędne zadania".');
             loadQuiz_Week1(true); // Załaduj quiz w trybie powtórki
             typesetQuizContent(); // Wywołaj renderowanie po załadowaniu pytań do powtórki
         });
     } else {
          console.error('Przycisk #retry-incorrect-button nie został znaleziony!');
     }


    // --- Obsługa Teorii ---
    if (markReadButton) {
        markReadButton.addEventListener('click', () => {
            if (!sectionProgress.theoryRead) {
                sectionProgress.theoryRead = true;
                saveProgress();
                updateTheoryStatus();
            }
        });
    } else {
         console.error('Przycisk #mark-read-button nie został znaleziony!');
    }


    // --- Inicjalizacja Strony ---
    if (sectionTitleElement && theoryContentElement && quizContainer) {
        initializeMathJax(); // Rozpocznij sprawdzanie/oczekiwanie na MathJax
        loadSectionContent(); // Rozpocznij ładowanie treści strony
    } else {
        console.error('Nie znaleziono kluczowych elementów strony (#section-title, #theory-content, #quiz-container). Inicjalizacja przerwana.');
        // Można wyświetlić komunikat błędu użytkownikowi
        document.body.innerHTML = '<h1>Wystąpił krytyczny błąd podczas ładowania strony.</h1><p>Nie znaleziono podstawowych elementów interfejsu.</p>';
    }


}); // Koniec DOMContentLoaded listener

