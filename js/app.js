const overlay = document.getElementById('overlay');
const keyboard = document.getElementById('keyboard');

let gameOver, lockBoard; //Boolean values
let timer; //Timer that calls checkAnswers if guess time expires
let resultsTimer; //Timer for player to view result screen
let selectedDifficulty; //Stores Player Selected Difficulty

//TO DOs
// -localStorage store scores for different difficulties
// -add sound?
// -debug firefox and safari
// -try different way to access API
// -OOP
// -Handlebars or Ember

let gameData = {
    bestScore: 11, //placeholder for lowest score
    attemptsUserHasLeft: 10,
    attemptUserIsOn: 1, // Reference to update user history
    guessUserIsOn: 1, // Stores guess of player
    randomAPIResults: [], // Stores numbers from API call
    userInput: [] // Stores user's input
}

//Render game's home screen
function renderHomeScreen() {
    overlay.style.display = 'block';
    overlay.classList.remove('overlay-game-over'); //Reset overlay classes
    gameOver = true;
    lockBoard = true;
    overlay.style.backgroundColor = '#fff';

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
                <div id="instructions" class="instructions">
                    <p class="txt-instructions">INSTRUCTIONS</p>
                    <ul class="instructions-list toggle-display">
                    <li>Player has 10 attempts to guess the correct location of 4 numbers</li>
                    <li>After each attempt, player has 3 seconds to view see if they matched/located any numbers</li> 
                    <li>Each attempt is timed based on the difficulty level</li>
                </ul>
                </div>
            </div>
        </div>
    `;

    overlay.innerHTML = html;
}

function selectDifficulty(e) {
    const gameDifficulty = { //Settings for game difficulty
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
        const response = await axios.get(url); //Call API
        const data = response.data.replace(/\s+/g, ''); //Remove spaces and carriage returns
        if (response.status === 200) {
            gameData.randomAPIResults = [...data]; //Store API results
        }
    } catch (e) { //Fallback if error calling API
        console.log(e);
        alert("ERROR CALLING API!");
        randomNumbersFallback(maxNumber); //Fallback to generate random numbers
    }
    checkIfHighScoreExists();
    renderGameBoard();
    startTimerBar(selectedDifficulty.timer);
}

// Fallback if API call fails-----------------
function randomNumbersFallback(number) {
    for (let i = 0; i < 4; i++) { //Return 4 elements
        gameData.randomAPIResults.push(generateRandomNumber(number).toString());
    }
}

function generateRandomNumber(number) {
    return Math.floor(Math.random() * (number + 1))
}
//-------------------------------------------

function renderGameBoard() { //Render game board after API call attempt
    renderRandomNumbers();
    renderUserGuesses();
    renderHistory();
    renderKeyboard();
    fadeSections('in');
    toggleKeyboardAccess(false); //Allow user access to keyboard
}

function renderUserGuesses() {
    const usersGuesses = document.getElementById('users-guesses');
    let html = '';
    for (let i = 0; i < 4; i++) {
        html += `
        <p class="user-guess number shrink">-</p>
        `
    }
    usersGuesses.innerHTML = html;
}

//Displays random numbers faced down onto gameboard
function renderRandomNumbers() {
    const randomNumbers = document.getElementById('random-numbers');
    let html = '';
    for (let randomNumber of gameData.randomAPIResults) {
        html += `
            <div class="card container">
                <p class="random-number card-face front number">${randomNumber}</p>
                <p class="random-number card-face back number">?</p>
            </div>
        `;
    }
    randomNumbers.innerHTML = html;
}

//Render clean player History
function renderHistory() {
    const historyTables = document.getElementById('history-tables');
    let html = `
        <tr class="table-titles-container">
            <td class="table-title">Attempts</td>
            <td class="table-title">Exist</td>
            <td class="table-title">Location</td>
        </tr>
    `
    for (let i = 0; i < 9; i++) {
        html += `
        <tr class="table-attempt">
            <td class="attempt">-</td>
            <td class="attempt">-</td>
            <td class="attempt">-</td>
        </tr>
    `
    }
    historyTables.innerHTML = html;
}

//Renders player keyboard
function renderKeyboard() {
    let html = '';
    for (let i = 0; i <= selectedDifficulty.keyboardMax; i++) {
        html += `<button class="keyboard-number number">${i}</button>`
    }
    keyboard.innerHTML = html;

    switch (true) { // Adjust keyboard size based off player difficulty
        case (selectedDifficulty.keyboardMax === 9): // Hard
            keyboard.style.gridTemplateColumns = 'repeat(5, 1fr)';
            break;
        case (selectedDifficulty.keyboardMax === 7): // Medium
            keyboard.style.gridTemplateColumns = 'repeat(4, 1fr)';
            break;
        default: // Easy
            keyboard.style.gridTemplateColumns = 'repeat(3, 1fr)';
    }
}

//Starts animation of timer bar
function startTimerBar(seconds) {
    const timerContainer = document.getElementById('timer');
    renderTimer(timerContainer);

    const timerBar = document.querySelector('.progress-bar');
    const startTimerBar = setTimeout(function () {
        timerBar.style.animation = `progress ${seconds}s linear`;
        clearTimeout(startTimerBar);
    }, seconds);

    startTimer(seconds);
}

//Starts timer for player's attempt
function startTimer(seconds) {
    timer = setTimeout(() => {
        if (lockBoard || gameOver) { //If player makes attempt or game is over clearTimeout
            clearTimeout(timer);
        } else {
            checkAnswers(); //If timer runs out checkAnswers
        }
    }, seconds * 1000);
}

//Builds timer
function renderTimer(el) {
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
    el.innerHTML = html;
}

// fade in/out page sections
function fadeSections(fade) {
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

//Initializes when user has made a guess
function userMakesGuess(e) {
    const userGuess = document.querySelectorAll('.user-guess');
    const key = e.target;
    if (key.tagName === 'BUTTON') {
        gameData.userInput.push(key.innerText); //Store player's guess
        displayGuessMade();
        userGuess[gameData.guessUserIsOn - 1].classList.toggle('grow');
        gameData.guessUserIsOn++;
    }
    if (gameData.userInput.length === 4) { //checkAnswers when player has made 4 guesses
        checkAnswers();
        gameData.guessUserIsOn = 0;
    }
}

//Updates display of player's guesses
function displayGuessMade() {
    const userGuess = document.querySelectorAll('.user-guess');
    for (let [index, guess] of userGuess.entries()) {
        if (!gameData.userInput[index]) return;
        guess.innerText = gameData.userInput[index];
    }
}

function checkAnswers() {
    lockBoard = true;
    clearInterval(timer); //clearInterval of timer if checkAnswers is called before time expires
    if (gameData.userInput !== 4) { //If user runs out of time store a ' x '        
        for (let i = 0; i < 4; i++) {
            if (!gameData.userInput[i]) {
                gameData.userInput[i] = ' x ';
            }
        }
    }

    const correctNumbers = checkIfNumberExists(); //Checks if player's guesses match any of the random numbers 
    const correctMatches = checkForMatches(); //Checks if player has guessed any numbers in their correct correct location
    gameData.matches = correctMatches;

    updateAttempts();
    if (correctMatches === 4 || gameData.attemptsUserHasLeft === 0) {
        gameOver = true;
        toggleAnswers();
        setTimeout(renderResults, 2500, correctNumbers, correctMatches); //Calls renderResults after toggleAnswers finish
    } else {
        renderResults(correctNumbers, correctMatches);
        updateHistory(correctNumbers, correctMatches);
    }
}

//Updates attempts left after 4 guesses have been made
function updateAttempts() {
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
    overlay.classList.add('overlay-default');
    let html = overlayHTMLResults(correctNumbers, correctMatches); //Build overlay results

    html += `
            </div>
        </div>
        `; //Close overlay container 

    overlay.innerHTML = html;
    overlay.style.display = 'block';
    closeOverlayListener(); //Event listener when player closes overlay
    resultsTimer = setTimeout(() => { //Timer for player to view result screen
        if (gameData.attemptsUserHasLeft !== 0) {
            continueGame();
        }
        if (!lockBoard && gameOver) {
            clearTimeout(resultsTimer);
        } else {
            clearTimeout(resultsTimer);
        }
    }, 3000);
}

function overlayHTMLResults(numbers, matches) {
    const winColor = 'rgba(159, 230, 159, .9)';
    const loseColor = 'rgba(228, 117, 122, .9)';
    let html = `
        <div class="overlay-content-container">
        <div class="overlay-content">
    `;

    switch (true) {
        case (matches === 4): //Player has matched all numbers
            if (gameData.attemptUserIsOn < gameData.bestScore) { //Compares player's score with bestScore
                gameData.bestScore = gameData.attemptUserIsOn;
                localStorage.setItem('bestScore', JSON.stringify(gameData.bestScore)); //Update local storage
                html += `
                    <h1 class="txt-win txt-results">NEW BEST SCORE!</h1>
                    <h3 class="txt-win txt-results">${gameData.attemptUserIsOn} attempts</h3>
                `;
            } else html += '<h1 class="txt-win txt-results">YOU WIN!</h1>';
            gameEnds(winColor);
            break;
        case (gameData.attemptUserIsOn === 10 || gameData.attemptsUserHasLeft === 0): // If player has lost game
            html += '<h1 class="txt-lose txt-results">YOU LOSE!</h1>';
            gameEnds(loseColor);
            break;
        case (numbers > 0 && matches < 4): // Player has guessed correct numbers
            html += `
                <h1 class="txt-results txt-correct-header">YOU GUESSED</h1>
                <div class="txt-correct-container">
                    <h3 class="txt-correct">&#8226 ${numbers}/4 Numbers That Exist<br>
                    &#8226 ${matches}/4 Numbers Correct Location</h3>
                </div>
            `;
            overlay.style.backgroundColor = 'rgba(77, 77, 77, .9)';
            break;
        default: // Player has guessed wrong
            html += '<h1 class="txt-wrong txt-results">YOU GUESSED WRONG!<br>TRY AGAIN</h1>';
            overlay.style.backgroundColor = 'rgba(77, 77, 77, .9)';
    }
    html += overlayHTMLButtons();
    return html;
}

//Adds buttons to overlay
function overlayHTMLButtons() {
    let html = '';
    if (gameOver) { //Checks if game is over
        html += '<button id="btn-game-over" class="btn reset">PLAY AGAIN?</button>';
    } else { //Continues game
        html += `                 
            <button id="btn-continue" class="btn continue">CONTINUE</button>
            <button id="btn-reset" class="btn reset">RESTART</button>
        `
    }
    return html;
}

//Changes overlay background color based on game results
function gameEnds(result) {
    gameData.attemptsUserHasLeft = 0; //Change attemptsUserHasLeft to stop resultsTimer
    overlay.style.backgroundColor = result;
    overlay.classList.add('overlay-game-over');
    overlay.classList.remove('overlay-default');
}

function closeOverlayListener() {
    overlay.addEventListener('click', closeOverlayHandle);
}

//Handles overlay target
function closeOverlayHandle(e) {
    const classList = e.target.classList;
    e.preventDefault();

    if (classList.contains('reset')) { //Reset game button
        resetGame();
    }
    if (classList.contains('continue') || classList.contains('overlay-default')) { //Continue game if player selects button or clicks on overlay      
        continueGame();
    }
}

function continueGame() {
    clearTimeout(resultsTimer); //Stops resultsTimer when overlay of results closes
    lockBoard = false;
    clearUserGuesses();
    overlay.style.display = 'none'; //Closes overlay and continues game
    startTimerBar(selectedDifficulty.timer); //Reset timer
    resetGuessData();
}

function resetGuessData() {
    resetUsersGuessCards(); // Remove animation from users guess cards
    gameData.guessUserIsOn = 1; // Reset guessUserIsOn
}

function resetUsersGuessCards() { // Remove animation from users guess cards
    const userGuess = document.querySelectorAll('.user-guess');
    for (let guess of userGuess) {
        guess.classList.remove('grow');
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

// Clear User Guesses with animation
function clearUserGuesses() {
    const userGuess = document.querySelectorAll('.user-guess');
    for (let guess of userGuess) {
        guess.innerText = '-';
    }
    gameData.userInput = [];
}

function resetGame() {
    clearTimeout(resultsTimer);
    toggleKeyboardAccess(true); // temporarily disable keyboard elements
    fadeSections('out'); // Game fades out back to home screen
    clearUserGuesses(); // Resets users guesses on screen
    resetGuessData();
    gameData.attemptsUserHasLeft = 11; // Reset attempts user has left
    gameData.attemptUserIsOn = 1; // Reset attempts
    gameData.randomAPIResults = []; // clear API Results
    updateAttempts(); // Resets attempts displayed on screen
    renderHomeScreen(); //Displays home screen
}

function toggleKeyboardAccess(bool) {
    const keyboardNumber = document.querySelectorAll('.keyboard-number');
    for (let key of keyboardNumber) {
        key.disabled = bool;
    }
}

function checkIfHighScoreExists() {
    const bestScore = document.getElementById('best-score');
    if (localStorage.bestScore) { // If localStorage.bestScore exists update Best Score displayed
        gameData.bestScore = JSON.parse(localStorage.bestScore);
        bestScore.innerText = gameData.bestScore + ' attempts';
    } else bestScore.innerText = '-'; // else display no score
}

async function toggleAnswers() {
    const cards = document.querySelectorAll('#random-numbers .card');
    for (let [i, card] of cards.entries()) {
        let flip = flipCard(card);
        let timer = setTimeout(flip, i * 500);
        await timer;
    }
}

function flipCard(card) {
    return function () {
        card.classList.toggle('flip');
    }
}

function renderInstructions(e) {
    const instructionsList = document.querySelector('.instructions-list');
    if (e.target.innerText === 'INSTRUCTIONS') {
        instructionsList.classList.toggle('toggle-display');
    }
}

window.onload = renderHomeScreen();
overlay.addEventListener('click', selectDifficulty);
overlay.addEventListener('click', renderInstructions);
keyboard.addEventListener('click', userMakesGuess);