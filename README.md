# Wordle Clone

A wordle clone that uses client server architecture so that you are unable to cheat by finding the word in client files.

### Table of Contents

1. Install and Run
2. Packages used
3. Client
   1. Game board
   2. Keyboard
   3. Submitting words
   4. Updating Words
   5. Statistics
   6. Hiding Letters
4. Server
   1. Word post request
   2. Checking valid word
   3. Checking accuracy of a word
   4. Changing word of the day
5. Additional info
   1. How I made my wordlist

### Install and Run

```shell
npm install
npm start
```

On startup, the server will log the message "Server running on port 8080" into the console.

### Packages used

* Express
* Animate.css
* Node-schedule

## Client

### Game board

The game board is made up of a 5 x 6 grid. Each letter cell is represented by a DIV element, and each row of letters is contained inside a parent DIV element which represents an entire 5-letter word.

The current word and current letter are tracked using global variables that are incremented every time a letter is inputted, or a word is successfully submitted.

```js
let wordID = 1;
let letterID = 1;
```

### Keyboard

There are two ways to input letter onto the game board:

Firstly, there is the on screen keyboard, which is represented using a grid of 20 columns and 3 rows. Most keys span 2 columns, apart from the "Enter" and "Undo" which span 3, and a column is used on both sides of the second row to add spacing.

Secondly, letters can be inputted using the physical keyboard. Valid key inputs range from a to Z, "Enter", and "Backspace".

When the page is loaded, event listeners are added to each button on the screen keyboard, and an event listener is added to the document for each key down press from the physical keyboard. Both of these events have their own handler functions, as the method to get the content of what is being pressed is different for buttons and keypresses, but they both pass the content of the key being pressed into the function *keyCheck*.

```js
function keyCheck(key) {
  if (wordID === 7) return;
  else if (key === 'ENTER' && letterID === 6) enterWord();
  else if ((key === 'BACKSPACE' || key === 'UNDO') && letterID !== 1) removeLetter();
  else if (key !== 'ENTER' && key !== 'BACKSPACE' && key !== 'UNDO' && letterID !== 6) enterLetter(key);
}
```

*keyCheck* immediately returns if the global wordID is 7 as this represents a completed game. If the game is ongoing, the key input is checked and sent to one of the appropriate functions: *enterWord*, *removeLetter* or *enterLetter*. *keyCheck* also checks to see if you are at the beginning or end of a word, so that you can't input more than 5 letters, or remove letters when they are none on the board.

When entering a letter or removing a letter, the textContent of the current letters element is updated and a class is toggled to update the border colour. The current letter's element is found by using the global wordID to find the parent element of the letters, and then using the global letterID to find the current letter within the children.

### Submitting words

When a word is successfully submitted, async function *enterWord* is called which awaits a promise from another async function *sendWord*. *sendWord* will send a string containing the submitted word to the server as a post request. The server will send back either an empty array which represents an invalid word, or an array containing the accuracy of each letter. 

If the word is valid, and the accuracy of the word is returned then the colours of the word and the keyboard will be updated to represent if the letter is, in the word and correct position, in the word but in the wrong position, and if the letter is not in the word. After, a function will be called to check if the game has been won or has ended.

```js
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
```

### Updating words and keyboard

When a correct word is submitted, and the accuracy has been returned from the server, two separate functions are called to display fancy animations and update the colours of the cells on the board and the keys of the on screen keyboard.

**Animate.css** is used for the animations.

#### Update word

To update the colours on the board and display animations the function *updateWord* is called. The current word element is selected, and each letter element is found from the children. A for loop is used to go through each element, adding the CSS classes for the animation and class for the colour of the accuracy.

The interval of each timeout **increases** with each for loop so that the animations begin at different times.

As set timeout is used so you can still type while the animation is displaying.

```js
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
```

#### Update keyboard

```js
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
```

### Statistics

#### Initialising statistics

When the page is loaded, a function is called to initialise the variables in local storage used to store statistics. Variables are all stored within one object, so the function will attempt to get that object from local storage and if it is null it will store a base object.

```js
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
```

#### Updating statistics

At the end of a game the statistics will be updated. The current statistics are retrieved from local storage and parsed to JSON. Then, depending on a win or loss, the statistics are incremented or reset, converted back to string using JSON.stringify and stored back in local storage.

```js
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
```

#### Displaying Statistics

