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
import { Level3Scene } from './scenes/Level3Scene.js';
import { Level4Scene } from './scenes/Level4Scene.js';
import { Level5Scene } from './scenes/Level5Scene.js';

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
    scene: [WelcomeScene, Level1Scene, Level2Scene, Level3Scene, Level4Scene, Level5Scene]
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

// Track if handlers have been set up to prevent duplicate calls
let handlersSetup = false;

/**
 * Initialize Event Handlers
 * Ensures setupEventHandlers is only called once, regardless of document state
 */
function initializeHandlers() {
    if (handlersSetup) {
        console.log('Handlers already set up, skipping duplicate initialization');
        return;
    }
    
    console.log('Setting up event handlers for the first time');
    handlersSetup = true;
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
}

// Set up handlers when DOM is ready
if (document.readyState === 'loading') {
    console.log('Document still loading, waiting for DOMContentLoaded...');
    document.addEventListener('DOMContentLoaded', initializeHandlers);
} else {
    console.log('Document already loaded, setting up handlers immediately');
    initializeHandlers();
}

/**
 * Setup Event Handlers for UI Controls
 * 
 * Attaches click event listeners to all interactive UI elements (buttons).
 * These handlers bridge the gap between the HTML UI and the Phaser game scenes.
 */
function setupEventHandlers() {
    /**
     * Start/Pause/Resume Button Handler
     * 
     * Toggles simulation state based on current status:
     * - Not running → Start simulation
     * - Running and not paused → Pause simulation
     * - Running and paused → Resume simulation
     */
    const startBtn = document.getElementById('btn-start');
    console.log('Attaching click handler to start button:', startBtn);
    
    if (startBtn) {
        startBtn.addEventListener('click', () => {
            console.log('START BUTTON CLICKED!');
            console.log('Current GameState:', {
                isRunning: GameState.isRunning,
                isPaused: GameState.isPaused,
                isGameOver: GameState.isGameOver
            });
            
            // Get references to all level scenes
            const level1Scene = game.scene.getScene('Level1Scene');
            const level2Scene = game.scene.getScene('Level2Scene');
            const level3Scene = game.scene.getScene('Level3Scene');
            const level4Scene = game.scene.getScene('Level4Scene');
            const level5Scene = game.scene.getScene('Level5Scene');
            
            console.log('Level1Scene active?', level1Scene?.sys.settings.active);
            console.log('Level2Scene active?', level2Scene?.sys.settings.active);
            console.log('Level3Scene active?', level3Scene?.sys.settings.active);
            console.log('Level4Scene active?', level4Scene?.sys.settings.active);
            console.log('Level5Scene active?', level5Scene?.sys.settings.active);
            
            // Determine which scene is currently active
            const activeScene = (level1Scene && level1Scene.sys.settings.active) ? level1Scene :
                               (level2Scene && level2Scene.sys.settings.active) ? level2Scene :
                               (level3Scene && level3Scene.sys.settings.active) ? level3Scene :
                               (level4Scene && level4Scene.sys.settings.active) ? level4Scene :
                               (level5Scene && level5Scene.sys.settings.active) ? level5Scene : null;
            
            console.log('Active scene:', activeScene);
            
            if (!activeScene) {
                console.error('No active scene found!');
                return; // No active scene, exit
            }
            
            // Handle different states
            if (!GameState.isRunning) {
                // Not running → Start simulation
                console.log('Calling startSimulation()');
                activeScene.startSimulation();
            } else if (GameState.isPaused) {
                // Running but paused → Resume simulation
                console.log('Calling resumeSimulation()');
                activeScene.resumeSimulation();
            } else {
                // Running and not paused → Pause simulation
                console.log('Calling pauseSimulation()');
                activeScene.pauseSimulation();
            }
        });
    } else {
        console.error('Start button not found!');
    }

    /**
     * Reset Button Handler
     * 
     * Restarts the current level from the beginning.
     * This completely resets the scene, clearing all state and UI.
     */
    document.getElementById('btn-reset').addEventListener('click', () => {
        // Get references to all level scenes
        const level1Scene = game.scene.getScene('Level1Scene');
        const level2Scene = game.scene.getScene('Level2Scene');
        const level3Scene = game.scene.getScene('Level3Scene');
        const level4Scene = game.scene.getScene('Level4Scene');
        const level5Scene = game.scene.getScene('Level5Scene');
        
        // Restart whichever scene is currently active
        if (level1Scene && level1Scene.sys.settings.active) {
            level1Scene.scene.restart();
        } else if (level2Scene && level2Scene.sys.settings.active) {
            level2Scene.scene.restart();
        } else if (level3Scene && level3Scene.sys.settings.active) {
            level3Scene.scene.restart();
        } else if (level4Scene && level4Scene.sys.settings.active) {
            level4Scene.scene.restart();
        } else if (level5Scene && level5Scene.sys.settings.active) {
            level5Scene.scene.restart();
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
            
            // Find all app servers (supports both single 'App' and multiple 'App1', 'App2', etc.)
            const appServers = Object.keys(GameState.nodes)
                .filter(key => key.startsWith('App') || key === 'App')
                .map(key => GameState.nodes[key])
                .filter(app => app && app.active);
            
            // Upgrade all app servers
            appServers.forEach(app => {
                if (app && app.upgrade) {
                    app.upgrade();
                }
            });
            
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
        // Get references to all level scenes
        const level1Scene = game.scene.getScene('Level1Scene');
        const level2Scene = game.scene.getScene('Level2Scene');
        const level3Scene = game.scene.getScene('Level3Scene');
        const level4Scene = game.scene.getScene('Level4Scene');
        
        // Restart whichever scene is currently active
        if (level1Scene && level1Scene.sys.settings.active) {
            level1Scene.scene.restart();
        } else if (level2Scene && level2Scene.sys.settings.active) {
            level2Scene.scene.restart();
        } else if (level3Scene && level3Scene.sys.settings.active) {
            level3Scene.scene.restart();
        } else if (level4Scene && level4Scene.sys.settings.active) {
            level4Scene.scene.restart();
        }
    });

    /**
     * Modal Next Level Button Handler
     * 
     * Appears in the result modal when a level is successfully completed.
     * Transitions the player to the next level.
     */
    document.getElementById('btn-modal-next').addEventListener('click', () => {
        // Get references to all level scenes
        const level1Scene = game.scene.getScene('Level1Scene');
        const level2Scene = game.scene.getScene('Level2Scene');
        const level3Scene = game.scene.getScene('Level3Scene');
        const level4Scene = game.scene.getScene('Level4Scene');
        
        // Transition to appropriate next level
        if (level1Scene && level1Scene.sys.settings.active) {
            level1Scene.scene.start('Level2Scene');
        } else if (level2Scene && level2Scene.sys.settings.active) {
            level2Scene.scene.start('Level3Scene');
        } else if (level3Scene && level3Scene.sys.settings.active) {
            level3Scene.scene.start('Level4Scene');
        } else if (level4Scene && level4Scene.sys.settings.active) {
            level4Scene.scene.start('Level5Scene');
        }
    });

    /**
     * Skip Level Button Handler
     * 
     * Debug/testing feature that allows bypassing the current level.
     * Useful for development and testing different levels quickly.
     */
    document.getElementById('btn-skip').addEventListener('click', () => {
        // Get references to all level scenes
        const level1Scene = game.scene.getScene('Level1Scene');
        const level2Scene = game.scene.getScene('Level2Scene');
        const level3Scene = game.scene.getScene('Level3Scene');
        const level4Scene = game.scene.getScene('Level4Scene');
        const level5Scene = game.scene.getScene('Level5Scene');
        
        // Call the skipLevel method on whichever scene is currently active
        if (level1Scene && level1Scene.sys.settings.active) {
            level1Scene.skipLevel();
        } else if (level2Scene && level2Scene.sys.settings.active) {
            level2Scene.skipLevel();
        } else if (level3Scene && level3Scene.sys.settings.active) {
            level3Scene.skipLevel();
        } else if (level4Scene && level4Scene.sys.settings.active) {
            level4Scene.skipLevel();
        } else if (level5Scene && level5Scene.sys.settings.active) {
            level5Scene.skipLevel();
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
                const level3Scene = game.scene.getScene('Level3Scene');
                const level4Scene = game.scene.getScene('Level4Scene');
                const level5Scene = game.scene.getScene('Level5Scene');
                if (welcomeScene) game.scene.stop('WelcomeScene');
                if (level2Scene) game.scene.stop('Level2Scene');
                if (level3Scene) game.scene.stop('Level3Scene');
                if (level4Scene) game.scene.stop('Level4Scene');
                if (level5Scene) game.scene.stop('Level5Scene');
                // Start Level 1
                game.scene.start('Level1Scene');
                // Reset dropdown to default
                setTimeout(() => { levelSelector.value = ''; }, 100);
            } else if (selectedLevel === '2') {
                console.log('Switching to Level 2');
                // Stop all other scenes
                const welcomeScene = game.scene.getScene('WelcomeScene');
                const level1Scene = game.scene.getScene('Level1Scene');
                const level3Scene = game.scene.getScene('Level3Scene');
                const level4Scene = game.scene.getScene('Level4Scene');
                const level5Scene = game.scene.getScene('Level5Scene');
                if (welcomeScene) game.scene.stop('WelcomeScene');
                if (level1Scene) game.scene.stop('Level1Scene');
                if (level3Scene) game.scene.stop('Level3Scene');
                if (level4Scene) game.scene.stop('Level4Scene');
                if (level5Scene) game.scene.stop('Level5Scene');
                // Start Level 2
                game.scene.start('Level2Scene');
                // Reset dropdown to default
                setTimeout(() => { levelSelector.value = ''; }, 100);
            } else if (selectedLevel === '3') {
                console.log('Switching to Level 3');
                // Stop all other scenes
                const welcomeScene = game.scene.getScene('WelcomeScene');
                const level1Scene = game.scene.getScene('Level1Scene');
                const level2Scene = game.scene.getScene('Level2Scene');
                const level4Scene = game.scene.getScene('Level4Scene');
                const level5Scene = game.scene.getScene('Level5Scene');
                if (welcomeScene) game.scene.stop('WelcomeScene');
                if (level1Scene) game.scene.stop('Level1Scene');
                if (level2Scene) game.scene.stop('Level2Scene');
                if (level4Scene) game.scene.stop('Level4Scene');
                if (level5Scene) game.scene.stop('Level5Scene');
                // Start Level 3
                game.scene.start('Level3Scene');
                // Reset dropdown to default
                setTimeout(() => { levelSelector.value = ''; }, 100);
            } else if (selectedLevel === '4') {
                console.log('Switching to Level 4');
                // Stop all other scenes
                const welcomeScene = game.scene.getScene('WelcomeScene');
                const level1Scene = game.scene.getScene('Level1Scene');
                const level2Scene = game.scene.getScene('Level2Scene');
                const level3Scene = game.scene.getScene('Level3Scene');
                const level5Scene = game.scene.getScene('Level5Scene');
                if (welcomeScene) game.scene.stop('WelcomeScene');
                if (level1Scene) game.scene.stop('Level1Scene');
                if (level2Scene) game.scene.stop('Level2Scene');
                if (level3Scene) game.scene.stop('Level3Scene');
                if (level5Scene) game.scene.stop('Level5Scene');
                // Start Level 4
                game.scene.start('Level4Scene');
                // Reset dropdown to default
                setTimeout(() => { levelSelector.value = ''; }, 100);
            } else if (selectedLevel === '5') {
                console.log('Switching to Level 5');
                // Stop all other scenes
                const welcomeScene = game.scene.getScene('WelcomeScene');
                const level1Scene = game.scene.getScene('Level1Scene');
                const level2Scene = game.scene.getScene('Level2Scene');
                const level3Scene = game.scene.getScene('Level3Scene');
                const level4Scene = game.scene.getScene('Level4Scene');
                if (welcomeScene) game.scene.stop('WelcomeScene');
                if (level1Scene) game.scene.stop('Level1Scene');
                if (level2Scene) game.scene.stop('Level2Scene');
                if (level3Scene) game.scene.stop('Level3Scene');
                if (level4Scene) game.scene.stop('Level4Scene');
                // Start Level 5
                game.scene.start('Level5Scene');
                // Reset dropdown to default
                setTimeout(() => { levelSelector.value = ''; }, 100);
            }
        });
        console.log('Level selector event listener attached');
    } else {
        console.error('Level selector element not found!');
    }

    /**
     * Zoom In Button Handler
     * 
     * Increases the camera zoom level (zoom in).
     */
    document.getElementById('btn-zoom-in').addEventListener('click', () => {
        const level1Scene = game.scene.getScene('Level1Scene');
        const level2Scene = game.scene.getScene('Level2Scene');
        const level3Scene = game.scene.getScene('Level3Scene');
        const level4Scene = game.scene.getScene('Level4Scene');
        const level5Scene = game.scene.getScene('Level5Scene');
        
        const activeScene = (level1Scene && level1Scene.sys.settings.active) ? level1Scene :
                           (level2Scene && level2Scene.sys.settings.active) ? level2Scene :
                           (level3Scene && level3Scene.sys.settings.active) ? level3Scene :
                           (level4Scene && level4Scene.sys.settings.active) ? level4Scene :
                           (level5Scene && level5Scene.sys.settings.active) ? level5Scene : null;
        
        if (activeScene && activeScene.adjustZoom) {
            activeScene.adjustZoom(0.1);
        }
    });

    /**
     * Zoom Out Button Handler
     * 
     * Decreases the camera zoom level (zoom out).
     */
    document.getElementById('btn-zoom-out').addEventListener('click', () => {
        const level1Scene = game.scene.getScene('Level1Scene');
        const level2Scene = game.scene.getScene('Level2Scene');
        const level3Scene = game.scene.getScene('Level3Scene');
        const level4Scene = game.scene.getScene('Level4Scene');
        
        const activeScene = (level1Scene && level1Scene.sys.settings.active) ? level1Scene :
                           (level2Scene && level2Scene.sys.settings.active) ? level2Scene :
                           (level3Scene && level3Scene.sys.settings.active) ? level3Scene :
                           (level4Scene && level4Scene.sys.settings.active) ? level4Scene : null;
        
        if (activeScene && activeScene.adjustZoom) {
            activeScene.adjustZoom(-0.1);
        }
    });

    /**
     * Reset Zoom Button Handler
     * 
     * Resets the camera zoom to 100% (default).
     */
    document.getElementById('btn-zoom-reset').addEventListener('click', () => {
        const level1Scene = game.scene.getScene('Level1Scene');
        const level2Scene = game.scene.getScene('Level2Scene');
        const level3Scene = game.scene.getScene('Level3Scene');
        const level4Scene = game.scene.getScene('Level4Scene');
        
        const activeScene = (level1Scene && level1Scene.sys.settings.active) ? level1Scene :
                           (level2Scene && level2Scene.sys.settings.active) ? level2Scene :
                           (level3Scene && level3Scene.sys.settings.active) ? level3Scene :
                           (level4Scene && level4Scene.sys.settings.active) ? level4Scene : null;
        
        if (activeScene && activeScene.resetZoom) {
            activeScene.resetZoom();
        }
    });
}
