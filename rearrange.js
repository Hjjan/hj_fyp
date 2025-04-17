 
document.addEventListener('DOMContentLoaded', () => {
    const progressBarInner = document.getElementById('progress-bar-inner');
    const progressText = document.getElementById('progress-text');
    const questionText = document.getElementById('question-text');
    const sentenceWords = document.getElementById('sentence-words');
    const sentenceBuilderArea = document.getElementById('sentence-builder-area');
    const submitButton = document.getElementById('submit-answer');
    const resetButton = document.getElementById('btn-reset');
    const hintButton = document.getElementById('btn-hint');
    const audioButton = document.getElementById('btn-audio');
    const audioBackButton = document.getElementById('btn-audio-back');
    const hintText = document.getElementById('hint-text');
    const correctness = document.getElementById('correctness');
    const explanation = document.getElementById('explanation');
    const flipCardCheckbox = document.getElementById('flip-card-checkbox');
    const cardInner = document.getElementById('card-inner');
    const tryAgainButton = document.getElementById('btn-try-again');
    const nextQuestionButton = document.getElementById('btn-next-question');
    const homeButton = document.getElementById('btn-home');

    let selectedQuestionIds = [];
    let currentQuestionIndex = parseInt(localStorage.getItem('currentQuestionIndex')) || 0;
    const totalQuestions = 10;
    let builtSentence = [];
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
        utterance.rate = 0.7; // Slower rate for younger users
        window.speechSynthesis.speak(utterance);
    }

    function displayQuestion() {
        const question = selectedQuestionIds[currentQuestionIndex];
        console.log(`[displayQuestion] Question ID: ${question.id}, Source: ${question.source}, Index: ${currentQuestionIndex}`);
        if (question.source === 'questions.json') {
            localStorage.setItem('currentQuestionIndex', currentQuestionIndex);
            window.location.href = 'index.html';
            return;
        }
        questionText.textContent = question.question;
        sentenceWords.innerHTML = '';
        sentenceBuilderArea.innerHTML = '';
        builtSentence = [];
        shuffledOptions = shuffleArray(question.options);
        shuffledOptions.forEach(word => {
            const wordElement = document.createElement('div');
            wordElement.className = 'sentence-word';
            wordElement.textContent = word;
            wordElement.addEventListener('click', () => moveWordToBuilder(word, wordElement));
            sentenceWords.appendChild(wordElement);
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

    function moveWordToBuilder(word, wordElement) {
        builtSentence.push(word);
        sentenceBuilderArea.appendChild(wordElement);
        wordElement.className = 'sentence-builder-word';
        wordElement.addEventListener('click', () => moveWordBack(word, wordElement));
        sentenceWords.removeChild(wordElement);
    }

    function moveWordBack(word, wordElement) {
        builtSentence = builtSentence.filter(w => w !== word);
        sentenceWords.appendChild(wordElement);
        wordElement.className = 'sentence-word';
        wordElement.addEventListener('click', () => moveWordToBuilder(word, wordElement));
        sentenceBuilderArea.removeChild(wordElement);
    }

    function checkAnswer() {
        const question = selectedQuestionIds[currentQuestionIndex];
        const isCorrect = builtSentence.every((word, index) => word === question.options[question.correctOrder[index]]);
        correctness.textContent = isCorrect ? 'Correct!' : 'Incorrect!';
        explanation.textContent = question.explanation;
        submitButton.disabled = true;
        resetButton.disabled = true;
        flipCardCheckbox.checked = true;
        cardInner.classList.add('flipped');
        tryAgainButton.classList.toggle('active', !isCorrect);
        nextQuestionButton.classList.toggle('active', isCorrect);
        audioBackButton.disabled = false;
        console.log(`[checkAnswer] Correctness: ${correctness.textContent}, Explanation: ${explanation.textContent}, Flipped: ${cardInner.classList.contains('flipped')}`);
    }

    function resetSentence() {
        displayQuestion();
        console.log(`[resetSentence] Reset sentence, Index: ${currentQuestionIndex}`);
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

    submitButton.addEventListener('click', checkAnswer);
    resetButton.addEventListener('click', resetSentence);
    hintButton.addEventListener('click', showHint);
    audioButton.addEventListener('click', () => {
        const question = selectedQuestionIds[currentQuestionIndex];
        readText(`${question.question} ${shuffledOptions.join(', ')}`);
        console.log(`[audioButton] Played: ${question.question} ${shuffledOptions.join(', ')}`);
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
            localStorage.removeItem('selectedQuestionIds');
            localStorage.removeItem('currentQuestionIndex');
            window.location.href = 'results.html?type=rearrange';
        }
        console.log(`[nextQuestionButton] New Index: ${currentQuestionIndex}`);
    });

    homeButton.addEventListener('click', () => {
        localStorage.clear();
        window.location.href = 'home.html';
        console.log('[homeButton] Cleared storage, redirected to home');
    });

    loadQuestions();
});
import questions from './data/rearrange.json' assert { type: 'json' };

let currentQuestionIndex = 0;
let currentQuestion = questions[currentQuestionIndex];
let builtSentence = [];
let sentenceGameCompleted = 0;
let sentenceGameCorrect = 0;

const sentenceWordsContainer = document.getElementById("sentence-words");
const sentenceBuilderArea = document.getElementById("sentence-builder-area");
const submitButton = document.getElementById("submit-answer");
const resultContainer = document.getElementById("result-container");
const correctnessText = document.getElementById("correctness");
const explanationText = document.getElementById("explanation");
const progressText = document.getElementById("progress-text");
const questionText = document.getElementById("question-text");
const nextButton = document.getElementById("btn-next-question");
const tryAgainButton = document.getElementById("btn-try-again");

// Load the current question
function loadQuestion() {
  currentQuestion = questions[currentQuestionIndex];
  
  // Ensure the question is valid
  if (!currentQuestion || !currentQuestion.question || !currentQuestion.options) {
    console.error("Invalid question data:", currentQuestion);
    return;
  }

  // Clear previous content
  builtSentence = [];
  sentenceBuilderArea.innerHTML = '';
  sentenceWordsContainer.innerHTML = '';
  resultContainer.style.display = 'none';

  questionText.textContent = currentQuestion.question;
  progressText.textContent = `Question ${currentQuestionIndex + 1} of ${questions.length}`;

  // Shuffle and display options
  const shuffledWords = [...currentQuestion.options].sort(() => 0.5 - Math.random());

  shuffledWords.forEach(word => {
    const wordElement = document.createElement('div');
    wordElement.className = 'sentence-word';
    wordElement.textContent = word;
    wordElement.dataset.word = word;
    
    // Add click event to add word to sentence
    wordElement.addEventListener('click', function() {
      addWordToSentence(this);
    });
    
    sentenceWordsContainer.appendChild(wordElement);
  });
}

// Add word to the sentence builder
function addWordToSentence(wordElement) {
  const word = wordElement.dataset.word;
  
  // Create a new word element in the sentence area
  const sentenceWord = document.createElement('div');
  sentenceWord.className = 'sentence-builder-word';
  sentenceWord.textContent = word;
  sentenceWord.dataset.word = word;
  
  // Add click event to remove word from sentence
  sentenceWord.addEventListener('click', function() {
    removeWordFromSentence(this);
  });
  
  sentenceBuilderArea.appendChild(sentenceWord);
  builtSentence.push(word);
  
  // Remove word from the available word bank
  wordElement.remove();
}

// Remove word from the sentence builder
function removeWordFromSentence(wordElement) {
  const word = wordElement.dataset.word;
  
  // Create a new word element in the word bank
  const newWordElement = document.createElement('div');
  newWordElement.className = 'sentence-word';
  newWordElement.textContent = word;
  newWordElement.dataset.word = word;
  
  // Add click event to add word to sentence
  newWordElement.addEventListener('click', function() {
    addWordToSentence(this);
  });
  
  sentenceWordsContainer.appendChild(newWordElement);
  
  // Remove word from built sentence
  wordElement.remove();
  builtSentence = builtSentence.filter(w => w !== word);
}

// Check if the sentence is correct
submitButton.addEventListener('click', () => {
  const builtSentenceStr = builtSentence.join(' ');

  if (builtSentence.length === 0) {
    correctnessText.textContent = "Please build a sentence first!";
    resultContainer.style.display = 'block';
    return;
  }

  // Check if the sentence matches the correct order
  if (builtSentenceStr === currentQuestion.correctOrder) {
    correctnessText.textContent = "Correct!";
    explanationText.textContent = 'Well done, the sentence is correct!';
    sentenceGameCorrect++;
  } else {
    correctnessText.textContent = "Incorrect!";
    explanationText.textContent = 'Try again, the order is not correct.';
    sentenceGameCorrect = 0;  // Reset score if incorrect
  }

  // Increment completed game counter
  sentenceGameCompleted++;
  progressText.textContent = `Progress: ${sentenceGameCompleted}/10 completed`;

  // Show result
  resultContainer.style.display = 'block';
  submitButton.style.display = 'none';
  nextButton.style.display = currentQuestionIndex + 1 < questions.length ? 'block' : 'none';
  tryAgainButton.style.display = 'block';
});

// Next question button functionality
nextButton.addEventListener('click', () => {
  currentQuestionIndex++;
  if (currentQuestionIndex < questions.length) {
    loadQuestion();
    resultContainer.style.display = 'none';
    submitButton.style.display = 'block';
  } else {
    alert('Quiz Complete!');
    window.location.href = 'home.html'; // Redirect to home page
  }
});

// Try again button functionality
tryAgainButton.addEventListener('click', () => {
  loadQuestion();
  resultContainer.style.display = 'none';
  submitButton.style.display = 'block';
});

// Load the first question on page load
loadQuestion();
