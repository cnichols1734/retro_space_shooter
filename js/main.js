// Game configuration
const config = {
    type: Phaser.AUTO,
    width: 1000,
    height: 800,
    parent: 'game-container',
    pixelArt: true, // For crisp pixel rendering
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: [
        BootScene,
        TitleScene,
        GameScene,
        GameOverScene
    ]
};

// Create game instance
const game = new Phaser.Game(config);

// Global game settings and state
window.GAME = {
    score: 0,
    highScore: 0,
    // Constants
    PLAYER_SPEED: 300,
    ENEMY_SPEED: 150,
    PROJECTILE_SPEED: 400,
    ENEMY_SPAWN_DELAY: 1000, // milliseconds
    DIFFICULTY_INCREASE_TIME: 10000, // 10 seconds
    // Sound FX volumes
    FX_VOLUME: 0.3,
    MUSIC_VOLUME: 0.2
}; 