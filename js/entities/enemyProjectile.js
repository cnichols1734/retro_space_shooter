class EnemyProjectile extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'enemyProjectile');
        
        // Add to scene and enable physics
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        // Add to enemy projectiles group
        scene.enemyProjectiles.add(this);
        
        // Set physics properties
        this.setVelocityY(window.GAME.ENEMY_PROJECTILE_SPEED);
        this.setScale(1.2);
        
        // Add glow effect
        this.setBlendMode(Phaser.BlendModes.ADD);
        this.setTint(0xff0000); // Red tint for enemy projectiles
        
        // Trail effect
        this.trailEmitter = scene.add.particles('particle').createEmitter({
            x: this.x,
            y: this.y,
            speed: 5,
            lifespan: 300,
            scale: { start: 0.4, end: 0 },
            blendMode: 'ADD',
            tint: 0xff0000
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
        // Get game height
        const gameHeight = this.scene.sys.game.config.height;
        
        // Destroy if off screen
        if (this.y > gameHeight + 50) {
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