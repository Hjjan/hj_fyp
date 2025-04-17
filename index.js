import example from "./data/questions.json" with { type: "json" };

/** Loads flashcard progress from local storage if available. */
function loadProgress() {
	try {
		const stored = localStorage.getItem("flashcardProgress");
		return stored ? JSON.parse(stored) : {};
	} catch (e) {
		console.error("Error loading progress:", e);
		return {};
	}
}

/** Saves the current progress back to local storage. */
function saveProgress(progress) {
	try {
		localStorage.setItem("flashcardProgress", JSON.stringify(progress));
	} catch (e) {
		console.error("Error saving progress:", e);
	}
}

const progressData = loadProgress();
// Ensure cards is an array and log its length for debugging
const cards = Array.isArray(example) ? example : [];
console.log("Total cards loaded:", cards.length);

const sortedCards = cards.sort((a, b) => {
	const dateA = progressData[a.id]?.dueDate ? new Date(progressData[a.id].dueDate) : new Date(9999, 0, 1);
	const dateB = progressData[b.id]?.dueDate ? new Date(progressData[b.id].dueDate) : new Date(9999, 0, 1);
	return dateA - dateB;
});

let currentIndex = 0;
const incorrectAnswers = [];

function pickRandomCardsFromRange(rangeStart, rangeEnd, count) {
	const filteredCards = sortedCards.filter(card => 
		card.id >= rangeStart && 
		card.id <= rangeEnd && 
		(rangeStart >= 41 || card.text) && // Require text for ranges < 41
		card.question && 
		Array.isArray(card.options) && 
		card.options.length >= 3
	);
	console.log(`Range ${rangeStart}-${rangeEnd}: ${filteredCards.length} valid cards`);
	shuffleArray(filteredCards);
	return filteredCards.slice(0, Math.min(count, filteredCards.length));
}

const TARGET_QUESTION_COUNT = 6; // Adjustable (e.g., 5, 20)
function ensureCards() {
	const selectedCards = [];
	const ranges = [
		{ start: 1, end: 20, count: Math.ceil(TARGET_QUESTION_COUNT / 3) },
		{ start: 21, end: 40, count: Math.ceil(TARGET_QUESTION_COUNT / 3) },
		{ start: 41, end: 58, count: Math.ceil(TARGET_QUESTION_COUNT / 3) }
	];

	// Try primary ranges
	for (const range of ranges) {
		const cards = pickRandomCardsFromRange(range.start, range.end, range.count);
		selectedCards.push(...cards);
	}

	// If fewer than TARGET_QUESTION_COUNT cards, fill from all valid cards
	if (selectedCards.length < TARGET_QUESTION_COUNT) {
		const needed = TARGET_QUESTION_COUNT - selectedCards.length;
		const currentIds = new Set(selectedCards.map(card => card.id));
		const availableCards = sortedCards.filter(card => 
			!currentIds.has(card.id) && 
			(card.id >= 41 || card.text) && // Require text for IDs < 41
			card.question && 
			Array.isArray(card.options) && 
			card.options.length >= 3
		);
		shuffleArray(availableCards);
		selectedCards.push(...availableCards.slice(0, needed));
	}

	// Ensure exactly TARGET_QUESTION_COUNT cards
	if (selectedCards.length > TARGET_QUESTION_COUNT) {
		selectedCards.length = TARGET_QUESTION_COUNT;
	}

	return selectedCards;
}

const selectedCards = ensureCards();
shuffleArray(selectedCards);
console.log("Selected cards:", selectedCards.map(card => card.id), `Total: ${selectedCards.length}`);

const text = document.getElementById("text");
const questionText = document.getElementById("question-text");
const backImage = document.getElementById("back-image");
const backAudio = document.getElementById("back-audio");
const backVideo = document.getElementById("back-video");
const flipCardCheckbox = document.getElementById("flip-card-checkbox");
const cardInner = document.getElementById("card-inner");
const transitionHalfDuration = cardInner ? parseFloat(getComputedStyle(cardInner).transitionDuration) * 1000 / 2 : 300;
const option1Element = document.getElementById("option-1");
const option2Element = document.getElementById("option-2");
const option3Element = document.getElementById("option-3");
const correctnessElement = document.getElementById("correctness");
const explanationElement = document.getElementById("explanation");
const nextQuestionButton = document.getElementById("btn-next-question");
const tryAgainButton = document.getElementById("btn-try-again");
const backButton = document.getElementById("btn-back");

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
