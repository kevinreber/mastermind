const query = '?num=4&min=0&max=7&col=1&base=16&format=plain';
const url = `https://www.random.org/integers/${query}`;
const overlay = document.getElementById('overlay');
const keyboard = document.getElementById('keyboard');
const randomNumbers = document.getElementById('random-numbers');
const keyboardNumber = document.querySelectorAll('.keyboard-number');
//const usersGuesses = document.getElementById('users-guesses');
const userGuess = document.querySelectorAll('.user-guess');
const attemptsLeft = document.getElementById('attempts-left');
//const attempts = document.querySelectorAll('.attempt');
const tableAttempts = document.querySelectorAll('.table-attempt');
const bestScore = document.getElementById('best-score');
let gameData = {
    highScore: 0,
    attemptsUserHasLeft: 10,
    attemptUserIsOn: 0, // Reference to update user history
    randomAPIResults: [], // Stores numbers from API call
    userInput: [] // Stores user's input
}

async function startGame() {
    const response = await axios.get(url);
    const data = response.data.replace(/\s+/g, ''); // remove spaces and carriage returns
    if (response.status === 200) {
        gameData.randomAPIResults = [...data];
        displayRandomNumbers();
        toggleKeyboard(false); // after API call allow access to keyboard
    }
}

function displayRandomNumbers() {
    let html = '';
    for (let randomNumber of gameData.randomAPIResults) {
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
        gameData.userInput.push(key.innerText);
        displayGuessMade();
    }
    if (gameData.userInput.length === 4) {
        updateAttempts();
        checkAnswers();
    }
}

function displayGuessMade() {
    for (let [index, guess] of userGuess.entries()) {
        if (!gameData.userInput[index]) return;
        guess.innerText = gameData.userInput[index];
    }
}

function checkAnswers() {
    const correctNumbers = checkIfNumberExists(); // The player had guess a correct number
    const correctMatches = checkForMatches(); // The player had guessed a correct number and its correct location

    displayResults(correctNumbers, correctMatches);
    updateHistory(correctNumbers, correctMatches);
}

function updateAttempts() { // updates attempts left after 4 guesses have been made
    gameData.attemptsUserHasLeft--;
    attemptsLeft.innerText = gameData.attemptsUserHasLeft;
}

function checkIfNumberExists() {
    let exists = 0;
    for (let num of gameData.randomAPIResults) {
        if (gameData.userInput.includes(num)) {
            exists++;
        }
    }
    return exists;
}

function checkForMatches() {
    let matches = 0;
    for (let i = 0; i < gameData.randomAPIResults.length; i++) {
        if (gameData.randomAPIResults[i] === gameData.userInput[i]) {
            matches++;
        }
    }
    return matches;
}

function displayResults(correctNumbers, correctMatches) {
    let html = `
        <div class="overlay-content-container">
        <div class="overlay-content">
        `;

    switch (true) {
        case (correctMatches === 4):
            if (gameData.attemptUserIsOn < gameData.highScore) {
                gameData.highScore = gameData.attemptUserIsOn;
                localStorage.setItem('highScore', JSON.stringify(highScore)); //Update local storage
                html += `
                    <h1 class="txt-win txt-results">NEW BEST SCORE!</h1>
                    <h3 class="txt-win txt-results">${gameData.attemptUserIsOn} ATTEMPT(S)</h3>
                    `;

            } else html += '<h1 class="txt-win txt-results">YOU WIN!</h1>';
            break;
        case (correctNumbers > 0 && correctMatches < 4):
            html += `
                <h1 class="txt-results txt-results-header">YOU GUESSED</h1>
                <h3 class="txt-correct txt-results">&#8226 ${correctNumbers}/4 correct numbers<br>
                &#8226 ${correctMatches}/4 numbers correct location</h3>
                `;
            break;
        case (correctNumbers === 0 && correctMatches === 0):
            html += '<h1 class="txt-wrong txt-results">YOU GUESSED WRONG!<br>TRY AGAIN</h1>';
            break;
        default:
            html += '<h1 class="txt-wrong txt-results">YOU LOSE!</h1>';
    }

    //Add buttons
    if (correctMatches === 4 || gameData.attemptUserIsOn === 10 || gameData.attemptsUserHasLeft === 0) {
        html += '<button id="btn-win" class="btn reset">PLAY AGAIN?</button>';
    } else {
        html += `                 
            <button id="btn-continue" class="btn continue">CONTINUE</button>
            <button id="btn-reset" class="btn reset">RESET</button>
        `
    }

    html += `
            </div>
        </div>`; // Close container 

    overlay.innerHTML = html;
    overlay.style.display = 'block';
    closeOverlayListener();
}

function closeOverlayListener() {
    const gameButtons = document.querySelectorAll('.btn');

    for (let btn of gameButtons) {
        btn.addEventListener('click', (e) => {
            const btnClass = e.target.classList;
            if (btnClass.contains('reset')) {
                resetGame();
            }
            if (btnClass.contains('continue')) {
                clearUserGuesses();
            }
            overlay.style.display = 'none';
        });
    }
}

function updateHistory(correct, located) {
    let html = `
        <td class="attempt">${gameData.userInput}</td>
        <td class="attempt">${correct}/4</td>
        <td class="attempt">${located}/4</td>
    `
    tableAttempts[gameData.attemptUserIsOn].innerHTML = html;
    gameData.attemptUserIsOn++;
}

function clearUserGuesses() {
    clearElements(userGuess);
    gameData.userInput = [];
}

function clearUserHistory() {
    const attempts = document.querySelectorAll('.attempt');
    clearElements(attempts);
}

function clearElements(elements) {
    for (let element of elements) {
        element.innerText = '-';
    }
}

function resetGame() {
    toggleKeyboard(true); // temporarily disable keyboard
    clearUserHistory();
    clearUserGuesses();
    gameData.attemptsUserHasLeft = 11; // subtracts 1 when game restarts
    gameData.attemptUserIsOn = 0;
    gameData.randomAPIResults = []; // clear API Results
    updateAttempts();
    startGame();
}

function toggleKeyboard(bool) {
    for (let key of keyboardNumber) {
        key.disabled = bool;
    }
}

function checkIfHighScoreExists() {
    if (localStorage.highScore) {
        highScore = JSON.parse(localStorage.highScore);
        bestScore.innerText = highScore; //Update Best Score
    } else bestScore.innerText = '-';
}


window.onload = checkIfHighScoreExists();
document.addEventListener('DOMContentLoaded', startGame);
keyboard.addEventListener('click', userMakesGuess);