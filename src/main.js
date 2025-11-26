/**
 * Main Entry Point - Application Bootstrap
 * 
 * This is the main entry point for the Architecture Simulator application.
 * It handles:
 * 1. Initializing the Phaser game engine with configuration
 * 2. Setting up all UI event handlers for buttons
 * 3. Managing window resize events
 * 4. Coordinating between the DOM UI and Phaser game scenes
 */

// Import game configuration and state management
import { CONFIG, GameState } from './config.js';
// Import UI update utilities
import { updateUI } from './utils/uiManager.js';
// Import all game scenes
import { WelcomeScene } from './scenes/WelcomeScene.js';
import { Level1Scene } from './scenes/Level1Scene.js';
import { Level2Scene } from './scenes/Level2Scene.js';

/**
 * Phaser Game Configuration Object
 * 
 * Defines how the Phaser game engine should initialize and render.
 * This configuration controls the canvas size, rendering mode, scaling behavior, etc.
 */
const gameConfig = {
    type: Phaser.AUTO,              // Auto-detect WebGL or Canvas rendering (prefers WebGL)
    parent: 'game-container',       // DOM element ID where the canvas will be injected
    width: window.innerWidth,       // Initial canvas width (full window width)
    height: window.innerHeight,     // Initial canvas height (full window height)
    backgroundColor: '#2a2a2a',     // Light gray background color for the canvas
    
    /**
     * Scale Manager Configuration
     * Controls how the game canvas responds to window size changes
     */
    scale: { 
        mode: Phaser.Scale.RESIZE,      // Canvas resizes to match container size dynamically
        autoCenter: Phaser.Scale.NO_CENTER  // Don't auto-center (we handle positioning via CSS)
    },
    
    /**
     * Scene Array - Defines all game scenes in order
     * Scenes are the different "screens" or "levels" of the game
     * First scene in array (WelcomeScene) will be the default starting scene
     */
    scene: [WelcomeScene, Level1Scene, Level2Scene]
};

/**
 * Initialize the Phaser Game Instance
 * This creates the game engine and starts it with the configuration above
 */
const game = new Phaser.Game(gameConfig);

/**
 * Window Resize Event Handler
 * 
 * Ensures the game canvas properly resizes when the browser window changes size.
 * This is necessary because our UI uses a flexbox layout where the game container
 * size changes based on available space.
 */
window.addEventListener('resize', () => {
    // Get the game container element from the DOM
    const container = document.getElementById('game-container');
    
    // If container exists and game scale manager is available
    if (container && game.scale) {
        // Resize the Phaser canvas to match the container's current dimensions
        game.scale.resize(container.clientWidth, container.clientHeight);
    }
});

/**
 * DOM Content Loaded Event Handler
 * 
 * Fires when the HTML document has been completely loaded and parsed.
 * This ensures all DOM elements exist before we try to attach event listeners.
 */
console.log('Script loaded, waiting for DOM...');

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content Loaded - setting up event handlers');
    // Set up all button event handlers
    setupEventHandlers();
    
    /**
     * Initial Resize with Delay
     * 
     * Perform an initial resize after a short delay to ensure the container
     * has finished rendering and has its final dimensions.
     * This prevents issues where the canvas might be sized incorrectly on first load.
     */
    setTimeout(() => {
        const container = document.getElementById('game-container');
        if (container && game.scale) {
            game.scale.resize(container.clientWidth, container.clientHeight);
        }
    }, 100); // 100ms delay
});

// Also try to set up immediately in case DOM is already loaded
if (document.readyState === 'loading') {
    console.log('Document still loading...');
} else {
    console.log('Document already loaded, setting up handlers immediately');
    setupEventHandlers();
}

/**
 * Setup Event Handlers for UI Controls
 * 
 * Attaches click event listeners to all interactive UI elements (buttons).
 * These handlers bridge the gap between the HTML UI and the Phaser game scenes.
 */
