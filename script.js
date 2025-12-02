// Game Variables
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreDisplay = document.getElementById('score');
const positionDisplay = document.getElementById('position');

let gameRunning = true;
let score = 0;
let roadOffset = 0;
const roadWidth = canvas.width / 3;
const laneWidth = canvas.width / 4;

// Car Configuration
class Car {
    constructor(x, lane, isPlayer = false) {
        this.x = x;
        this.lane = lane;
        this.y = 50 + lane * 100;
        this.width = 30;
        this.height = 50;
        this.speed = isPlayer ? 0 : (2 + Math.random() * 2);
        this.isPlayer = isPlayer;
        this.color = isPlayer ? '#00FF00' : this.getRandomColor();
    }

    getRandomColor() {
        const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A'];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    update() {
        if (this.isPlayer) {
            this.y = Math.max(20, Math.min(canvas.height - 70, this.y));
        } else {
            // AI lane switching logic
            if (Math.random() < 0.02) {
                this.lane = Math.max(0, Math.min(3, this.lane + (Math.random() > 0.5 ? 1 : -1)));
            }
            this.y = 50 + this.lane * 100;
            this.speed += 0.001;
        }
    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 10;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.shadowColor = 'transparent';

        // Car windows
        ctx.fillStyle = '#87CEEB';
        ctx.fillRect(this.x + 5, this.y + 5, 20, 15);
        ctx.fillRect(this.x + 5, this.y + 25, 20, 15);
    }

    checkCollision(other) {
        return !(this.x + this.width < other.x || 
                 this.x > other.x + other.width ||
                 this.y + this.height < other.y || 
                 this.y > other.y + other.height);
    }
}

// Game Objects
const player = new Car(canvas.width / 2 - 15, 2, true);
const aiCars = [
    new Car(canvas.width / 4 - 15, 0),
    new Car(canvas.width / 2 - 15, 1),
    new Car(3 * canvas.width / 4 - 15, 3)
];

const allCars = [player, ...aiCars];

// Keyboard Controls
const keys = {};
window.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    if (e.key === ' ') {
        e.preventDefault();
        location.reload();
    }
});

window.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

// Update Player Position
function updatePlayer() {
    if (keys['ArrowUp'] || keys['w']) player.y -= 5;
    if (keys['ArrowDown'] || keys['s']) player.y += 5;
    if (keys['ArrowLeft'] || keys['a']) player.x -= 5;
    if (keys['ArrowRight'] || keys['d']) player.x += 5;
}

// Draw Road
function drawRoad() {
    // Road background
    ctx.fillStyle = '#444';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Road surface
    ctx.fillStyle = '#222';
    ctx.fillRect(50, 0, canvas.width - 100, canvas.height);

    // Lane dividers
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 2;
    ctx.setLineDash([20, 10]);
    for (let i = 1; i < 4; i++) {
        const laneX = 50 + i * (canvas.width - 100) / 4;
        ctx.beginPath();
        ctx.moveTo(laneX, (roadOffset % 30));
        ctx.lineTo(laneX, (roadOffset % 30) + canvas.height);
        ctx.stroke();
    }
    ctx.setLineDash([]);

    // Center road lines  
    ctx.strokeStyle = '#FFF';
    ctx.lineWidth = 1;
    ctx.setLineDash([10, 10]);
    ctx.beginPath();
    ctx.moveTo(50, roadOffset % 30);
    ctx.lineTo(50, (roadOffset % 30) + canvas.height);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(canvas.width - 50, roadOffset % 30);
    ctx.lineTo(canvas.width - 50, (roadOffset % 30) + canvas.height);
    ctx.stroke();
    ctx.setLineDash([]);
}

// Check Collisions & Update Positions
function checkCollisions() {
    for (let i = 0; i < aiCars.length; i++) {
        if (player.checkCollision(aiCars[i])) {
            gameRunning = false;
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#FF0000';
            ctx.font = 'bold 40px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('GAME OVER!', canvas.width / 2, canvas.height / 2);
            ctx.font = '20px Arial';
            ctx.fillText('Final Score: ' + score, canvas.width / 2, canvas.height / 2 + 40);
            ctx.fillText('Press SPACE to restart', canvas.width / 2, canvas.height / 2 + 80);
            return;
        }
    }
}

// Update Position Rankings
function updatePositions() {
    const positions = allCars.map((car, index) => ({
        index: index === 0 ? 0 : index,
        distFromTop: car.y
    })).sort((a, b) => a.distFromTop - b.distFromTop);

    for (let i = 0; i < positions.length; i++) {
        if (positions[i].index === 0) {
            positionDisplay.textContent = (i + 1) + 'st';
            break;
        }
    }
}

// Game Loop
function gameLoop() {
    if (gameRunning) {
        // Clear and draw
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawRoad();

        // Update game state
        updatePlayer();
        player.update();
        aiCars.forEach(car => car.update());
        
        roadOffset += 5;
        score += 1;
        scoreDisplay.textContent = score;

        // Check collisions
        checkCollisions();
        updatePositions();

        // Draw cars
        allCars.forEach(car => car.draw());
    }

    requestAnimationFrame(gameLoop);
}

// Start Game
gameLoop();
