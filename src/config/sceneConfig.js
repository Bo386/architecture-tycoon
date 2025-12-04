/**
 * Scene Configuration
 * 
 * Centralized configuration for all game scenes.
 * This configuration drives the SceneManager's behavior.
 * 
 * Each scene configuration object contains:
 * - key: The Phaser scene key (must match the scene's constructor key)
 * - isLevel: Whether this is a gameplay level (vs menu/welcome screen)
 * - levelNumber: The level number (1-8) if isLevel is true
 * - title: The display title of the level
 * - nextLevel: The key of the next level (if any)
 * - description: Brief description of what this level teaches
 */

export const SCENE_CONFIG = [
    {
        key: 'WelcomeScene',
        isLevel: false,
        levelNumber: null,
        title: 'Welcome',
        nextLevel: 'ChapterSelectScene',
        description: 'Welcome screen'
    },
    {
        key: 'ChapterSelectScene',
        isLevel: false,
        levelNumber: null,
        title: 'Chapter Selection',
        nextLevel: 'Level1Scene',
        description: 'Select a chapter to play'
    },
    {
        key: 'Level1Scene',
        isLevel: true,
        levelNumber: 1,
        title: 'Monolithic Architecture',
        nextLevel: 'Level2Scene',
        description: 'Learn the basics: Single server handling all requests'
    },
    {
        key: 'Level2Scene',
        isLevel: true,
        levelNumber: 2,
        title: 'Database Integration',
        nextLevel: 'Level3Scene',
        description: 'Separate database tier for data persistence'
    },
    {
        key: 'Level3Scene',
        isLevel: true,
        levelNumber: 3,
        title: 'Database Scaling',
        nextLevel: 'Level4Scene',
        description: 'Scale database horizontally with read replicas'
    },
    {
        key: 'Level4Scene',
        isLevel: true,
        levelNumber: 4,
        title: 'App Server Scaling',
        nextLevel: 'Level5Scene',
        description: 'Scale application tier with multiple servers'
    },
    {
        key: 'Level5Scene',
        isLevel: true,
        levelNumber: 5,
        title: 'Cache Layer',
        nextLevel: 'Level6Scene',
        description: 'Add caching to reduce database load'
    },
    {
        key: 'Level6Scene',
        isLevel: true,
        levelNumber: 6,
        title: 'Load Balancer',
        nextLevel: 'Level7Scene',
        description: 'Distribute traffic across multiple servers'
    },
    {
        key: 'Level7Scene',
        isLevel: true,
        levelNumber: 7,
        title: 'CDN Layer',
        nextLevel: 'Level8Scene',
        description: 'Serve static content from edge locations'
    },
    {
        key: 'Level8Scene',
        isLevel: true,
        levelNumber: 8,
        title: 'Read Replicas',
        nextLevel: 'Level9Scene',
        description: 'Read/write separation with read replicas'
    },
    {
        key: 'Level9Scene',
        isLevel: true,
        levelNumber: 9,
        title: 'Message Queue',
        nextLevel: null,
        description: 'Asynchronous processing with Pubsub queues'
    }
];

/**
 * Get scene configuration by key
 * 
 * @param {string} sceneKey - The scene key to look up
 * @returns {Object|null} The scene configuration, or null if not found
 */
export function getSceneConfig(sceneKey) {
    return SCENE_CONFIG.find(config => config.key === sceneKey) || null;
}

/**
 * Get all level scenes (excluding non-level scenes like WelcomeScene)
 * 
 * @returns {Array} Array of level scene configurations
 */
export function getLevelConfigs() {
    return SCENE_CONFIG.filter(config => config.isLevel);
}

/**
 * Get scene configuration by level number
 * 
 * @param {number} levelNumber - The level number (1-8)
 * @returns {Object|null} The scene configuration, or null if not found
 */
export function getSceneByLevel(levelNumber) {
    return SCENE_CONFIG.find(
        config => config.isLevel && config.levelNumber === levelNumber
    ) || null;
}

/**
 * Get the total number of levels
 * 
 * @returns {number} The total number of levels
 */
export function getTotalLevels() {
    return SCENE_CONFIG.filter(config => config.isLevel).length;
}
