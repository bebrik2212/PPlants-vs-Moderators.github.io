const IMAGES = {
    sunflower: 'https://fortport.ru/photo/55463',
    peashooter: 'https://fortport.ru/photo/55462',
    zombie: 'https://fortport.ru/photo/4059',
    projectile: 'https://foni.papik.pro/uploads/posts/2024-09/foni-papik-pro-7vtu-p-kartinki-krug-zelenii-na-prozrachnom-fone-13.png',
    mower: 'https://static.wikia.nocookie.net/plantsvs-zombies/images/1/18/Machine.png/revision/latest/scale-to-width-down/250?cb=20200506143358&path-prefix=ru',
    sun: 'https://cdn-icons-png.flaticon.com/512/2720/2720081.png',
    grass1: 'https://fortport.ru/photo/51017',
    grass2: 'https://fortport.ru/photo/51016'
};

const AUDIO_FILES = {
    background: 'plants_vs_zombies_04 - Grasswalk.mp3',
    sunPickup: 'plants-vs-zombies-sun-pickup.mp3',
    seedPacket: 'plants-vs-zombies-seed-packet-sound.mp3',
    planting: 'plants-vs-zombies-planting-sound.mp3',
    hit: 'plants-vs-zombies-hit.mp3',
    chomp: 'chomp.mp3',
    chomp2: 'chomp2.mp3'
};

class AudioManager {
    constructor() {
        this.sounds = {};
        this.backgroundMusic = null;
        this.initAudio();
    }

    initAudio() {
        for (const [key, file] of Object.entries(AUDIO_FILES)) {
            const audio = new Audio(file);
            audio.preload = 'auto';
            this.sounds[key] = audio;
        }

        this.backgroundMusic = this.sounds.background;
        this.backgroundMusic.loop = true;
        this.backgroundMusic.volume = 0.3;
    }

    playBackground() {
        this.backgroundMusic.play().catch(() => {
            document.addEventListener('click', () => {
                this.backgroundMusic.play();
            }, { once: true });
        });
    }

    playSound(soundKey) {
        const sound = this.sounds[soundKey];
        if (sound) {
            sound.currentTime = 0;
            sound.play().catch(() => {});
        }
    }

    playChomp() {
        const sounds = [this.sounds.chomp, this.sounds.chomp2];
        const randomSound = sounds[Math.floor(Math.random() * sounds.length)];
        if (randomSound) {
            randomSound.currentTime = 0;
            randomSound.play().catch(() => {});
        }
    }
}

class Game {
    constructor() {
        this.sunCount = 150;
        this.selectedPlant = null;
        this.gameRunning = true;
        this.rows = 5;
        this.cols = 9;
        this.plants = [];
        this.zombies = [];
        this.projectiles = [];
        this.mowers = [];
        this.suns = [];
        this.intervals = [];
        this.timeouts = [];
        this.zombieCounter = 0;
        this.waveNumber = 1;
        this.audioManager = new AudioManager();
        this.ghostPlant = document.getElementById('ghostPlant');
        this.cellWidth = 0;
        this.cellHeight = 0;
        this.gameStartTime = Date.now();

        this.init();
    }

    init() {
        this.createLawn();
        this.createMowers();
        this.bindEvents();
        this.startGame();
        this.audioManager.playBackground();
    }

    createLawn() {
        const lawn = document.getElementById('lawn');
        lawn.innerHTML = '';

        for (let r = 0; r < this.rows; r++) {
            this.plants[r] = [];
            const row = document.createElement('div');
            row.className = 'row';
            row.dataset.row = r;

            for (let c = 0; c < this.cols; c++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = r;
                cell.dataset.col = c;
                
                if ((r + c) % 2 === 0) {
                    cell.style.backgroundImage = `url('${IMAGES.grass1}')`;
                } else {
                    cell.style.backgroundImage = `url('${IMAGES.grass2}')`;
                }
                
                cell.addEventListener('click', (e) => this.onCellClick(e));
                row.appendChild(cell);
                this.plants[r][c] = null;
            }

            lawn.appendChild(row);
        }

        setTimeout(() => {
            const firstCell = document.querySelector('.cell');
            this.cellWidth = firstCell.getBoundingClientRect().width;
            this.cellHeight = firstCell.getBoundingClientRect().height;
        }, 100);
    }

