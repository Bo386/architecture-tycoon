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
    width: window.innerWidth,
    height: window.innerHeight,
    backgroundColor: '#000000',
    scale: { 
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.NO_CENTER
    },
    scene: [WelcomeScene, Level1Scene, Level2Scene]
};

// Initialize game
const game = new Phaser.Game(gameConfig);

// Handle window resize
window.addEventListener('resize', () => {
    const container = document.getElementById('game-container');
    if (container && game.scale) {
        game.scale.resize(container.clientWidth, container.clientHeight);
    }
});

// UI Event Handlers
document.addEventListener('DOMContentLoaded', () => {
    setupEventHandlers();
    // Initial resize to fit container
    setTimeout(() => {
        const container = document.getElementById('game-container');
        if (container && game.scale) {
            game.scale.resize(container.clientWidth, container.clientHeight);
        }
    }, 100);
});

function setupEventHandlers() {
    // Start button
    document.getElementById('btn-start').addEventListener('click', () => {
        const level1Scene = game.scene.getScene('Level1Scene');
        const level2Scene = game.scene.getScene('Level2Scene');
        
        if (level1Scene && level1Scene.sys.settings.active) {
            level1Scene.startSimulation();
        } else if (level2Scene && level2Scene.sys.settings.active) {
            level2Scene.startSimulation();
        }
    });

    // Reset button
    document.getElementById('btn-reset').addEventListener('click', () => {
        const level1Scene = game.scene.getScene('Level1Scene');
        const level2Scene = game.scene.getScene('Level2Scene');
        
        if (level1Scene && level1Scene.sys.settings.active) {
            level1Scene.scene.restart();
        } else if (level2Scene && level2Scene.sys.settings.active) {
            level2Scene.scene.restart();
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
        const level1Scene = game.scene.getScene('Level1Scene');
        const level2Scene = game.scene.getScene('Level2Scene');
        
        if (level1Scene && level1Scene.sys.settings.active) {
            level1Scene.scene.restart();
        } else if (level2Scene && level2Scene.sys.settings.active) {
            level2Scene.scene.restart();
        }
    });

    // Modal next level button
    document.getElementById('btn-modal-next').addEventListener('click', () => {
        const level1Scene = game.scene.getScene('Level1Scene');
        if (level1Scene && level1Scene.sys.settings.active) {
            level1Scene.scene.start('Level2Scene');
        }
    });

    // Skip level button
    document.getElementById('btn-skip').addEventListener('click', () => {
        const level1Scene = game.scene.getScene('Level1Scene');
        const level2Scene = game.scene.getScene('Level2Scene');
        
        if (level1Scene && level1Scene.sys.settings.active) {
            level1Scene.skipLevel();
        } else if (level2Scene && level2Scene.sys.settings.active) {
            level2Scene.skipLevel();
        }
    });
}
