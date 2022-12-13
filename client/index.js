keyboardListener();
buttonListener();
keyPressListener();
initialiseLocalStorage();

// Global Variables for current word and current letter
let wordID = 1;
let letterID = 1;

// ----------------------------------- HEADER -----------------------------------

function buttonListener() {
  const hideLetterButton = document.querySelector('.hideLettersButton');
  hideLetterButton.addEventListener('click', hideLetters);
  const statisticsButton = document.querySelector('.statisticsButton');
  statisticsButton.addEventListener('click', displayStats);
  const modalSpan = document.querySelector('.close');
  modalSpan.addEventListener('click', closeModal);
}

// Hides letters on the board
function hideLetters() {
  const board = document.querySelector('#board');
  const wordBoxes = board.children;
  for (const box of wordBoxes) {
    const letters = box.children;
    for (const letter of letters) {
      letter.classList.toggle('textHidden');
    }
  }
}

// ----------------------------------- KEYBOARD -----------------------------------

// Event listener for physical keyboard
function keyPressListener() {
  document.addEventListener('keydown', keyPressEvent);
}

// eventHandler for physical key presses
function keyPressEvent(e) {
  let key = e.key;
  key = key.toUpperCase();
  const validKeys = [
    'Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P',
    'A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L',
    'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'ENTER', 'BACKSPACE'];
  if (validKeys.includes(key)) keyCheck(key);
}

// Adds event listener to every button on the virtual keyboard
function keyboardListener() {
  const keyboard = document.querySelector('#keyboard');
  const keys = keyboard.children;
  for (const key of keys) {
    if (key.textContent !== '') {
      key.addEventListener('click', buttonPressHandler);
    }
  }
}

// Checks correct key press and calls correct function
function buttonPressHandler(e) {
  const keyContent = e.target.textContent;
  keyCheck(keyContent);
}

// Checks keys from both virtual and physical keyboard
function keyCheck(key) {
  // eslint-disable-next-line no-useless-return
  if (wordID === 7) return;
  else if (key === 'ENTER' && letterID === 6) enterWord();
  else if ((key === 'BACKSPACE' || key === 'UNDO') && letterID !== 1) removeLetter();
  else if (key !== 'ENTER' && key !== 'BACKSPACE' && key !== 'UNDO' && letterID !== 6) enterLetter(key);
}

// Add letter text content, toggle guess class and increment global current letter
function enterLetter(key) {
  const letter = getCurrentLetter();
  letter.textContent = key;
  letter.classList.toggle('guess');
  letterID += 1;
}

// Decrement global current letter, remove text content and toggle guess class
function removeLetter() {
  letterID -= 1;
  const letter = getCurrentLetter();
  letter.textContent = '';
  letter.classList.toggle('guess');
}

function getCurrentLetter() {
  const currentWord = document.querySelector('#word' + wordID);
  const letters = currentWord.children;
  for (const letter of letters) {
    if (letter.id === 'letter' + letterID) {
      return letter;
    }
  }
}

function getCurrentWord() {
  const currentWord = document.querySelector('#word' + wordID);
  const letters = currentWord.children;
  let word = '';
  for (const letter of letters) {
    word += letter.textContent;
  }
  return word;
}

// ----------------------------------- ENTERING WORDS -----------------------------------

async function enterWord() {
  const accuracy = await sendWord();
  if (accuracy.length > 0) {
    updateWord(accuracy);
    updateKeyboard(accuracy);
    wordID += 1;
    letterID = 1;
    checkWin(accuracy);
  }
}

async function sendWord() {
  const word = getCurrentWord();
  const response = await fetch('/word', {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: word,
  });

  if (response.ok) {
    const accuracy = await response.json();
    return accuracy;
  } else {
    console.log('failed');
  }
}

function updateWord(accuracy) {
  const currentWord = document.querySelector('#word' + wordID);
  const letters = currentWord.children;
  const interval = 200;

  for (let i = 0; i < 5; i++) {
    setTimeout(() => {
      letters[i].classList.add('animate__animated', 'animate__flipInX', accuracy[i]);
    }, interval * i);
  }
}

function updateKeyboard(accuracy) {
  const currentWord = getCurrentWord();
  const keyboard = document.querySelector('#keyboard');
  const keys = keyboard.children;

  for (let i = 0; i < 5; i++) {
    for (const key of keys) {
      if (key.textContent === currentWord[i]) {
        key.classList.add('animate__animated', 'animate__fadeIn', accuracy[i]);
        break;
      }
    }
  }
}

function checkWin(accuracy) {
  let win = true;
  for (const stat of accuracy) {
    console.log('stats', stat);
    if (stat !== 'correct') win = false;
  }
  // if game is won or all guesses done
  if (win || wordID === 7) {
    console.log('here');
    updateStats(win);
    displayStats();
    wordID = 7;
  }
}

// ----------------------------------- STATISTICS -----------------------------------

function initialiseLocalStorage() {
  const initialised = localStorage.getItem('statistics');
  if (initialised === null) {
    const baseObject = {
      wins: 0,
      losses: 0,
      streak: 0,
      highestStreak: 0,
    };
    localStorage.setItem('statistics', JSON.stringify(baseObject));
  }
}

function updateStats(win) {
  const statistics = JSON.parse(localStorage.getItem('statistics'));
  if (win) {
    // increment wins, win streak, and check if new highest streak.
    ++statistics.wins;
    ++statistics.streak;
    if (statistics.streak > statistics.highestStreak) statistics.highestStreak = statistics.streak;
  } else {
    // increment losses, end win streak
    ++statistics.losses;
    statistics.streak = 0;
  }
  localStorage.setItem('statistics', JSON.stringify(statistics));
}

function displayStats() {
  const statistics = JSON.parse(localStorage.getItem('statistics'));
  // Select all modal elements
  const playedTextEle = document.querySelector('#modalPlayed');
  const winPercentEle = document.querySelector('#modalWinPercent');
  const currentStreakEle = document.querySelector('#modalCurrentStreak');
  const maxStreakEle = document.querySelector('#modalMaxStreak');
  // calculate win percent
  const winPercent = (statistics.wins / (statistics.wins + statistics.losses)) * 100;
  // Set text content of stats
  playedTextEle.textContent = 'Played: ' + (statistics.wins + statistics.losses);
  winPercentEle.textContent = 'Win %: ' + winPercent.toFixed(2);
  currentStreakEle.textContent = 'Current streak: ' + statistics.streak;
  maxStreakEle.textContent = 'Max streak: ' + statistics.highestStreak;

  const statisticsModal = document.querySelector('#statisticsModal');
  statisticsModal.style.display = 'block';
}

function closeModal() {
  const statisticsModal = document.querySelector('#statisticsModal');
  statisticsModal.style.display = 'none';
}
