// Game Configuration
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const ROAD_WIDTH = 400;
const LANE_COUNT = 4;
const LANE_WIDTH = ROAD_WIDTH / LANE_COUNT;
const ROAD_LEFT = (CANVAS_WIDTH - ROAD_WIDTH) / 2;

// Car dimensions
const CAR_WIDTH = 50;
const CAR_HEIGHT = 90;

// AI behavior constants
const LANE_SWITCH_COOLDOWN = 60;
const SPAWN_DISTANCE_RANGE = 200;
const DIFFICULTY_INCREMENT = 0.002;

// Game state
let canvas, ctx;
let gameRunning = false;
let score = 0;
let roadOffset = 0;
let roadSpeed = 5;

// Player car
let playerCar = {
    x: ROAD_LEFT + LANE_WIDTH * 1.5 - CAR_WIDTH / 2,
    y: CANVAS_HEIGHT - CAR_HEIGHT - 50,
    width: CAR_WIDTH,
    height: CAR_HEIGHT,
    speed: 0,
    maxSpeed: 8,
    lane: 1,
    color: '#e74c3c'
};

// AI cars array
let aiCars = [];

// Controls state
let keys = {
    ArrowUp: false,
    ArrowDown: false,
    ArrowLeft: false,
    ArrowRight: false
};

// Initialize game
function init() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    
    // Set up event listeners
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    
    document.getElementById('startBtn').addEventListener('click', startGame);
    document.getElementById('restartBtn').addEventListener('click', restartGame);
    
    // Draw initial state
    drawRoad();
}

// Handle key press
function handleKeyDown(e) {
    if (keys.hasOwnProperty(e.key)) {
        keys[e.key] = true;
        e.preventDefault();
    }
}

// Handle key release
function handleKeyUp(e) {
    if (keys.hasOwnProperty(e.key)) {
        keys[e.key] = false;
        e.preventDefault();
    }
}

// Start the game
function startGame() {
    document.getElementById('startOverlay').classList.add('hidden');
    resetGame();
    gameRunning = true;
    gameLoop();
}

// Restart the game
function restartGame() {
    document.getElementById('gameOverlay').classList.add('hidden');
    resetGame();
    gameRunning = true;
    gameLoop();
}

// Reset game state
function resetGame() {
    score = 0;
    roadSpeed = 5;
    roadOffset = 0;
    
    // Reset player position
    playerCar.x = ROAD_LEFT + LANE_WIDTH * 1.5 - CAR_WIDTH / 2;
    playerCar.y = CANVAS_HEIGHT - CAR_HEIGHT - 50;
    playerCar.speed = 0;
    playerCar.lane = 1;
    
    // Initialize AI cars
    initAICars();
    
    updateScoreDisplay();
}

// Initialize AI cars
function initAICars() {
    aiCars = [];
    const colors = ['#3498db', '#2ecc71', '#f39c12'];
    const lanes = [0, 2, 3];
    
    for (let i = 0; i < 3; i++) {
        aiCars.push({
            x: ROAD_LEFT + LANE_WIDTH * (lanes[i] + 0.5) - CAR_WIDTH / 2,
            y: -CAR_HEIGHT - (i * SPAWN_DISTANCE_RANGE),
            width: CAR_WIDTH,
            height: CAR_HEIGHT,
            speed: 2 + Math.random() * 2,
            lane: lanes[i],
            targetLane: lanes[i],
            color: colors[i],
            switchCooldown: 0
        });
    }
}

// Main game loop
function gameLoop() {
    if (!gameRunning) return;
    
    update();
    draw();
    
    requestAnimationFrame(gameLoop);
}

// Update game state
function update() {
    // Update player movement
    updatePlayer();
    
    // Update road scroll
    roadOffset += roadSpeed;
    if (roadOffset >= 100) {
        roadOffset = 0;
    }
    
    // Update AI cars
    updateAICars();
    
    // Check collisions
    if (checkCollisions()) {
        gameOver();
        return;
    }
    
    // Update score
    score += Math.floor(roadSpeed);
    updateScoreDisplay();
    
    // Gradually increase difficulty
    if (score % 1000 < roadSpeed && roadSpeed < 15) {
        roadSpeed += DIFFICULTY_INCREMENT;
    }
}

