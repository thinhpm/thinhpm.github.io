// Global variables
let pieces = [];
let questions = [];
let imageUrl = '';
let x = 0; // Will be set dynamically from API response
var appScriptUrl = "https://puzzlegames.thinhpm.homes/api/v1";
var gameId = "game1";
const typeQuestionsMap = {
    "type1": "thuchanh",
    "type2": "lythuyet",
}

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

function fetchJson(url, options = {}) {
    return fetch(url, options).then(res => {
        if (!res.ok) {
            throw new Error("Network error: " + res.status);
        }
        return res.json();
    });
}

function init() {
    const loader = document.getElementById('loader-game');
    loader.style.display = 'block';  // show loader
    
    fetchJson(appScriptUrl + '/games/' + gameId)
        .then(resp => {
            loader.style.display = 'none';

            var data = resp.data;
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
                case 10:
                case 12: cols = 3; rows = 4; break;
                case 11: cols = 3; rows = 4; break;
                case 13:
                case 14: cols = 3; rows = 5; break;
                case 15:
                case 16: cols = 4; rows = 4; break;
                case 17:
                case 18: cols = 3; rows = 6; break;
                case 19:
                case 20: cols = 4; rows = 5; break;
                default:
                    cols = Math.ceil(Math.sqrt(x));
                    rows = Math.ceil(x / cols);
                    break;
            }
            const totalWidth = 600, totalHeight = 400;
            let pieceCount = 0;

            for (let i = 0; i < rows; i++) {
                for (let j = 0; j < cols; j++) {
                    if (pieceCount < x) {
                        const piece = document.createElement('div');
                        piece.className = 'piece';
                        var width, height;
                        if (pieceCount === x - 1) {
                            width = totalWidth - (j * (totalWidth / cols)); height = totalHeight / rows; 
                        } 
                        else {
                            width = totalWidth / cols; height = totalHeight / rows; 
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
        }).catch(err => {
            loader.style.display = 'none';
            console.error("Failed to load game data:", err);
            alert("Không thể tải câu hỏi. Vui lòng thử lại.");
        });
}


function showPopup(e) {
    const index = e.target.dataset.index;
    let questionText = questions[index].question;
    let type = questions[index].type;
    // Replace each "_" with an input field including the index
    let inputCount = 0;

    if (type == typeQuestionsMap["type1"] || type == "") {
        questionText = questionText.replace(/_/g, () => {
            const inputId = `input${inputCount}`;
            inputCount++;
            return `<input type="number" id="${inputId}" placeholder="_">`;
        });
    } else if (type == typeQuestionsMap["type2"]) {
        questionText =  `<input type="text" class="input-answer" id="input0" placeholder="Đáp án">`;
    }
    
    document.getElementById('question').innerHTML = questions[index].question; // Render inputs
    document.getElementById('input-group').innerHTML = questionText; // Render inputs
    document.getElementById('popup').dataset.question = questions[index].question;
    document.getElementById('popup').dataset.index = index;
    document.getElementById('popup').dataset.type = type;

    document.getElementById('overlay').style.display = 'block';
    document.getElementById('popup').style.display = 'block';
}

function checkAnswer() {
    let question = document.getElementById('popup').dataset.question;
    let type = document.getElementById('popup').dataset.type;
    let index = document.getElementById('popup').dataset.index;
    let userAnswer = [];
    let inputCount = 0;

    if (type == typeQuestionsMap["type2"]) {
        userAnswer.push(document.getElementById(`input0`).value);
    } else {
        while (document.getElementById(`input${inputCount}`)) {
            userAnswer.push(parseInt(document.getElementById(`input${inputCount}`).value) || 0);
            inputCount++;
        }
    }

    document.getElementById('loader').style.display = 'block';

    let raw = JSON.stringify({
        "question": question,
        "answer": userAnswer
    });

    let requestOptions = {
        method: "POST",
        body: raw,
        redirect: "follow"
    };

    fetchJson(`${appScriptUrl}/games/${gameId}/verify`, requestOptions)
        .then(resp => {
            let data = resp.data;
            document.getElementById('loader').style.display = 'none';

            if (data.is_correct) {
                pieces[index].style.display = 'none';
                closePopup();
            } else {
                alert('Sai! Thử lại.');
            }
        })
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