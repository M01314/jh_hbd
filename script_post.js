document.addEventListener('DOMContentLoaded', () => {
    const giftTrigger = document.getElementById('gift-trigger');
    const messageContainer = document.getElementById('message-container');

    giftTrigger.addEventListener('click', () => {
        // 1. 축하 폭죽 효과 (Confetti)
        fireworks();

        // 2. 메시지 카드 표시
        if (messageContainer.classList.contains('hidden')) {
            messageContainer.classList.remove('hidden');

            // 스무스 스크롤
            setTimeout(() => {
                messageContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);

            // 선물 상자 효과 변경
            giftTrigger.querySelector('.gift-icon').textContent = '💖';
            giftTrigger.querySelector('.gift-hint').textContent = '생일 정말 축하해!';
        }
    });
});

function fireworks() {
    const duration = 5 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    function randomInRange(min, max) {
        return Math.random() * (max - min) + min;
    }

    const interval = setInterval(function () {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
            return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        // since particles fall down, start a bit higher than random
        confetti(Object.assign({}, defaults, {
            particleCount,
            origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
        }));
        confetti(Object.assign({}, defaults, {
            particleCount,
            origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
        }));
    }, 250);

    // 한 번에 크게 터지는 효과
    confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#8e2de2', '#4a00e0', '#ff007a', '#ff8a00', '#ffffff']
    });
}