    createMowers() {
        this.mowers = [];
        const rows = document.querySelectorAll('.row');
        rows.forEach((row, index) => {
            const mower = document.createElement('img');
            mower.src = IMAGES.mower;
            mower.className = 'mower';
            mower.style.left = '-35px';
            row.appendChild(mower);
            this.mowers.push({
                row: index,
                element: mower,
                active: false,
                x: -35
            });
        });
    }

    bindEvents() {
        document.getElementById('seedSunflower').addEventListener('click', () => {
            this.audioManager.playSound('seedPacket');
            this.togglePlantSelection('sunflower');
        });

        document.getElementById('seedPeashooter').addEventListener('click', () => {
            this.audioManager.playSound('seedPacket');
            this.togglePlantSelection('peashooter');
        });

        document.addEventListener('mousemove', (e) => {
            if (this.selectedPlant && this.gameRunning) {
                this.ghostPlant.style.display = 'block';
                this.ghostPlant.style.left = e.clientX + 'px';
                this.ghostPlant.style.top = e.clientY + 'px';
            } else {
                this.ghostPlant.style.display = 'none';
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.selectedPlant = null;
                this.updateSeedButtons();
                this.ghostPlant.style.display = 'none';
            }
        });
    }

    togglePlantSelection(type) {
        if (!this.gameRunning) return;
        
        const cost = type === 'sunflower' ? 50 : 100;
        if (this.sunCount < cost) return;

        if (this.selectedPlant === type) {
            this.selectedPlant = null;
            this.ghostPlant.style.display = 'none';
        } else {
            this.selectedPlant = type;
            this.ghostPlant.src = type === 'sunflower' ? IMAGES.sunflower : IMAGES.peashooter;
        }
        this.updateSeedButtons();
    }

    updateSeedButtons() {
        const sunSeed = document.getElementById('seedSunflower');
        const peaSeed = document.getElementById('seedPeashooter');

        sunSeed.classList.toggle('selected', this.selectedPlant === 'sunflower');
        peaSeed.classList.toggle('selected', this.selectedPlant === 'peashooter');
        sunSeed.classList.toggle('disabled', this.sunCount < 50);
        peaSeed.classList.toggle('disabled', this.sunCount < 100);
    }

    onCellClick(e) {
        if (!this.gameRunning || !this.selectedPlant) return;

        const row = parseInt(e.target.dataset.row);
        const col = parseInt(e.target.dataset.col);

        if (this.plants[row][col]) return;

        const cost = this.selectedPlant === 'sunflower' ? 50 : 100;
        if (this.sunCount < cost) return;

        this.sunCount -= cost;
        this.updateSunDisplay();
        this.audioManager.playSound('planting');
        this.plantOnCell(row, col, this.selectedPlant);
        this.selectedPlant = null;
        this.ghostPlant.style.display = 'none';
        this.updateSeedButtons();
    }

    plantOnCell(row, col, type) {
        const cell = document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
        const plant = document.createElement('img');
        plant.src = type === 'sunflower' ? IMAGES.sunflower : IMAGES.peashooter;
        plant.className = 'plant';
        cell.appendChild(plant);
        cell.classList.add('occupied');
        
        const plantData = {
            type: type,
            element: plant,
            lastShot: 0,
            lastSun: Date.now(),
            hp: 100,
            firstSunDelay: type === 'sunflower' ? 5000 + Math.random() * 2000 : 0,
            firstSunDone: false
        };
        
        this.plants[row][col] = plantData;
    }

    updateSunDisplay() {
        document.getElementById('sunCount').textContent = this.sunCount;
        this.updateSeedButtons();
    }

    flashElement(element, className, duration = 300) {
        if (!element) return;
        element.classList.add(className);
        setTimeout(() => {
            element.classList.remove(className);
        }, duration);
    }

