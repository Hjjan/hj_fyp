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
	//Modify as needed
    const totalQuestions = 10;
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
                const [mcResponse, reResponse] = await Promise.all([
                    fetch('data/questions.json'),
                    fetch('data/rearrange.json')
                ]);
                const questions = await mcResponse.json();
                const rearrangeQuestions = await reResponse.json();
                const filteredMC = questions.filter(q => q.difficulty === difficulty);
                const filteredRe = rearrangeQuestions.filter(q => q.difficulty === difficulty);
                selectedQuestionIds = getRandomQuestions(filteredMC, filteredRe, 5);
                localStorage.setItem('selectedQuestionIds', JSON.stringify(selectedQuestionIds));
            }
            console.log(`[loadQuestions] Selected Question IDs: ${selectedQuestionIds.map(q => `${q.id} (${q.source})`).join(', ')}`);
            displayQuestion();
        } catch (error) {
            console.error('[loadQuestions] Error loading questions:', error);
            questionText.textContent = 'Error loading questions';
            textElement.textContent = '';
        }
    }

    function getRandomQuestions(mcQuestions, reQuestions, countPerType) {
        const shuffledMC = mcQuestions.sort(() => 0.5 - Math.random()).slice(0, countPerType).map(q => ({ ...q, source: 'questions.json' }));
        const shuffledRe = reQuestions.sort(() => 0.5 - Math.random()).slice(0, countPerType).map(q => ({ ...q, source: 'rearrange.json' }));
        const interleaved = [];
        for (let i = 0; i < countPerType; i++) {
            if (i < shuffledMC.length) interleaved.push(shuffledMC[i]);
            if (i < shuffledRe.length) interleaved.push(shuffledRe[i]);
        }
        console.log(`[getRandomQuestions] MC Questions: ${shuffledMC.map(q => q.id).join(', ')}`);
        console.log(`[getRandomQuestions] Re Questions: ${shuffledRe.map(q => q.id).join(', ')}`);
        console.log(`[getRandomQuestions] Interleaved: ${interleaved.map(q => `${q.id} (${q.source})`).join(', ')}`);
        return interleaved;
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

<<<<<<< HEAD
let correctAnswersCount = 0;  // Track the number of correct answers
const totalQuestions = selectedCards.length;  // Total number of flashcards

// Update progress bar based on the current index of the selected cards
function updateProgress() {
<<<<<<< HEAD
    const progressBar = document.getElementById('progress-bar');
    const progressText = document.getElementById('progress-text');

    // Calculate the percentage based on the current index
    const progress = ((currentIndex + 1) / selectedCards.length) * 100; // currentIndex + 1 to count the first card as 1
    progressBar.style.width = `${progress}%`;

    // Update the text with current question and total questions
    progressText.textContent = `Question ${currentIndex + 1} of ${selectedCards.length}`;
=======
	const progressText = document.getElementById("progress-text");
	if (!progressText) {
		console.error("Progress text element not found");
		return;
	}
	progressText.textContent = `Question ${currentIndex + 1} of ${totalQuestions}`;
	progressText.style.display = "block";
	console.log(`Progress updated: Question ${currentIndex + 1} of ${totalQuestions}, Index: ${currentIndex}, Total: ${totalQuestions}`);
}

function playFeedbackSound(isCorrect) {
	const audio = new Audio(isCorrect ? "/sounds/correct.mp3" : "/sounds/incorrect.mp3");
	audio.play().catch(e => console.error("Error playing sound:", e));
>>>>>>> 4070cfd (nice)
}

function checkAnswer() {
	if (!flipCardCheckbox || !cardInner || !correctnessElement || !explanationElement) {
		console.error("Required elements missing in checkAnswer");
		return;
	}
	flipCardCheckbox.checked = true;
	const currentCard = selectedCards[currentIndex];
	if (!currentCard || !currentCard.options) {
		console.error("Invalid card at index", currentIndex, currentCard);
		return;
	}
	const selection = this.textContent;
	const correctAnswer = currentCard.options[0];

	// Disable buttons during transition
	[option1Element, option2Element, option3Element].forEach(btn => btn && (btn.disabled = true));
	setTimeout(() => {
		[option1Element, option2Element, option3Element].forEach(btn => btn && (btn.disabled = false));
	}, transitionHalfDuration * 2);

	if (selection === correctAnswer) {
		correctnessElement.textContent = "Correct!";
		correctAnswersCount++;
		explanationElement.innerHTML = `You’ve got this!<br><br>${currentCard.explanation}`;
		if (nextQuestionButton) {
			nextQuestionButton.classList.add("active");
			nextQuestionButton.disabled = false;
		}
		if (tryAgainButton) tryAgainButton.classList.remove("active");
		playFeedbackSound(true);
		saveProgress(progressData);
		// Move to the next question after answering
		updateProgress();   // Update the progress bar
	} else {
		correctnessElement.textContent = "Incorrect!";
		explanationElement.innerHTML = `Not quite!<br><br>${currentCard.tips}`;
		if (nextQuestionButton) nextQuestionButton.classList.remove("active");
		if (tryAgainButton) tryAgainButton.classList.add("active");
		playFeedbackSound(false);
		incorrectAnswers.push({
			question: currentCard.text || "Pick the sentence with incorrect grammar:",
			userAnswer: selection,
			correctAnswer: correctAnswer
		});
	}
}

if (nextQuestionButton) {
	nextQuestionButton.addEventListener("click", () => {
		try {
			if (!selectedCards.length) {
				console.error("No cards available to proceed");
				return;
			}
			if (currentIndex === selectedCards.length - 1) {
				const encodedIncorrectAnswers = encodeURIComponent(JSON.stringify(incorrectAnswers));
				window.location.href = `results.html?score=${correctAnswersCount}&total=${totalQuestions}&type=multiple-choice&incorrectAnswers=${encodedIncorrectAnswers}`;
			} else {
				currentIndex++;
				console.log("Advancing to index", currentIndex, "Card ID:", selectedCards[currentIndex]?.id);
				renderCard();
				updateProgress();
			}
		} catch (e) {
			console.error("Error in nextQuestionButton handler:", e);
		}
	});
}

if (tryAgainButton) {
	tryAgainButton.addEventListener("click", () => {
		renderCard();
		updateProgress();
	});
}

if (option1Element) option1Element.addEventListener("click", checkAnswer);
if (option2Element) option2Element.addEventListener("click", checkAnswer);
if (option3Element) option3Element.addEventListener("click", checkAnswer);

function shuffleArray(array) {
	for (let i = array.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[array[i], array[j]] = [array[j], array[i]];
	}
}

function renderCard() {
	if (!text || !questionText || !flipCardCheckbox || !cardInner || !option1Element || !option2Element || !option3Element) {
		console.error("Required DOM elements missing in renderCard:", {
			text, questionText, flipCardCheckbox, cardInner, option1Element, option2Element, option3Element
		});
		return;
	}

	// Reset button states
	if (nextQuestionButton) {
		nextQuestionButton.classList.remove("active");
		nextQuestionButton.disabled = false;
	}
	if (tryAgainButton) tryAgainButton.classList.remove("active");

	if (selectedCards.length === 0) {
		text.textContent = "No questions available!";
		questionText.textContent = "Please try again later.";
		const progressText = document.getElementById("progress-text");
		if (progressText) progressText.textContent = "No questions";
		console.error("No cards to render");
		return;
	}

	if (currentIndex >= selectedCards.length) {
		currentIndex = selectedCards.length - 1;
		console.warn("Index out of bounds, clamping to", currentIndex);
	}

	const currentCard = selectedCards[currentIndex];
	if (!currentCard || !currentCard.question || !Array.isArray(currentCard.options) || currentCard.options.length === 0) {
		console.error("Invalid card at index", currentIndex, currentCard);
		text.textContent = "Oops, something went wrong!";
		questionText.textContent = "Let’s try another question!";
		const progressText = document.getElementById("progress-text");
		if (progressText) progressText.textContent = "Error";
		return;
	}

	console.log("Rendering card at index", currentIndex, "ID:", currentCard.id, "Data:", {
		text: currentCard.text,
		question: currentCard.question,
		options: currentCard.options
	});
	
	// Handle text field: use card.text if available, otherwise use a placeholder for ID >= 41
	text.textContent = currentCard.text || (currentCard.id >= 41 ? "Pick the sentence with incorrect grammar:" : "Missing word");
	questionText.textContent = currentCard.question || "Missing question";
	
	const options = [...currentCard.options];
	shuffleArray(options);
	option1Element.textContent = options[0] || "Option 1";
	option2Element.textContent = options[1] || "Option 2";
	option3Element.textContent = options[2] || "Option 3";

	// Ensure elements are visible
	text.style.display = "block";
	questionText.style.display = "block";
	option1Element.style.display = "block";
	option2Element.style.display = "block";
	option3Element.style.display = "block";

	flipCardCheckbox.checked = false;

	setTimeout(() => {
		if (!backImage || !backAudio || !backVideo) {
			console.warn("Media elements missing");
			return;
		}
		if (currentCard.image) {
			backImage.src = currentCard.image;
			backImage.style.display = "block";
		} else {
			backImage.style.display = "none";
		}
		if (currentCard.audio) {
			backAudio.src = currentCard.audio;
			backAudio.style.display = "block";
		} else {
			backAudio.style.display = "none";
		}
		if (currentCard.video) {
			backVideo.src = currentCard.video;
			backVideo.style.display = "block";
		} else {
			backVideo.style.display = "none";
		}
	}, transitionHalfDuration);

	updateProgress();
}

if (document.getElementById("btn-home")) {
	document.getElementById("btn-home").addEventListener("click", () => {
		window.location.href = "home.html";
	});
}

if (backButton) {
	backButton.addEventListener("click", () => {
		if (currentIndex > 0) {
			currentIndex--;
			renderCard();
			updateProgress();
		}
		backButton.disabled = currentIndex === 0;
	});
}

// Initialize
document.addEventListener("DOMContentLoaded", () => {
	renderCard();
<<<<<<< HEAD
});

// Handle Review Mistakes button click
document.getElementById("review-mistakes-button").addEventListener("click", () => {
	const mistakeCards = selectedCards.filter((card) => incorrectAnswers.includes(card.id));
	renderCards(mistakeCards); // Render only the mistake cards
  });
  

// Initial render
initEntries();
renderCard();
updateProgress();
=======
	updateProgress();
});
>>>>>>> 4070cfd (nice)
=======
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
            window.location.href = 'results.html?type=multiple-choice';
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
>>>>>>> e43f3dd (new changes)
