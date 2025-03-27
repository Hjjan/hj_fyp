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

// Sorts the flashcards by their due date to prioritise learning.
const progressData = loadProgress();
const cards = example
	.sort((a, b) => {
		// Put cards without a dueDate at the last
		const dateA = progressData[a.id]?.dueDate ? new Date(progressData[a.id].dueDate) : Infinity;
		const dateB = progressData[b.id]?.dueDate ? new Date(progressData[b.id].dueDate) : Infinity;
		return dateA - dateB;
	});

let currentIndex = 0;

const entriesBody = document.getElementById("entries-body");

/** Creates a table row for each card, allowing quick navigation. */
function initEntries() {
	// Build table rows
	cards.forEach((card, i) => {
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
		cellDue.textContent = progressData[card.id]?.dueDate || "Unseen"; // If the card has not been learnt before, mark it as "Unseen"

		row.appendChild(cellId);
		row.appendChild(cellWord);
		row.appendChild(cellDue);
		entriesBody.appendChild(row);
	});
}

/** Updates highlighted row and due dates each time we render or change data. */
function updateEntries() {
	// Update row highlight and due dates
	cards.forEach((card, i) => {
		const row = entriesBody.children[i];
		row.classList.toggle("row-highlight", i === currentIndex);

		const cellDue = row.children[row.childElementCount - 1];
		const dueDateString = progressData[card.id]?.dueDate;
		if (dueDateString) {
			cellDue.textContent = dueDateString;
			// If the due date is earlier than today, mark it as overdue
			const dueDate = new Date(dueDateString);
			const today = new Date();
			cellDue.classList.toggle("overdue-date", dueDate.setHours(0, 0, 0, 0) < today.setHours(0, 0, 0, 0));
		} else {
			cellDue.textContent = "Unseen";
			cellDue.classList.remove("overdue-date");
		}
	});
}



// Grabs references to the flashcard UI elements needed to display data.
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

const nextQuestionButton = document.getElementById("btn-next-question"); // The "Next Question" button
const tryAgainButton = document.getElementById("btn-try-again"); // The "Try Again" button

let correctAnswersCount = 0;  // Track the number of correct answers
const totalQuestions = cards.length;  // Total number of flashcards

function checkAnswer() {
	// Flip the flashcard to the back side
	flipCardCheckbox.checked = true;

	// Compare the selected answer with the correct one and show appropriate feedback
	const currentCard = cards[currentIndex];
	const selection = this.textContent;
	const correctAnswer = currentCard.options[0];  // The first option is always the correct answer

	if (selection === correctAnswer) {
		correctnessElement.textContent = "Correct!";
		// Increment correct answers count
		correctAnswersCount++;
		// Use backticks for template literals
		explanationElement.innerHTML = `You’ve got this!<br><br>${currentCard.explanation}`;
		nextQuestionButton.style.display = "block";
		tryAgainButton.style.display = "none";
		saveProgress(data);
	} else {
		correctnessElement.textContent = "Incorrect!";
		// Use backticks for template literals
		explanationElement.innerHTML = `Not quite!<br><br>${currentCard.tips}`;
		nextQuestionButton.style.display = "none";
		tryAgainButton.style.display = "block";	
	}
}

nextQuestionButton.addEventListener("click", () => {
    nextCard(); // Move to the next card
    console.log(currentIndex, cards.length - 1);  // Log current index and last card index
    if (currentIndex === cards.length - 1) {
        console.log("Redirecting to results page...");
        // Store results in localStorage
        localStorage.setItem('correctAnswersCount', correctAnswersCount);
        localStorage.setItem('totalQuestions', totalQuestions);
        window.location.href = 'results.html';  // Navigate to results page
    } else {
        renderCard(); // Render the new card
        nextQuestionButton.style.display = "none"; // Hide the button again after moving to the next card
    }
});


tryAgainButton.addEventListener("click", () => {
    renderCard(); // Render the new card
    tryAgainButton.style.display = "none"; // Hide the button again after moving to the next card
});

// Trigger the function when the option buttons are clicked
option1Element.addEventListener("click", checkAnswer);
option2Element.addEventListener("click", checkAnswer);
option3Element.addEventListener("click", checkAnswer);

// Fisher-Yates Shuffle function
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]]; // Swap elements
    }
}


/** Renders the current card on both front and back. */
function renderCard() {
	// STUDENTS: Start of recommended modifications
	// If there are more fields in the dataset (e.g., synonyms, example sentences),
	// display them here (e.g., backSynonym.textContent = currentCard.synonym).

	// Update the front side with the current card's word
	const currentCard = cards[currentIndex];
	text.textContent = currentCard.text;
	questionText.textContent = currentCard.question;

	const options = [...currentCard.options]; // Clone the array to avoid modifying the original options array
    shuffleArray(options); // Shuffle the options
	option1Element.textContent = options[0] || "";  // If options[0] exists, set it; otherwise, leave empty
	option2Element.textContent = options[1] || "";  // Same for option 2
	option3Element.textContent = options[2] || "";  // Same for option 3

	// Reset flashcard to the front side
	flipCardCheckbox.checked = false;

	// Wait for the back side to become invisible before updating the content
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
	// STUDENTS: End of recommended modifications

	updateEntries();
}

// Add event listener to "Back to Home" button
document.getElementById("btn-home").addEventListener("click", () => {
    window.location.href = "home.html";  // Navigate to home page
});


/** Navigates to the previous card. */
function previousCard() {
	currentIndex = (currentIndex - 1 + cards.length) % cards.length;
}

/** Navigates to the next card. */
function nextCard() {
	currentIndex = (currentIndex + 1) % cards.length;
}

document.getElementById("btn-back").addEventListener("click", () => {
	previousCard();
	renderCard();
});
document.getElementById("btn-next").addEventListener("click", () => {
	nextCard();
	renderCard();
});



// Initial render
initEntries();
renderCard();