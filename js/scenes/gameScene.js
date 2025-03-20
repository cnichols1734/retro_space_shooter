class GameScene extends Phaser.Scene {
    constructor() {
        super({key: 'GameScene'});
    }

    init() {
        // Reset game state
        window.GAME.score = 0;
        this.enemySpeed = window.GAME.ENEMY_SPEED;
        this.enemySpawnDelay = window.GAME.ENEMY_SPAWN_DELAY;
        this.isGameOver = false;
        this.difficultyLevel = 1;
        this.maxEnemies = 5; // Initial limit
        this.enemiesPerWave = 1; // Start with single enemies
        this.bossActive = false; // Track if a boss is active
        this.shipsEscaped = 0; // Track how many ships escaped
    }

    create() {
        // Create scrolling background
        this.background = this.add.tileSprite(0, 0, this.cameras.main.width, this.cameras.main.height, 'background');
        this.background.setOrigin(0, 0);
        
        // Initialize groups
        this.projectiles = this.physics.add.group();
        this.enemies = this.physics.add.group();
        this.enemyProjectiles = this.physics.add.group();
        this.explosions = this.physics.add.group();
        this.powerups = this.physics.add.group();
        
        // Create player
        this.player = new Player(this, this.cameras.main.width / 2, this.cameras.main.height - 100);
        
        // Score text
        this.scoreText = this.add.text(20, 20, 'SCORE: 0', {
            fontFamily: '"Press Start 2P"',
            fontSize: '16px',
            fill: '#FFFFFF'
        });
        
        // Level text
        this.levelText = this.add.text(this.cameras.main.width - 20, 20, 'LEVEL: 1', {
            fontFamily: '"Press Start 2P"',
            fontSize: '16px',
            fill: '#FFFFFF'
        }).setOrigin(1, 0);
        
        // Escaped ships counter
        this.escapedText = this.add.text(this.cameras.main.width - 20, 50, 'ESCAPED: 0', {
            fontFamily: '"Press Start 2P"',
            fontSize: '16px',
            fill: '#FF5555'
        }).setOrigin(1, 0);
        
        // Setup collisions between projectiles and enemies
        this.physics.add.collider(this.projectiles, this.enemies, this.hitEnemy, null, this);
        
        // Setup collisions between enemy projectiles and player
        this.physics.add.collider(this.enemyProjectiles, this.player, this.hitPlayerWithProjectile, null, this);
        
        // Setup collisions between player and enemies
        this.physics.add.collider(this.player, this.enemies, this.hitPlayer, null, this);
        
        // Setup collisions between player and powerups
        this.physics.add.collider(this.player, this.powerups, this.collectPowerup, null, this);
        
        // Setup input
        this.cursors = this.input.keyboard.createCursorKeys();
        this.wasd = this.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D,
            fire: Phaser.Input.Keyboard.KeyCodes.SPACE
        });
        
        // Click/tap to fire
        this.input.on('pointerdown', () => {
            if (!this.isGameOver) {
                this.player.fire();
            }
        });

        // Enemy spawning timer
        this.enemyTimer = this.time.addEvent({
            delay: this.enemySpawnDelay,
            callback: this.spawnEnemyWave,
            callbackScope: this,
            loop: true
        });
        
        // Increase difficulty timer
        this.difficultyTimer = this.time.addEvent({
            delay: window.GAME.DIFFICULTY_INCREASE_TIME,
            callback: this.increaseDifficulty,
            callbackScope: this,
            loop: true
        });
        
        // Background music
        this.music = this.sound.add('music', {
            volume: window.GAME.MUSIC_VOLUME,
            loop: true
        });
        this.music.play();
        
        // Particle emitter for stars
        this.particles = this.add.particles('particle');
        
        this.particles.createEmitter({
            x: { min: 0, max: this.cameras.main.width },
            y: -10,
            lifespan: 6000,
            speedY: { min: 30, max: 100 },
            scale: { start: 0.1, end: 0 },
            quantity: 1,
            blendMode: 'ADD',
            frequency: 500
        });
    }

    update() {
        if (this.isGameOver) return;
        
        // Update player
        this.player.update(this.cursors, this.wasd);
        
        // Scroll background (changed from += to -= for correct direction)
        this.background.tilePositionY -= 2;
        
        // Update score text
        this.scoreText.setText(`SCORE: ${window.GAME.score}`);
        
        // Update level text
        this.levelText.setText(`LEVEL: ${this.difficultyLevel}`);
        
        // Update escaped ships text - show only the count, not max escapes
        this.escapedText.setText(`ESCAPED: ${this.shipsEscaped}`);
        
        // No more game over condition for escapes - just penalty on score
    }

    spawnEnemyWave() {
        if (this.isGameOver) return;
        
        // Don't spawn more enemies than the maximum allowed
        if (this.enemies.getChildren().length >= this.maxEnemies) return;
        
        // Spawn boss enemy every 5 levels (if none active)
        if (this.difficultyLevel % 5 === 0 && this.difficultyLevel > 0 && !this.bossActive) {
            this.spawnBossEnemy();
            return;
        }
        
        // Determine how many enemies to spawn this wave
        // More controlled spawning - keep it manageable
        const waveSizeRoll = Math.random();
        let waveSize = 1; // Default minimum
        
        if (this.difficultyLevel <= 3) {
            // Early levels: mostly single enemies
            waveSize = 1;
        } else if (this.difficultyLevel <= 6) {
            // Medium levels: 1-2 enemies
            waveSize = waveSizeRoll < 0.7 ? 1 : 2;
        } else if (this.difficultyLevel <= 10) {
            // Harder levels: 1-3 enemies
            waveSize = waveSizeRoll < 0.5 ? 1 : (waveSizeRoll < 0.8 ? 2 : 3);
        } else {
            // Very hard levels: 2-4 enemies
            waveSize = waveSizeRoll < 0.4 ? 2 : (waveSizeRoll < 0.7 ? 3 : 4);
        }
        
        // Cap at max enemies per wave
        waveSize = Math.min(waveSize, this.enemiesPerWave);
        
        // Spawn multiple enemies based on calculated wave size
        for (let i = 0; i < waveSize; i++) {
            // Add a little delay between enemies in the same wave
            this.time.delayedCall(i * 200, () => {
                this.spawnEnemy();
            });
        }
    }

    spawnEnemy() {
        if (this.isGameOver) return;
        
        // Random x position
        const x = Phaser.Math.Between(50, this.cameras.main.width - 50);
        
        // Randomize speed a bit to make it less predictable
        const speedVariation = Phaser.Math.FloatBetween(0.8, 1.2);
        const enemySpeed = this.enemySpeed * speedVariation;
        
        // Create enemy (type determined automatically based on difficulty)
        new Enemy(this, x, -50, enemySpeed);
    }
    
    spawnBossEnemy() {
        if (this.isGameOver) return;
        
        // Set boss as active
        this.bossActive = true;
        
        // Create at center of screen, slightly above
        const x = this.cameras.main.width / 2;
        const y = -80;
        
        // Slower moving boss
        const enemySpeed = this.enemySpeed * 0.6;
        
        // Create boss enemy (type 6-8)
        const bossType = Phaser.Math.Between(6, 8);
        const boss = new Enemy(this, x, y, enemySpeed, bossType);
        
        // Announce boss
        const bossText = this.add.text(this.cameras.main.width / 2, this.cameras.main.height / 2, 'WARNING:\nBOSS APPROACHING', {
            fontFamily: '"Press Start 2P"',
            fontSize: '24px',
            align: 'center',
            fill: '#FF0000'
        }).setOrigin(0.5);
        
        // Add warning effect
        bossText.setStroke('#FFFFFF', 5);
        
        // Flash effect
        this.tweens.add({
            targets: bossText,
            alpha: 0,
            duration: 500,
            yoyo: true,
            repeat: 3,
            onComplete: () => {
                bossText.destroy();
            }
        });
        
        // Play warning sound
        this.sound.play('gameover', { volume: window.GAME.FX_VOLUME * 0.5 });
        
        // Camera shake effect
        this.cameras.main.shake(500, 0.01);
    }

    increaseDifficulty() {
        // Increase difficulty level
        this.difficultyLevel++;
        
        // Show level up text
        const levelUpText = this.add.text(this.cameras.main.width / 2, this.cameras.main.height / 2 - 50, `LEVEL ${this.difficultyLevel}`, {
            fontFamily: '"Press Start 2P"',
            fontSize: '24px',
            fill: '#FFFF00'
        }).setOrigin(0.5);
        
        // Flash effect and remove
        this.tweens.add({
            targets: levelUpText,
            alpha: { from: 1, to: 0 },
            duration: 2000,
            ease: 'Power2',
            onComplete: () => {
                levelUpText.destroy();
            }
        });
        
        // Play level up sound
        this.sound.play('powerup', { volume: window.GAME.FX_VOLUME });
        
        // Increase enemy speed and spawn rate - more gradual increases
        this.enemySpeed += 20;
        this.enemySpawnDelay = Math.max(500, this.enemySpawnDelay - 50);
        
        // Every 2 levels, increase max enemies slightly
        if (this.difficultyLevel % 2 === 0) {
            this.maxEnemies = Math.min(15, this.maxEnemies + 1);
        }
        
        // Every 3 levels, increase enemies per wave
        if (this.difficultyLevel % 3 === 0) {
            this.enemiesPerWave = Math.min(4, this.enemiesPerWave + 1);
        }
        
        // Update enemy timer
        this.enemyTimer.remove();
        this.enemyTimer = this.time.addEvent({
            delay: this.enemySpawnDelay,
            callback: this.spawnEnemyWave,
            callbackScope: this,
            loop: true
        });
    }

    hitEnemy(projectile, enemy) {
        // Create explosion
        const enemyDestroyed = enemy.takeDamage();
        
        // Play sound
        this.sound.play('explosion', { volume: window.GAME.FX_VOLUME });
        
        // Remove projectile
        projectile.destroy();
        
        // Flash effect
        if (!enemyDestroyed) {
            return;
        }
        
        // If enemy destroyed, create explosion and check for powerup
        this.explode(enemy.x, enemy.y);
        
        // Try to drop a powerup
        enemy.dropPowerup();
        
        // Remove enemy
        enemy.destroy();
        
        // Increase score based on enemy type
        let scoreValue;
        
        if (enemy.enemyType >= 6) {
            // Boss enemy (50 points)
            scoreValue = 50;
        } else if (enemy.enemyType >= 3) {
            // Shooting enemy (20 points)
            scoreValue = 20;
        } else if (enemy.movementPattern === 0) {
            // Basic enemy (10 points)
            scoreValue = 10;
        } else {
            // Fast moving or wave pattern enemy (15 points)
            scoreValue = 15;
        }
        
        window.GAME.score += scoreValue;
        
        // Show score text
        const scoreText = this.add.text(enemy.x, enemy.y, `+${scoreValue}`, {
            fontFamily: '"Press Start 2P"',
            fontSize: '16px',
            fill: '#FFFF00'
        }).setOrigin(0.5);
        
        // Add animation and remove
        this.tweens.add({
            targets: scoreText,
            y: enemy.y - 50,
            alpha: 0,
            duration: 1000,
            onComplete: () => scoreText.destroy()
        });
        
        // If it was a boss, set boss inactive
        if (enemy.enemyType >= 6) {
            this.bossActive = false;
        }
    }
    
    hitPlayerWithProjectile(player, projectile) {
        // Create explosion at projectile
        this.explode(projectile.x, projectile.y);
        
        // Check if player has shield
        const playerHit = player.takeDamage();
        
        // Remove projectile
        projectile.destroy();
        
        // If shield absorbed hit, return
        if (!playerHit) {
            this.sound.play('laser', { volume: window.GAME.FX_VOLUME * 0.5 });
            return;
        }
        
        // Play hit sound
        this.sound.play('explosion', { volume: window.GAME.FX_VOLUME });
        
        // Game over
        this.killPlayer(player);
    }

    hitPlayer(player, enemy) {
        if (this.isGameOver) return;
        
        // Check if player has shield
        const playerHit = player.takeDamage();
        
        // Create explosion at enemy
        this.explode(enemy.x, enemy.y);
        
        // Destroy enemy
        enemy.destroy();
        
        // If shield absorbed hit, return
        if (!playerHit) {
            this.sound.play('explosion', { volume: window.GAME.FX_VOLUME });
            return;
        }
        
        // Handle player death
        this.killPlayer(player);
    }
    
    killPlayer(player) {
        // Create explosion at player position
        this.explode(player.x, player.y);
        
        // Play sound
        this.sound.play('gameover', { volume: window.GAME.FX_VOLUME });
        
        // Stop music
        this.music.stop();
        
        // Set game over
        this.isGameOver = true;
        
        // Hide player
        player.setVisible(false);
        
        // Update high score
        if (window.GAME.score > window.GAME.highScore) {
            window.GAME.highScore = window.GAME.score;
        }
        
        // Go to game over scene after delay
        this.time.delayedCall(2000, () => {
            this.scene.start('GameOverScene', { reason: 'destroyed' });
        });
    }
    
    collectPowerup(player, powerup) {
        // Apply powerup effect
        powerup.applyEffect(player);
        
        // Play sound with variation based on powerup type
        let soundConfig = { volume: window.GAME.FX_VOLUME };
        
        // Add different sound effects for each powerup type
        switch(powerup.powerupType) {
            case 0: // Extra projectile
                soundConfig.detune = -200; // Lower pitch
                break;
            case 1: // Faster firing
                soundConfig.detune = 200; // Higher pitch
                break;
            case 2: // Rapid cooling
                soundConfig.detune = 400; // Even higher pitch
                break;
            case 3: // Shield
                soundConfig.detune = 0; // Normal pitch
                break;
        }
        
        this.sound.play('powerup', soundConfig);
        
        // Show powerup text
        player.showPowerupText(powerup.getTypeText(), '#' + powerup.getColorForType().toString(16));
        
        // Create special effect based on powerup type
        if (powerup.powerupType === 2) { // Cooling system
            // Create cooling wave effect
            const circle = this.add.circle(player.x, player.y, 10, 0x00ff00, 0.5);
            circle.setBlendMode(Phaser.BlendModes.ADD);
            
            // Animate it outward
            this.tweens.add({
                targets: circle,
                radius: 100,
                alpha: 0,
                duration: 500,
                onComplete: () => circle.destroy()
            });
        }
        
        // Create particle burst
        const emitter = this.particles.createEmitter({
            x: player.x,
            y: player.y,
            speed: { min: 50, max: 200 },
            angle: { min: 0, max: 360 },
            scale: { start: 0.5, end: 0 },
            lifespan: 500,
            blendMode: 'ADD',
            tint: powerup.getColorForType(),
            quantity: 20,
            on: false // Start inactive
        });
        
        // Emit once then completely remove after particles expire
        emitter.explode(20, player.x, player.y);
        
        // Remove emitter completely after particles have expired
        this.time.delayedCall(600, () => {
            if (emitter && emitter.manager) {
                emitter.remove();
            }
        });
        
        // Remove powerup
        powerup.destroy();
    }

    explode(x, y) {
        // Create explosion sprite
        const explosion = this.add.sprite(x, y, 'explosion');
        
        // Scale up for effect
        explosion.setScale(2);
        
        // Add glow
        explosion.setBlendMode(Phaser.BlendModes.ADD);
        
        // Create animation timeline
        this.tweens.add({
            targets: explosion,
            alpha: 0,
            scale: 3,
            duration: 300,
            onComplete: () => {
                explosion.destroy();
            }
        });
        
        // Particle burst
        const emitter = this.particles.createEmitter({
            x: x,
            y: y,
            speed: { min: 50, max: 200 },
            angle: { min: 0, max: 360 },
            scale: { start: 0.5, end: 0 },
            lifespan: 500,
            blendMode: 'ADD',
            quantity: 20,
            on: false // Start inactive
        });
        
        // Emit once then immediately stop and remove
        emitter.explode(20, x, y);
        
        // Remove emitter completely after particles have expired
        this.time.delayedCall(600, () => {
            if (emitter && emitter.manager) {
                emitter.remove();
            }
        });
    }
} 