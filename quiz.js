const TOTAL_QUESTIONS = 10;

// Function to shuffle an array (Fisher-Yates)
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// Function to select random questions
function selectRandomQuestions(questions, count) {
  if (questions.length < count) {
    console.error(`Not enough questions available: ${questions.length} found, ${count} needed`);
    return questions;
  }
  const shuffled = shuffleArray([...questions]);
  return shuffled.slice(0, count);
}

document.addEventListener('DOMContentLoaded', () => {
  const difficultyButtons = document.querySelectorAll('.difficulty-group .btn');
  let questionsData = [];
  let rearrangeData = [];

  // Load questions
  Promise.all([
    fetch('data/questions.json').then(response => response.json()),
    fetch('data/rearrange.json').then(response => response.json())
  ])
    .then(([questions, rearrange]) => {
      questionsData = questions;
      rearrangeData = rearrange;

      difficultyButtons.forEach(button => {
        button.addEventListener('click', () => {
          const difficulty = button.id.replace('btn-', '');
          localStorage.setItem('difficulty', difficulty);
          localStorage.setItem('score', 0);
          localStorage.setItem('currentQuestionIndex', 0);
          localStorage.setItem('incorrectAnswers', JSON.stringify([]));

          // Filter questions by difficulty
          const filteredMultipleChoice = questionsData.filter(q => q.difficulty === difficulty);
          const filteredRearrange = rearrangeData.filter(q => q.difficulty === difficulty);

          // Select 3 random questions from each type
          const selectedMultipleChoice = selectRandomQuestions(filteredMultipleChoice, 5).map(q => ({
            type: 'multiple-choice',
            data: q
          }));
          const selectedRearrange = selectRandomQuestions(filteredRearrange, 5).map(q => ({
            type: 'rearrange',
            data: q
          }));

          // Combine and shuffle questions
          const selectedQuestions = shuffleArray([...selectedMultipleChoice, ...selectedRearrange]);
          localStorage.setItem('quizQuestions', JSON.stringify(selectedQuestions));

          window.location.href = selectedQuestions[0].type === 'multiple-choice' ? 'index.html' : 'rearrange.html';
        });
      });
    })
    .catch(error => {
      console.error('Error loading questions:', error);
    });
});