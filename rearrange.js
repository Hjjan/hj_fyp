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
  const totalQuestions = 15;
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
      utterance.rate = 0.7;
      window.speechSynthesis.speak(utterance);
  }

  function displayQuestion() {
      const question = selectedQuestionIds[currentQuestionIndex];
      console.log(`[displayQuestion] Question ID: ${question.id}, Source: ${question.source}, Index: ${currentQuestionIndex}`);
      if (question.source === 'questions.json') {
          localStorage.setItem('currentQuestionIndex', currentQuestionIndex);
          window.location.href = 'mc.html';
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
      submitButton.disabled = false;
      resetButton.disabled = false;
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
      submitButton.disabled = builtSentence.length === 0;
      resetButton.disabled = builtSentence.length === 0;
  }

  function moveWordBack(word, wordElement) {
      builtSentence = builtSentence.filter(w => w !== word);
      sentenceWords.appendChild(wordElement);
      wordElement.className = 'sentence-word';
      wordElement.addEventListener('click', () => moveWordToBuilder(word, wordElement));
      sentenceBuilderArea.removeChild(wordElement);
      submitButton.disabled = builtSentence.length === 0;
      resetButton.disabled = builtSentence.length === 0;
  }

  function checkAnswer() {
      const question = selectedQuestionIds[currentQuestionIndex];
      const correctSentence = question.correctOrder.map(index => question.options[index].toLowerCase());
      const userSentence = builtSentence.map(word => word.toLowerCase());
      const isCorrect = userSentence.every((word, index) => word === correctSentence[index]);
      correctness.textContent = isCorrect ? 'Correct!' : 'Incorrect!';
      explanation.textContent = question.explanation;
      submitButton.disabled = true;
      resetButton.disabled = true;
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

      console.log(`[checkAnswer] User Sentence: ${userSentence}, Correct Sentence: ${correctSentence}, Correctness: ${correctness.textContent}`);
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