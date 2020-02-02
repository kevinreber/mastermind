const randomAPI = 'https://www.random.org/integers/?num=4&min=0&max=7&col=1&base=16&format=plain';
const keyboard = document.getElementById('keyboard');
const randomNumbers = document.getElementById('random-numbers');
const usersGuesses = document.getElementById('users-guesses');
const usersGuess = usersGuesses.querySelectorAll('.user-guess');
const attempts = document.getElementById('attempts');
let attemptsLeft = 10;
let randomAPIResults = [];
let userInput = []; //store user input(similar to Simon Game)

// SOURCE
// https://stackoverflow.com/questions/6375461/get-html-code-using-javascript-with-a-url
const request = makeHttpObject();
request.open("GET", randomAPI, true);
request.send(null);
request.onreadystatechange = function () {
    if (request.readyState === 4) {
        let nums = request.responseText.replace(/\s+/g, ''); // remove carriage return
        randomAPIResults = [...nums];
        addRandomNumbers();
    }
};

function makeHttpObject() {
    try {
        return new XMLHttpRequest();
    } catch (error) {}
    try {
        return new ActiveXObject("Msxml2.XMLHTTP");
    } catch (error) {}
    try {
        return new ActiveXObject("Microsoft.XMLHTTP");
    } catch (error) {}

    throw new Error("Could not create HTTP request object.");
}

function addRandomNumbers() {
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

function userSelection(e) {
    userInput.push(e.target.innerText);
    displayUsersGuess();
    //compareNumber();
    if (userInput.length === 4) {
        //console.log(submitAttempt);
        checkAnswers();
        updateAttempts();
    }
}

function updateAttempts() { // updates attempts made after 4 guesses have been made
    attemptsLeft--;
    attempts.innerText = attemptsLeft;
}

function checkAnswers() {
    let html = '';

    const correctNumbers = checkIfNumberExists(); //  The player had guess a correct number
    const correctMatches = checkForMatches(); // The player had guessed a correct number and its correct location

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

function checkIfNumberExists() {
    let exists = 0;
    for (let num of randomAPIResults) {
        if (userInput.includes(num)) {
            exists++;
        }
    }
    return exists;

    // if (randomAPIResults.some(number => userInput.includes(number))) {
    //     console.log('some');
    //}
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

// function displayUsersGuess(){
//     let html = '';
//     for (let usersGuess of userInput) {
//         html +=
//         `
//         <div class="users-number-container container">
//             <p class="user-number number">${usersGuess}</p>
//         </div>
//         `;
//     }
//     usersGuesses.innerHTML = html;
// }

function displayUsersGuess() {
    for (let [index, guess] of usersGuess.entries()) {
        if (!userInput[index]) return;
        // console.log(guess,index);
        guess.innerText = userInput[index];
    }
}

function compareNumber() {
    console.log(userInput);
    console.log(userInput.length);

    for (let i = 0; i < userInput.length; i++) {

        if (userInput[i] === randomAPIResults[i]) {
            console.log('match');

        } else console.log('no match');

    }
}

keyboard.addEventListener('click', userSelection);