// Global variables
let pieces = [];
let questions = [];
let imageUrl = '';
let totalQuestions = 0;
let openedPieces = [];
var appScriptUrl = "https://puzzlegames.thinhpm.homes/api/v1";
var gameId = "game1";
const typeQuestionsMap = {
    "type1": "thuchanh",
    "type2": "lythuyet",
}
let timer;
let timeElapsed = 0;
let username = "";

function loadGameState(username) {
    if (!username) return null;
    const data = localStorage.getItem("gameState_" + username);
    return data ? JSON.parse(data) : null;
}

function saveGameState(username) {
    if (!username) return;
    const state = {
        gameData,
        openedPieces,
        username,
        timeElapsed,
        finished: openedPieces.length === gameData.questions.length
    };
    localStorage.setItem("gameState_" + username, JSON.stringify(state));
}

function startGame() {
    document.getElementById('background').style.backgroundImage = `url(${imageUrl})`;
    let startBtn = document.getElementById('start-btn');

    startBtn.style.display = 'none';
    createPuzzle(totalQuestions);

    updateTimerDisplay();

    // bắt đầu đếm tăng dần
    timer = setInterval(() => {
        timeElapsed++;
        updateTimerDisplay();
        saveGameState(username);
    }, 1000);
}

function restartGame() {
    timeElapsed = 0;
    openedPieces = [];
    saveGameState(username);

    let restartBtn = document.getElementById('restart-btn');
    restartBtn.style.display = 'none';

    startGame();
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
    const startBtn = document.getElementById('start-btn');
    const timerText = document.getElementById('timer');
    loader.style.display = 'block';  // show loader
    
    fetchJson(appScriptUrl + '/games/' + gameId)
        .then(resp => {
            loader.style.display = 'none';

            gameData = resp.data;
            imageUrl = gameData.image;
            questions = gameData.questions;
            totalQuestions = questions.length;

            startBtn.style.display = 'block';
            timerText.style.display = 'block';
        }).catch(err => {
            loader.style.display = 'none';
            console.error("Failed to load game data:", err);
            alert("Không thể tải câu hỏi. Vui lòng thử lại.");
        });
}

function updateTimerDisplay() {
    let minutes = Math.floor(timeElapsed / 60);
    let seconds = timeElapsed % 60;
    let formattedTime = 
    (minutes < 10 ? "0" : "") + minutes + ":" + 
    (seconds < 10 ? "0" : "") + seconds;
    document.getElementById("timeElapsed").textContent = formattedTime;
}

function createPuzzle(totalQuestions) {
    let cols, rows;
    switch (totalQuestions) {
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
            cols = Math.ceil(Math.sqrt(totalQuestions));
            rows = Math.ceil(totalQuestions / cols);
            break;
    }
    const totalWidth = 600, totalHeight = 400;
    let pieceCount = 0;

    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            if (pieceCount < totalQuestions) {
                const piece = document.createElement('div');
                piece.className = 'piece';
                var width, height;
                if (pieceCount === totalQuestions - 1) {
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

    loadOpendPieces();
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
                saveOpenQuestion(question, index);
                saveGameState(username);
                closePopup();
            } else {
                alert('Sai! Thử lại.');
            }
        })
}

function saveOpenQuestion(question, index) {
    openedPieces.push({"index": index, "question": question});

    if (openedPieces.length >= totalQuestions) {
      clearInterval(timer);
    }
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

document.getElementById("saveUsername").addEventListener("click", function() {
    let username = document.getElementById("usernameInput").value;
    if (username) {
        document.getElementById("username-popup").style.display = "none";
        document.getElementById("info-username").textContent = username;
        saveUserName(username);
        document.getElementById("overlay2").style.display = "none";
        init();
    } else {
        alert("Vui lòng nhập tên!");
    }
});

function showPopupUsername() {
    document.getElementById("username-popup").style.display = "block";
    document.getElementById("overlay2").style.display = "block";
}

function saveUserName(name) {
    if (!name || name.trim() === "") return;

    username = name;
    // Lưu vào localStorage
    localStorage.setItem("username", name);

    // Hiển thị tên lên giao diện
    const usernameDisplay = document.getElementById("info-username");
    if (usernameDisplay) {
        usernameDisplay.textContent = name;
    }
}

function getUsername() {
    let name = localStorage.getItem("username");
    username = name;
    return name;
}

function loadOpendPieces() {
    for (let i = 0; i < openedPieces.length; i++) {
        pieces[openedPieces[i].index].style.display = 'none';
    }
}

function addEventDragAndMoveBarInfo() {
    const bar = document.getElementById("bar-info");

    let isDragging = false;
    let offsetX, offsetY;

    window.addEventListener("load", () => {
        const savedPosition = JSON.parse(localStorage.getItem("barPosition"));
        if (savedPosition) {
            bar.style.left = savedPosition.left + "px";
            bar.style.top = savedPosition.top + "px";
            bar.style.right = "auto"; // bỏ fix bên phải
        }
    });

    bar.addEventListener("mousedown", function(e) {
        isDragging = true;
        offsetX = e.clientX - bar.offsetLeft;
        offsetY = e.clientY - bar.offsetTop;
        bar.style.transition = "none"; // tắt hiệu ứng
    });

    document.addEventListener("mousemove", function(e) {
        if (isDragging) {
            bar.style.left = (e.clientX - offsetX) + "px";
            bar.style.top = (e.clientY - offsetY) + "px";
            bar.style.right = "auto"; // bỏ fix bên phải
        }
    });

    document.addEventListener("mouseup", function() {
        if (isDragging) {
            isDragging = false;
            // Lưu vị trí vào localStorage
            localStorage.setItem("barPosition", JSON.stringify({
                left: bar.offsetLeft,
                top: bar.offsetTop
            }));
        }
    });
}

function addEventResetGame() {
     const resetBtn = document.getElementById("reset-game");

    resetBtn.addEventListener("click", () => {
        if (confirm("Bạn có chắc muốn chơi lại không?")) {
            // Xóa gameState của user
            localStorage.removeItem("gameState_" + username);
            // Reset vị trí info-bar
            localStorage.removeItem("username");
            // Reload trang
            location.reload();
        }
    });
}

window.onload = function() {
    let username = getUsername();

    if (username == null) {
        showPopupUsername();
    } else {
        document.getElementById("info-username").innerText = username;

        const savedState = loadGameState(username);

        if (savedState) {
            gameData = savedState.gameData;
            openedPieces = savedState.openedPieces || [];
            timeElapsed = savedState.timeElapsed || 0;
            username = savedState.username || "";
            imageUrl = gameData.image || "";
            questions = gameData.questions || [];
            totalQuestions = questions.length || 0;
            
            if (savedState.finished) {
                document.getElementById("restart-btn").style.display = "block";
            } else {
                startGame();
            }
        } else {
            init();
        }
    }

    document.getElementById("start-btn").addEventListener("click", startGame);
    document.getElementById("restart-btn").addEventListener("click", restartGame);
    document.getElementById('submit').addEventListener('click', checkAnswer);
    document.getElementById('overlay').addEventListener('click', closePopup);
    addEventDragAndMoveBarInfo();
    addEventResetGame();
}