// Update player car
function updatePlayer() {
    // Vertical movement
    if (keys.ArrowUp) {
        playerCar.speed = Math.min(playerCar.speed + 0.5, playerCar.maxSpeed);
    } else if (keys.ArrowDown) {
        playerCar.speed = Math.max(playerCar.speed - 0.5, -3);
    } else {
        // Gradual deceleration
        if (playerCar.speed > 0) {
            playerCar.speed = Math.max(0, playerCar.speed - 0.1);
        } else if (playerCar.speed < 0) {
            playerCar.speed = Math.min(0, playerCar.speed + 0.1);
        }
    }
    
    // Horizontal movement
    const moveSpeed = 5;
    if (keys.ArrowLeft) {
        playerCar.x -= moveSpeed;
    }
    if (keys.ArrowRight) {
        playerCar.x += moveSpeed;
    }
    
    // Keep player on road
    playerCar.x = Math.max(ROAD_LEFT, Math.min(ROAD_LEFT + ROAD_WIDTH - CAR_WIDTH, playerCar.x));
    
    // Keep player within vertical bounds
    playerCar.y = Math.max(0, Math.min(CANVAS_HEIGHT - CAR_HEIGHT, playerCar.y));
}

// Update AI cars
function updateAICars() {
    aiCars.forEach(car => {
        // Move car down relative to road speed
        car.y += roadSpeed - car.speed + playerCar.speed * 0.5;
        
        // Reduce switch cooldown
        if (car.switchCooldown > 0) {
            car.switchCooldown--;
        }
        
        // Lane switching AI logic
        if (car.switchCooldown === 0 && Math.random() < 0.01) {
            // Random lane change
            const direction = Math.random() < 0.5 ? -1 : 1;
            const newLane = car.lane + direction;
            
            if (newLane >= 0 && newLane < LANE_COUNT) {
                // Check if lane is safe
                const newX = ROAD_LEFT + LANE_WIDTH * (newLane + 0.5) - CAR_WIDTH / 2;
                let laneSafe = true;
                
                // Check for other cars in the target lane
                aiCars.forEach(otherCar => {
                    if (otherCar !== car) {
                        const targetX = ROAD_LEFT + LANE_WIDTH * (newLane + 0.5) - CAR_WIDTH / 2;
                        if (Math.abs(otherCar.y - car.y) < CAR_HEIGHT * 2 && 
                            Math.abs(otherCar.x - targetX) < CAR_WIDTH) {
                            laneSafe = false;
                        }
                    }
                });
                
                // Check if player is in target lane
                const playerLaneX = ROAD_LEFT + LANE_WIDTH * (newLane + 0.5) - CAR_WIDTH / 2;
                if (Math.abs(playerCar.y - car.y) < CAR_HEIGHT * 2.5 &&
                    Math.abs(playerCar.x - playerLaneX) < CAR_WIDTH * 1.5) {
                    laneSafe = false;
                }
                
                if (laneSafe) {
                    car.targetLane = newLane;
                    car.switchCooldown = LANE_SWITCH_COOLDOWN;
                }
            }
        }
        
        // Smooth lane transition
        const targetX = ROAD_LEFT + LANE_WIDTH * (car.targetLane + 0.5) - CAR_WIDTH / 2;
        const dx = targetX - car.x;
        if (Math.abs(dx) > 1) {
            car.x += dx * 0.05;
        } else {
            car.x = targetX;
            car.lane = car.targetLane;
        }
        
        // Reset car if it goes off screen
        if (car.y > CANVAS_HEIGHT + CAR_HEIGHT) {
            car.y = -CAR_HEIGHT - Math.random() * SPAWN_DISTANCE_RANGE;
            car.speed = 2 + Math.random() * 2;
            
            // Pick a random lane
            const availableLanes = [0, 1, 2, 3].filter(l => {
                // Avoid player's current lane position
                const laneX = ROAD_LEFT + LANE_WIDTH * (l + 0.5) - CAR_WIDTH / 2;
                return Math.abs(playerCar.x - laneX) > CAR_WIDTH;
            });
            
            const newLane = availableLanes.length > 0 
                ? availableLanes[Math.floor(Math.random() * availableLanes.length)]
                : Math.floor(Math.random() * LANE_COUNT);
            
            car.lane = newLane;
            car.targetLane = newLane;
            car.x = ROAD_LEFT + LANE_WIDTH * (newLane + 0.5) - CAR_WIDTH / 2;
        }
        
        // Reset car if it goes off top of screen
        if (car.y < -CAR_HEIGHT * 3) {
            car.y = CANVAS_HEIGHT + Math.random() * SPAWN_DISTANCE_RANGE;
        }
    });
}

