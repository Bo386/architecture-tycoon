/**
 * Main Entry Point
 * Initializes Phaser game and sets up UI event handlers
 */

import { CONFIG, GameState } from './config.js';
import { updateUI } from './utils/uiManager.js';
import { WelcomeScene } from './scenes/WelcomeScene.js';
import { Level1Scene } from './scenes/Level1Scene.js';
import { Level2Scene } from './scenes/Level2Scene.js';

// Phaser Game Configuration
const gameConfig = {
    type: Phaser.AUTO,
    parent: 'game-container',
    width: 800,
    height: 600,
    backgroundColor: '#1e1e1e',
    scale: { 
        mode: Phaser.Scale.FIT, 
        autoCenter: Phaser.Scale.CENTER_BOTH 
    },
    scene: [WelcomeScene, Level1Scene, Level2Scene]
};

// Initialize game
const game = new Phaser.Game(gameConfig);

// UI Event Handlers
document.addEventListener('DOMContentLoaded', () => {
    setupEventHandlers();
});

function setupEventHandlers() {
    // Start button
    document.getElementById('btn-start').addEventListener('click', () => {
        const scene = game.scene.getScene('Level1Scene');
        if (scene && scene.sys.settings.active) {
            scene.startSimulation();
        }
    });

    // Reset button
    document.getElementById('btn-reset').addEventListener('click', () => {
        const scene = game.scene.getScene('Level1Scene');
        if (scene) {
            scene.scene.restart();
        }
    });

    // Upgrade button
    document.getElementById('btn-upgrade').addEventListener('click', () => {
        if (GameState.money >= CONFIG.upgradeCost) {
            GameState.money -= CONFIG.upgradeCost;
            const app = GameState.nodes['App'];
            if (app) {
                app.upgrade();
            }
            updateUI();
        }
    });

    // Modal retry button
    document.getElementById('btn-modal-retry').addEventListener('click', () => {
        const scene = game.scene.getScene('Level1Scene');
        if (scene) {
            scene.scene.restart();
        }
    });

    // Modal next level button
    document.getElementById('btn-modal-next').addEventListener('click', () => {
        const scene = game.scene.getScene('Level1Scene');
        if (scene) {
            scene.scene.start('Level2Scene');
        }
    });
}
