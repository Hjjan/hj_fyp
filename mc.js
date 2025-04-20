document.addEventListener('DOMContentLoaded', () => {
    const progressBarInner = document.getElementById('progress-bar-inner');
    const progressText = document.getElementById('progress-text');
    const questionText = document.getElementById('question-text');
    const textElement = document.getElementById('text');
    const optionButtons = [
        document.getElementById('option-1'),
        document.getElementById('option-2'),
        document.getElementById('option-3')
    ];
    const hintButton = document.getElementById('btn-hint');
    const hintText = document.getElementById('hint-text');
    const audioButton = document.getElementById('btn-audio');
    const audioBackButton = document.getElementById('btn-audio-back');
    const correctness = document.getElementById('correctness');
    const explanation = document.getElementById('explanation');
    const flipCardCheckbox = document.getElementById('flip-card-checkbox');
    const cardInner = document.getElementById('card-inner');
    const tryAgainButton = document.getElementById('btn-try-again');
    const nextQuestionButton = document.getElementById('btn-next-question');
    const homeButton = document.getElementById('btn-home');

    let selectedQuestionIds = [];
    let currentQuestionIndex = parseInt(localStorage.getItem('currentQuestionIndex')) || 0;
    const totalQuestions = 15;
    let hintUsed = false;
    let shuffledOptions = [];

    async function loadQuestions() {
        try {
            selectedQuestionIds = JSON.parse(localStorage.getItem('selectedQuestionIds')) || [];
            const difficulty = localStorage.getItem('difficulty') || 'easy';
            document.body.className = '';
            document.body.classList.add(difficulty);
            console.log(`[loadQuestions] Applied background: ${difficulty}`);
            if (!selectedQuestionIds.length) {
                console.error('[loadQuestions] No questions in localStorage, redirecting to index.html');
                window.location.href = 'index.html';
                return;
            }
            console.log(`[loadQuestions] Selected Question IDs: ${selectedQuestionIds.map(q => `${q.id} (${q.source})`).join(', ')}`);
            displayQuestion();
        } catch (error) {
            console.error('[loadQuestions] Error loading questions:', error);
            questionText.textContent = 'Error loading questions';
            textElement.textContent = '';
        }
    }

    function shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    function readText(text) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-US';
        utterance.rate = 0.7;
        window.speechSynthesis.speak(utterance);
    }

    function displayQuestion() {
        const question = selectedQuestionIds[currentQuestionIndex];
        console.log(`[displayQuestion] Question ID: ${question.id}, Source: ${question.source}, Index: ${currentQuestionIndex}`);
        if (question.source === 'rearrange.json') {
            localStorage.setItem('currentQuestionIndex', currentQuestionIndex);
            window.location.href = 'rearrange.html';
            return;
        }
        questionText.textContent = question.question;
        textElement.textContent = question.text;
        shuffledOptions = shuffleArray(question.options);
        optionButtons.forEach((button, index) => {
            button.textContent = shuffledOptions[index];
            button.disabled = false;
            button.classList.remove('error');
        });
        hintText.textContent = '';
        hintButton.disabled = false;
        audioButton.disabled = false;
        audioBackButton.disabled = true;
        hintUsed = false;
        correctness.textContent = '';
        explanation.textContent = '';
        flipCardCheckbox.checked = false;
        cardInner.classList.remove('flipped');
        updateProgress();
    }

    function showHint() {
        if (hintUsed) return;
        const question = selectedQuestionIds[currentQuestionIndex];
        const partialTip = question.tips.split('.')[0] + '.';
        hintText.textContent = partialTip;
        hintButton.disabled = true;
        hintUsed = true;
        console.log(`[showHint] Hint displayed: ${partialTip}`);
    }

    function checkAnswer(selectedOption) {
        const question = selectedQuestionIds[currentQuestionIndex];
        const isCorrect = selectedOption === question.options[0];
        correctness.textContent = isCorrect ? 'Correct!' : 'Incorrect!';
        explanation.textContent = question.explanation;
        optionButtons.forEach(button => {
            button.disabled = true;
            if (button.textContent !== question.options[0]) {
                button.classList.add('error');
            }
        });
        flipCardCheckbox.checked = true;
        cardInner.classList.add('flipped');
        tryAgainButton.classList.toggle('active', !isCorrect);
        nextQuestionButton.classList.toggle('active', isCorrect);
        audioBackButton.disabled = false;

        if (isCorrect) {
            let score = parseInt(localStorage.getItem('score')) || 0;
            score++;
            localStorage.setItem('score', score.toString());
            console.log(`[checkAnswer] Score incremented to: ${score}`);
        } else {
            let incorrectAnswers = JSON.parse(localStorage.getItem('incorrectAnswers')) || [];
            incorrectAnswers.push(question.id);
            localStorage.setItem('incorrectAnswers', JSON.stringify(incorrectAnswers));
            console.log(`[checkAnswer] Incorrect answer, ID ${question.id} added to incorrectAnswers`);
        }

        console.log(`[checkAnswer] Correctness: ${correctness.textContent}, Explanation: ${explanation.textContent}, Flipped: ${cardInner.classList.contains('flipped')}`);
    }

    function updateProgress() {
        const progressPercent = (currentQuestionIndex / totalQuestions) * 100;
        progressBarInner.style.width = '0%';
        progressBarInner.offsetWidth;
        progressBarInner.style.width = `${progressPercent}%`;
        progressText.textContent = `Question ${currentQuestionIndex + 1} of ${totalQuestions}`;
        progressText.classList.add('pulse');
        setTimeout(() => progressText.classList.remove('pulse'), 300);
        console.log(`[updateProgress] Progress: ${progressText.textContent}, Width: ${progressPercent}%, Pulse: ${progressText.classList.contains('pulse')}`);
    }

    optionButtons.forEach(button => {
        button.addEventListener('click', () => checkAnswer(button.textContent));
    });

    hintButton.addEventListener('click', showHint);

    audioButton.addEventListener('click', () => {
        const question = selectedQuestionIds[currentQuestionIndex];
        readText(`${question.question} ${question.text} ${shuffledOptions.join(', ')}`);
        console.log(`[audioButton] Played: ${question.question} ${question.text} ${shuffledOptions.join(', ')}`);
    });

    audioBackButton.addEventListener('click', () => {
        const question = selectedQuestionIds[currentQuestionIndex];
        readText(`${correctness.textContent} ${question.explanation}`);
        console.log(`[audioBackButton] Played: ${correctness.textContent} ${question.explanation}`);
    });

    tryAgainButton.addEventListener('click', () => {
        flipCardCheckbox.checked = false;
        cardInner.classList.remove('flipped');
        displayQuestion();
        console.log(`[tryAgainButton] Reset card, Index: ${currentQuestionIndex}`);
    });

    nextQuestionButton.addEventListener('click', () => {
        currentQuestionIndex++;
        localStorage.setItem('currentQuestionIndex', currentQuestionIndex);
        if (currentQuestionIndex < totalQuestions) {
            displayQuestion();
        } else {
            const score = parseInt(localStorage.getItem('score')) || 0;
            localStorage.removeItem('selectedQuestionIds');
            localStorage.removeItem('currentQuestionIndex');
            window.location.href = `results.html?score=${score}&total=${totalQuestions}&type=quiz`;
            console.log(`[nextQuestionButton] Quiz ended, score: ${score}, total: ${totalQuestions}`);
        }
        console.log(`[nextQuestionButton] New Index: ${currentQuestionIndex}`);
    });

    homeButton.addEventListener('click', () => {
        localStorage.clear();
        window.location.href = 'index.html';
        console.log('[homeButton] Cleared storage, redirected to home');
    });

    loadQuestions();
});