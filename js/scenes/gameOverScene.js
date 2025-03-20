class GameOverScene extends Phaser.Scene {
    constructor() {
        super({key: 'GameOverScene'});
    }

    init(data) {
        // Store the reason for game over
        this.gameOverReason = data.reason || 'destroyed';
        this.escapeCount = data.count || 0;
        this.maxEscapes = data.max || 10;
    }

    create() {
        // Background
        this.background = this.add.tileSprite(0, 0, this.cameras.main.width, this.cameras.main.height, 'background');
        this.background.setOrigin(0, 0);
        
        // Game over text with glow effect
        const gameOverText = this.add.text(this.cameras.main.width / 2, 120, 'GAME OVER', {
            fontFamily: '"Press Start 2P"',
            fontSize: '40px',
            align: 'center',
            fill: '#FF0000'
        }).setOrigin(0.5);
        
        // Add glow effect to title
        gameOverText.setStroke('#880000', 6);
        gameOverText.setShadow(2, 2, '#FF0000', 5, true);
        
        // Reason text
        let reasonText = '';
        if (this.gameOverReason === 'escaped') {
            reasonText = `TOO MANY SHIPS ESCAPED: ${this.escapeCount}/${this.maxEscapes}`;
        } else {
            reasonText = 'YOUR SHIP WAS DESTROYED';
        }
        
        this.add.text(this.cameras.main.width / 2, 180, reasonText, {
            fontFamily: '"Press Start 2P"',
            fontSize: '14px',
            align: 'center',
            fill: '#FF9999'
        }).setOrigin(0.5);
        
        // Score text
        this.add.text(this.cameras.main.width / 2, 240, `SCORE: ${window.GAME.score}`, {
            fontFamily: '"Press Start 2P"',
            fontSize: '24px',
            fill: '#FFFFFF'
        }).setOrigin(0.5);
        
        // High score text
        this.add.text(this.cameras.main.width / 2, 290, `HIGH SCORE: ${window.GAME.highScore}`, {
            fontFamily: '"Press Start 2P"',
            fontSize: '16px',
            fill: '#FFFF00'
        }).setOrigin(0.5);
        
        // Game tip text
        let tipText = '';
        if (this.gameOverReason === 'escaped') {
            tipText = 'TIP: SHOOT ALL SHIPS BEFORE THEY ESCAPE!';
        } else {
            tipText = 'TIP: COLLECT SHIELDS TO SURVIVE LONGER!';
        }
        
        this.add.text(this.cameras.main.width / 2, 340, tipText, {
            fontFamily: '"Press Start 2P"',
            fontSize: '10px',
            align: 'center',
            fill: '#66FFFF'
        }).setOrigin(0.5);
        
        // Play again button
        const playAgainButton = this.add.text(this.cameras.main.width / 2, 400, 'PLAY AGAIN', {
            fontFamily: '"Press Start 2P"',
            fontSize: '20px',
            fill: '#FFFFFF',
            padding: {
                x: 20,
                y: 10
            }
        }).setOrigin(0.5);
        
        playAgainButton.setInteractive({ useHandCursor: true });
        
        // Button hover effects
        playAgainButton.on('pointerover', () => {
            playAgainButton.setStyle({ fill: '#00FFFF' });
        });
        
        playAgainButton.on('pointerout', () => {
            playAgainButton.setStyle({ fill: '#FFFFFF' });
        });
        
        // Start game on click
        playAgainButton.on('pointerdown', () => {
            this.sound.play('powerup', { volume: window.GAME.FX_VOLUME });
            this.scene.start('GameScene');
        });
        
        // Main menu button
        const menuButton = this.add.text(this.cameras.main.width / 2, 460, 'MAIN MENU', {
            fontFamily: '"Press Start 2P"',
            fontSize: '16px',
            fill: '#CCCCCC',
            padding: {
                x: 10,
                y: 5
            }
        }).setOrigin(0.5);
        
        menuButton.setInteractive({ useHandCursor: true });
        
        // Button hover effects
        menuButton.on('pointerover', () => {
            menuButton.setStyle({ fill: '#FFFFFF' });
        });
        
        menuButton.on('pointerout', () => {
            menuButton.setStyle({ fill: '#CCCCCC' });
        });
        
        // Go to title screen on click
        menuButton.on('pointerdown', () => {
            this.scene.start('TitleScene');
        });

        // Particle emitter for stars
        const particles = this.add.particles('particle');
        
        particles.createEmitter({
            x: { min: 0, max: this.cameras.main.width },
            y: -10,
            lifespan: 6000,
            speedY: { min: 30, max: 100 },
            scale: { start: 0.1, end: 0 },
            quantity: 1,
            blendMode: 'ADD',
            frequency: 200
        });
    }

    update() {
        // Scroll background for parallax effect
        this.background.tilePositionY -= 0.5;
    }
} 