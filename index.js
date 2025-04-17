import example from "./data/questions.json" with { type: "json" };

/** Loads flashcard progress from local storage if available. */
function loadProgress() {
	const stored = localStorage.getItem("flashcardProgress");
	return stored ? JSON.parse(stored) : {};
}

/** Saves the current progress back to local storage. */
function saveProgress(progress) {
	localStorage.setItem("flashcardProgress", JSON.stringify(progress));
}

const progressData = loadProgress();
const cards = example.sort((a, b) => {
	const dateA = progressData[a.id]?.dueDate ? new Date(progressData[a.id].dueDate) : Infinity;
	const dateB = progressData[b.id]?.dueDate ? new Date(progressData[b.id].dueDate) : Infinity;
	return dateA - dateB;
});

let currentIndex = 0;
const incorrectAnswers = []; // Declare the array to store incorrect answers

const entriesBody = document.getElementById("entries-body");

function pickRandomCardsFromRange(rangeStart, rangeEnd, count) {
	const filteredCards = cards.filter(card => card.id >= rangeStart && card.id <= rangeEnd);
	shuffleArray(filteredCards);
	return filteredCards.slice(0, count);
}

const selectedCards = [
	...pickRandomCardsFromRange(1, 20, 2),
	...pickRandomCardsFromRange(21, 40, 2),
	...pickRandomCardsFromRange(41, 55, 2)
];
shuffleArray(selectedCards);
console.log(selectedCards);

function initEntries() {
	selectedCards.forEach((card, i) => {
		const row = document.createElement("tr");
		row.addEventListener("click", () => {
			currentIndex = i;
			renderCard();
		});
		const cellId = document.createElement("td");
		cellId.textContent = card.id;
		const cellWord = document.createElement("td");
		cellWord.textContent = card.text;
		const cellDue = document.createElement("td");
		cellDue.textContent = progressData[card.id]?.dueDate || "Unseen";
		row.appendChild(cellId);
		row.appendChild(cellWord);
		row.appendChild(cellDue);
		entriesBody.appendChild(row);
	});
}

function updateEntries() {
	selectedCards.forEach((card, i) => {
		const row = entriesBody.children[i];
		row.classList.toggle("row-highlight", i === currentIndex);
		const cellDue = row.children[row.childElementCount - 1];
		const dueDateString = progressData[card.id]?.dueDate;
		if (dueDateString) {
			cellDue.textContent = dueDateString;
			const dueDate = new Date(dueDateString);
			const today = new Date();
			cellDue.classList.toggle("overdue-date", dueDate.setHours(0,0,0,0) < today.setHours(0,0,0,0));
		} else {
			cellDue.textContent = "Unseen";
			cellDue.classList.remove("overdue-date");
		}
	});
}

const text = document.getElementById("text");
const questionText = document.getElementById("question-text");
const backImage = document.getElementById("back-image");
const backAudio = document.getElementById("back-audio");
const backVideo = document.getElementById("back-video");

const flipCardCheckbox = document.getElementById("flip-card-checkbox");
const cardInner = document.getElementById("card-inner");
const transitionHalfDuration = parseFloat(getComputedStyle(cardInner).transitionDuration) * 1000 / 2;
const option1Element = document.getElementById("option-1");
const option2Element = document.getElementById("option-2");
const option3Element = document.getElementById("option-3");

const correctnessElement = document.getElementById("correctness");
const explanationElement = document.getElementById("explanation");

const nextQuestionButton = document.getElementById("btn-next-question");
const tryAgainButton = document.getElementById("btn-try-again");

let correctAnswersCount = 0;  // Track the number of correct answers
const totalQuestions = selectedCards.length;  // Total number of flashcards

// Update progress bar based on the current index of the selected cards
function updateProgress() {
    const progressBar = document.getElementById('progress-bar');
    const progressText = document.getElementById('progress-text');

    // Calculate the percentage based on the current index
    const progress = ((currentIndex + 1) / selectedCards.length) * 100; // currentIndex + 1 to count the first card as 1
    progressBar.style.width = `${progress}%`;

    // Update the text with current question and total questions
    progressText.textContent = `Question ${currentIndex + 1} of ${selectedCards.length}`;
}

function checkAnswer() {
	flipCardCheckbox.checked = true;
	const currentCard = selectedCards[currentIndex];
	const selection = this.textContent;
	const correctAnswer = currentCard.options[0];

	if (selection === correctAnswer) {
		correctnessElement.textContent = "Correct!";
		correctAnswersCount++;
		explanationElement.innerHTML = `You’ve got this!<br><br>${currentCard.explanation}`;
		nextQuestionButton.style.display = "block";
		tryAgainButton.style.display = "none";
		saveProgress(progressData);
		// Move to the next question after answering
		updateProgress();   // Update the progress bar
	} else {
		correctnessElement.textContent = "Incorrect!";
		explanationElement.innerHTML = `Not quite!<br><br>${currentCard.tips}`;
		nextQuestionButton.style.display = "none";
		tryAgainButton.style.display = "block";
		if (!incorrectAnswers.includes(currentCard.id)) {
			incorrectAnswers.push(currentCard.id);
		}
	}
}

nextQuestionButton.addEventListener("click", () => {
	if (currentIndex === selectedCards.length - 1) {
		localStorage.setItem('correctAnswersCount', correctAnswersCount);
		localStorage.setItem('totalQuestions', totalQuestions);
		localStorage.setItem('incorrectAnswers', JSON.stringify(incorrectAnswers));
		window.location.href = 'results.html';
	} else {
		currentIndex++;
		renderCard();
		updateProgress();
		nextQuestionButton.style.display = "none";
	}
});

tryAgainButton.addEventListener("click", () => {
	renderCard();
	tryAgainButton.style.display = "none";
});

option1Element.addEventListener("click", checkAnswer);
option2Element.addEventListener("click", checkAnswer);
option3Element.addEventListener("click", checkAnswer);

function shuffleArray(array) {
	for (let i = array.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[array[i], array[j]] = [array[j], array[i]];
	}
}

function renderCard() {
	if (selectedCards.length === 0) {
		console.error('No cards to render');
		return;
	}
	const currentCard = selectedCards[currentIndex];
	if (!currentCard) {
		console.error('Invalid current card');
		return;
	}
	text.textContent = currentCard.text;
	questionText.textContent = currentCard.question;

	const options = [...currentCard.options];
	shuffleArray(options);
	option1Element.textContent = options[0] || "";
	option2Element.textContent = options[1] || "";
	option3Element.textContent = options[2] || "";

	flipCardCheckbox.checked = false;

	setTimeout(() => {
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

	updateEntries();
}

document.getElementById("btn-home").addEventListener("click", () => {
	window.location.href = "home.html";
});

document.getElementById("btn-back").addEventListener("click", () => {
	currentIndex = (currentIndex - 1 + selectedCards.length) % selectedCards.length;
	renderCard();
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