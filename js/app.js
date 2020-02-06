const overlay = document.getElementById('overlay');
const keyboard = document.getElementById('keyboard');
const userGuess = document.querySelectorAll('.user-guess');
let gameOver = false;
let lockBoard = false;
let selectedDifficulty;

//TO DOs
// -edit "easy" mode layout
// -add flip to numbers
// -setTimeout on overlay screen to see results with timer
// -display result pages differently
// -add sound?
// -debug firefox and safari
// -generate random number as fallback if API call fails
// -try different way to access API
// -OOP
// -Handlebars or Ember
// -add instructions

let gameData = {
    bestScore: 10, //lowest score possible
    attemptsUserHasLeft: 10,
    attemptUserIsOn: 1, // Reference to update user history
    randomAPIResults: [], // Stores numbers from API call
    userInput: [] // Stores user's input
}

function selectDifficulty(e) {
    const gameDifficulty = {
        easy: {
            keyboardMax: 5,
            timer: 10
        },
        medium: {
            keyboardMax: 7,
            timer: 7
        },
        hard: {
            keyboardMax: 9,
            timer: 5
        }
    }

    if (e.target.classList.contains('difficulty-btn')) {
        e.preventDefault();
        const difficulty = e.target.innerText.toLowerCase();
        selectedDifficulty = gameDifficulty[difficulty];

        startGame();
        overlay.style.display = 'none';
    }
}

async function startGame() {
    const maxNumber = selectedDifficulty.keyboardMax;
    const query = `?num=4&min=0&max=${maxNumber}&col=1&base=16&format=plain&rnd=new`;
    const url = `https://www.random.org/integers/${query}`;
    gameOver = false;
    lockBoard = false;

    try {
        const response = await axios.get(url);
        const data = response.data.replace(/\s+/g, ''); // remove spaces and carriage returns
        if (response.status === 200) {
            gameData.randomAPIResults = [...data];
        }
    } catch (e) {
        console.log(e);
        alert("TROUBLESHOOT API");
    }
    checkIfHighScoreExists();
    renderGameBoard();
    startTimer(selectedDifficulty.timer);
}

function renderGameBoard() {
    renderRandomNumbers();
    renderKeyboard();
    fadeSections('in');
    toggleKeyboardAccess(false); // after API call allow user access to keyboard
}

function renderRandomNumbers() {
    const randomNumbers = document.getElementById('random-numbers');
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
    for (let i = 0; i <= selectedDifficulty.keyboardMax; i++) {
        html += `<button class="keyboard-number number">${i}</button>`
    }
    keyboard.innerHTML = html;

    if (selectedDifficulty.keyboardMax === 9) { // Adjust keyboard size based off difficulty
        keyboard.style.gridTemplateColumns = 'repeat(5, 1fr)';
    } else {
        keyboard.style.gridTemplateColumns = 'repeat(4, 1fr)';
    }
}

function renderTimer() {
    const timer = document.getElementById('timer');
    let html = `
    <div class="timer-container">
        <svg viewBox="0 0 75 75" class="progress">
            <path class="progress-bg" d="M18 2.0845
            a 15.9155 15.9155 0 0 1 0 31.831
            a 15.9155 15.9155 0 0 1 0 -31.831"/>
            <path class="progress-bar" stroke-dasharray="100, 100" d="M18 2.0845
            a 15.9155 15.9155 0 0 1 0 31.831
            a 15.9155 15.9155 0 0 1 0 -31.831"/>
        </svg>
    </div>
    `;
    timer.innerHTML = html;
}

function startTimer(seconds) {
    renderTimer();
    const progressBar = document.querySelector('.progress-bar');
    const interval = setInterval(function () {
        progressBar.style.animation = `progress ${seconds}s linear`;
        clearInterval(interval);
    }, seconds);

    const timer = setTimeout(checkAnswers, seconds * 1000);
    if (!gameOver || !lockBoard) clearTimeout(timer); // Prevent timer from calling checkAnswers
}

