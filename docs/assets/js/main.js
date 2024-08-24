
let gameState = {
  gameNumber: null,
  answerGroups: [],
  clickedWords: [],
  gameBoardWords: [],
  guessesRemaining: 4,
  correctGuesses: 0,
};

const defaultBackgroundColor = 'rgb(239, 239, 230)';

const guessesRemainingContainer = document.getElementById('guessesRemainingContainer');
const guessesRemainingElement = document.getElementById('guessesRemaining');

document.addEventListener('DOMContentLoaded', loadGameState);
window.addEventListener('unload', saveGameState);

function saveGameState() {
  localStorage.setItem('gameState', JSON.stringify(gameState));
}

function loadGameState() {
  const savedState = localStorage.getItem('gameState');
  if (savedState) {
    gameState = JSON.parse(savedState);
    populateNewDisplay();
  } else {
    startNewGame();
    populateNewDisplay();
  }
}

function newGameButtonPress() {
  playAgain();
}

function playAgain() {
  gameState.guessesRemaining = 4;
  gameState.correctGuesses = 0;
  gameState.gameBoardWords = [];
  gameState.correctlyGuessedGroups = [];
  gameState.clickedWords = [];
  startNewGame();
  populateNewDisplay();
  toggleGameControlButtons(true);
}

function toggleGameControlButtons(enable) {
  const buttons = document.querySelectorAll('#shuffleButton, #submitButton');
  buttons.forEach(button => button.disabled = !enable);
}

function checkWinCondition() {
  if (gameState.correctGuesses === 4 && gameState.gameBoardWords.length === 0) {
    displayModal('winModal');
    saveGameState();
    toggleGameControlButtons(false);
  }
}

function checkLossCondition() {
  if (gameState.guessesRemaining === 0) {
    displayModal('lossModal');
    saveGameState();
    toggleGameControlButtons(false);
  }
}

function displayModal(id) {
  const modalBody = document.getElementById(`${id}Body`);
  modalBody.innerHTML = '';

  gameState.answerGroups.forEach(group => {
    const words = group.words.map(word => word.toUpperCase()).join(', ');
    const categoryName = group.category;
    const p = document.createElement('p');
    p.innerHTML = `<strong>${categoryName}</strong> - ${words}`;
    modalBody.appendChild(p);
  });

  const modal = new bootstrap.Modal(document.getElementById(id));
  modal.show();
}

function startNewGame() {
  getRandomCategories(setupNewGame);
}

async function getRandomCategories(callback) {
  try {
      const response = await fetch('../docs/connections.json');
      const data = await response.json();

      const randomIndex = Math.floor(Math.random() * data.length);
      gameState.gameNumber = randomIndex;
      const randomCategories = data[randomIndex].answers;

      const categories = randomCategories.map(answer => {
          return {
              category: answer.group,
              words: answer.members,
              level: answer.level,
              guessedCorrectly: false
          };
      });

      callback(categories);
    } catch (error) {
        console.error('Error fetching or parsing JSON:', error);
    }
}

function setupNewGame(categories) {
    gameState.answerGroups = categories;
    gameState.answerGroups.forEach(category => {
        category.words.forEach(word => gameState.gameBoardWords.push(word));
    });
    gameState.gameBoardWords = shuffle(gameState.gameBoardWords);
    populateNewDisplay();
    saveGameState();
}

function populateNewDisplay() {
  setGameTitle();
  clearSolvedCategoriesHtml();
  showGameBoard();
}

function setGameTitle() {
  const title = document.getElementById('gameTitle');
  title.textContent = `LexLink - #${gameState.gameNumber}`;
}

function shuffleGameBoard() {
  gameState.gameBoardWords = shuffle(gameState.gameBoardWords);
  gameState.clickedWords = [];
  showGameBoard();
  toggleDeselectButton();
}

function toggleSubmitButton(enable) {
  document.getElementById('submitButton').disabled = !enable;
}

function toggleDeselectButton(enable) {
  document.getElementById('deselectButton').disabled = !enable;
}

function generateDotsHTML(guessesRemaining) {
  return '&bull; '.repeat(guessesRemaining);
}

function showGameBoard() {
  const cardsContainer = document.getElementById('cardsContainer');
  cardsContainer.classList = 'cardsContainer';
  cardsContainer.innerHTML = '';

  const numRows = Math.ceil(gameState.gameBoardWords.length / 4);

  if (numRows === 4) {
      cardsContainer.classList.add('cardsContainer4');
  } else if (numRows === 3) {
      cardsContainer.classList.add('cardsContainer3');
  } else if (numRows === 2) {
      cardsContainer.classList.add('cardsContainer2');
  } else if (numRows === 1) {
      cardsContainer.classList.add('cardsContainer1');
  }

  for (let i = 0; i < numRows; i++) {
    for (let j = 0; j < 4; j++) {
      const index = i * 4 + j;
      if (index < gameState.gameBoardWords.length) {
        const currentWord = gameState.gameBoardWords[index];

        const input = document.createElement('input');
        input.className = 'visually-hidden';
        input.type = 'checkbox';
        input.id = `inner-card-${index}`;
        input.name = `inner-card-${index}`;
        input.value = currentWord;
        input.setAttribute('data-testid', 'card-input');

        const label = document.createElement('label');
        label.className = 'label';
        label.setAttribute('for', `inner-card-${index}`);
        label.setAttribute('data-testid', 'card-label');
        label.setAttribute('data-flip-config', '{"translate":true,"scale":true,"opacity":true}');
        label.setAttribute('data-flip-id', currentWord);
        label.setAttribute('data-portal-key', 'portal');
        label.textContent = currentWord.toUpperCase();

        label.classList.add('shuffle');

        label.addEventListener('click', function () {
          const index = gameState.clickedWords.indexOf(currentWord);
          if (index === -1 && gameState.clickedWords.length < 4) {
            gameState.clickedWords.push(currentWord);
            label.classList.add('selected');
          } else if (index !== -1) {
            gameState.clickedWords.splice(index, 1);
            label.classList.remove('selected');
          }
          toggleSubmitButton(gameState.clickedWords.length === 4);
          toggleDeselectButton(gameState.clickedWords.length > 0);

          console.log(gameState.clickedWords);
        });

        cardsContainer.appendChild(input);
        cardsContainer.appendChild(label);
      }
    }
  }

  guessesRemainingElement.innerHTML = generateDotsHTML(gameState.guessesRemaining);
}