    spawnSun() {
        if (!this.gameRunning) return;

        const row = Math.floor(Math.random() * this.rows);
        const col = Math.floor(Math.random() * (this.cols - 1));
        const sun = document.createElement('img');
        sun.src = IMAGES.sun;
        sun.className = 'sun';
        const rowElement = document.querySelector(`.row[data-row="${row}"]`);
        const cellWidth = this.cellWidth;
        sun.style.left = `${col * cellWidth + cellWidth / 2 - 20}px`;
        sun.style.top = '-50px';
        
        rowElement.appendChild(sun);
        this.suns.push(sun);

        let y = -50;
        const fallInterval = setInterval(() => {
            if (!this.gameRunning) {
                clearInterval(fallInterval);
                return;
            }
            y += 3;
            sun.style.top = `${y}px`;
            
            if (y >= this.cellHeight - 45) {
                clearInterval(fallInterval);
                sun.style.cursor = 'pointer';
                sun.addEventListener('click', () => this.collectSun(sun));
                
                setTimeout(() => {
                    if (sun.parentNode) {
                        sun.remove();
                        const index = this.suns.indexOf(sun);
                        if (index > -1) {
                            this.suns.splice(index, 1);
                        }
                    }
                }, 10000);
            }
        }, 30);
        this.intervals.push(fallInterval);
    }

    spawnSunFromPlant(row, col) {
        if (!this.gameRunning) return;

        const plantData = this.plants[row][col];
        if (plantData && plantData.element) {
            this.flashElement(plantData.element, 'sun-flash', 3000);
        }

        const sun = document.createElement('img');
        sun.src = IMAGES.sun;
        sun.className = 'sun';
        const rowElement = document.querySelector(`.row[data-row="${row}"]`);
        const cellWidth = this.cellWidth;
        sun.style.left = `${col * cellWidth + cellWidth / 2 - 20}px`;
        sun.style.top = `${row * this.cellHeight + this.cellHeight / 2 - 20}px`;
        
        rowElement.appendChild(sun);
        this.suns.push(sun);
        
        sun.style.cursor = 'pointer';
        sun.addEventListener('click', () => this.collectSun(sun));
        
        setTimeout(() => {
            if (sun.parentNode) {
                sun.remove();
                const index = this.suns.indexOf(sun);
                if (index > -1) {
                    this.suns.splice(index, 1);
                }
            }
        }, 10000);
    }

    collectSun(sunElement) {
        if (!this.gameRunning || !sunElement.parentNode) return;

        this.sunCount += 25;
        this.updateSunDisplay();
        this.audioManager.playSound('sunPickup');
        sunElement.remove();
        
        const index = this.suns.indexOf(sunElement);
        if (index > -1) {
            this.suns.splice(index, 1);
        }
    }

    spawnZombie() {
        if (!this.gameRunning) return;

        this.zombieCounter++;
        const row = Math.floor(Math.random() * this.rows);
        const zombie = document.createElement('img');
        zombie.src = IMAGES.zombie;
        zombie.className = 'zombie';
        
        const rowElement = document.querySelector(`.row[data-row="${row}"]`);
        const rowWidth = rowElement.getBoundingClientRect().width;
        zombie.style.left = `${rowWidth + 50}px`;
        zombie.style.top = `${this.cellHeight / 2 - (this.cellHeight * 0.75 / 2)}px`;

        rowElement.appendChild(zombie);

        const zombieObj = {
            id: Date.now() + Math.random(),
            row: row,
            x: rowWidth + 50,
            hp: 200,
            element: zombie,
            alive: true,
            speed: 0.7,
            eating: false,
            damageInterval: null,
            eatingPlantCol: -1,
            // Точный хитбокс зомби (в пикселях)
            hitboxWidth: this.cellWidth * 0.65,
            hitboxHeight: this.cellHeight * 0.65
        };

        this.zombies.push(zombieObj);
        this.moveZombie(zombieObj);
    }

