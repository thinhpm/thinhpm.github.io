// Global variables
let pieces = [];
let questions = [];
let imageUrl = '';
let x = 0; // Will be set dynamically from API response
var appScriptUrl = "https://script.google.com/macros/s/AKfycbzYn0KU2hdP6ERwZVKSustbpuZpZpRQEXafSlGf8FlNoaaIYOocIX4gZx_W2tcf6uuSwQ/exec";

// Helper JSONP loader
function jsonpRequest(url, callbackName) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        const callback = 'cb_' + Math.random().toString(36).substr(2, 9);

        window[callback] = function(data) {
            delete window[callback];
            document.body.removeChild(script);
            resolve(data);
        };

        script.src = `${url}&callback=${callback}`;
        script.onerror = reject;
        document.body.appendChild(script);
    });
}

function init() {
    jsonpRequest(appScriptUrl + '?action=getData')
        .then(data => {
            imageUrl = data.image;
            questions = data.questions;
            x = questions.length;

            document.getElementById('background').style.backgroundImage = `url(${imageUrl})`;

            let cols, rows;
            switch (x) {
                case 1: cols = 1; rows = 1; break;
                case 2: cols = 2; rows = 1; break;
                case 3: 
                case 4: cols = 2; rows = 2; break;
                case 5:
                case 6: cols = 2; rows = 3; break;
                case 7:
                case 8: cols = 2; rows = 4; break;
                case 9: cols = 3; rows = 3; break;
            }

            const totalWidth = 600, totalHeight = 400;
            let pieceCount = 0;

            for (let i = 0; i < rows; i++) {
                for (let j = 0; j < cols; j++) {
                    if (pieceCount < x) {
                        const piece = document.createElement('div');
                        piece.className = 'piece';
                        let width, height;
                        if (pieceCount === x - 1) {
                            width = totalWidth - (j * (totalWidth / cols));
                            height = totalHeight / rows;
                        } else {
                            width = totalWidth / cols;
                            height = totalHeight / rows;
                        }
                        piece.style.width = `${width}px`;
                        piece.style.height = `${height}px`;
                        piece.style.left = `${j * (totalWidth / cols)}px`;
                        piece.style.top = `${i * (totalHeight / rows)}px`;
                        piece.dataset.index = pieceCount;
                        piece.addEventListener('click', showPopup);
                        document.getElementById('puzzle-container').appendChild(piece);
                        pieces.push(piece);
                        pieceCount++;
                    }
                }
            }
        })
        .catch(err => console.error("JSONP error:", err));
}


function showPopup(e) {
    const index = e.target.dataset.index;
    let questionText = questions[index].question;
    // Replace each "_" with an input field including the index
    let inputCount = 0;
    questionText = questionText.replace(/_/g, () => {
        const inputId = `input${inputCount}`;
        inputCount++;
        return `<input type="number" id="${inputId}" placeholder="_">`;
    });
    document.getElementById('question').innerHTML = questions[index].question; // Render inputs
    document.getElementById('input-group').innerHTML = questionText; // Render inputs
    document.getElementById('popup').dataset.index = index;
    document.getElementById('overlay').style.display = 'block';
    document.getElementById('popup').style.display = 'block';
}

function checkAnswer() {
    const index = document.getElementById('popup').dataset.index;
    const userAnswer = [];
    let inputCount = 0;
    while (document.getElementById(`input${inputCount}`)) {
        userAnswer.push(parseInt(document.getElementById(`input${inputCount}`).value) || 0);
        inputCount++;
    }

    document.getElementById('loader').style.display = 'block';


    jsonpRequest(`${appScriptUrl}?action=checkAnswer&index=${index}&answer=${JSON.stringify(userAnswer)}`)
        .then(data => {
            document.getElementById('loader').style.display = 'none';

            if (data.correct) {
                pieces[index].style.display = 'none';
                closePopup();
            } else {
                alert('Sai! Thử lại.');
            }
        })
        .catch(err => {
            document.getElementById('loader').style.display = 'none';
            console.error("JSONP error:", err);
        });
}

function closePopup() {
    document.getElementById('overlay').style.display = 'none';
    document.getElementById('popup').style.display = 'none';
    // Clear input elements
    const index = document.getElementById('popup').dataset.index;
    let inputCount = 0;
    while (document.getElementById(`input${inputCount}`)) {
        document.getElementById(`input${inputCount}`).remove();
        inputCount++;
    }
}

document.getElementById('submit').addEventListener('click', checkAnswer);
document.getElementById('overlay').addEventListener('click', closePopup);

init();