function addCorrectlyGuessedGroupToGameBoard(correctlyGuessedGroup) {
  const section = document.createElement('section');
  section.className = 'solvedCategory textFadeInThemeLight pulse';
  section.setAttribute('data-level', correctlyGuessedGroup.level);
  section.setAttribute('role', 'img');
  section.setAttribute('aria-label', `Correct group ${correctlyGuessedGroup.name}. ${correctlyGuessedGroup.words.join(', ')}`);
  section.setAttribute('data-testid', 'solved-category-container');

  const title = document.createElement('h3');
  title.className = 'categoryTitle textFadeInThemeLight';
  title.setAttribute('data-testid', 'solved-category-title');
  title.textContent = correctlyGuessedGroup.category;
  section.appendChild(title);

  const cardList = document.createElement('ol');

  correctlyGuessedGroup.words.forEach((word) => {
      const li = document.createElement('li');
      li.className = 'cardListItem textFadeInThemeLight';
      li.setAttribute('data-testid', 'solved-category-card');
      li.textContent = word;
      cardList.appendChild(li);
  });

  section.appendChild(cardList);

  const solvedCategories = document.getElementById('SolvedCategories')
  solvedCategories.appendChild(section);
}

function clearSolvedCategoriesHtml() {
  const solvedCategoriesContainer = document.getElementById('SolvedCategories');
  solvedCategoriesContainer.innerHTML = '';
}

function revertCardsColor() {
  const cardContainers = document.querySelectorAll('#cardsContainer');
  cardContainers.forEach(container => {
    const cards = container.querySelectorAll('.label');
    cards.forEach(card => {
      card.classList.remove('selected');
    });
  });
}

function deselectAll() {
  gameState.clickedWords = [];
  revertCardsColor();
  toggleSubmitButton(false);
  toggleDeselectButton(false);
}

function checkGuess() {
  let foundMatch = false;
  let majorityCategoryCount = 0;
  let notInMajorityCount = 0;
  let majorityCategoryIndex = -1;

  if (gameState.clickedWords.length !== 4) {
    return;
  }

  for (let i = 0; i < gameState.answerGroups.length; i++) {
    const categoryWords = gameState.answerGroups[i].words;
    let feedback = '';

    if (arraysEqual(gameState.clickedWords, categoryWords)) {
      foundMatch = true;
      majorityCategoryIndex = i;
      break;
    }

    let count = 0;
    gameState.clickedWords.forEach(word => {
      if (categoryWords.includes(word)) {
        count++;
      }
    });

    if (count > majorityCategoryCount) {
      majorityCategoryCount = count;
      majorityCategoryIndex = i;
    }
  }

  if (foundMatch) {
    gameState.clickedWords.forEach(word => {
      let index = gameState.gameBoardWords.indexOf(word);
      gameState.gameBoardWords.splice(index, 1);

    });

    correctlyGuessedGroup = gameState.answerGroups[majorityCategoryIndex];
    gameState.correctlyGuessedGroups.push(gameState.answerGroups[majorityCategoryIndex]);
    addCorrectlyGuessedGroupToGameBoard(correctlyGuessedGroup);

    gameState.correctGuesses += 1;

  } else {
    notInMajorityCount = gameState.clickedWords.length - majorityCategoryCount;
    feedback = (notInMajorityCount < 2) ? `${notInMajorityCount} AWAY...` : 'WRONG';
    updateFeedbackText(feedback);
    gameState.guessesRemaining -= 1;
  }

  gameState.clickedWords = [];

  showGameBoard();
  revertCardsColor();
  toggleSubmitButton(false);
  toggleDeselectButton(false);
  checkWinCondition();
  checkLossCondition();
  saveGameState();
}

function updateFeedbackText(message) {
  const feedbackElement = document.getElementById('feedbackText');
  feedbackElement.innerText = message;

  feedbackElement.style.opacity = '1';
  clearTimeout(feedbackElement.fadeOutTimeout);

  feedbackElement.fadeOutTimeout = setTimeout(() => {
      feedbackElement.style.transition = 'opacity 1s ease';
      feedbackElement.style.opacity = '0';
  }, 2000);
}

function arraysEqual(a, b) {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (a.length !== b.length) return false;

  a.sort();
  b.sort();

  for (let i = 0; i < a.length; ++i) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

function shuffle(array) {
  if (!array || array.length <= 1) {
    return array;
  }

  let currentIndex = array.length;
  while (currentIndex != 0) {
    let randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
  }
  return array;
}