A modal is used to display the statistics. At the end of a game, the modal is opened automatically to indicate that the playyer has won the game, and to also show their new statistics. At any time the user is able to open the statistics on their own by clicking a button in the top left of the screen to open the modal.

When the function to open the modal is called, the statistics are retrieved from local storage and set as the textContent of the modals children elements.

```js
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
```

```js
function closeModal() {
  const statisticsModal = document.querySelector('#statisticsModal');
  statisticsModal.style.display = 'none';
}
```

To open and close the modal, only the css *display* property is changed from none to block and block to none.

### Hiding Letters

At any time during a game or after, the user is able to hide the letters on the game board by clicking on a "Hide letters" button in the top right. This is intended to allow the user to share their game board with others without sharing their guesses and spoiling the word of the day.

To hide the letters, a nested for loop is used that goes through each word, and for each word goes through each letter toggling a CSS class to hide the text.

```js
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
```

## Server

### Word post request

Upon a post request for a word, postWord is called using express.text() as a parser.

```js
app.post('/word', express.text(), postWord);
```

The body of the request - the 5 letter word - is stored in a variable, and a function is called to check if it is a valid word. If it is, then another function will be called to get the accuracy of each letter in the form of an array and it is sent back as JSON. Otherwise, an empty array is sent back as JSON.

```js
function postWord(req, res) {
  const guessWord = req.body;
  if (wordle.checkValidWord(guessWord)) {
    // Send back list of accuracy
    const accuracy = wordle.checkAccuracy(guessWord);
    console.log(accuracy);
    res.json(accuracy);
  } else {
    // Send back empty list
    const accuracy = [];
    res.json(accuracy);
  }
}
```

### Checking valid word

On server start up, the txt file containing all valid words is read only once and stored in the variable *wordlist*. Then, whenever a request comes in the function *checkValidWord* is called and the .includes method is used to check if the guessed word is contained in *wordlist*.

```js
const wordlist = fs.readFileSync('server/wordlist.txt', 'utf8');

export function checkValidWord(guessWord) {
  return wordlist.includes(guessWord);
}
```

### Checking accuracy of a word

To check the accuracy of the word, a traditional for loop is used, defining *i* as 0 and incrementing each loop up to 5. *i* is used to index the same letter in both the guess word and the wordOfTheDay each loop. If both letters are equal, 'correct' will be added to the same index in the *resultsArr*. Else, if the letter is included in the word, 'wrongposition" will be added at that index. Else, 'wrong' will be added.

```js
export function checkAccuracy(guessWord) {
  const resultsArr = [];
  for (let i = 0; i < 5; i++) {
    if (guessWord[i] === wordOfTheDay[i]) resultsArr[i] = 'correct';
    else {
      if (wordOfTheDay.includes(guessWord[i])) resultsArr[i] = 'wrongposition';
      else resultsArr[i] = 'wrong';
    }
  }
  return resultsArr;
}
```

### Changing word of the day

On server start up, the function *changeWordOfTheDay* imported from **./wordle.js** is called to initially set the first word.

```js
wordle.changeWordOfTheDay();
```

After server start up, the **node-schedule** package is used to call the function *changeWordOfTheDay* at midnight every day. 

```js
schedule.scheduleJob('0 0 * * *', function () {
  wordle.changeWordOfTheDay();
});
```

On server start up, the txt file containing all possible words of the day is read only once and stored in the variable *potentialWordList*. This word list is different from the previous one, as it is very likely that a word that the majority of people do not know could be chosen. So, this list consists of hand selected words.

When the *changeWordOfTheDay* function is called, a random number is generated using the word list's length as the max. The random number is used to index a word in variable *potentialWordList* and set as the *wordOfTheDay*. 

Every time the word changes, it is logged on the server.

```js
const potentialWordList = fs.readFileSync('server/potentialwords.txt', 'utf8').split('\n');

export function changeWordOfTheDay() {
  const randomInt = getRandomInt(potentialWordList.length);
  console.log(potentialWordList[randomInt]);
  wordOfTheDay = potentialWordList[randomInt];
}

function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}
```

## Additional info

### How I made my wordlist

To create the wordlist which is used to check for valid words, I took a txt file of the scrabble world word list and filtered to 5 letter words using a node js script 

Inside the folder **/extra**, you can find the scrabble word list txt file, the filter word list and the node js file used to create it.
