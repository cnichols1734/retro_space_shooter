class Projectile extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'projectile');
        
        // Add to scene and enable physics
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        // Add to projectiles group
        scene.projectiles.add(this);
        
        // Set physics properties
        this.setVelocityY(-window.GAME.PROJECTILE_SPEED);
        this.setScale(1.5);
        
        // Add glow effect
        this.setBlendMode(Phaser.BlendModes.ADD);
        
        // Trail effect
        this.trailEmitter = scene.add.particles('particle').createEmitter({
            x: this.x,
            y: this.y,
            speed: 5,
            lifespan: 300,
            scale: { start: 0.5, end: 0 },
            blendMode: 'ADD',
            tint: 0x00ffff
        });
        
        // Destroy when off screen
        this.checkDestroy = scene.time.addEvent({
            delay: 100,
            callback: this.checkIfOffScreen,
            callbackScope: this,
            loop: true
        });
    }

    preUpdate(time, delta) {
        super.preUpdate(time, delta);
        
        // Update trail position
        if (this.trailEmitter && this.trailEmitter.manager) {
            this.trailEmitter.setPosition(this.x, this.y);
        }
    }

    checkIfOffScreen() {
        // Destroy if off screen
        if (this.y < -50) {
            this.destroy();
        }
    }
    
    destroy() {
        // Clean up the trail emitter
        if (this.trailEmitter && this.trailEmitter.manager) {
            this.trailEmitter.stop();
            this.trailEmitter.remove();
            this.trailEmitter = null;
        }
        
        // Clean up the timer
        if (this.checkDestroy) {
            this.checkDestroy.remove();
            this.checkDestroy = null;
        }
        
        super.destroy();
    }
} 