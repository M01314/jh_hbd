document.addEventListener('DOMContentLoaded', () => {
    // UI Elements
    const startBtn = document.getElementById('start-btn');
    const retryBtn = document.getElementById('retry-btn');
    const openLetterBtn = document.getElementById('open-letter-btn');

    const startScreen = document.getElementById('start-screen');
    const overScreen = document.getElementById('over-screen');
    const winScreen = document.getElementById('win-screen');
    const messageContainer = document.getElementById('message-container');

    const player = document.getElementById('player');
    const girl = document.getElementById('pursuer-girl');
    const gameArea = document.getElementById('game-area');
    const headerTitle = document.getElementById('header-title');

    // Minimap Icons
    const mapGirl = document.getElementById('map-girl');
    const mapDino = document.getElementById('map-dino');
    const distRemain = document.getElementById('dist-remain');

    const girlBubble = document.getElementById('girl-bubble');
    const fakeCard = document.getElementById('fake-card');
    const realCard = document.getElementById('real-card');
    const showRealBtn = document.getElementById('show-real-btn');

    // Game Constants
    const gravity = 0.65;
    const jumpPower = -14;
    const targetDistance = 3000;

    // 기기별 속도 설정
    const isMobileSize = window.innerWidth <= 600;
    const gameSpeed = isMobileSize ? 8.5 : 11.5; // 모바일 보통, 데스크탑 빠르게
    const obstacleInterval = isMobileSize ? 1700 : 1300; // 생성 간격 단축
    const distSpeed = isMobileSize ? 3.8 : 5.2; // 진행 속도 상향

    // Game State
    let gameActive = false;
    let distance = 0;
    let py = 0; // Player Y
    let pvy = 0; // Player Velocity Y
    let isJumping = false;
    let isDucking = false;
    let obstacles = [];
    let lastObstacleTime = 0;
    let animationId = null;

    const stalkerQuotes = [
        "째현아... 어디 가?",
        "뒤에 나 있어...♥",
        "놓치지 않을 거야",
        "사랑해 사랑해 사랑해",
        "너 뒤태가 참 예쁘다",
        "거의 다 왔네? 후후",
        "잡히면 어떻게 해줄까?",
        "오늘따라 더 빨라보여",
        "헉헉... 조금만 더!",
        "포기하면 편해 째현아",
        "우리 평생 함께하자",
        "도망치는 모습도 귀여워",
        "발소리가 여기까지 들려",
        "나한테서 못 벗어나",
        "거기 돌 조심해! (깔깔)",
        "비행기 조심해야지?",
        "지금 나랑 눈 마주쳤지?",
        "너 냄새... 너무 좋아",
        "사랑의 추격전이야~",
        "어차피 넌 내 거야",
        "조금만 천천히 가줘",
        "도망가지 마아아악!!",
        "내 심장소리 들리니?",
        "째현아 사랑해애애액!",
        "넌 도망칠 때가 젤 멋져"
    ];

    // --- 이벤트 및 조작 ---

    const handleJump = () => {
        if (!gameActive || isDucking) return;
        if (!isJumping) {
            pvy = jumpPower;
            isJumping = true;
        }
    };

    const handleDuck = (duck) => {
        if (!gameActive || isJumping) return;
        isDucking = duck;
        if (isDucking) {
            player.classList.add('ducking');
        } else {
            player.classList.remove('ducking');
        }
    };

    // 키보드 조작 (위/아래)
    window.addEventListener('keydown', (e) => {
        if (e.code === 'ArrowUp' || e.code === 'Space') {
            e.preventDefault();
            handleJump();
        }
        if (e.code === 'ArrowDown') {
            e.preventDefault();
            handleDuck(true);
        }
    });

    window.addEventListener('keyup', (e) => {
        if (e.code === 'ArrowDown') {
            handleDuck(false);
        }
    });

    // --- 스와이프 및 터치 조작 ---
    let touchStartY = 0;
    let touchEndY = 0;
    const swipeThreshold = 50; // 스와이프로 인정할 최소 거리

    gameArea.addEventListener('touchstart', (e) => {
        touchStartY = e.changedTouches[0].screenY;
    }, { passive: true });

    gameArea.addEventListener('touchend', (e) => {
        touchEndY = e.changedTouches[0].screenY;
        handleSwipe();
    }, { passive: true });

    function handleSwipe() {
        const deltaY = touchStartY - touchEndY;

        if (Math.abs(deltaY) < swipeThreshold) {
            // 거리가 짧으면 그냥 점프로 처리 (탭)
            handleJump();
            return;
        }

        if (deltaY > swipeThreshold) {
            // 위로 스와이프
            handleJump();
        } else if (deltaY < -swipeThreshold) {
            // 아래로 스와이프
            handleDuck(true);
            // 일정 시간 후 수그리기 해제 (모바일 특성상)
            setTimeout(() => handleDuck(false), 600);
        }
    }

    // 마우스 대응
    gameArea.addEventListener('mousedown', (e) => {
        if (!gameActive) return;
        e.preventDefault();
        handleJump();
    });

    startBtn.addEventListener('click', startGame);
    retryBtn.addEventListener('click', startGame);

    openLetterBtn.addEventListener('click', () => {
        messageContainer.classList.remove('hidden');
        messageContainer.scrollIntoView({ behavior: 'smooth' });
        winScreen.classList.add('hidden');
        fakeCard.classList.remove('hidden'); // 가짜 편지 먼저 노출
        realCard.classList.add('hidden');
    });

    showRealBtn.addEventListener('click', () => {
        fakeCard.classList.add('hidden');
        realCard.classList.remove('hidden'); // 진짜 편지 노출
        confetti({
            particleCount: 200,
            spread: 120,
            origin: { y: 0.6 },
            colors: ['#ffb6c1', '#a8d5ba', '#ffffff', '#5d4037']
        });
    });

    // --- 게임 루프 ---

    function startGame() {
        gameActive = true;
        distance = 0;
        py = 0;
        pvy = 0;
        isJumping = false;
        isDucking = false;
        obstacles.forEach(obs => obs.el.remove());
        obstacles = [];
        lastObstacleTime = 0;

        startScreen.classList.add('hidden');
        overScreen.classList.add('hidden');
        winScreen.classList.add('hidden');
        messageContainer.classList.add('hidden');
        fakeCard.classList.add('hidden');
        realCard.classList.add('hidden');
        player.classList.remove('hidden', 'ducking');
        headerTitle.classList.remove('hidden'); // 게임 시작 시 상단 제목 노출

        if (animationId) cancelAnimationFrame(animationId);
        gameLoop();
        startStalkerTalk(); // 음침한 말 시작
    }

    function startStalkerTalk() {
        if (!gameActive) return;

        const showTalk = () => {
            if (!gameActive) return;
            girlBubble.textContent = stalkerQuotes[Math.floor(Math.random() * stalkerQuotes.length)];
            girlBubble.style.opacity = 1;

            setTimeout(() => {
                girlBubble.style.opacity = 0;
                // 말풍선 대사 빈도 극대화: 사라지자마자 거의 바로 다음 대사 출력
                if (gameActive) setTimeout(showTalk, 100 + Math.random() * 500);
            }, 1000); // 노출 시간도 1초로 단축하여 회전율 극대화
        };

        setTimeout(showTalk, 1000);
    }

    function gameLoop(timestamp) {
        if (!gameActive) return;

        updatePlayer();
        updateObstacles(timestamp);
        updateMinimap();

        if (distance >= targetDistance) {
            winGame();
            return;
        }

        animationId = requestAnimationFrame(gameLoop);
    }

    function updatePlayer() {
        if (!isDucking) {
            pvy += gravity;
            py -= pvy;

            if (py <= 0) {
                py = 0;
                pvy = 0;
                isJumping = false;
            }
        } else {
            py = 0; // 숙일 때는 바닥에 고정
        }

        let transform = `scaleX(-1) translateY(${-py}px)`;
        if (isDucking) {
            transform += ` scaleY(0.5)`;
        }
        player.style.transform = transform;

        // 애니메이션 효과
        if (!isJumping && !isDucking) {
            const tilt = Math.sin(Date.now() / 60) * 5;
            player.style.transform += ` rotate(${tilt}deg)`;
        }
    }

    function updateObstacles(timestamp) {
        distance += distSpeed;

        if (timestamp - lastObstacleTime > obstacleInterval + Math.random() * 1000) {
            createObstacle();
            lastObstacleTime = timestamp;
        }

        const playerRect = player.getBoundingClientRect();
        const pBox = {
            left: playerRect.left + 15,
            right: playerRect.right - 15,
            top: playerRect.top + (isDucking ? 45 : 20),
            bottom: playerRect.bottom - 5
        };

        for (let i = obstacles.length - 1; i >= 0; i--) {
            const obs = obstacles[i];
            obs.x -= gameSpeed;
            obs.el.style.left = `${obs.x}px`;

            const obsContent = obs.el.querySelector('div');
            const obsRect = obsContent.getBoundingClientRect();

            const oBox = {
                left: obsRect.left + 15,
                right: obsRect.right - 15,
                top: obsRect.top + 15,
                bottom: obsRect.bottom - 10
            };

            if (isColliding(pBox, oBox)) {
                gameOver();
                return;
            }

            if (obs.x < -200) {
                obs.el.remove();
                obstacles.splice(i, 1);
            }
        }
    }

    function createObstacle() {
        const el = document.createElement('div');
        el.className = 'obstacle char-box';

        const isPlane = Math.random() > 0.4;
        if (isPlane) {
            el.innerHTML = '<div class="plane-main">✈️</div>';
            el.dataset.type = 'plane';
        } else {
            el.innerHTML = '<div class="stone-main">🪨</div>';
            el.dataset.type = 'stone';
        }

        const rect = gameArea.getBoundingClientRect();
        const obs = {
            el: el,
            x: rect.width + 100
        };

        el.style.left = `${obs.x}px`;
        gameArea.appendChild(el);
        obstacles.push(obs);
    }

    function updateMinimap() {
        const totalDist = targetDistance;
        const width = gameArea.offsetWidth - 100;

        const dinoPos = 40 + (distance / totalDist) * width;
        mapDino.style.left = `${dinoPos}px`;

        const girlPos = Math.max(40, dinoPos - 80 + Math.sin(Date.now() / 400) * 15);
        mapGirl.style.left = `${girlPos}px`;

        distRemain.textContent = Math.max(0, totalDist - Math.floor(distance));
    }

    function isColliding(a, b) {
        return !(a.right < b.left || a.left > b.right || a.bottom < b.top || a.top > b.bottom);
    }

    function gameOver() {
        gameActive = false;
        player.classList.add('hidden');
        overScreen.classList.remove('hidden');
        obstacles.forEach(obs => obs.el.remove());
        obstacles = [];
    }

    function winGame() {
        gameActive = false;
        player.classList.add('hidden');
        winScreen.classList.remove('hidden');
        obstacles.forEach(obs => obs.el.remove());
        obstacles = [];
        confetti({
            particleCount: 150,
            spread: 100,
            origin: { y: 0.6 }
        });
    }
});