function setupEventHandlers() {
    /**
     * Start Button Handler
     * 
     * Initiates the simulation in whichever level is currently active.
     * The button triggers request generation to begin.
     */
    document.getElementById('btn-start').addEventListener('click', () => {
        // Get references to both level scenes
        const level1Scene = game.scene.getScene('Level1Scene');
        const level2Scene = game.scene.getScene('Level2Scene');
        
        // Check which scene is currently active and start its simulation
        if (level1Scene && level1Scene.sys.settings.active) {
            level1Scene.startSimulation();
        } else if (level2Scene && level2Scene.sys.settings.active) {
            level2Scene.startSimulation();
        }
    });

    /**
     * Reset Button Handler
     * 
     * Restarts the current level from the beginning.
     * This completely resets the scene, clearing all state and UI.
     */
    document.getElementById('btn-reset').addEventListener('click', () => {
        // Get references to both level scenes
        const level1Scene = game.scene.getScene('Level1Scene');
        const level2Scene = game.scene.getScene('Level2Scene');
        
        // Restart whichever scene is currently active
        if (level1Scene && level1Scene.sys.settings.active) {
            level1Scene.scene.restart();
        } else if (level2Scene && level2Scene.sys.settings.active) {
            level2Scene.scene.restart();
        }
    });

    /**
     * Upgrade Button Handler
     * 
     * Purchases an upgrade for the main application server.
     * Only works if player has enough money (checked before executing).
     * Deducts money, upgrades the server capacity, and updates the UI.
     */
    document.getElementById('btn-upgrade').addEventListener('click', () => {
        // Check if player has sufficient funds for upgrade
        if (GameState.money >= CONFIG.upgradeCost) {
            // Deduct the upgrade cost from player's money
            GameState.money -= CONFIG.upgradeCost;
            
            // Get reference to the main application server node
            const app = GameState.nodes['App'];
            
            // If the node exists, upgrade it (increases capacity)
            if (app) {
                app.upgrade();
            }
            
            // Update the UI to reflect new money amount and node capacity
            updateUI();
        }
        // Note: If insufficient funds, nothing happens (button should be disabled via UI)
    });

    /**
     * Modal Retry Button Handler
     * 
     * Appears in the result modal when a level is completed (win or lose).
     * Allows player to retry the same level.
     */
    document.getElementById('btn-modal-retry').addEventListener('click', () => {
        // Get references to both level scenes
        const level1Scene = game.scene.getScene('Level1Scene');
        const level2Scene = game.scene.getScene('Level2Scene');
        
        // Restart whichever scene is currently active
        if (level1Scene && level1Scene.sys.settings.active) {
            level1Scene.scene.restart();
        } else if (level2Scene && level2Scene.sys.settings.active) {
            level2Scene.scene.restart();
        }
    });

    /**
     * Modal Next Level Button Handler
     * 
     * Appears in the result modal when Level 1 is successfully completed.
     * Transitions the player to Level 2.
     */
    document.getElementById('btn-modal-next').addEventListener('click', () => {
        // Get reference to Level 1 scene
        const level1Scene = game.scene.getScene('Level1Scene');
        
        // If Level 1 is currently active, transition to Level 2
        if (level1Scene && level1Scene.sys.settings.active) {
            level1Scene.scene.start('Level2Scene');
        }
    });

    /**
     * Skip Level Button Handler
     * 
     * Debug/testing feature that allows bypassing the current level.
     * Useful for development and testing different levels quickly.
     */
    document.getElementById('btn-skip').addEventListener('click', () => {
        // Get references to both level scenes
        const level1Scene = game.scene.getScene('Level1Scene');
        const level2Scene = game.scene.getScene('Level2Scene');
        
        // Call the skipLevel method on whichever scene is currently active
        if (level1Scene && level1Scene.sys.settings.active) {
            level1Scene.skipLevel();
        } else if (level2Scene && level2Scene.sys.settings.active) {
            level2Scene.skipLevel();
        }
    });

    /**
     * Level Selection Dropdown Handler
     * 
     * Allows player to switch between different levels using a dropdown menu.
     * Listens for changes to the select element.
     */
    const levelSelector = document.getElementById('level-selector');
    if (levelSelector) {
        levelSelector.addEventListener('change', (event) => {
            const selectedLevel = event.target.value;
            console.log('Level selected:', selectedLevel);
            
            if (selectedLevel === '1') {
                console.log('Switching to Level 1');
                // Stop all other scenes
                const welcomeScene = game.scene.getScene('WelcomeScene');
                const level2Scene = game.scene.getScene('Level2Scene');
                if (welcomeScene) game.scene.stop('WelcomeScene');
                if (level2Scene) game.scene.stop('Level2Scene');
                // Start Level 1
                game.scene.start('Level1Scene');
                // Reset dropdown to default
                setTimeout(() => { levelSelector.value = ''; }, 100);
            } else if (selectedLevel === '2') {
                console.log('Switching to Level 2');
                // Stop all other scenes
                const welcomeScene = game.scene.getScene('WelcomeScene');
                const level1Scene = game.scene.getScene('Level1Scene');
                if (welcomeScene) game.scene.stop('WelcomeScene');
                if (level1Scene) game.scene.stop('Level1Scene');
                // Start Level 2
                game.scene.start('Level2Scene');
                // Reset dropdown to default
                setTimeout(() => { levelSelector.value = ''; }, 100);
            }
        });
        console.log('Level selector event listener attached');
    } else {
        console.error('Level selector element not found!');
    }
}
