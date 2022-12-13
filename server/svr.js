import express from 'express';
import * as wordle from './wordle.js';
import schedule from 'node-schedule';

const app = express();
app.use(express.static('client'));

// Chooses word on the day on startup
wordle.changeWordOfTheDay();

// Schedules the word to change at midnight
schedule.scheduleJob('0 0 * * *', function () {
  wordle.changeWordOfTheDay();
});

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

app.post('/word', express.text(), postWord);

app.listen(8080);

console.log('Server running on port 8080');
