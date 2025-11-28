/**
 * SceneManager - Centralized Scene Management
 * 
 * This class provides a unified interface for managing all game scenes.
 * It eliminates code duplication and provides a clean API for scene operations.
 * 
 * Key Features:
 * - Centralized scene tracking and state management
 * - Simplified scene switching logic
 * - Method delegation to active scenes
 * - Automatic scene cleanup and transitions
 * 
 * @class SceneManager
 */
export class SceneManager {
    /**
     * Creates a new SceneManager instance
     * 
     * @param {Phaser.Game} game - The Phaser game instance
     */
    constructor(game) {
        this.game = game;
        this.sceneConfigs = [];        // Array of scene configuration objects
        this.sceneMap = new Map();     // Map of scene key -> config
        this.currentSceneKey = null;   // Currently active scene key
    }

    /**
     * Initialize the scene manager with scene configurations
     * 
     * @param {Array} sceneConfigs - Array of scene configuration objects
     * @example
     * sceneManager.initialize([
     *   { key: 'Level1Scene', isLevel: true, levelNumber: 1, nextLevel: 'Level2Scene' },
     *   { key: 'Level2Scene', isLevel: true, levelNumber: 2, nextLevel: 'Level3Scene' }
     * ]);
     */
    initialize(sceneConfigs) {
        this.sceneConfigs = sceneConfigs;
        
        // Build scene map for quick lookups
        sceneConfigs.forEach(config => {
            this.sceneMap.set(config.key, config);
        });
        
        console.log('SceneManager initialized with', sceneConfigs.length, 'scenes');
    }

    /**
     * Get the currently active scene instance
     * 
     * @returns {Phaser.Scene|null} The active scene instance, or null if none found
     */
    getActiveScene() {
        // Check all registered scenes to find the active one
        for (const config of this.sceneConfigs) {
            const scene = this.game.scene.getScene(config.key);
            if (scene && scene.sys.settings.active) {
                this.currentSceneKey = config.key;
                return scene;
            }
        }
        
        return null;
    }

    /**
     * Get the configuration of the currently active scene
     * 
     * @returns {Object|null} The active scene configuration, or null if none found
     */
    getActiveSceneConfig() {
        const activeScene = this.getActiveScene();
        if (!activeScene) return null;
        
        return this.sceneMap.get(this.currentSceneKey);
    }

    /**
     * Switch to a specific scene by its key
     * 
     * @param {string} sceneKey - The key of the scene to switch to
     * @param {boolean} stopOthers - Whether to stop all other scenes (default: true)
     */
    switchToScene(sceneKey, stopOthers = true) {
        console.log('SceneManager: Switching to', sceneKey);
        
        // Validate scene exists
        if (!this.sceneMap.has(sceneKey)) {
            console.error(`SceneManager: Scene '${sceneKey}' not found in configuration`);
            return;
        }

        // Stop all other scenes if requested
        if (stopOthers) {
            this.sceneConfigs.forEach(config => {
                if (config.key !== sceneKey) {
                    const scene = this.game.scene.getScene(config.key);
                    if (scene) {
                        this.game.scene.stop(config.key);
                    }
                }
            });
        }

        // Start the target scene
        this.game.scene.start(sceneKey);
        this.currentSceneKey = sceneKey;
    }

    /**
     * Restart the currently active scene
     */
    restartCurrentScene() {
        const activeScene = this.getActiveScene();
        if (activeScene) {
            console.log('SceneManager: Restarting current scene');
            activeScene.scene.restart();
        } else {
            console.warn('SceneManager: No active scene to restart');
        }
    }

    /**
     * Go to the next level
     * Only works if the current scene has a 'nextLevel' configured
     */
    goToNextLevel() {
        const currentConfig = this.getActiveSceneConfig();
        
        if (!currentConfig) {
            console.warn('SceneManager: No active scene found');
            return;
        }

        if (!currentConfig.isLevel) {
            console.warn('SceneManager: Current scene is not a level');
            return;
        }

        if (!currentConfig.nextLevel) {
            console.warn('SceneManager: Current level has no next level configured');
            return;
        }

        console.log('SceneManager: Going to next level:', currentConfig.nextLevel);
        this.switchToScene(currentConfig.nextLevel);
    }

