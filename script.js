$(document).ready(function() {
    // Game Configuration
    const difficulties = {
        easy: { gridSize: 4, pairs: 8, nextLevel: 'medium', timeLimit: 180 },
        medium: { gridSize: 6, pairs: 12, nextLevel: 'hard', timeLimit: 240 },
        hard: { gridSize: 8, pairs: 16, nextLevel: 'easy', timeLimit: 300 }
    };
    
    // Game State Variables
    let currentDifficulty = 'easy';
    let emojis = [
        '🍎', '🍌', '🍒', '🍇', '🍉', '🍊', '🍋', '🍍', 
        '🍐', '🍑', '🍓', '🍈', '🍄', '🥝', '🥭', '🍅', 
        '🍋', '🍉', '🥑', '🍍', '🍇', '🍓', '🥭', '🍒'
    ];
    let cards = [];
    let flippedCards = [];
    let matchedPairs = 0;
    let moves = 0;
    let timer;
    let seconds = 0;
    let timeLimit = 0;
    let leaderboard = JSON.parse(localStorage.getItem('memoryGameLeaderboard')) || [];

    // Sound Management
    const sounds = {
        flip: new Audio('sounds/flip-sound.mp3'),
        match: new Audio('sounds/match-sound.mp3'),
        win: new Audio('sounds/win-sound.mp3'),
        lose: new Audio('sounds/lose-sound.mp3'),
        background: new Audio('sounds/background-music.mp3')
    };

    // Sound Settings
    let isMuted = false;
    let isBgMusicPlaying = false;

    // Configure background music
    sounds.background.loop = true;
    sounds.background.volume = 0.3;

    // Sound Control Functions
    function playSound(soundKey) {
        if (!isMuted) {
            sounds[soundKey].currentTime = 0;
            sounds[soundKey].play().catch(error => console.log('Sound play error:', error));
        }
    }

    function toggleMute() {
        isMuted = !isMuted;
        const volumeIcon = $('#volume-icon');
        
        if (isMuted) {
            volumeIcon.removeClass('fa-volume-up').addClass('fa-volume-mute');
            Object.values(sounds).forEach(sound => sound.pause());
        } else {
            volumeIcon.removeClass('fa-volume-mute').addClass('fa-volume-up');
        }
    }

    function toggleBackgroundMusic() {
        const musicIcon = $('#bg-music-btn i');
        
        if (!isBgMusicPlaying) {
            sounds.background.play();
            musicIcon.addClass('text-danger');
            isBgMusicPlaying = true;
        } else {
            sounds.background.pause();
            musicIcon.removeClass('text-danger');
            isBgMusicPlaying = false;
        }
    }

    // Card Shuffling and Board Creation
    function shuffleCards() {
        const selectedEmojis = emojis.slice(0, difficulties[currentDifficulty].pairs);
        cards = [...selectedEmojis, ...selectedEmojis];
        cards.sort(() => Math.random() - 0.5);
    }

    function createBoard() {
        const gameBoard = $('.game-board');
        gameBoard.empty();
        gameBoard.css('grid-template-columns', `repeat(${difficulties[currentDifficulty].gridSize}, 1fr)`);
        
        cards.forEach((emoji, index) => {
            const card = $(`
                <div class="card" data-index="${index}">
                    <div class="card-back"></div>
                    <div class="card-front">${emoji}</div>
                </div>
            `);
            card.on('click', handleCardClick);
            gameBoard.append(card);
        });

        // Update difficulty and time limit display
        $('#current-difficulty').text(currentDifficulty.charAt(0).toUpperCase() + currentDifficulty.slice(1));
        timeLimit = difficulties[currentDifficulty].timeLimit;
    }

    // Game Interaction Functions
    function handleCardClick() {
        const card = $(this);
        
        if (flippedCards.length < 2 && !card.hasClass('flipped') && !card.hasClass('matched')) {
            playSound('flip');
            card.addClass('flipped animate__animated animate__flipInY');
            flippedCards.push(card);

            if (flippedCards.length === 2) {
                moves++;
                $('#moves').text(moves);
                checkMatch();
            }
        }
    }

    function checkMatch() {
        const [card1, card2] = flippedCards;
        const emoji1 = card1.find('.card-front').text();
        const emoji2 = card2.find('.card-front').text();

        if (emoji1 === emoji2) {
            playSound('match');
            card1.addClass('matched animate__animated animate__pulse');
            card2.addClass('matched animate__animated animate__pulse');
            matchedPairs++;

            if (matchedPairs === difficulties[currentDifficulty].pairs) {
                setTimeout(gameWon, 500);
            }
        } else {
            setTimeout(() => {
                card1.removeClass('flipped animate__flipInY');
                card2.removeClass('flipped animate__flipInY');
            }, 1000);
        }

        flippedCards = [];
    }

    // Timer and Game State Management
    function startTimer() {
        timer = setInterval(() => {
            seconds++;
            const remainingTime = Math.max(timeLimit - seconds, 0);
            const minutes = Math.floor(remainingTime / 60);
            const remainingSeconds = remainingTime % 60;
            
            $('#timer').text(`${pad(minutes)}:${pad(remainingSeconds)}`);

            if (remainingTime <= 0) {
                gameLost();
            }
        }, 1000);
    }

    function pad(number) {
        return number < 10 ? `0${number}` : number;
    }

    // Leaderboard Management
    function addToLeaderboard(playerName, difficulty, moves, time) {
        const entry = {
            name: playerName,
            difficulty: difficulty,
            moves: moves,
            time: time,
            date: new Date().toLocaleString()
        };

        leaderboard.push(entry);
        leaderboard.sort((a, b) => {
            if (a.moves !== b.moves) return a.moves - b.moves;
            return a.time - b.time;
        });

        leaderboard = leaderboard.slice(0, 10);
        
        localStorage.setItem('memoryGameLeaderboard', JSON.stringify(leaderboard));
        updateLeaderboardDisplay();
    }

    function updateLeaderboardDisplay() {
        const leaderboardBody = $('#leaderboard-body');
        leaderboardBody.empty();

        leaderboard.forEach((entry, index) => {
            leaderboardBody.append(`
                <tr>
                    <td>${index + 1}</td>
                    <td>${entry.name}</td>
                    <td>${entry.difficulty}</td>
                    <td>${entry.moves}</td>
                    <td>${entry.time}</td>
                    <td>${entry.date}</td>
                </tr>
            `);
        });
    }

    // Game Completion Functions
    function gameWon() {
        clearInterval(timer);
        playSound('win');
        
        Swal.fire({
            title: 'Congratulations!',
            html: `You won in ${moves} moves and ${seconds} seconds!`,
            icon: 'success',
            input: 'text',
            inputLabel: 'Enter your name for the leaderboard',
            inputPlaceholder: 'Your Name',
            showCancelButton: true,
            confirmButtonText: 'Save & Continue',
            cancelButtonText: 'Continue without saving',
            inputValidator: (value) => {
                if (!value) return 'You need to write something!';
            }
        }).then((result) => {
            if (result.isConfirmed) {
                addToLeaderboard(result.value, currentDifficulty, moves, seconds);
            }

            currentDifficulty = difficulties[currentDifficulty].nextLevel;
            resetGame();
        });
    }

    function gameLost() {
        clearInterval(timer);
        playSound('lose');
        
        Swal.fire({
            title: 'Time\'s Up!',
            text: 'You ran out of time. Try again!',
            icon: 'error',
            confirmButtonText: 'Restart'
        }).then(() => {
            resetGame();
        });
    }

    // Game Reset and Difficulty Change
    function resetGame() {
        clearInterval(timer);
        flippedCards = [];
        matchedPairs = 0;
        moves = 0;
        seconds = 0;
        
        $('#moves').text(moves);
        $('#timer').text(`${pad(difficulties[currentDifficulty].timeLimit / 60)}:00`);
        
        shuffleCards();
        createBoard();
        startTimer();
    }

    function changeDifficulty() {
        currentDifficulty = difficulties[currentDifficulty].nextLevel;
        resetGame();
    }

    // Event Listeners
    $('#restart-btn').on('click', resetGame);
    $('#difficulty-btn').on('click', changeDifficulty);
    $('#mute-btn').on('click', toggleMute);
    $('#bg-music-btn').on('click', toggleBackgroundMusic);
    $('#clear-leaderboard-btn').on('click', function() {
        Swal.fire({
            title: 'Clear Leaderboard?',
            text: 'Are you sure you want to delete all leaderboard entries?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, clear it!',
            cancelButtonText: 'Cancel'
        }).then((result) => {
            if (result.isConfirmed) {
                leaderboard = [];
                localStorage.removeItem('memoryGameLeaderboard');
                updateLeaderboardDisplay();
                Swal.fire('Cleared!', 'Leaderboard has been reset.', 'success');
            }
        });
    });

    // Initialize Game
    shuffleCards();
    createBoard();
    startTimer();
    updateLeaderboardDisplay();
});