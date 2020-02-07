const overlay = document.getElementById('overlay');
const keyboard = document.getElementById('keyboard');
const userGuess = document.querySelectorAll('.user-guess');
let gameOver = false;
let lockBoard = false;
let timer;
let selectedDifficulty;

//TO DOs
// -localStorage store scores for different difficulties
// -setTimeout on overlay screen to see results with timer
// -add sound?
// -debug firefox and safari
// -try different way to access API
// -OOP
// -Handlebars or Ember

let gameData = {
    bestScore: 10, //lowest score possible
    attemptsUserHasLeft: 10,
    attemptUserIsOn: 1, // Reference to update user history
    guessUserIsOn: 1, // 
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
        const response = await axios.get(url);  //Call API
        const data = response.data.replace(/\s+/g, ''); //Remove spaces and carriage returns
        if (response.status === 200) {
            gameData.randomAPIResults = [...data]; //Store API results
        }
    } catch (e) {   //Fallback if error calling API
        console.log(e);
        alert("ERROR CALLING API!");
        randomNumbersFallback(maxNumber); //Fallback to generate random numbers
    }
    checkIfHighScoreExists();
    renderGameBoard();
    startTimerBar(selectedDifficulty.timer);
}

// Fallback if API call fails-----------
function randomNumbersFallback(number) {
    for (let i = 0; i < 4; i++) {   //Return 4 elements
        gameData.randomAPIResults.push(generateRandomNumber(number).toString());
    }
}

function generateRandomNumber(number) {
    return Math.floor(Math.random() * (number + 1))
}
//-------------------------------------

function renderGameBoard() {    //Render game board after API call attempt
    renderRandomNumbers();
    renderKeyboard();
    fadeSections('in');
    toggleKeyboardAccess(false); //Allow user access to keyboard
}

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

function renderKeyboard() {
    let html = '';
    for (let i = 0; i <= selectedDifficulty.keyboardMax; i++) {
        html += `<button class="keyboard-number number">${i}</button>`
    }
    keyboard.innerHTML = html;

    switch (true) { // Adjust keyboard size based off difficulty
        case (selectedDifficulty.keyboardMax === 9): // Hard
            keyboard.style.gridTemplateColumns = 'repeat(5, 1fr)';
            break;
        case (selectedDifficulty.keyboardMax === 7): // Medium
            keyboard.style.gridTemplateColumns = 'repeat(4, 1fr)';
            break;
        default:
            keyboard.style.gridTemplateColumns = 'repeat(3, 1fr)'; // Easy
    }
}

//Starts animation of timer bar
function startTimerBar(seconds) {   
    renderTimer();
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
        if (gameOver || lockBoard) {
            clearTimeout(timer);
            return;
        } else {
            checkAnswers(); //If timer runs out checkAnswers
        }
    }, seconds * 1000);
}

//Displays timer
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

// fade in/out sections
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
    for (let [index, guess] of userGuess.entries()) {
        if (!gameData.userInput[index]) return;
        guess.innerText = gameData.userInput[index];
    }
}