    /**
     * Go to the previous level
     * Finds the level with levelNumber = current - 1
     */
    goToPreviousLevel() {
        const currentConfig = this.getActiveSceneConfig();
        
        if (!currentConfig || !currentConfig.isLevel) {
            console.warn('SceneManager: Not in a level scene');
            return;
        }

        const previousLevelNum = currentConfig.levelNumber - 1;
        if (previousLevelNum < 1) {
            console.warn('SceneManager: Already at first level');
            return;
        }

        // Find previous level config
        const previousConfig = this.sceneConfigs.find(
            config => config.isLevel && config.levelNumber === previousLevelNum
        );

        if (previousConfig) {
            console.log('SceneManager: Going to previous level:', previousConfig.key);
            this.switchToScene(previousConfig.key);
        } else {
            console.error('SceneManager: Previous level not found');
        }
    }

    /**
     * Skip the current level (go to next level)
     * This is a convenience method that calls the scene's skipLevel method
     * and then transitions to the next level
     */
    skipCurrentLevel() {
        const activeScene = this.getActiveScene();
        const currentConfig = this.getActiveSceneConfig();
        
        if (!activeScene || !currentConfig) {
            console.warn('SceneManager: No active scene to skip');
            return;
        }

        // Call the scene's skipLevel method if it exists
        if (typeof activeScene.skipLevel === 'function') {
            activeScene.skipLevel();
        } else {
            // If scene doesn't have skipLevel, just go to next level
            this.goToNextLevel();
        }
    }

    /**
     * Switch to a level by its number
     * 
     * @param {number} levelNumber - The level number (1-8)
     */
    switchToLevel(levelNumber) {
        const levelConfig = this.sceneConfigs.find(
            config => config.isLevel && config.levelNumber === levelNumber
        );

        if (levelConfig) {
            this.switchToScene(levelConfig.key);
        } else {
            console.error(`SceneManager: Level ${levelNumber} not found`);
        }
    }

    /**
     * Execute a method on the currently active scene
     * 
     * @param {string} methodName - The name of the method to execute
     * @param {...any} args - Arguments to pass to the method
     * @returns {any} The return value of the method, or undefined if method doesn't exist
     * 
     * @example
     * sceneManager.executeOnActive('startSimulation');
     * sceneManager.executeOnActive('adjustZoom', 0.1);
     */
    executeOnActive(methodName, ...args) {
        const activeScene = this.getActiveScene();
        
        if (!activeScene) {
            console.warn(`SceneManager: No active scene to execute ${methodName}`);
            return;
        }

        if (typeof activeScene[methodName] !== 'function') {
            console.warn(`SceneManager: Active scene does not have method '${methodName}'`);
            return;
        }

        console.log(`SceneManager: Executing ${methodName} on active scene`);
        return activeScene[methodName](...args);
    }

    /**
     * Get all level scenes (scenes with isLevel: true)
     * 
     * @returns {Array} Array of level scene configurations
     */
    getLevelScenes() {
        return this.sceneConfigs.filter(config => config.isLevel);
    }

    /**
     * Get the total number of levels
     * 
     * @returns {number} The total number of levels
     */
    getTotalLevels() {
        return this.getLevelScenes().length;
    }

    /**
     * Get the current level number
     * 
     * @returns {number|null} The current level number, or null if not in a level
     */
    getCurrentLevelNumber() {
        const currentConfig = this.getActiveSceneConfig();
        return currentConfig && currentConfig.isLevel ? currentConfig.levelNumber : null;
    }

    /**
     * Check if a specific scene is active
     * 
     * @param {string} sceneKey - The scene key to check
     * @returns {boolean} True if the scene is active
     */
    isSceneActive(sceneKey) {
        const scene = this.game.scene.getScene(sceneKey);
        return scene ? scene.sys.settings.active : false;
    }

    /**
     * Get scene instance by key
     * 
     * @param {string} sceneKey - The scene key
     * @returns {Phaser.Scene|null} The scene instance, or null if not found
     */
    getScene(sceneKey) {
        return this.game.scene.getScene(sceneKey);
    }

    /**
     * Check if there is a next level available
     * 
     * @returns {boolean} True if there is a next level
     */
    hasNextLevel() {
        const currentConfig = this.getActiveSceneConfig();
        return currentConfig && currentConfig.isLevel && !!currentConfig.nextLevel;
    }

    /**
     * Check if there is a previous level available
     * 
     * @returns {boolean} True if there is a previous level
     */
    hasPreviousLevel() {
        const currentConfig = this.getActiveSceneConfig();
        if (!currentConfig || !currentConfig.isLevel) return false;
        
        return currentConfig.levelNumber > 1;
    }
}
