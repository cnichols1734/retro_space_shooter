class Powerup extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'powerup');
        
        // Add to scene and enable physics
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        // Add to powerups group
        scene.powerups.add(this);
        
        // Set random powerup type
        this.powerupType = Phaser.Math.Between(0, 3);
        /* Powerup types:
          0: Extra projectile (increase max projectiles)
          1: Faster firing (reduce fire delay)
          2: Rapid cooling (reduce weapon heat buildup)
          3: Shield (temporary invincibility)
        */
        
        // Set color based on powerup type
        this.setTint(this.getColorForType());
        
        // Set physics properties
        this.setVelocityY(100);
        this.setScale(1.2);
        
        // Add glow effect
        this.setBlendMode(Phaser.BlendModes.ADD);
        
        // Particle effect for powerup
        this.glowEmitter = scene.add.particles('particle').createEmitter({
            x: this.x,
            y: this.y,
            speed: { min: 10, max: 20 },
            angle: { min: 0, max: 360 },
            scale: { start: 0.4, end: 0 },
            lifespan: 500,
            blendMode: 'ADD',
            tint: this.getColorForType(),
            frequency: 50
        });
        
        // Pulsing effect
        scene.tweens.add({
            targets: this,
            scale: 1.5,
            duration: 500,
            yoyo: true,
            repeat: -1
        });
        
        // Destroy when off screen
        this.checkDestroy = scene.time.addEvent({
            delay: 100,
            callback: this.checkIfOffScreen,
            callbackScope: this,
            loop: true
        });
    }

    preUpdate() {
        super.preUpdate();
        
        // Update particle emitter position
        if (this.glowEmitter && this.glowEmitter.manager) {
            this.glowEmitter.setPosition(this.x, this.y);
        }
    }
    
    getColorForType() {
        switch(this.powerupType) {
            case 0: return 0x00ffff; // Cyan - Extra projectile
            case 1: return 0xffff00; // Yellow - Faster firing
            case 2: return 0x00ff00; // Green - Rapid cooling
            case 3: return 0xff00ff; // Purple - Shield
            default: return 0xffffff;
        }
    }
    
    checkIfOffScreen() {
        // Get game height
        const gameHeight = this.scene.sys.game.config.height;
        
        // Destroy if off screen
        if (this.y > gameHeight + 50) {
            this.destroy();
        }
    }
    
    getTypeText() {
        switch(this.powerupType) {
            case 0: return 'EXTRA PROJECTILE';
            case 1: return 'FASTER FIRING';
            case 2: return 'RAPID COOLING';
            case 3: return 'SHIELD';
            default: return 'POWERUP';
        }
    }
    
    applyEffect(player) {
        // Apply effect based on powerup type
        switch(this.powerupType) {
            case 0: // Extra projectile
                player.maxProjectiles = Math.min(player.maxProjectiles + 1, 6);
                break;
            case 1: // Faster firing
                player.fireDelay = Math.max(player.fireDelay * 0.8, 150);
                // Also reduce heat generation by 20%
                player.heatRate = Math.max(player.heatRate * 0.8, 5);
                // Set powerup active and timer (10 seconds)
                player.fastFiringActive = true;
                player.fastFiringTime = 10000;
                break;
            case 2: // Rapid cooling
                player.heatRate = Math.max(player.heatRate * 0.7, 5);
                player.coolingRate = player.coolingRate * 2.0;
                player.coolingUpgraded = true;
                break;
            case 3: // Shield
                player.shield = true;
                player.shieldTime = 7000; // 7 seconds of shield
                break;
        }
    }
    
    destroy() {
        // Clean up the glow emitter
        if (this.glowEmitter && this.glowEmitter.manager) {
            this.glowEmitter.stop();
            this.glowEmitter.remove();
            this.glowEmitter = null;
        }
        
        // Clean up the timer
        if (this.checkDestroy) {
            this.checkDestroy.remove();
            this.checkDestroy = null;
        }
        
        super.destroy();
    }
} 