function fadeSections(fade) { // fade in/out sections
    const sections = document.querySelectorAll('section');
    if (fade === 'in') {
        for (let section of sections) {
            section.classList.remove('hide');
            section.classList.add('animated', 'animatedFadeInUp', 'fadeInUp');
        }
    }
    if (fade === 'out') {
        for (let section of sections) {
            section.classList.add('hide');
            section.classList.remove('animated', 'animatedFadeInUp', 'fadeInUp');
        }
    }
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
    lockBoard = true;
    if (gameData.userInput !== 4) { // If user runs out of time store a '-'        
        for (let i = 0; i < 4; i++) {
            if (!gameData.userInput[i]) {
                gameData.userInput[i] = ' x ';
                console.log('adding -');
            }
        }
    }

    const correctNumbers = checkIfNumberExists(); // The player had guess a correct number
    const correctMatches = checkForMatches(); // The player had guessed a correct number and its correct location

    renderResults(correctNumbers, correctMatches);
    updateHistory(correctNumbers, correctMatches);
}

function updateAttempts() { // updates attempts left after 4 guesses have been made
    const attemptsLeft = document.getElementById('attempts-left');
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

function renderResults(correctNumbers, correctMatches) {
    let html = overlayHTMLResults(correctNumbers, correctMatches); // Build Overlay

    html += `
            </div>
        </div>
        `; // Close overlay container 

    overlay.innerHTML = html;
    overlay.style.backgroundColor = 'rgba(77, 77, 77, .9)';
    overlay.style.display = 'block';
    closeOverlayListener();
}

function overlayHTMLResults(numbers, matches) {
    let html = `
        <div class="overlay-content-container">
        <div class="overlay-content">
    `;

    switch (true) {
        case (matches === 4):
            gameOver = true;
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
            gameOver = true;
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
                lockBoard = false;
                e.preventDefault();
                clearUserGuesses();
                overlay.style.display = 'none';
                // setTimeout(startTimer, 3000);
                startTimer(selectedDifficulty.timer);
            }
        });
    }
}

function updateHistory(correct, located) {
    const tableAttempts = document.querySelectorAll('.table-attempt');
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
    fadeSections('out');
    clearUserHistory();
    clearUserGuesses();
    gameData.attemptsUserHasLeft = 11; // subtracts 1 when game restarts
    gameData.attemptUserIsOn = 1;
    gameData.randomAPIResults = []; // clear API Results
    updateAttempts();
    renderHomeScreen();
}

function toggleKeyboardAccess(bool) {
    const keyboardNumber = document.querySelectorAll('.keyboard-number');
    for (let key of keyboardNumber) {
        key.disabled = bool;
    }
}

function checkIfHighScoreExists() {
    const bestScore = document.getElementById('best-score');
    if (localStorage.bestScore) {
        gameData.bestScore = JSON.parse(localStorage.bestScore);
        bestScore.innerText = gameData.bestScore + ' attempts'; //Update Best Score
    } else bestScore.innerText = '-';
}

function renderHomeScreen() {
    lockBoard = true;
    overlay.style.backgroundColor = '#fff';
    //change opacity

    let html = `
        <div id="home-screen" class="overlay-content-container">
            <div class="overlay-content animated animatedFadeInUp fadeInUp">
                <h1 class="game-title start-screen">MASTERMIND</h1>
                <div class="difficulty-container">
                    <h3>SELECT YOUR DIFFICULTY</h3>
                    <div class="difficulty-options">
                        <button class="difficulty-btn">EASY</button>
                        <button class="difficulty-btn">MEDIUM</button>
                        <button class="difficulty-btn">HARD</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    overlay.innerHTML = html;
}

window.onload = renderHomeScreen();
// document.addEventListener('DOMContentLoaded', startGame);
overlay.addEventListener('click', selectDifficulty);
keyboard.addEventListener('click', userMakesGuess);