document.addEventListener('DOMContentLoaded', () => {
    // Game canvas setup
    const canvas = document.getElementById('game-board');
    const ctx = canvas.getContext('2d');
    
    // Set canvas size
    canvas.width = 400;
    canvas.height = 400;
    
    // Game variables
    const gridSize = 20;
    const tileCount = canvas.width / gridSize;
    let speed = 10;
    let running = false;
    let gameOver = false;
    
    // Snake properties
    let snake = [
        { x: 10, y: 10 }
    ];
    let dx = 0;
    let dy = 0;
    let pendingDirection = null;
    
    // Food properties
    let food = { x: 5, y: 5 };
    
    // Score tracking
    let score = 0;
    let highScore = localStorage.getItem('snakeHighScore') || 0;
    
    // DOM elements
    const scoreElement = document.getElementById('score');
    const highScoreElement = document.getElementById('high-score');
    const startBtn = document.getElementById('start-btn');
    const resetBtn = document.getElementById('reset-btn');
    const upBtn = document.getElementById('up-btn');
    const downBtn = document.getElementById('down-btn');
    const leftBtn = document.getElementById('left-btn');
    const rightBtn = document.getElementById('right-btn');
    
    // Update the high score display
    highScoreElement.textContent = highScore;
    
    // Game loop
    let gameInterval;
    
    function startGame() {
        if (running) return;
        running = true;
        gameOver = false;
        snake = [{ x: 10, y: 10 }];
        dx = 1;
        dy = 0;
        score = 0;
        scoreElement.textContent = score;
        placeFood();
        gameInterval = setInterval(gameLoop, 1000 / speed);
        startBtn.textContent = "Pause";
    }
    
    function pauseGame() {
        running = false;
        clearInterval(gameInterval);
        startBtn.textContent = "Resume";
    }
    
    function resetGame() {
        pauseGame();
        clearCanvas();
        snake = [{ x: 10, y: 10 }];
        dx = 0;
        dy = 0;
        score = 0;
        scoreElement.textContent = score;
        gameOver = false;
        startBtn.textContent = "Start Game";
    }
    
    function gameLoop() {
        if (gameOver) {
            pauseGame();
            return;
        }
        
        clearCanvas();
        moveSnake();
        checkCollision();
        drawFood();
        drawSnake();
    }
    
    function clearCanvas() {
        ctx.fillStyle = '#151515';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw grid lines
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1;
        
        // Vertical lines
        for (let i = 0; i <= tileCount; i++) {
            ctx.beginPath();
            ctx.moveTo(i * gridSize, 0);
            ctx.lineTo(i * gridSize, canvas.height);
            ctx.stroke();
        }
        
        // Horizontal lines
        for (let i = 0; i <= tileCount; i++) {
            ctx.beginPath();
            ctx.moveTo(0, i * gridSize);
            ctx.lineTo(canvas.width, i * gridSize);
            ctx.stroke();
        }
    }
    
    function moveSnake() {
        // Apply pending direction if it exists
        if (pendingDirection !== null) {
            const [newDx, newDy] = pendingDirection;
            // Prevent 180-degree turns
            if (!(newDx === -dx && newDy === -dy)) {
                dx = newDx;
                dy = newDy;
            }
            pendingDirection = null;
        }
        
        // Create new head
        const head = { x: snake[0].x + dx, y: snake[0].y + dy };
        
        // Add new head to snake
        snake.unshift(head);
        
        // Check if snake ate food
        if (head.x === food.x && head.y === food.y) {
            // Increase score
            score++;
            scoreElement.textContent = score;
            
            // Update high score if needed
            if (score > highScore) {
                highScore = score;
                highScoreElement.textContent = highScore;
                localStorage.setItem('snakeHighScore', highScore);
            }
            
            // Place new food
            placeFood();
            
            // Increase speed slightly after every 3 points
            if (score % 3 === 0) {
                speed += 0.5;
                clearInterval(gameInterval);
                gameInterval = setInterval(gameLoop, 1000 / speed);
            }
        } else {
            // Remove tail if didn't eat food
            snake.pop();
        }
    }
    
    function checkCollision() {
        const head = snake[0];
        
        // Check wall collision
        if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount) {
            gameOver = true;
            showGameOver();
            return;
        }
        
        // Check self collision (start from index 1 to avoid checking head against itself)
        for (let i = 1; i < snake.length; i++) {
            if (head.x === snake[i].x && head.y === snake[i].y) {
                gameOver = true;
                showGameOver();
                return;
            }
        }
    }
    
    function drawSnake() {
        // Draw snake body
        for (let i = 1; i < snake.length; i++) {
            const segment = snake[i];
            const gradient = ctx.createRadialGradient(
                segment.x * gridSize + gridSize / 2, 
                segment.y * gridSize + gridSize / 2, 
                0, 
                segment.x * gridSize + gridSize / 2, 
                segment.y * gridSize + gridSize / 2, 
                gridSize / 2
            );
            gradient.addColorStop(0, '#8e24aa');
            gradient.addColorStop(1, '#6a1b9a');
            
            ctx.fillStyle = gradient;
            ctx.fillRect(segment.x * gridSize, segment.y * gridSize, gridSize, gridSize);
            
            // Add rounded corners
            ctx.strokeStyle = '#9c27b0';
            ctx.lineWidth = 2;
            roundRect(
                ctx, 
                segment.x * gridSize, 
                segment.y * gridSize, 
                gridSize, 
                gridSize, 
                4, 
                false, 
                true
            );
        }
        
        // Draw snake head with different color
        const head = snake[0];
        const headGradient = ctx.createRadialGradient(
            head.x * gridSize + gridSize / 2, 
            head.y * gridSize + gridSize / 2, 
            0, 
            head.x * gridSize + gridSize / 2, 
            head.y * gridSize + gridSize / 2, 
            gridSize / 2
        );
        headGradient.addColorStop(0, '#ba68c8');
        headGradient.addColorStop(1, '#8e24aa');
        
        ctx.fillStyle = headGradient;
        ctx.fillRect(head.x * gridSize, head.y * gridSize, gridSize, gridSize);
        
        // Eyes based on direction
        ctx.fillStyle = 'white';
        const eyeSize = gridSize / 5;
        const eyeOffset = gridSize / 3;
        
        if (dx === 1) { // Moving right
            ctx.beginPath();
            ctx.arc(head.x * gridSize + gridSize - eyeOffset, head.y * gridSize + eyeOffset, eyeSize, 0, Math.PI * 2);
            ctx.arc(head.x * gridSize + gridSize - eyeOffset, head.y * gridSize + gridSize - eyeOffset, eyeSize, 0, Math.PI * 2);
            ctx.fill();
        } else if (dx === -1) { // Moving left
            ctx.beginPath();
            ctx.arc(head.x * gridSize + eyeOffset, head.y * gridSize + eyeOffset, eyeSize, 0, Math.PI * 2);
            ctx.arc(head.x * gridSize + eyeOffset, head.y * gridSize + gridSize - eyeOffset, eyeSize, 0, Math.PI * 2);
            ctx.fill();
        } else if (dy === -1) { // Moving up
            ctx.beginPath();
            ctx.arc(head.x * gridSize + eyeOffset, head.y * gridSize + eyeOffset, eyeSize, 0, Math.PI * 2);
            ctx.arc(head.x * gridSize + gridSize - eyeOffset, head.y * gridSize + eyeOffset, eyeSize, 0, Math.PI * 2);
            ctx.fill();
        } else if (dy === 1) { // Moving down
            ctx.beginPath();
            ctx.arc(head.x * gridSize + eyeOffset, head.y * gridSize + gridSize - eyeOffset, eyeSize, 0, Math.PI * 2);
            ctx.arc(head.x * gridSize + gridSize - eyeOffset, head.y * gridSize + gridSize - eyeOffset, eyeSize, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Add rounded corners to head
        ctx.strokeStyle = '#ba68c8';
        ctx.lineWidth = 2;
        roundRect(
            ctx, 
            head.x * gridSize, 
            head.y * gridSize, 
            gridSize, 
            gridSize, 
            6, 
            false, 
            true
        );
    }
    
    function drawFood() {
        // Create a glowing effect for food
        ctx.shadowColor = 'rgba(255, 0, 0, 0.6)';
        ctx.shadowBlur = 10;
        
        // Draw the food with gradient
        const gradient = ctx.createRadialGradient(
            food.x * gridSize + gridSize / 2, 
            food.y * gridSize + gridSize / 2, 
            1, 
            food.x * gridSize + gridSize / 2, 
            food.y * gridSize + gridSize / 2, 
            gridSize / 2
        );
        gradient.addColorStop(0, '#ff5252');
        gradient.addColorStop(1, '#d32f2f');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(
            food.x * gridSize + gridSize / 2, 
            food.y * gridSize + gridSize / 2, 
            gridSize / 2 - 2, 
            0, 
            Math.PI * 2
        );
        ctx.fill();
        
        // Reset shadow effect
        ctx.shadowBlur = 0;
    }
    
    function showGameOver() {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.font = '36px Arial';
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2 - 20);
        
        ctx.font = '24px Arial';
        ctx.fillText(`Score: ${score}`, canvas.width / 2, canvas.height / 2 + 20);
        
        ctx.font = '18px Arial';
        ctx.fillText('Press Reset to play again', canvas.width / 2, canvas.height / 2 + 60);
    }
    
    function placeFood() {
        let validPosition = false;
        
        while (!validPosition) {
            food.x = Math.floor(Math.random() * tileCount);
            food.y = Math.floor(Math.random() * tileCount);
            
            // Check if food is placed on snake
            validPosition = true;
            for (const segment of snake) {
                if (food.x === segment.x && food.y === segment.y) {
                    validPosition = false;
                    break;
                }
            }
        }
    }
    
    // Helper function for rounded rectangles
    function roundRect(ctx, x, y, width, height, radius, fill, stroke) {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
        if (stroke) {
            ctx.stroke();
        }
        if (fill) {
            ctx.fill();
        }
    }
    
    // Set up event listeners for keyboard controls
    document.addEventListener('keydown', (e) => {
        if (!running && !gameOver && (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
            startGame();
        }
        
        switch (e.key) {
            case 'ArrowUp':
                if (dy !== 1) { // Prevent moving in opposite direction (down)
                    pendingDirection = [0, -1];
                }
                e.preventDefault();
                break;
            case 'ArrowDown':
                if (dy !== -1) { // Prevent moving in opposite direction (up)
                    pendingDirection = [0, 1];
                }
                e.preventDefault();
                break;
            case 'ArrowLeft':
                if (dx !== 1) { // Prevent moving in opposite direction (right)
                    pendingDirection = [-1, 0];
                }
                e.preventDefault();
                break;
            case 'ArrowRight':
                if (dx !== -1) { // Prevent moving in opposite direction (left)
                    pendingDirection = [1, 0];
                }
                e.preventDefault();
                break;
            case ' ': // Space bar to pause/resume
                if (running) {
                    pauseGame();
                } else if (!gameOver) {
                    startGame();
                }
                e.preventDefault();
                break;
            case 'r': // R key to reset
                resetGame();
                e.preventDefault();
                break;
        }
    });
    
    // Set up button event listeners
    startBtn.addEventListener('click', () => {
        if (running) {
            pauseGame();
        } else if (!gameOver) {
            startGame();
        }
    });
    
    resetBtn.addEventListener('click', resetGame);
    
    // Mobile control buttons
    upBtn.addEventListener('click', () => {
        if (dy !== 1) pendingDirection = [0, -1];
        if (!running && !gameOver) startGame();
    });
    
    downBtn.addEventListener('click', () => {
        if (dy !== -1) pendingDirection = [0, 1];
        if (!running && !gameOver) startGame();
    });
    
    leftBtn.addEventListener('click', () => {
        if (dx !== 1) pendingDirection = [-1, 0];
        if (!running && !gameOver) startGame();
    });
    
    rightBtn.addEventListener('click', () => {
        if (dx !== -1) pendingDirection = [1, 0];
        if (!running && !gameOver) startGame();
    });
    
    // Mobile touch swipe controls
    let touchStartX = 0;
    let touchStartY = 0;
    
    canvas.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
        touchStartY = e.changedTouches[0].screenY;
        e.preventDefault();
    }, { passive: false });
    
    canvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
    }, { passive: false });
    
    canvas.addEventListener('touchend', (e) => {
        const touchEndX = e.changedTouches[0].screenX;
        const touchEndY = e.changedTouches[0].screenY;
        
        const diffX = touchEndX - touchStartX;
        const diffY = touchEndY - touchStartY;
        
        // Check if it's a horizontal or vertical swipe
        if (Math.abs(diffX) > Math.abs(diffY)) {
            // Horizontal swipe
            if (diffX > 0) {
                // Right swipe
                if (dx !== -1) pendingDirection = [1, 0];
            } else {
                // Left swipe
                if (dx !== 1) pendingDirection = [-1, 0];
            }
        } else {
            // Vertical swipe
            if (diffY > 0) {
                // Down swipe
                if (dy !== -1) pendingDirection = [0, 1];
            } else {
                // Up swipe
                if (dy !== 1) pendingDirection = [0, -1];
            }
        }
        
        if (!running && !gameOver) startGame();
        e.preventDefault();
    }, { passive: false });
    
    // Initial draw
    clearCanvas();
    
    // Handle window resize
    function handleResize() {
        if (window.innerWidth <= 768) {
            canvas.width = 300;
            canvas.height = 300;
        } else {
            canvas.width = 400;
            canvas.height = 400;
        }
        clearCanvas();
        drawSnake();
        drawFood();
    }
    
    window.addEventListener('resize', handleResize);
    
    // Initial setup
    handleResize();
});