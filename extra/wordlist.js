// Filters scrabble wordlist to only 5 letter words
const fs = require('fs');

const arr = fs.readFileSync('scrabblewordlist.txt').toString().split('\n');
const newArr = arr.filter(word => word.length == 6);
console.log(newArr);
const file = fs.createWriteStream('wordlist.txt');
newArr.forEach(element => file.write(element));
