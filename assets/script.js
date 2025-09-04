// Global variables
let pieces = [];
let questions = [];
let imageUrl = '';
let x = 0; // Will be set dynamically from API response
var appScriptUrl = "https://script.google.com/macros/s/AKfycbwbKbe1jdLSEPrubnkRSTiNOPgfLsrMrDFHlW-W6bwIksV1GGzdq88-H2Jeaw3ArWak/exec";

function init() {
    // Fetch all data from Google Apps Script API with redirect handling
    fetch(appScriptUrl +'?action=getData', {
        method: 'GET',
        redirect: 'follow', // Follow 302 redirects
        headers: {
            'X-Requested-With': 'XMLHttpRequest'
        }
    })
        .then(response => {
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return response.json();
        })
        .then(data => {
            imageUrl = data.image;
            questions = data.questions;
            x = questions.length; // Set x based on number of questions
            document.getElementById('background').style.backgroundImage = `url(${imageUrl})`;

            let cols, rows;
            switch (x) {
                case 1:
                    cols = 1; rows = 1; // Exception for x = 1
                    break;
                case 2:
                    cols = 2; rows = 1; // 2 columns, 1 row
                    break;
                case 3:
                    cols = 2; rows = 2; // 2 columns, 2 rows
                    break;
                case 4:
                    cols = 2; rows = 2; // 2 columns, 2 rows
                    break;
                case 5:
                    cols = 2; rows = 3; // 2 columns, 3 rows
                    break;
                case 6:
                    cols = 2; rows = 3; // 2 columns, 3 rows
                    break;
                case 7:
                    cols = 2; rows = 4; // 2 columns, 4 rows
                    break;
                case 8:
                    cols = 2; rows = 4; // 2 columns, 4 rows
                    break;
                case 9:
                    cols = 3; rows = 3; // 3 columns, 3 rows
                    break;
            }
            const totalWidth = 600; // Total fixed width
            const totalHeight = 400; // Total fixed height
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
        .catch(error => console.error('Error fetching data:', error));
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
    document.getElementById('question').innerHTML = questionText; // Render inputs
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
    // Check answer via API with redirect handling
    fetch(`${appScriptUrl}?action=checkAnswer&index=${index}&answer=${JSON.stringify(userAnswer)}`, {
        method: 'GET',
        redirect: 'follow', // Follow 302 redirects
        headers: {
            'X-Requested-With': 'XMLHttpRequest'
        }
    })
        .then(response => {
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return response.json();
        })
        .then(data => {
            if (data.correct) {
                pieces[index].style.display = 'none';
                closePopup();
            } else {
                alert('Sai! Thử lại.');
            }
        })
        .catch(error => console.error('Error checking answer:', error));
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