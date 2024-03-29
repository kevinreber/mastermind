const overlay = document.getElementById('overlay'); //Overlay container for event listener
const keyboard = document.getElementById('keyboard'); //Keyboard container for event listener

let gameOver, lockBoard; //Boolean values
let timer; //Timer that calls checkAnswers if guess time expires
let resultsTimer; //Timer for player to view result screen
let selectedDifficulty; //Stores Player Selected Difficulty

let gameData = {
    bestScore: 11, // Placeholder for lowest score
    attemptsPlayerHasLeft: 10, // Updates on game screen
    attemptPlayerIsOn: 1, // Reference to update player history
    guessPlayerIsOn: 0, // Stores guess player is on
    randomAPIResults: [], // Stores numbers from API call
    playerInput: ['-', '-', '-', '-'] // Stores player's input
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
            <div class="overlay-content animated hide fadeInUp">
                <h1 class="game-title start-screen">MASTERMIND</h1>
                <div class="difficulty-container">
                    <h3>SELECT YOUR DIFFICULTY</h3>
                    <div class="difficulty-options">
                        <button class="difficulty-btn">EASY</button>
                        <button class="difficulty-btn">MEDIUM</button>
                        <button class="difficulty-btn">HARD</button>
                    </div>
                </div>
                <footer id="instructions" class="instructions">
                    <p class="txt-instructions">INSTRUCTIONS</p>
                    <ul class="instructions-list toggle-display">
                        <li>Player has 10 attempts to guess the location of 4 numbers in limited time</li>
                        <li>After each attempt player has 10 seconds to view their results</li>
                        <li>Game ends when player runs out of attempts or matches all numbers</li>                    
                    </ul>
                </footer>
            </div>
        </div>
    `;

    overlay.innerHTML = html;
}

function selectDifficulty(e) {
    const gameDifficulty = { //Settings for game difficulty
        easy: {
            keyboardMax: 5,
            timer: 25
        },
        medium: {
            keyboardMax: 7,
            timer: 20
        },
        hard: {
            keyboardMax: 9,
            timer: 15
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
    checkIfBestScoreExists();
    renderGameBoard();
    startTimerBar(selectedDifficulty.timer);
}

//Fallback if API call fails
function randomNumbersFallback(number) {
    for (let i = 0; i < 4; i++) { //Return 4 elements
        gameData.randomAPIResults.push(generateRandomNumber(number).toString());
    }
}

function generateRandomNumber(number) {
    return Math.floor(Math.random() * (number + 1))
}


//Render game board after API call attempt
function renderGameBoard() {
    renderRandomNumbers();
    renderPlayerGuesses();
    renderHistory();
    renderKeyboard();
    fadeSections('in');
    toggleKeyboardAccess(false); //Allow player access to keyboard
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

//Displays player's guesses
function renderPlayerGuesses() {
    const playersGuesses = document.getElementById('players-guesses');

    for (let i = 0; i < 4; i++) {
        const card = document.createElement('p');
        card.id = i;
        card.classList.add('player-guess', 'number', 'shrink');
        card.onclick = removeCardValue;
        card.innerText = '-';
        playersGuesses.appendChild(card);
    }
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
            <td class="attempt">----</td>
            <td class="attempt">--</td>
            <td class="attempt">--</td>
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

    switch (true) { // Adjust keyboard size based off selected difficulty
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

//Fade in/out animation for page sections
function fadeSections(fade) {
    const sections = document.querySelectorAll('section');
    fadeElements(sections, fade);
}

//Fade in/out animation for elements
function fadeElements(elements, fade) {
    if (fade === 'in') {
        for (let element of elements) {
            element.classList.remove('hide');
            element.classList.add('animated', 'fadeInUp');
        }
    }
    if (fade === 'out') {
        for (let element of elements) {
            element.classList.add('hide');
            element.classList.remove('animated', 'fadeInUp');
        }
    }
}

//Stores player's input
function playerMakesGuess(e) {
    const playerGuess = document.querySelectorAll('.player-guess');
    const key = e.target;
    if (key.tagName === 'BUTTON') {
        updateGuessPlayerIsOn();    //If player removes card, makes sure gameData.guessPlayerIsOn is updated

        gameData.playerInput[gameData.guessPlayerIsOn] = key.innerText; //Store player's guess
        displayGuessMade();
        playerGuess[gameData.guessPlayerIsOn].classList.toggle('grow');
        gameData.guessPlayerIsOn++;
    }

    if (!gameData.playerInput.includes('-')) { //checkAnswers when player has made 4 guesses
        checkAnswers();
    }
}

// If player removes a card value, updateGuessPlayerIsOn will make sure other card values aren't affected
function updateGuessPlayerIsOn() {
    for (let i = 0; i < 3; i++) {
        if (gameData.playerInput[gameData.guessPlayerIsOn] !== '-') {   //if playerInput contains a number, guessPlayerIsOn will increment to skip that input
            gameData.guessPlayerIsOn++;
        }
    }
}

function removeCardValue(e) {
    const card = e.target;

    // gameData.guessPlayerIsOn = card.id;
    gameData.guessPlayerIsOn = 0;   //Sets guess to 0, updateGuessPlayerIsOn() will ensure no card values are skipped

    card.innerText = '-';
    card.classList.toggle('grow');
    gameData.playerInput[card.id] = '-';
}

//Updates display of player's guesses
function displayGuessMade() {
    const playerGuess = document.querySelectorAll('.player-guess');
    for (let [index, guess] of playerGuess.entries()) {
        if (!gameData.playerInput[index]) return;
        guess.innerText = gameData.playerInput[index];
    }
}

//Checks answers 
function checkAnswers() {
    lockBoard = true;
    clearInterval(timer); //clearInterval of timer if checkAnswers is called before time expires   
    for (let i = 0; i < 4; i++) { //If player runs out of time store a ' x ' 
        if (gameData.playerInput[i] === '-') {
            gameData.playerInput[i] = 'x';
        }
    }

    const correctNumbers = checkIfNumberExists(); //Checks if player's guesses match any of the random numbers 
    const correctMatches = checkForMatches(); //Checks if player has guessed any numbers in their correct correct location
    gameData.matches = correctMatches;

    updateAttempts();
    if (correctMatches === 4 || gameData.attemptsPlayerHasLeft === 0) {
        gameOver = true;
        toggleAnswers(); //Shows answers
        setTimeout(renderResults, 2500, correctNumbers, correctMatches); //Calls renderResults after toggleAnswers finish
    } else {
        renderResults(correctNumbers, correctMatches);
        updateHistory(correctNumbers, correctMatches);
    }
}

//Updates attempts left after 4 guesses have been made
function updateAttempts() {
    const attemptsLeft = document.getElementById('attempts-left');
    gameData.attemptsPlayerHasLeft--;
    attemptsLeft.innerText = gameData.attemptsPlayerHasLeft;
}

//Returns how many numbers the player has guessed exist
function checkIfNumberExists() {
    let exists = 0;
    for (let num of gameData.randomAPIResults) {
        if (gameData.playerInput.includes(num)) {
            exists++;
        }
    }
    return exists;
}

//Returns how many numbers the player has guessed are in the correct location
function checkForMatches() {
    let matches = 0;
    for (let i = 0; i < gameData.randomAPIResults.length; i++) {
        if (gameData.randomAPIResults[i] === gameData.playerInput[i]) {
            matches++;
        }
    }
    return matches;
}

//Display results after comparing player input to the random numbers
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
        if (gameData.attemptsPlayerHasLeft !== 0) {
            continueGame();
        }
        if (!lockBoard && gameOver) {
            clearTimeout(resultsTimer);
        } else {
            clearTimeout(resultsTimer);
        }
    }, 10000);
}

//Builds overlay results 
function overlayHTMLResults(numbers, matches) {
    const winColor = 'rgba(159, 230, 159, .9)';
    const loseColor = 'rgba(228, 117, 122, .9)';
    let html = `
        <div class="overlay-content-container">
        <div class="overlay-content">
    `;

    switch (true) {
        case (matches === 4): //Player has matched all numbers
            if (gameData.attemptPlayerIsOn < gameData.bestScore) { //Compares player's score with bestScore
                gameData.bestScore = gameData.attemptPlayerIsOn;
                localStorage.setItem('bestScore', JSON.stringify(gameData.bestScore)); //Update local storage
                html += `
                    <h1 class="txt-win txt-results">NEW BEST SCORE!</h1>
                    <h3 class="txt-win txt-results">${gameData.attemptPlayerIsOn} attempts</h3>
                `;
            } else html += '<h1 class="txt-win txt-results">YOU WIN!</h1>';
            gameEnds(winColor);
            break;
        case (gameData.attemptPlayerIsOn === 10 || gameData.attemptsPlayerHasLeft === 0): // If player has lost game
            html += '<h1 class="txt-lose txt-results">YOU LOSE!</h1>';
            gameEnds(loseColor);
            break;
        case (numbers > 0 && matches < 4): // Player has guessed correct numbers
            html += `
                <h1 class="txt-results txt-correct-header">YOU GUESSED</h1>
                <div class="txt-correct-container">
                    <h2 class="txt-player-input">${gameData.playerInput.join('-')}</h2>
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
    if (gameOver) { //If game is over
        html += '<button id="btn-game-over" class="btn reset">PLAY AGAIN?</button>';
    } else { //If game is not over
        html += `
        <button id="btn-continue" class="btn continue">CONTINUE</button>
            <button id="btn-reset" class="btn reset">RESTART</button>
        `
    }
    return html;
}

