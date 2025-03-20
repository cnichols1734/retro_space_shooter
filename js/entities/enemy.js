class Enemy extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, speed, type = -1) {
        super(scene, x, y, 'enemy');
        
        // Store scene reference
        this.gameScene = scene;
        
        // Add to scene and enable physics
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        // Add to enemies group
        scene.enemies.add(this);
        
        // Enemy type override or random (-1 for random)
        this.enemyType = type >= 0 ? type : this.getRandomEnemyType(scene.difficultyLevel);
        
        // Set movement pattern based on enemy type 
        this.movementPattern = this.enemyType % 3; // 0-2 movement patterns
        
        // Determine if this enemy can shoot based on type and random chance
        this.canShoot = this.enemyType >= 3; // Types 3-5 can shoot
        this.fireDelay = Phaser.Math.Between(2000, 4000); // Random time between shots
        this.lastFired = 0;
        
        // Set health based on enemy type
        this.health = this.enemyType >= 6 ? 3 : 1; // Boss enemies have 3 health
        
        // Set size based on type
        const scale = this.enemyType >= 6 ? 2.5 : 1.5;
        this.setScale(scale);
        
        // Set physics properties
        this.setVelocityY(speed);
        
        // Add horizontal velocity for some enemies
        if (this.movementPattern === 1) {
            // Sine wave movement (horizontal oscillation)
            this.baseSpeed = speed;
            this.oscillationAmplitude = Phaser.Math.Between(50, 150);
            this.oscillationFrequency = Phaser.Math.FloatBetween(0.001, 0.003);
            this.initialX = x;
        } else if (this.movementPattern === 2) {
            // Add some sideways movement
            const direction = Phaser.Math.Between(0, 1) ? 1 : -1;
            this.setVelocityX(direction * speed * 0.5);
        }
        
        this.setSize(40, 40);
        
        // Color tint based on enemy type
        this.applyTint();
        
        // Add slight random rotation
        this.rotation = Phaser.Math.FloatBetween(-0.1, 0.1);
        
        // Add engine particles
        this.engineEmitter = scene.add.particles('particle').createEmitter({
            x: this.x,
            y: this.y - 20,
            speed: { min: 50, max: 100 },
            angle: { min: 260, max: 280 },
            scale: { start: 0.3, end: 0 },
            lifespan: { min: 300, max: 500 },
            blendMode: 'ADD',
            frequency: 20,
            tint: this.getTintColor()
        });

        // Store game height for off-screen checking
        this.gameHeight = scene.sys.game.config.height;
        this.gameWidth = scene.sys.game.config.width;
        
        // Destroy when off screen
        this.checkDestroy = scene.time.addEvent({
            delay: 100,
            callback: this.checkIfOffScreen,
            callbackScope: this,
            loop: true
        });
        
        // Flag to prevent multiple cleanups
        this.isBeingDestroyed = false;
        
        // Track time for sine movement
        this.timeAlive = 0;
        
        // Show health indicator for boss enemies
        if (this.health > 1) {
            this.healthBar = scene.add.rectangle(x, y - 25, 40, 5, 0x00ff00);
            this.healthBar.setOrigin(0.5);
        }
        
        // Setup shooting timer for shooting enemies
        if (this.canShoot) {
            scene.time.addEvent({
                delay: this.fireDelay,
                callback: this.fireProjectile,
                callbackScope: this,
                loop: true
            });
        }
    }
    
    // Determine random enemy type based on current difficulty level
    getRandomEnemyType(difficultyLevel) {
        // Types:
        // 0-2: Basic enemies with different movement patterns
        // 3-5: Shooting enemies with different movement patterns
        // 6-8: Boss enemies with different movement patterns (more health)
        
        const maxType = Math.min(8, Math.floor(difficultyLevel / 2) + 2);
        
        // Rarity: common enemies more frequent than shooting, boss enemies rare
        const rand = Math.random() * 100;
        
        if (difficultyLevel >= 5 && rand < 5) {
            // 5% chance for boss enemy if difficulty level >= 5
            return Phaser.Math.Between(6, Math.min(8, maxType));
        } else if (difficultyLevel >= 3 && rand < 20) {
            // 20% chance for shooting enemy if difficulty level >= 3
            return Phaser.Math.Between(3, Math.min(5, maxType));
        } else {
            // Regular enemy
            return Phaser.Math.Between(0, Math.min(2, maxType));
        }
    }
    
    // Get tint color based on enemy type
    getTintColor() {
        if (this.enemyType >= 6) {
            // Boss enemies
            return 0xff0000; // Red
        } else if (this.enemyType >= 3) {
            // Shooting enemies
            return 0x00ff00; // Green
        } else {
            // Basic enemies based on movement pattern
            return this.movementPattern === 0 ? 0xff5555 : 
                  this.movementPattern === 1 ? 0xffaa55 : 0xff55ff;
        }
    }
    
    // Apply tint color
    applyTint() {
        if (this.enemyType >= 6) {
            // Boss enemies
            this.setTint(0xff0000); // Red
        } else if (this.enemyType >= 3) {
            // Shooting enemies
            this.setTint(0x00ff00); // Green
        } else if (this.movementPattern === 1) {
            this.setTint(0xffaa00); // Orange for sine wave
        } else if (this.movementPattern === 2) {
            this.setTint(0xff00ff); // Purple for diagonal
        }
    }

    preUpdate(time, delta) {
        super.preUpdate(time, delta);
        
        this.timeAlive += delta;
        
        // Update engine particles position
        if (this.engineEmitter && this.engineEmitter.manager) {
            this.engineEmitter.setPosition(this.x, this.y - 20);
        }
        
        // Update health bar position
        if (this.healthBar) {
            this.healthBar.x = this.x;
            this.healthBar.y = this.y - 25;
        }
        
        // Apply movement pattern
        if (this.movementPattern === 0) {
            // Basic movement, add slight oscillation
            this.x += Math.sin(time / 500) * 0.5;
        } else if (this.movementPattern === 1) {
            // Sine wave movement
            this.x = this.initialX + Math.sin(this.timeAlive * this.oscillationFrequency) * this.oscillationAmplitude;
        } else if (this.movementPattern === 2) {
            // Diagonal movement, bounce off walls
            if (this.x <= 30 || this.x >= this.gameWidth - 30) {
                this.body.velocity.x *= -1;
            }
        }
    }
    
    // Fire projectile at player
    fireProjectile() {
        if (this.isBeingDestroyed || !this.active || !this.gameScene) return;
        
        // Create enemy projectile
        new EnemyProjectile(this.gameScene, this.x, this.y + 20);
        
        // Play sound at reduced volume
        this.gameScene.sound.play('laser', { volume: window.GAME.FX_VOLUME * 0.3, detune: -300 });
    }
    
    // Take damage
    takeDamage(damage = 1) {
        this.health -= damage;
        
        if (this.health <= 0) {
            // Destroy if no health left
            return true; // Enemy destroyed
        } else {
            // Update health bar
            if (this.healthBar) {
                // Flash white for damage
                this.setTint(0xffffff);
                this.gameScene.time.delayedCall(100, () => {
                    if (this.active) this.applyTint();
                });
                
                // Update health bar width and color
                const healthPercent = this.health / 3;
                const width = 40 * healthPercent;
                const color = healthPercent > 0.67 ? 0x00ff00 : // Green
                              healthPercent > 0.33 ? 0xffff00 : // Yellow
                              0xff0000; // Red
                              
                this.healthBar.width = width;
                this.healthBar.fillColor = color;
            }
            
            return false; // Enemy still alive
        }
    }

    checkIfOffScreen() {
        // Destroy if off screen (using game height from constructor)
        if (this.y > this.gameHeight + 50) {
            // Penalize player for letting enemy escape
            if (!this.isBeingDestroyed && this.gameScene && !this.gameScene.isGameOver) {
                // Increment escaped ships counter
                this.gameScene.shipsEscaped++;
                
                // Penalty based on enemy type - now just 1 point for all regular ships, 30 for bosses
                let penalty = this.enemyType >= 6 ? 30 : 1;
                
                // Reduce score
                window.GAME.score = Math.max(0, window.GAME.score - penalty);
                
                // Show penalty text
                const penaltyText = this.gameScene.add.text(this.x, this.y - 30, `-${penalty}`, {
                    fontFamily: '"Press Start 2P"',
                    fontSize: '16px',
                    fill: '#FF0000'
                }).setOrigin(0.5);
                
                // Add animation and remove
                this.gameScene.tweens.add({
                    targets: penaltyText,
                    y: this.y - 80,
                    alpha: 0,
                    duration: 1000,
                    onComplete: () => penaltyText.destroy()
                });
                
                // Flash the escape counter
                this.gameScene.tweens.add({
                    targets: this.gameScene.escapedText,
                    scale: { from: 1.3, to: 1 },
                    duration: 300,
                    ease: 'Bounce.Out'
                });
                
                // Camera shake effect based on enemy type
                if (this.enemyType >= 6) {
                    // Boss escapes
                    // this.gameScene.cameras.main.shake(300, 0.01); // Removed screen shake
                    
                    // Play warning sound
                    this.gameScene.sound.play('gameover', { volume: window.GAME.FX_VOLUME * 0.3 });
                    
                    // Show big warning
                    const warningText = this.gameScene.add.text(this.gameScene.cameras.main.width / 2, 
                        this.gameScene.cameras.main.height / 2, "BOSS ESCAPED!", {
                        fontFamily: '"Press Start 2P"',
                        fontSize: '24px',
                        fill: '#FF0000'
                    }).setOrigin(0.5).setAlpha(0);
                    
                    // Flash warning
                    this.gameScene.tweens.add({
                        targets: warningText,
                        alpha: 1,
                        duration: 200,
                        yoyo: true,
                        repeat: 1,
                        onComplete: () => warningText.destroy()
                    });
                } else if (this.enemyType >= 3) {
                    // Shooting enemy escapes
                    // this.gameScene.cameras.main.shake(150, 0.005); // Removed screen shake
                    this.gameScene.sound.play('explosion', { volume: window.GAME.FX_VOLUME * 0.5 });
                }
            }
            
            this.cleanUp();
            super.destroy();
        }
    }
    
    // Override the destroy method to clean up resources
    destroy(fromScene) {
        this.cleanUp();
        super.destroy(fromScene);
    }
    
    // Clean up all resources
    cleanUp() {
        // Prevent multiple cleanups
        if (this.isBeingDestroyed) return;
        this.isBeingDestroyed = true;
        
        // Clean up the particle emitter
        if (this.engineEmitter && this.engineEmitter.manager) {
            this.engineEmitter.stop();
            this.engineEmitter.remove();
            this.engineEmitter = null;
        }
        
        // Clean up the health bar
        if (this.healthBar) {
            this.healthBar.destroy();
            this.healthBar = null;
        }
        
        // Clean up the timer
        if (this.checkDestroy) {
            this.checkDestroy.remove();
            this.checkDestroy = null;
        }
    }
    
    // Drop powerup with certain probability
    dropPowerup() {
        if (!this.gameScene || !this.active) return;
        
        // Chance based on enemy type
        const chance = this.enemyType >= 6 ? 0.75 : // 75% for boss
                      this.enemyType >= 3 ? 0.15 : // 15% for shooting
                      0.05; // 5% for regular
        
        if (Math.random() < chance) {
            // Create a powerup
            new Powerup(this.gameScene, this.x, this.y);
        }
    }
} 