    moveZombie(zombie) {
        if (!zombie.alive || !this.gameRunning) return;

        const interval = setInterval(() => {
            if (!zombie.alive || !this.gameRunning) {
                clearInterval(interval);
                return;
            }

            let hasPlant = false;
            // Обновляем размер хитбокса при изменении размера окна
            const hitboxWidth = this.cellWidth * 0.65;
            const hitboxHeight = this.cellHeight * 0.65;
            
            for (let c = 0; c < this.cols; c++) {
                if (this.plants[zombie.row][c]) {
                    const plantX = c * this.cellWidth;
                    const plantCenterX = plantX + this.cellWidth / 2;
                    const zombieCenterX = zombie.x + hitboxWidth / 2;
                    
                    // Проверка пересечения хитбоксов
                    const zombieLeft = zombie.x + (this.cellWidth * 0.75 - hitboxWidth) / 2;
                    const zombieRight = zombieLeft + hitboxWidth;
                    const plantLeft = plantX + (this.cellWidth - this.cellWidth * 0.75) / 2;
                    const plantRight = plantLeft + this.cellWidth * 0.75;
                    
                    if (zombieRight > plantLeft && zombieLeft < plantRight) {
                        hasPlant = true;
                        if (!zombie.eating) {
                            zombie.eating = true;
                            zombie.eatingPlantCol = c;
                            this.startEating(zombie, c);
                        }
                        break;
                    }
                }
            }

            if (!hasPlant) {
                if (zombie.eating) {
                    zombie.eating = false;
                    zombie.eatingPlantCol = -1;
                    if (zombie.damageInterval) {
                        clearInterval(zombie.damageInterval);
                    }
                }
                zombie.x -= zombie.speed;
                zombie.element.style.left = `${zombie.x}px`;
            }

            // Проверка достижения левого края
            if (zombie.x < 60) {
                this.activateMower(zombie.row);
                zombie.alive = false;
                zombie.element.remove();
                const index = this.zombies.indexOf(zombie);
                if (index > -1) {
                    this.zombies.splice(index, 1);
                }
                clearInterval(interval);
            }
        }, 50);
        this.intervals.push(interval);
    }

    startEating(zombie, plantCol) {
        if (zombie.damageInterval) {
            clearInterval(zombie.damageInterval);
        }
        
        zombie.damageInterval = setInterval(() => {
            if (!zombie.alive || !this.gameRunning) {
                clearInterval(zombie.damageInterval);
                return;
            }
            
            if (this.plants[zombie.row][plantCol]) {
                this.audioManager.playChomp();
                
                const plant = this.plants[zombie.row][plantCol];
                plant.hp -= 25;
                
                this.flashElement(plant.element, 'flash-white', 300);
                
                if (plant.hp <= 0) {
                    plant.element.remove();
                    this.plants[zombie.row][plantCol] = null;
                    document.querySelector(`.cell[data-row="${zombie.row}"][data-col="${plantCol}"]`).classList.remove('occupied');
                    zombie.eating = false;
                    zombie.eatingPlantCol = -1;
                    clearInterval(zombie.damageInterval);
                }
            } else {
                zombie.eating = false;
                zombie.eatingPlantCol = -1;
                clearInterval(zombie.damageInterval);
            }
        }, 1000);
        
        this.intervals.push(zombie.damageInterval);
    }

    activateMower(row) {
        const mower = this.mowers.find(m => m.row === row);
        if (!mower || mower.active) return;

        mower.active = true;
        let x = -35;
        const interval = setInterval(() => {
            if (!this.gameRunning) {
                clearInterval(interval);
                return;
            }

            x += 10;
            mower.element.style.left = `${x}px`;

            this.zombies.forEach(zombie => {
                if (zombie.row === row && zombie.alive) {
                    const hitboxWidth = this.cellWidth * 0.65;
                    const zombieLeft = zombie.x + (this.cellWidth * 0.75 - hitboxWidth) / 2;
                    const zombieRight = zombieLeft + hitboxWidth;
                    
                    if (x + 40 > zombieLeft && x < zombieRight) {
                        this.flashElement(zombie.element, 'flash-white', 300);
                        zombie.hp -= 200;
                        if (zombie.hp <= 0) {
                            zombie.alive = false;
                            zombie.element.remove();
                            if (zombie.damageInterval) {
                                clearInterval(zombie.damageInterval);
                            }
                        }
                    }
                }
            });

            if (x > window.innerWidth + 100) {
                clearInterval(interval);
                mower.active = false;
                mower.element.style.left = '-35px';
            }
        }, 50);
        this.intervals.push(interval);
    }

