const maxNumber = 7;
const query = `?num=4&min=0&max=${maxNumber}&col=1&base=16&format=plain&rnd=new`;
const url = `https://www.random.org/integers/${query}`;
const overlay = document.getElementById('overlay');
const keyboard = document.getElementById('keyboard');
const randomNumbers = document.getElementById('random-numbers');
const keyboardNumber = document.querySelectorAll('.keyboard-number');
const userGuess = document.querySelectorAll('.user-guess');
const attemptsLeft = document.getElementById('attempts-left');
const tableAttempts = document.querySelectorAll('.table-attempt');
const bestScore = document.getElementById('best-score');
let selectedDifficulty;


// function fillBar(seconds){
//     const progressBar = document.querySelector('.progress');
//     const interval = setInterval(function () {
//       let bar = 1000;
//       progressBar.setAttribute('stroke-dashoffset', bar);
//       bar--;
//       if(bar === 0){
//         clearInterval(interval);
//       }
//     }, ((seconds * 1000)/ 100)
//   )}

let gameData = {
    bestScore: 10,
    attemptsUserHasLeft: 10,
    attemptUserIsOn: 1, // Reference to update user history
    randomAPIResults: [], // Stores numbers from API call
    userInput: [] // Stores user's input
}

function selectDifficulty(e) {
    const gameDifficulty = {
        easy: {
            keyboardMax: 7,
            timer: 12
        },
        medium: {
            keyboardMax: 7,
            timer: 8
        },
        hard: {
            keyboardMax: 11,
            timer: 5
        }
    }

    if (e.target.classList.contains('difficulty-btn')) {
        e.preventDefault();
        const difficulty = e.target.innerText.toLowerCase();
        selectedDifficulty = gameDifficulty[difficulty];
        // maxNumber = gameDifficulty[difficulty].keyboardMax;

        startGame();
        overlay.style.display = 'none';
    }
}

async function startGame() {
    try {
        const response = await axios.get(url);
        const data = response.data.replace(/\s+/g, ''); // remove spaces and carriage returns
        if (response.status === 200) {
            gameData.randomAPIResults = [...data];
            renderGameboard();
            toggleKeyboardAccess(false); // after API call allow user access to keyboard
        }
    } catch (e) {
        console.log(e);
        alert("TROUBLESHOOT API");
    }
}

function renderGameboard() {
    const sections = document.querySelectorAll('section');
    renderRandomNumbers();
    renderTimer();
    renderKeyboard();
    for (let section of sections) {
        section.classList.remove('hide');
        section.classList.add('animated', 'animatedFadeInUp', 'fadeInUp');
    }
}

function renderRandomNumbers() {
    let html = '';
    for (let randomNumber of gameData.randomAPIResults) {
        html += `
            <div class="random-number-container container">
                <p class="random-number number">${randomNumber}</p>
            </div>
        `;
    }
    randomNumbers.innerHTML = html;
}
function renderKeyboard() {
    let html = '';
    for (let i = 0; i < 8; i++) {
        html += `<button class="keyboard-number number">${i}</button>`
    }
    keyboard.innerHTML = html;
}

function renderTimer() {
    const timer = document.getElementById('timer');
    let html = `
    <svg  class="circular-chart">
        <path class="progress-bg" d="M18 2.0845
        a 15.9155 15.9155 0 0 1 0 31.831
        a 15.9155 15.9155 0 0 1 0 -31.831" />
        <path class="progress" stroke-dasharray="100, 100" d="M18 2.0845
        a 15.9155 15.9155 0 0 1 0 31.831
        a 15.9155 15.9155 0 0 1 0 -31.831"/>
    </svg>
    `;
    timer.innerHTML = html;
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
    let html = overlayHTML(correctNumbers, correctMatches); // Build Overlay

    html += `
            </div>
        </div>
        `; // Close overlay container 

    overlay.innerHTML = html;
    overlay.style.backgroundColor = 'rgba(77, 77, 77, .9)';
    overlay.style.display = 'block';
    closeOverlayListener();
}

