/**
 * Game Configuration Module
 * 
 * This is the central configuration file that defines all game constants,
 * visual settings, and maintains the global game state. It exports:
 * - CONFIG: Static configuration values (colors, costs, targets)
 * - GameState: Runtime game state (mutable during gameplay)
 * - resetGameState: Function to reset the game state between levels
 */

/**
 * CONFIG - Static Game Configuration
 * Contains all constant values used throughout the game
 * These values should not be modified during runtime
 */
export const CONFIG = {
    /**
     * Color palette for all visual elements in the game
     * All colors are in hexadecimal format (0xRRGGBB)
     */
    colors: {
        bg: 0x1e1e1e,          // Background color - dark gray for the game canvas
        node: 0x252526,         // Server node fill color - slightly lighter gray
        nodeBorder: 0x4fc1ff,   // Server node border color - bright cyan for visibility
        packetReq: 0x00ffff,    // Read request packet color - cyan (matches legend)
        packetWrite: 0xff6b35,  // Write/update request packet color - orange
        packetRes: 0xffd700,    // Response packet color - gold (matches legend)
        linkReq: 0x005555,      // Request link/connection color - dark cyan
        linkRes: 0x554400       // Response link/connection color - dark gold
    },
    
    /**
     * Request Type Configuration
     */
    writeRequestPercentage: 30,  // Percentage of requests that are write operations (30%)
    
    /**
     * Game Economics
     */
    upgradeCost: 200,           // Cost in dollars to upgrade a server's capacity
    
    /**
     * Win Conditions for Different Levels
     */
    targetTotal: 1000,          // Level 1: Total requests that must be processed to complete
    maxErrorRate: 1.0,          // Maximum acceptable error rate percentage (1% = 1.0)
    level2Target: 100           // Level 2: Reduced target (only needs 100 requests)
};

/**
 * GameState - Mutable Runtime Game State
 * 
 * This object tracks all dynamic game state during gameplay.
 * It's modified as the player progresses through the simulation.
 * All properties here are reset when starting/restarting a level.
 */
export const GameState = {
    /**
     * Player Resources
     */
    money: 500,                 // Current budget for purchasing upgrades (starts at $500)
    
    /**
     * Request Processing Statistics
     * These track the overall performance of the architecture
     */
    success: 0,                 // Count of successfully processed requests
    errors: 0,                  // Count of failed/timed-out requests
    total: 0,                   // Total requests processed (success + errors)
    
    /**
     * Architecture State
     */
    nodes: {},                  // Object storing all server node instances (key: nodeId, value: ServerNode)
    
    /**
     * Simulation State Flags
     */
    isRunning: false,           // Whether the simulation is currently active (requests being generated)
    isGameOver: false,          // Whether the level has ended (win or lose)
    
    /**
     * Difficulty Progression
     */
    difficultyLevel: 0,         // Current difficulty level (increases during gameplay, affects concurrency)
    
    /**
     * Level Tracking
     */
    currentLevel: 1,            // Current level number (1 = monolithic, 2 = microservices)
    
    /**
     * Database Storage State
     * Tracks how much data has been written to the database
     * Storage growth affects database performance (slower as it grows)
     */
    databaseStorage: 0          // Current database storage size (increases with write operations)
};

/**
 * Reset Game State
 * 
 * Resets all game state properties to their initial values.
 * Called when starting a new level or restarting the current level.
 * 
 * @param {number} level - The level number to initialize (default: 1)
 *                         This determines which level configuration to use
 */
export const resetGameState = (level = 1) => {
    // Reset player resources to starting values
    GameState.money = 500;
    
    // Clear all request processing statistics
    GameState.success = 0;
    GameState.errors = 0;
    GameState.total = 0;
    
    // Clear all server nodes (will be recreated by the level scene)
    GameState.nodes = {};
    
    // Reset simulation state flags
    GameState.isRunning = false;
    GameState.isGameOver = false;
    
    // Reset difficulty to initial level
    GameState.difficultyLevel = 0;
    
    // Set the current level
    GameState.currentLevel = level;
    
    // Reset database storage (only relevant for Level 2+)
    GameState.databaseStorage = 0;
};
