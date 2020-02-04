const query = '?num=4&min=0&max=7&col=1&base=16&format=plain';
const url = `https://www.random.org/integers/${query}`;
const keyboard = document.getElementById('keyboard');
const randomNumbers = document.getElementById('random-numbers');
//const usersGuesses = document.getElementById('users-guesses');
const userGuess = document.querySelectorAll('.user-guess');
const attemptsLeft = document.getElementById('attempts-left');
//const attempts = document.querySelectorAll('.attempt');
const tableAttempts = document.querySelectorAll('.table-attempt');
const firstReq = new XMLHttpRequest();
let attemptsUserHasLeft = 10;
let attemptUserIsOn = 0; // Reference to update user history
let randomAPIResults = []; // Store numbers from API call
let userInput = []; // store user input

// SOURCE
// https://stackoverflow.com/questions/6375461/get-html-code-using-javascript-with-a-url

firstReq.addEventListener('load', () => console.log('SUCCESS!'));
firstReq.addEventListener('error', () => console.log('ERROR'));

function startGame() {
    firstReq.open('GET', url); // Make API call
    firstReq.send();
    firstReq.onreadystatechange = function () {
        if (firstReq.readyState === 4) {
            const response = firstReq.responseText.replace(/\s+/g, ''); // remove carriage return            
            randomAPIResults = [...response];
            displayRandomNumbers();
        }
    };
}

function displayRandomNumbers() {
    let html = '';
    for (let randomNumber of randomAPIResults) {
        html +=
            `
        <div class="random-number-container container">
            <p class="random-number number">${randomNumber}</p>
        </div>
        `;
    }
    randomNumbers.innerHTML = html;
}

function userMakesGuess(e) {
    const key = e.target;
    if (key.tagName === 'BUTTON') {
        userInput.push(key.innerText);
        displayGuessMade();
    }
    if (userInput.length === 4) {
        checkAnswers();
        updateAttempts();
    }
}

function displayGuessMade() {
    for (let [index, guess] of userGuess.entries()) {
        if (!userInput[index]) return;
        guess.innerText = userInput[index];
    }
}

function checkAnswers() {
    const correctNumbers = checkIfNumberExists(); // The player had guess a correct number
    const correctMatches = checkForMatches(); // The player had guessed a correct number and its correct location

    displayResults(correctNumbers, correctMatches);
    updateHistory(correctNumbers, correctMatches);

    clearUserGuesses();
}

function updateAttempts() { // updates attempts left after 4 guesses have been made
    attemptsUserHasLeft--;
    attemptsLeft.innerText = attemptsUserHasLeft;
}

function checkIfNumberExists() {
    let exists = 0;
    for (let num of randomAPIResults) {
        if (userInput.includes(num)) {
            exists++;
        }
    }
    return exists;
}

function checkForMatches() {
    let matches = 0;
    for (let i = 0; i < randomAPIResults.length; i++) {
        if (randomAPIResults[i] === userInput[i]) {
            matches++;
        }
    }
    return matches;
}

function displayResults(correctNumbers, correctMatches) {
    let html = '';
    if (correctMatches === 4) {
        html = 'Congratulations! You Win!'
    } else if (correctNumbers) {
        html = `
        Player has guessed ${correctNumbers}/4 numbers that exist,
        Player has guessed ${correctMatches}/4 numbers in the correct location
        `;
    } else html = 'You have guessed wrong! Try Again';
    console.log(html);
}

function updateHistory(correct, located) {
    let html = `
        <td class="attempt">${userInput}</td>
        <td class="attempt">${correct}/4</td>
        <td class="attempt">${located}/4</td>
    `
    tableAttempts[attemptUserIsOn].innerHTML = html;
    attemptUserIsOn++;
    if (attemptUserIsOn === 10 || attemptsUserHasLeft === 0) {
        resetGame();
    }
}

function clearUserGuesses() {
    for (let guess of userGuess) {
        guess.innerText = '-';
    }
    userInput = [];
}

function clearUserHistory() {
    const attempts = document.querySelectorAll('.attempt');
    for (let attempt of attempts) {
        attempt.innerText = '-';
    }
}

function resetGame() {
    clearUserHistory();
    clearUserGuesses();
    attemptsUserHasLeft = 11; // subtracts 1 when game restarts
    attemptUserIsOn = 0;
    randomAPIResults = []; // clear API Results 
    startGame();
}

document.addEventListener('DOMContentLoaded', startGame);
keyboard.addEventListener('click', userMakesGuess);