function checkAnswers() {
    lockBoard = true;
    clearInterval(timer);   //clearInterval of timer if checkAnswers is called before time expires
    if (gameData.userInput !== 4) { //If user runs out of time store a 'x'        
        for (let i = 0; i < 4; i++) {
            if (!gameData.userInput[i]) {
                gameData.userInput[i] = ' x ';
            }
        }
    }

    const correctNumbers = checkIfNumberExists(); //Checks if player's guesses match any of the random numbers 
    const correctMatches = checkForMatches(); //Checks if player has guessed any numbers in their correct correct location

    updateAttempts();
    if (correctMatches === 4 || gameData.attemptsUserHasLeft === 0) {
        toggleAnswers();
        setTimeout(renderResults, 2500, correctNumbers, correctMatches);    //Calls renderResults after toggleAnswers finish
        console.log('time');
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
    let html = overlayHTMLResults(correctNumbers, correctMatches); //Build overlay results

    html += `
            </div>
        </div>
        `; //Close overlay container 

    overlay.innerHTML = html;
    overlay.style.display = 'block';
    closeOverlayListener(); //Event listener when player closes overlay
}

function overlayHTMLResults(numbers, matches) {
    let html = `
        <div class="overlay-content-container">
        <div class="overlay-content">
    `;

    switch (true) {
        case (matches === 4): //Player has matched all numbers
            gameOver = true;
            if (gameData.attemptUserIsOn < gameData.bestScore) { //Compares player's score with bestScore
                gameData.bestScore = gameData.attemptUserIsOn;
                localStorage.setItem('bestScore', JSON.stringify(gameData.bestScore)); //Update local storage
                html += `
                    <h1 class="txt-win txt-results">NEW BEST SCORE!</h1>
                    <h3 class="txt-win txt-results">${gameData.attemptUserIsOn} attempts</h3>
                `;
            } else html += '<h1 class="txt-win txt-results">YOU WIN!</h1>';
            overlay.style.backgroundColor = 'rgba(159, 230, 159, .9)';
            break;
        case (gameData.attemptUserIsOn === 10 || gameData.attemptsUserHasLeft === 0): // If player has lost game
            gameOver = true;
            html += '<h1 class="txt-lose txt-results">YOU LOSE!</h1>';
            overlay.style.backgroundColor = 'rgba(228, 117, 122, .9)';
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
    html += overlayHTMLButtons(matches);
    return html;
}

//Adds buttons to overlay
function overlayHTMLButtons(matches) { 
    let html = '';
    if (gameOver) {   //Checks if game is over
        html += '<button id="btn-win" class="btn reset">PLAY AGAIN?</button>';
    } else {
        html += `                 
            <button id="btn-continue" class="btn continue">CONTINUE</button>
            <button id="btn-reset" class="btn reset">RESTART</button>
        `
    }
    return html;
}

function closeOverlayListener() {
    const gameButtons = document.querySelectorAll('.btn');

    for (let btn of gameButtons) {
        btn.addEventListener('click', closeOverlayHandle);
    }
}

function closeOverlayHandle(e) {
    const btnClass = e.target.classList;
    if (btnClass.contains('reset')) {   //Reset game button
        e.preventDefault();
        resetGame();
    }
    if (btnClass.contains('continue')) {    //Continue game button
        lockBoard = false;
        e.preventDefault();
        clearUserGuesses();
        overlay.style.display = 'none'; //Closes overlay and continues game
        startTimerBar(selectedDifficulty.timer); //Reset timer
    }
    resetUsersGuessCards(); // Remove animation from users guess cards
    gameData.guessUserIsOn = 1; // Reset guessUserIsOn
}

function resetUsersGuessCards(){ // Remove animation from users guess cards
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

// CLEAR GAME ELEMENTS --------
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
//----------------------------

function resetGame() {
    toggleKeyboardAccess(true); // temporarily disable keyboard
    fadeSections('out');    // Game fades out back to home screen
    clearUserHistory();     // Resets user history on screen
    clearUserGuesses(); // Resets users guesses on screen
    gameData.attemptsUserHasLeft = 11; // Reset attempts user has left
    gameData.attemptUserIsOn = 1;   // Reset attempts
    gameData.randomAPIResults = []; // clear API Results
    updateAttempts();   // Resets attempts displayed on screen
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
    if (localStorage.bestScore) {   // If localStorage.bestScore exists update Best Score displayed
        gameData.bestScore = JSON.parse(localStorage.bestScore);
        bestScore.innerText = gameData.bestScore + ' attempts'; 
    } else bestScore.innerText = '-'; // else display no score
}

function renderHomeScreen() {
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
                    <li>Player is given 10 attempts to guess the correct location of 4 numbers</li>
                    <li>After each attempt, player receives feedback if any of the attempted numbers are located or exist</li> 
                    <li>Each attempt is timed depending on the difficulty level</li>
                </ul>
                </div>
            </div>
        </div>
    `;

    overlay.innerHTML = html;
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