class Player extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'player');
        
        // Add player to scene and enable physics
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        // Set physics properties
        this.setCollideWorldBounds(true);
        this.setBounce(0.1);
        this.setSize(40, 40);
        this.setScale(1.5);
        
        // Player properties
        this.speed = window.GAME.PLAYER_SPEED;
        this.lastFired = 0;
        this.fireDelay = 350; // Milliseconds between shots
        this.maxProjectiles = 3; // Limit number of projectiles on screen
        this.baseMaxProjectiles = 3; // Store initial value
        this.baseFireDelay = 350; // Store initial value
        this.baseFiringHeatRate = 35; // Store initial heat rate
        
        // Powerup timers
        this.fastFiringActive = false;
        this.fastFiringTime = 0;
        
        // Weapon heat mechanics
        this.weaponHeat = 0;
        this.weaponOverheated = false;
        this.heatRate = 35; // Increased from 20 to 35
        this.coolingRate = 0.3; // Decreased from 0.5 to 0.3
        this.overheatCooldown = 1500; // Time weapon is disabled after overheating
        this.coolingUpgraded = false; // Track if cooling system is upgraded
        
        // Store scene reference
        this.gameScene = scene;
        
        // Shield properties
        this.shield = false;
        this.shieldTime = 0;
        this.shieldSprite = scene.add.sprite(x, y, 'shield');
        this.shieldSprite.setScale(2);
        this.shieldSprite.setVisible(false);
        this.shieldSprite.setBlendMode(Phaser.BlendModes.ADD);
        
        // Cooling system indicator
        this.coolingIndicator = scene.add.rectangle(x, y + 50, 30, 3, 0x00ff00);
        this.coolingIndicator.setOrigin(0.5);
        this.coolingIndicator.setVisible(false);
        this.coolingIndicator.setAlpha(0.7);
        
        // Extra projectile indicator
        this.projectileIndicator = scene.add.text(x, y - 40, '', {
            fontFamily: '"Press Start 2P"',
            fontSize: '10px',
            fill: '#00FFFF'
        }).setOrigin(0.5);
        this.projectileIndicator.setVisible(false);
        
        // Faster firing indicator
        this.firingIndicator = scene.add.rectangle(x, y + 55, 30, 3, 0xffff00);
        this.firingIndicator.setOrigin(0.5);
        this.firingIndicator.setVisible(false);
        this.firingIndicator.setAlpha(0.7);
        
        // Add engine particles
        this.engineEmitter = scene.add.particles('particle').createEmitter({
            x: this.x,
            y: this.y + 20,
            speed: { min: 50, max: 100 },
            angle: { min: 80, max: 100 },
            scale: { start: 0.4, end: 0 },
            lifespan: { min: 300, max: 500 },
            blendMode: 'ADD',
            frequency: 30,
            tint: 0x00ffff
        });
        
        // Weapon heat visual indication
        this.weaponHeatBar = scene.add.rectangle(x, y + 40, 40, 5, 0x00ffff);
        this.weaponHeatBar.setOrigin(0.5);
        this.weaponHeatBar.setVisible(false);
        
        // Powerup notification text
        this.powerupText = scene.add.text(scene.cameras.main.width / 2, 100, '', {
            fontFamily: '"Press Start 2P"',
            fontSize: '14px',
            align: 'center',
            fill: '#FFFFFF'
        }).setOrigin(0.5);
        this.powerupText.setVisible(false);
    }

    update(cursors, wasd) {
        // Reset velocity
        this.setVelocity(0);
        
        // Handle movement
        const leftPressed = cursors.left.isDown || wasd.left.isDown;
        const rightPressed = cursors.right.isDown || wasd.right.isDown;
        const upPressed = cursors.up.isDown || wasd.up.isDown;
        const downPressed = cursors.down.isDown || wasd.down.isDown;
        
        // Horizontal movement
        if (leftPressed) {
            this.setVelocityX(-this.speed);
        } else if (rightPressed) {
            this.setVelocityX(this.speed);
        }
        
        // Vertical movement
        if (upPressed) {
            this.setVelocityY(-this.speed);
        } else if (downPressed) {
            this.setVelocityY(this.speed);
        }
        
        // Fire projectile
        if ((cursors.space.isDown || wasd.fire.isDown) && this.gameScene.time.now > this.lastFired && !this.weaponOverheated) {
            this.fire();
        }
        
        // Cool down weapon heat over time
        if (this.weaponHeat > 0) {
            // Show heat bar when it has heat
            this.weaponHeatBar.setVisible(true);
            
            // Reduce heat
            this.weaponHeat -= this.coolingRate;
            
            // Update heat bar width and color
            const heatRatio = this.weaponHeat / 100;
            this.weaponHeatBar.width = 40 * heatRatio;
            
            // Change color as it heats up
            let color;
            if (heatRatio < 0.5) {
                color = 0x00ffff; // Cyan when cool
            } else if (heatRatio < 0.8) {
                color = 0xffff00; // Yellow when warm
            } else {
                color = 0xff0000; // Red when hot
            }
            this.weaponHeatBar.fillColor = color;
            
            // Hide bar when fully cooled
            if (this.weaponHeat <= 0) {
                this.weaponHeat = 0;
                this.weaponHeatBar.setVisible(false);
                this.weaponOverheated = false;
            }
            
            // Cooling effect animation if upgraded
            if (this.coolingUpgraded && this.weaponHeat > 5) {
                // Occasionally show cooling particles
                if (Math.random() < 0.05) {
                    this.gameScene.particles.createEmitter({
                        x: this.x,
                        y: this.y + 40,
                        speed: { min: 20, max: 50 },
                        angle: { min: 250, max: 290 },
                        scale: { start: 0.2, end: 0 },
                        lifespan: 300,
                        blendMode: 'ADD',
                        quantity: 1,
                        tint: 0x00ff66,
                        on: false
                    }).explode(3, this.x, this.y + 45);
                }
            }
        }
        
        // Update shield
        if (this.shield) {
            this.shieldSprite.setVisible(true);
            this.shieldSprite.setPosition(this.x, this.y);
            this.shieldSprite.rotation += 0.02; // Rotate shield
            
            // Countdown shield time
            this.shieldTime -= 16.67; // Approximate ms per frame
            
            if (this.shieldTime <= 0) {
                this.shield = false;
                this.shieldSprite.setVisible(false);
            }
        }
        
        // Update faster firing powerup
        if (this.fastFiringActive) {
            // Countdown faster firing time
            this.fastFiringTime -= 16.67; // Approximate ms per frame
            
            if (this.fastFiringTime <= 0) {
                this.fastFiringActive = false;
                // Reset firing rate and heat generation to base values
                this.fireDelay = this.baseFireDelay;
                this.heatRate = this.baseFiringHeatRate;
            }
        }
        
        // Update engine particles
        this.engineEmitter.setPosition(this.x, this.y + 20);
        
        // Update heat bar position
        this.weaponHeatBar.x = this.x;
        this.weaponHeatBar.y = this.y + 40;
        
        // Update cooling indicator
        this.coolingIndicator.setPosition(this.x, this.y + 50);
        this.coolingIndicator.setVisible(this.coolingUpgraded);
        
        // Pulse the cooling indicator when active
        if (this.coolingUpgraded) {
            // Pulse the indicator to make it more noticeable
            this.coolingIndicator.alpha = 0.6 + Math.sin(this.gameScene.time.now * 0.01) * 0.4;
        }
        
        // Update projectile indicator
        if (this.maxProjectiles > this.baseMaxProjectiles) {
            this.projectileIndicator.setPosition(this.x, this.y - 40);
            this.projectileIndicator.setText(`x${this.maxProjectiles}`);
            this.projectileIndicator.setVisible(true);
            // Add slight pulse effect
            const pulseAmount = Math.sin(this.gameScene.time.now * 0.005) * 0.2;
            this.projectileIndicator.setAlpha(0.8 + pulseAmount);
        } else {
            this.projectileIndicator.setVisible(false);
        }
        
        // Update firing rate indicator
        if (this.fireDelay < this.baseFireDelay) {
            this.firingIndicator.setPosition(this.x, this.y + 55);
            this.firingIndicator.setVisible(true);
            // Add slight pulse effect
            const pulseAmount = Math.sin(this.gameScene.time.now * 0.01) * 0.4;
            this.firingIndicator.alpha = 0.6 + pulseAmount;
            
            // Add countdown indicator if active
            if (this.fastFiringActive) {
                // Show countdown as fading indicator
                const timeRatio = this.fastFiringTime / 10000; // 10 seconds total
                this.firingIndicator.scaleX = timeRatio * 30;
            }
        } else {
            this.firingIndicator.setVisible(false);
        }
        
        // Add slight rotation effect when moving horizontally
        if (leftPressed) {
            this.setRotation(-0.1);
        } else if (rightPressed) {
            this.setRotation(0.1);
        } else {
            this.setRotation(0);
        }
    }

    fire() {
        // Check fire delay
        if (this.gameScene.time.now <= this.lastFired) return;
        
        // Check max projectiles
        const projectileCount = this.gameScene.projectiles.getChildren().length;
        if (projectileCount >= this.maxProjectiles) return;
        
        // Update last fired timestamp
        this.lastFired = this.gameScene.time.now + this.fireDelay;
        
        // Increase weapon heat
        this.weaponHeat += this.heatRate;
        
        // Check for overheating
        if (this.weaponHeat >= 100) {
            this.weaponHeat = 100;
            this.weaponOverheated = true;
            this.gameScene.time.delayedCall(this.overheatCooldown, () => {
                // Start cooling down after the cooldown period
                this.weaponHeat = 80;
            });
            
            // Visual feedback for overheating without shaking
            // this.gameScene.cameras.main.shake(200, 0.005);
            this.gameScene.sound.play('powerup', { volume: window.GAME.FX_VOLUME * 0.5, detune: 1200 }); // Distorted sound for overheat
            return; // Don't fire if overheated
        }
        
        // Create projectile
        new Projectile(this.gameScene, this.x, this.y - 20);
        
        // Play sound
        this.gameScene.sound.play('laser', { volume: window.GAME.FX_VOLUME });
    }
    
    takeDamage() {
        // Check if shield is active
        if (this.shield) {
            // Flash shield on hit
            this.gameScene.tweens.add({
                targets: this.shieldSprite,
                alpha: 0.2,
                duration: 100,
                yoyo: true,
                repeat: 1
            });
            
            // Shield absorbs the hit
            return false;
        }
        
        // No shield, take damage
        return true;
    }
    
    showPowerupText(text, color) {
        // Show powerup notification
        this.powerupText.setText(text);
        this.powerupText.setColor(color);
        this.powerupText.setVisible(true);
        
        // Animation
        this.gameScene.tweens.add({
            targets: this.powerupText,
            y: 80,
            alpha: 0,
            duration: 2000,
            onComplete: () => {
                this.powerupText.setVisible(false);
                this.powerupText.y = 100;
                this.powerupText.alpha = 1;
            }
        });
    }
} 