function overlayHTML(numbers, matches) {
    let html = `
        <div class="overlay-content-container">
        <div class="overlay-content">
    `;

    switch (true) {
        case (matches === 4):
            if (gameData.attemptUserIsOn < gameData.bestScore) { // Check for new best score
                gameData.bestScore = gameData.attemptUserIsOn;
                localStorage.setItem('bestScore', JSON.stringify(gameData.bestScore)); //Update local storage
                html += `
                    <h1 class="txt-win txt-results">NEW BEST SCORE!</h1>
                    <h3 class="txt-win txt-results">${gameData.attemptUserIsOn} attempts</h3>
                `;
            } else html += '<h1 class="txt-win txt-results">YOU WIN!</h1>';
            break;
        case (gameData.attemptUserIsOn === 10 || gameData.attemptsUserHasLeft === 0):
            html += '<h1 class="txt-wrong txt-results">YOU LOSE!</h1>';
            break;
        case (numbers > 0 && matches < 4):
            html += `
                <h1 class="txt-results txt-results-header">YOU GUESSED</h1>
                <div class="txt-correct-container">
                    <h3 class="txt-correct txt-results">&#8226 ${numbers}/4 Numbers That Exist<br>
                    &#8226 ${matches}/4 Numbers Correct Location</h3>
                </div>
            `;
            break;
        default:
            html += '<h1 class="txt-wrong txt-results">YOU GUESSED WRONG!<br>TRY AGAIN</h1>';
    }
    html += overlayHTMLButtons(matches);
    return html;
}

function overlayHTMLButtons(matches) { //Add buttons
    let html = '';
    if (matches === 4 || gameData.attemptUserIsOn === 10 || gameData.attemptsUserHasLeft === 0) {
        html += '<button id="btn-win" class="btn reset">PLAY AGAIN?</button>';
    } else {
        html += `                 
            <button id="btn-continue" class="btn continue">CONTINUE</button>
            <button id="btn-reset" class="btn reset">RESET</button>
        `
    }
    return html;
}

function closeOverlayListener() {
    const gameButtons = document.querySelectorAll('.btn');

    for (let btn of gameButtons) {
        btn.addEventListener('click', (e) => {
            const btnClass = e.target.classList;
            if (btnClass.contains('reset')) {
                e.preventDefault();
                resetGame();
            }
            if (btnClass.contains('continue')) {
                e.preventDefault();
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
    tableAttempts[gameData.attemptUserIsOn - 1].innerHTML = html;
    gameData.attemptUserIsOn++;
}

// CLEAR ELEMENTS 
function clearElements(elements) {
    for (let element of elements) {
        element.innerText = '-';
    }
}

function clearUserGuesses() {
    clearElements(userGuess);
    gameData.userInput = [];
}

function clearUserHistory() {
    const attempts = document.querySelectorAll('.attempt');
    clearElements(attempts);
}

function resetGame() {
    toggleKeyboardAccess(true); // temporarily disable keyboard
    clearUserHistory();
    clearUserGuesses();
    gameData.attemptsUserHasLeft = 11; // subtracts 1 when game restarts
    gameData.attemptUserIsOn = 1;
    gameData.randomAPIResults = []; // clear API Results
    updateAttempts();
    checkIfHighScoreExists();
    startGame();
}

function toggleKeyboardAccess(bool) {
    for (let key of keyboardNumber) {
        key.disabled = bool;
    }
}

function checkIfHighScoreExists() {
    if (localStorage.bestScore) {
        gameData.bestScore = JSON.parse(localStorage.bestScore);
        bestScore.innerText = gameData.bestScore + ' attempts'; //Update Best Score
    } else bestScore.innerText = '-';
}

window.onload = checkIfHighScoreExists();
// document.addEventListener('DOMContentLoaded', startGame);
overlay.addEventListener('click', selectDifficulty);
keyboard.addEventListener('click', userMakesGuess);