class TransitionScene extends Phaser.Scene {
    constructor() {
        super({key: 'TransitionScene'});
    }

    create() {
        // Create scrolling background
        this.background = this.add.tileSprite(0, 0, this.cameras.main.width, this.cameras.main.height, 'background');
        this.background.setOrigin(0, 0);
        
        // Add starfield effect
        this.starSpeed = 1;
        this.maxStarSpeed = 20;
        this.accelerationRate = 0.1;
        
        // Star particles with dynamic speed
        this.particles = this.add.particles('particle');
        this.starEmitter = this.particles.createEmitter({
            x: { min: 0, max: this.cameras.main.width },
            y: -10,
            lifespan: 6000,
            speedY: { min: this.starSpeed * 30, max: this.starSpeed * 100 },
            scale: { start: 0.1, end: 0 },
            quantity: 1,
            blendMode: 'ADD',
            frequency: 200
        });
        
        // Add side streaks for warp speed effect
        this.leftStreakEmitter = this.particles.createEmitter({
            x: 0,
            y: { min: 0, max: this.cameras.main.height },
            speedX: { min: 300, max: 500 },
            lifespan: 1000,
            scale: { start: 0.5, end: 0 },
            quantity: 0,
            blendMode: 'ADD',
            tint: 0x00ffff
        });
        
        this.rightStreakEmitter = this.particles.createEmitter({
            x: this.cameras.main.width,
            y: { min: 0, max: this.cameras.main.height },
            speedX: { min: -500, max: -300 },
            lifespan: 1000,
            scale: { start: 0.5, end: 0 },
            quantity: 0,
            blendMode: 'ADD',
            tint: 0x00ffff
        });
        
        // Player ship (starting small and far away)
        this.player = this.add.sprite(this.cameras.main.width / 2, this.cameras.main.height + 100, 'player');
        this.player.setScale(0.1);
        this.player.setAlpha(0.1);
        this.player.setBlendMode(Phaser.BlendModes.ADD);
        
        // Engine particles for player
        this.engineEmitter = this.particles.createEmitter({
            x: this.player.x,
            y: this.player.y + 5,
            speed: { min: 50, max: 100 },
            angle: { min: 80, max: 100 },
            scale: { start: 0.1, end: 0 },
            lifespan: { min: 300, max: 500 },
            blendMode: 'ADD',
            frequency: 30,
            tint: 0x00ffff,
            on: false
        });
        
        // Add scrolling text (WARP SPEED)
        this.warpText = this.add.text(this.cameras.main.width / 2, this.cameras.main.height / 2, 'WARP SPEED', {
            fontFamily: '"Press Start 2P"',
            fontSize: '40px',
            align: 'center',
            fill: '#FFFFFF'
        }).setOrigin(0.5);
        
        // Add glow effect to title
        this.warpText.setStroke('#00FFFF', 8);
        this.warpText.setShadow(2, 2, '#00FFFF', 5, true);
        this.warpText.setAlpha(0);
        
        // Transition timeline
        this.time.delayedCall(500, () => {
            // Fade in the warp text
            this.tweens.add({
                targets: this.warpText,
                alpha: 1,
                duration: 1000,
                ease: 'Power2'
            });
            
            // Play warp sound
            this.sound.play('warp', { 
                volume: window.GAME.FX_VOLUME * 1.5,
                detune: 400
            });
        });
        
        // Start accelerating stars
        this.time.delayedCall(2000, () => {
            // Accelerate stars
            this.acceleratingStars = true;
            
            // Make warp text pulse
            this.tweens.add({
                targets: this.warpText,
                scale: 1.2,
                duration: 500,
                yoyo: true,
                repeat: 3
            });
            
            // Play another warp sound with different pitch
            this.sound.play('warp', { 
                volume: window.GAME.FX_VOLUME * 1.2,
                detune: 600
            });
            
            // Start side streaks
            this.time.delayedCall(1000, () => {
                this.leftStreakEmitter.setQuantity(2);
                this.rightStreakEmitter.setQuantity(2);
            });
            
            // Start ship appearing
            this.tweens.add({
                targets: this.player,
                y: this.cameras.main.height - 100,
                scale: 1.5,
                alpha: 1,
                duration: 3000,
                ease: 'Cubic.easeOut',
                onUpdate: () => {
                    // Update engine particles position
                    this.engineEmitter.setPosition(this.player.x, this.player.y + 20);
                },
                onStart: () => {
                    // Turn on engine particles
                    this.engineEmitter.start();
                    
                    // Fade out warp text with zoom effect
                    this.time.delayedCall(1000, () => {
                        this.tweens.add({
                            targets: this.warpText,
                            alpha: 0,
                            scale: 5,
                            duration: 1000,
                            ease: 'Power2'
                        });
                        
                        // Final warp sound
                        this.sound.play('warp', { 
                            volume: window.GAME.FX_VOLUME,
                            detune: 800
                        });
                        
                        // Add a circular light burst around the ship
                        this.time.delayedCall(500, () => {
                            const circle = this.add.circle(this.player.x, this.player.y, 10, 0x00ffff, 0.8);
                            circle.setBlendMode(Phaser.BlendModes.ADD);
                            
                            this.tweens.add({
                                targets: circle,
                                radius: 200,
                                alpha: 0,
                                duration: 1000,
                                onUpdate: () => {
                                    circle.setPosition(this.player.x, this.player.y);
                                },
                                onComplete: () => {
                                    circle.destroy();
                                }
                            });
                        });
                    });
                }
            });
        });
        
        // Transition to game scene
        this.time.delayedCall(5000, () => {
            // Increase streak effect right before transition
            this.leftStreakEmitter.setQuantity(5);
            this.rightStreakEmitter.setQuantity(5);
            this.leftStreakEmitter.setSpeedX({ min: 600, max: 800 });
            this.rightStreakEmitter.setSpeedX({ min: -800, max: -600 });
            
            // Flash effect before transitioning
            this.cameras.main.flash(500, 255, 255, 255);
            
            // Play laser sound for transition
            this.sound.play('laser', { 
                volume: window.GAME.FX_VOLUME * 1.5,
                detune: 0
            });
            
            // Transition to game scene
            this.time.delayedCall(500, () => {
                this.scene.start('GameScene');
            });
        });
    }
    
    update() {
        // Scroll background
        this.background.tilePositionY -= this.starSpeed;
        
        // Accelerate stars if needed
        if (this.acceleratingStars) {
            this.starSpeed = Math.min(this.maxStarSpeed, this.starSpeed + this.accelerationRate);
            
            // Update star particle speed
            this.starEmitter.setSpeedY({ min: this.starSpeed * 30, max: this.starSpeed * 100 });
            
            // Increase quantity as we go faster
            if (this.starSpeed > 10) {
                this.starEmitter.setFrequency(50);
            }
            
            // Add more side streaks as we get faster
            if (this.starSpeed > 15 && this.leftStreakEmitter.quantity.propertyValue < 3) {
                this.leftStreakEmitter.setQuantity(3);
                this.rightStreakEmitter.setQuantity(3);
            }
        }
    }
} 