// Check for collisions
function checkCollisions() {
    for (let car of aiCars) {
        if (isColliding(playerCar, car)) {
            return true;
        }
    }
    return false;
}

// AABB collision detection
function isColliding(rect1, rect2) {
    // Add small padding for more forgiving collision
    const padding = 5;
    return rect1.x + padding < rect2.x + rect2.width - padding &&
           rect1.x + rect1.width - padding > rect2.x + padding &&
           rect1.y + padding < rect2.y + rect2.height - padding &&
           rect1.y + rect1.height - padding > rect2.y + padding;
}

// Game over
function gameOver() {
    gameRunning = false;
    document.getElementById('finalScore').textContent = score;
    document.getElementById('gameOverlay').classList.remove('hidden');
}

// Update score display
function updateScoreDisplay() {
    document.getElementById('score').textContent = score;
}

// Draw everything
function draw() {
    // Clear canvas
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // Draw grass background
    drawGrass();
    
    // Draw road
    drawRoad();
    
    // Draw road markings
    drawRoadMarkings();
    
    // Draw AI cars
    aiCars.forEach(car => drawCar(car));
    
    // Draw player car
    drawCar(playerCar, true);
}

// Draw grass areas
function drawGrass() {
    // Left grass
    const grassGradientLeft = ctx.createLinearGradient(0, 0, ROAD_LEFT, 0);
    grassGradientLeft.addColorStop(0, '#27ae60');
    grassGradientLeft.addColorStop(1, '#2ecc71');
    ctx.fillStyle = grassGradientLeft;
    ctx.fillRect(0, 0, ROAD_LEFT, CANVAS_HEIGHT);
    
    // Right grass
    const grassGradientRight = ctx.createLinearGradient(ROAD_LEFT + ROAD_WIDTH, 0, CANVAS_WIDTH, 0);
    grassGradientRight.addColorStop(0, '#2ecc71');
    grassGradientRight.addColorStop(1, '#27ae60');
    ctx.fillStyle = grassGradientRight;
    ctx.fillRect(ROAD_LEFT + ROAD_WIDTH, 0, CANVAS_WIDTH - ROAD_LEFT - ROAD_WIDTH, CANVAS_HEIGHT);
    
    // Add some grass texture (simple lines)
    ctx.strokeStyle = '#229954';
    ctx.lineWidth = 2;
    for (let y = (roadOffset % 30) - 30; y < CANVAS_HEIGHT; y += 30) {
        for (let x = 10; x < ROAD_LEFT - 10; x += 20) {
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x + 5, y - 10);
            ctx.stroke();
        }
        for (let x = ROAD_LEFT + ROAD_WIDTH + 10; x < CANVAS_WIDTH - 10; x += 20) {
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x + 5, y - 10);
            ctx.stroke();
        }
    }
}

