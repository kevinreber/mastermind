const randomAPI = 'https://www.random.org/integers/?num=4&min=0&max=8&col=1&base=16&format=plain';
const keyboard = document.getElementById('keyboard');
const randomNumbers = document.getElementById('random-numbers');
let randomAPIResults = [];
let userInput = []; //store user input(similar to Simon Game)

// fetch(randomAPI)
//     .then(checkStatus)
//     //.then(res => res.json())
//     .then(storeData)
//     .catch(error => console.log('Looks like there was a problem', error));

// function checkStatus(response) {
//     if (response.ok) { //check if status range 200-299
//         return Promise.resolve(response);
//     } else {
//         return Promise.reject(new Error(response.statusText));
//     }
// }

// function storeData(res){
//     const numList = randomAPI.responseText;
//     console.log(res);

// randomAPIResults = [...res];
// return randomAPIResults;
//}

const request = makeHttpObject();
request.open("GET", randomAPI, true);
request.send(null);
request.onreadystatechange = function () {
    if (request.readyState === 4) {
        let nums = request.responseText.replace(/\s+/g, '');    // remove carriage return
        randomAPIResults = [...nums];
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


//user needs to guess number and number location

//

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

// document.addEventListener("DOMContentLoaded", addRandomNumbers());


keyboard.addEventListener('click', function (e) {
    console.log(e.target.innerText);
})