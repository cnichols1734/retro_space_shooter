class TitleScene extends Phaser.Scene {
    constructor() {
        super({key: 'TitleScene'});
    }

    create() {
        // Background
        this.background = this.add.tileSprite(0, 0, this.cameras.main.width, this.cameras.main.height, 'background');
        this.background.setOrigin(0, 0);
        
        // Title text with glow effect
        const titleText = this.add.text(this.cameras.main.width / 2, 120, 'RETRO SPACE\nSHOOTER', {
            fontFamily: '"Press Start 2P"',
            fontSize: '40px',
            align: 'center',
            fill: '#FFFFFF'
        }).setOrigin(0.5);
        
        // Add glow effect to title
        titleText.setStroke('#00FFFF', 8);
        titleText.setShadow(2, 2, '#00FFFF', 5, true);
        
        // High score text if exists
        if (window.GAME.highScore > 0) {
            this.add.text(this.cameras.main.width / 2, 220, `HIGH SCORE: ${window.GAME.highScore}`, {
                fontFamily: '"Press Start 2P"',
                fontSize: '16px',
                fill: '#FFFF00'
            }).setOrigin(0.5);
        }
        
        // Start button with hover effect
        const startButton = this.add.text(this.cameras.main.width / 2, 280, 'START GAME', {
            fontFamily: '"Press Start 2P"',
            fontSize: '20px',
            fill: '#FFFFFF',
            padding: {
                x: 20,
                y: 10
            }
        }).setOrigin(0.5);
        
        startButton.setInteractive({ useHandCursor: true });
        
        // Button hover effects
        startButton.on('pointerover', () => {
            startButton.setStyle({ fill: '#00FFFF' });
        });
        
        startButton.on('pointerout', () => {
            startButton.setStyle({ fill: '#FFFFFF' });
        });
        
        // Start game on click
        startButton.on('pointerdown', () => {
            this.sound.play('powerup', { volume: window.GAME.FX_VOLUME });
            this.scene.start('GameScene');
        });
        
        // Instructions text
        this.add.text(this.cameras.main.width / 2, 330, 'ARROWS / WASD: MOVE\nSPACE / CLICK: SHOOT', {
            fontFamily: '"Press Start 2P"',
            fontSize: '12px',
            align: 'center',
            fill: '#CCCCCC'
        }).setOrigin(0.5);

        // Powerup guide title
        this.add.text(this.cameras.main.width / 2, 380, 'POWERUPS', {
            fontFamily: '"Press Start 2P"',
            fontSize: '14px',
            align: 'center',
            fill: '#FFFFFF'
        }).setOrigin(0.5);
        
        // Create powerup guide
        this.createPowerupGuide();

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
    
    createPowerupGuide() {
        const startY = 410;
        const spacing = 45;
        const centerX = this.cameras.main.width / 2;
        
        // Calculate positions to center the entire powerup guide
        const colSpacing = 350; // Increased spacing between columns even more
        const leftColX = centerX - colSpacing/2 + 20; // Shifted to center
        const rightColX = centerX + colSpacing/2 - 20; // Shifted to center
        
        // Create powerup examples
        this.createPowerupInfo(leftColX, startY, 0x00ffff, 'EXTRA PROJECTILE', 'Increases max projectiles');
        this.createPowerupInfo(leftColX, startY + spacing, 0xffff00, 'FASTER FIRING', 'Faster shots & less heat (10s)');
        this.createPowerupInfo(rightColX, startY, 0x00ff00, 'RAPID COOLING', 'Improves weapon cooling');
        this.createPowerupInfo(rightColX, startY + spacing, 0xff00ff, 'SHIELD', 'Temporary invincibility');
        
        // Weapon heat note
        this.add.text(centerX, startY + spacing * 2.2, 'WATCH YOUR WEAPON HEAT!', {
            fontFamily: '"Press Start 2P"',
            fontSize: '12px',
            align: 'center',
            fill: '#FF5555'
        }).setOrigin(0.5);
    }
    
    createPowerupInfo(x, y, color, title, description) {
        // Create powerup icon
        const powerupIcon = this.add.sprite(x - 120, y, 'powerup');
        powerupIcon.setScale(1.2);
        powerupIcon.setTint(color);
        powerupIcon.setBlendMode(Phaser.BlendModes.ADD);
        
        // Add pulsing effect to powerup
        this.tweens.add({
            targets: powerupIcon,
            scale: 1.4,
            duration: 800,
            yoyo: true,
            repeat: -1
        });
        
        // Handle RAPID COOLING specially - it's problematic
        if (title === 'RAPID COOLING') {
            // Create a RAPID COOLING title as a sprite
            const titleBackground = this.add.rectangle(x - 30, y - 8, 150, 18, 0x000022, 0.7);
            
            // Create text with specific settings
            const rapidText = this.add.text(x - 90, y - 8, 'RAPID COOLING', {
                fontFamily: '"Press Start 2P"',
                fontSize: '9px',
                align: 'left',
                fill: '#' + color.toString(16)
            });
            
            // Make sure it's visible by bringing to top
            rapidText.setDepth(10);
        } else {
            // Regular title text for other powerups
            this.add.text(x - 90, y - 8, title, {
                fontFamily: '"Press Start 2P"',
                fontSize: '9px',
                align: 'left',
                fill: '#' + color.toString(16)
            });
        }
        
        // Add description text - position based on whether it's RAPID COOLING
        const descY = title === 'RAPID COOLING' ? y + 6 : y + 5;
        this.add.text(x - 90, descY, description, {
            fontFamily: '"Press Start 2P"',
            fontSize: '8px',
            align: 'left',
            fill: '#AAAAAA'
        });
    }

    update() {
        // Scroll background for parallax effect
        this.background.tilePositionY -= 0.5;
    }
} 