// Draw road
function drawRoad() {
    // Road surface
    const roadGradient = ctx.createLinearGradient(ROAD_LEFT, 0, ROAD_LEFT + ROAD_WIDTH, 0);
    roadGradient.addColorStop(0, '#34495e');
    roadGradient.addColorStop(0.5, '#4a5568');
    roadGradient.addColorStop(1, '#34495e');
    ctx.fillStyle = roadGradient;
    ctx.fillRect(ROAD_LEFT, 0, ROAD_WIDTH, CANVAS_HEIGHT);
    
    // Road borders
    ctx.fillStyle = '#e74c3c';
    ctx.fillRect(ROAD_LEFT - 10, 0, 10, CANVAS_HEIGHT);
    ctx.fillRect(ROAD_LEFT + ROAD_WIDTH, 0, 10, CANVAS_HEIGHT);
    
    // Border stripes (red and white)
    const stripeHeight = 20;
    for (let y = (roadOffset % (stripeHeight * 2)); y < CANVAS_HEIGHT; y += stripeHeight * 2) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(ROAD_LEFT - 10, y, 10, stripeHeight);
        ctx.fillRect(ROAD_LEFT + ROAD_WIDTH, y, 10, stripeHeight);
    }
}

// Draw road markings (lane lines)
function drawRoadMarkings() {
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.setLineDash([40, 30]);
    
    // Draw lane dividers
    for (let i = 1; i < LANE_COUNT; i++) {
        const x = ROAD_LEFT + LANE_WIDTH * i;
        ctx.beginPath();
        ctx.moveTo(x, -roadOffset);
        ctx.lineTo(x, CANVAS_HEIGHT);
        ctx.stroke();
    }
    
    ctx.setLineDash([]);
}

// Draw a car
function drawCar(car, isPlayer = false) {
    const x = car.x;
    const y = car.y;
    const w = car.width;
    const h = car.height;
    
    // Car shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(x + 5, y + 5, w, h);
    
    // Car body
    const carGradient = ctx.createLinearGradient(x, y, x + w, y);
    carGradient.addColorStop(0, car.color);
    carGradient.addColorStop(0.5, lightenColor(car.color, 20));
    carGradient.addColorStop(1, car.color);
    ctx.fillStyle = carGradient;
    
    // Main body rounded rectangle
    roundRect(x, y + h * 0.15, w, h * 0.7, 8);
    ctx.fill();
    
    // Front section
    ctx.fillStyle = car.color;
    roundRect(x + w * 0.1, y, w * 0.8, h * 0.3, 5);
    ctx.fill();
    
    // Rear section
    roundRect(x + w * 0.1, y + h * 0.75, w * 0.8, h * 0.25, 5);
    ctx.fill();
    
    // Windshield
    ctx.fillStyle = '#2c3e50';
    roundRect(x + w * 0.15, y + h * 0.1, w * 0.7, h * 0.2, 3);
    ctx.fill();
    
    // Rear window
    ctx.fillStyle = '#2c3e50';
    roundRect(x + w * 0.2, y + h * 0.7, w * 0.6, h * 0.12, 3);
    ctx.fill();
    
    // Wheels
    ctx.fillStyle = '#1a1a1a';
    // Front left wheel
    ctx.fillRect(x - 3, y + h * 0.15, 6, h * 0.15);
    // Front right wheel
    ctx.fillRect(x + w - 3, y + h * 0.15, 6, h * 0.15);
    // Rear left wheel
    ctx.fillRect(x - 3, y + h * 0.65, 6, h * 0.15);
    // Rear right wheel
    ctx.fillRect(x + w - 3, y + h * 0.65, 6, h * 0.15);
    
    // Headlights
    ctx.fillStyle = '#f1c40f';
    ctx.fillRect(x + w * 0.15, y + 2, w * 0.2, 5);
    ctx.fillRect(x + w * 0.65, y + 2, w * 0.2, 5);
    
    // Taillights
    ctx.fillStyle = '#c0392b';
    ctx.fillRect(x + w * 0.15, y + h - 7, w * 0.2, 5);
    ctx.fillRect(x + w * 0.65, y + h - 7, w * 0.2, 5);
    
    // Player indicator (racing number)
    if (isPlayer) {
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('1', x + w / 2, y + h * 0.55);
    }
}

// Helper function to draw rounded rectangles
function roundRect(x, y, width, height, radius) {
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
}

// Helper function to lighten a hex color
function lightenColor(color, percent) {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    return '#' + (0x1000000 + 
        (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 + 
        (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 + 
        (B < 255 ? (B < 1 ? 0 : B) : 255)
    ).toString(16).slice(1);
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', init);
