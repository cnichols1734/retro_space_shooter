class BootScene extends Phaser.Scene {
    constructor() {
        super({key: 'BootScene'});
    }

    preload() {
        // Loading bar
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        // Loading text
        const loadingText = this.add.text(width / 2, height / 2 - 50, 'LOADING...', { 
            fontFamily: '"Press Start 2P"', 
            fontSize: '20px', 
            fill: '#FFFFFF' 
        }).setOrigin(0.5);
        
        // Create loading bar
        const progressBar = this.add.graphics();
        const progressBox = this.add.graphics();
        progressBox.fillStyle(0x222222, 0.8);
        progressBox.fillRect(width / 2 - 160, height / 2, 320, 30);
        
        // Loading progress events
        this.load.on('progress', function (value) {
            progressBar.clear();
            progressBar.fillStyle(0x00ffff, 1);
            progressBar.fillRect(width / 2 - 150, height / 2 + 10, 300 * value, 10);
        });
        
        this.load.on('complete', function () {
            progressBar.destroy();
            progressBox.destroy();
            loadingText.destroy();
        });
        
        // Load assets
        this.load.image('player', 'assets/images/player.png');
        this.load.image('enemy', 'assets/images/enemy.png');
        this.load.image('projectile', 'assets/images/projectile.png');
        this.load.image('enemyProjectile', 'assets/images/enemy_projectile.png');
        this.load.image('explosion', 'assets/images/explosion.png');
        this.load.image('background', 'assets/images/space_background.png');
        this.load.image('particle', 'assets/images/particle.png');
        this.load.image('powerup', 'assets/images/powerup.png');
        this.load.image('shield', 'assets/images/shield.png');
        
        // Audio
        this.load.audio('laser', 'assets/sounds/laser.wav');
        this.load.audio('explosion', 'assets/sounds/explosion.wav');
        this.load.audio('powerup', 'assets/sounds/powerup.wav');
        this.load.audio('gameover', 'assets/sounds/gameover.wav');
        this.load.audio('music', 'assets/sounds/music.mp3');
    }

    create() {
        // Add new game constants
        window.GAME.ENEMY_PROJECTILE_SPEED = 300;
        
        // Start title scene
        this.scene.start('TitleScene');
    }
} 