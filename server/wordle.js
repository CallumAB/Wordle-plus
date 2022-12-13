import * as fs from 'fs';

let wordOfTheDay;
const potentialWordList = fs.readFileSync('server/potentialwords.txt', 'utf8').split('\n');
const wordlist = fs.readFileSync('server/wordlist.txt', 'utf8');

// set word of the day
export function changeWordOfTheDay() {
  const randomInt = getRandomInt(potentialWordList.length);
  console.log(potentialWordList[randomInt]);
  wordOfTheDay = potentialWordList[randomInt];
}

function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}

// Checks if a word is valid
export function checkValidWord(guessWord) {
  return wordlist.includes(guessWord);
}

// Checks accuracy of a word and returns an array containing the accuracy of each letter
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