    shootProjectile(row, col) {
        if (!this.gameRunning) return;

        const projectile = document.createElement('img');
        projectile.src = IMAGES.projectile;
        projectile.className = 'projectile';
        projectile.style.left = `${col * this.cellWidth + this.cellWidth / 2}px`;
        projectile.style.top = `${this.cellHeight / 2 - 14}px`;

        const rowElement = document.querySelector(`.row[data-row="${row}"]`);
        rowElement.appendChild(projectile);

        const projectileObj = {
            row: row,
            x: col * this.cellWidth + this.cellWidth / 2,
            element: projectile,
            active: true
        };

        this.projectiles.push(projectileObj);

        const interval = setInterval(() => {
            if (!projectileObj.active || !this.gameRunning) {
                clearInterval(interval);
                return;
            }

            projectileObj.x += 8;
            projectileObj.element.style.left = `${projectileObj.x}px`;

            this.zombies.forEach(zombie => {
                if (zombie.row === row && zombie.alive) {
                    const hitboxWidth = this.cellWidth * 0.65;
                    const zombieLeft = zombie.x + (this.cellWidth * 0.75 - hitboxWidth) / 2;
                    const zombieRight = zombieLeft + hitboxWidth;
                    
                    if (projectileObj.x > zombieLeft && projectileObj.x < zombieRight) {
                        zombie.hp -= 20;
                        projectileObj.active = false;
                        projectileObj.element.remove();
                        this.audioManager.playSound('hit');
                        
                        this.flashElement(zombie.element, 'flash-white', 300);
                        
                        if (zombie.hp <= 0) {
                            zombie.alive = false;
                            zombie.element.remove();
                            if (zombie.damageInterval) {
                                clearInterval(zombie.damageInterval);
                            }
                        }
                    }
                }
            });

            if (projectileObj.x > window.innerWidth + 50) {
                projectileObj.active = false;
                projectileObj.element.remove();
                clearInterval(interval);
            }
        }, 30);
        this.intervals.push(interval);
    }

    checkPeashooters() {
        const now = Date.now();
        for (let r = 0; r < this.rows; r++) {
            let hasZombie = this.zombies.some(z => z.row === r && z.alive);
            if (hasZombie) {
                for (let c = 0; c < this.cols; c++) {
                    if (this.plants[r][c] && this.plants[r][c].type === 'peashooter') {
                        if (now - this.plants[r][c].lastShot >= 2000) {
                            this.plants[r][c].lastShot = now;
                            this.shootProjectile(r, c);
                        }
                    }
                }
            }
        }
    }

    checkSunflowers() {
        const now = Date.now();
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                const plant = this.plants[r][c];
                if (plant && plant.type === 'sunflower') {
                    if (!plant.firstSunDone) {
                        if (now - plant.lastSun >= plant.firstSunDelay) {
                            plant.firstSunDone = true;
                            plant.lastSun = now;
                            this.spawnSunFromPlant(r, c);
                        }
                    } else {
                        if (now - plant.lastSun >= 24000) {
                            plant.lastSun = now;
                            this.spawnSunFromPlant(r, c);
                        }
                    }
                }
            }
        }
    }

    startGame() {
        this.gameRunning = true;
        
        const firstZombieDelay = 20000;
        
        const zombieInterval = setInterval(() => {
            if (this.gameRunning) {
                if (Date.now() - this.gameStartTime >= firstZombieDelay) {
                    this.spawnZombie();
                    
                    if (this.zombieCounter % 10 === 0) {
                        this.waveNumber++;
                    }
                }
            }
        }, 8000);
        this.intervals.push(zombieInterval);

        const firstZombie = setTimeout(() => {
            if (this.gameRunning) {
                this.spawnZombie();
            }
        }, firstZombieDelay);
        this.timeouts.push(firstZombie);

        const sunInterval = setInterval(() => {
            if (this.gameRunning) {
                this.spawnSun();
            }
        }, 5000);
        this.intervals.push(sunInterval);

        const gameLoop = setInterval(() => {
            if (!this.gameRunning) return;
            this.checkPeashooters();
            this.checkSunflowers();
        }, 100);
        this.intervals.push(gameLoop);
    }
}

const game = new Game();