//Changes overlay background color based on game results
function gameEnds(result) {
    gameData.attemptsPlayerHasLeft = 0; //Reset attemptsPlayerHasLeft to stop resultsTimer
    overlay.style.backgroundColor = result;
    overlay.classList.add('overlay-game-over');
    overlay.classList.remove('overlay-default');
}

//Listens for event on overlay of results
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
    if (classList.contains('continue')) { //Continue game if player clicks overlay      
        continueGame();
    }
}

//Closes overlay of results and continues game to next attempt
function continueGame() {
    clearTimeout(resultsTimer); //Stops resultsTimer when overlay of results closes
    lockBoard = false;
    overlay.style.display = 'none'; //Closes overlay and continues game
    startTimerBar(selectedDifficulty.timer); //Reset timer
    resetPlayerGuessData();
}

//Resets guess player is on
function resetPlayerGuessData() {
    resetPlayersGuessCards(); // Remove animation from players guess cards
    gameData.guessPlayerIsOn = 0; // Reset guessPlayerIsOn
}

//Remove animation from players guess cards
function resetPlayersGuessCards() {
    const playerGuess = document.querySelectorAll('.player-guess');
    for (let guess of playerGuess) {
        guess.classList.remove('grow');
        guess.innerText = '-';
    }
    gameData.playerInput = ['-', '-', '-', '-'];
}

//Updates player's attempt history
function updateHistory(correct, located) {
    const tableAttempts = document.querySelectorAll('.table-attempt');
    let html = `
        <td class="attempt">${gameData.playerInput.join('-')}</td>
        <td class="attempt">${correct}/4</td>
        <td class="attempt">${located}/4</td>
    `
    tableAttempts[gameData.attemptPlayerIsOn - 1].innerHTML = html;
    gameData.attemptPlayerIsOn++;
}

//Resets Game
function resetGame() {
    document.getElementById('players-guesses').innerHTML = ''; //Clears any previous cards
    clearTimeout(resultsTimer);
    toggleKeyboardAccess(true); // temporarily disable keyboard elements
    fadeSections('out'); // Game fades out back to home screen
    resetPlayerGuessData();
    gameData.attemptsPlayerHasLeft = 11; // Reset attempts player has left
    gameData.attemptPlayerIsOn = 1; // Reset attempts
    gameData.randomAPIResults = []; // clear API Results
    updateAttempts(); // Resets attempts displayed on screen
    renderHomeScreen(); //Displays home screen
}

//Toggle player's access to keyboard
function toggleKeyboardAccess(bool) {
    const keyboardNumber = document.querySelectorAll('.keyboard-number');
    for (let key of keyboardNumber) {
        key.disabled = bool;
    }
}

//Check local storage for bestScore
function checkIfBestScoreExists() {
    const bestScore = document.getElementById('best-score');
    if (localStorage.bestScore) { // If localStorage.bestScore exists update Best Score displayed
        gameData.bestScore = JSON.parse(localStorage.bestScore);
        bestScore.innerText = gameData.bestScore + ' attempts';
    } else bestScore.innerText = '-'; // else display no score
}

//Reveal answers when game is over
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

//Toggle display of instructions on home screen
function showInstructions(e) {
    const instructions = document.getElementById('instructions');
    const instructionsList = document.querySelector('.instructions-list');

    if (e.target.innerText === 'INSTRUCTIONS') {
        instructions.classList.toggle('slideUp');
        instructionsList.classList.toggle('toggle-display');
    }
}

//EVENT LISTENERS
window.onload = renderHomeScreen(); //Renders home screen on page load
overlay.addEventListener('click', selectDifficulty); //Listens for player to select difficulty and starts game
overlay.addEventListener('click', showInstructions); //Listens for player to click instructions to display
keyboard.addEventListener('click', playerMakesGuess); //Listens for player to make a guess