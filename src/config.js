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
    level2Target: 800,          // Level 2: Increased target (requires 300 requests to test database scalability)
    level3Target: 1000,         // Level 3: Further increased target to test multi-database scalability
    
    /**
     * Level 2 Configuration
     * Server node initial stats and difficulty progression settings
     */
    level2: {
        // Initial traffic generation settings
        initialTrafficDelay: 2000,      // Initial delay between traffic waves (ms)
        initialPacketsPerWave: 1,       // Starting number of packets per wave
        difficultyInterval: 10000,      // Time between difficulty increases (ms)
        
        // Server node configurations
        servers: {
            user: {
                capacity: 999,          // User nodes have unlimited capacity
                speed: 10               // Instant request generation (ms)
            },
            app: {
                capacity: 5,            // App server initial capacity
                speed: 600              // App server initial processing speed (ms)
            },
            database: {
                capacity: 12,            // Database initial capacity (doubled from 3 to 6)
                speed: 400              // Database initial processing speed (doubled - reduced from 800ms to 400ms)
            }
        },
        
        // Difficulty progression stages
        difficulty: {
            stage1: {
                level: 1,
                trafficDelay: 1700,     // Reduce delay by 300ms
                packetsPerWave: 1,
                message: "Traffic increasing..."
            },
            stage2: {
                level: 2,
                trafficDelay: 1400,     // Continue reducing delay
                packetsPerWave: 1,
                message: "Traffic increasing..."
            },
            stage3: {
                level: 3,
                trafficDelay: 800,      // First spike
                packetsPerWave: 2,      // Increase to 2 packets per wave
                message: "⚠ Higher traffic load!"
            },
            stage4: {
                level: 4,
                trafficDelay: 600,
                packetsPerWave: 2,
                message: "Database under pressure..."
            },
            stage5: {
                level: 5,
                trafficDelay: 600,
                packetsPerWave: 2,
                message: "Database under pressure..."
            },
            stage6: {
                level: 6,
                trafficDelay: 400,      // Peak load
                packetsPerWave: 3,      // Maximum packets per wave
                message: "⛔ Peak load! Watch the database!"
            },
            stage7: {
                level: 7,
                trafficDelay: 400,
                packetsPerWave: 3,
                message: "Maximum database load"
            }
        }
    },
    
    /**
     * Level 3 Configuration
     * Same layout as Level 2 but with ability to add more database servers
     */
    level3: {
        // Initial traffic generation settings
        initialTrafficDelay: 2000,      // Initial delay between traffic waves (ms)
        initialPacketsPerWave: 1,       // Starting number of packets per wave
        difficultyInterval: 10000,      // Time between difficulty increases (ms)
        
        // Server node configurations
        servers: {
            user: {
                capacity: 999,          // User nodes have unlimited capacity
                speed: 10               // Instant request generation (ms)
            },
            app: {
                capacity: 5,            // App server initial capacity
                speed: 600              // App server initial processing speed (ms)
            },
            database: {
                capacity: 12,           // Database initial capacity
                speed: 400              // Database initial processing speed (ms)
            }
        },
        
        // Difficulty progression stages
        difficulty: {
            stage1: {
                level: 1,
                trafficDelay: 1700,
                packetsPerWave: 1,
                message: "Traffic increasing..."
            },
            stage2: {
                level: 2,
                trafficDelay: 1400,
                packetsPerWave: 1,
                message: "Traffic increasing..."
            },
            stage3: {
                level: 3,
                trafficDelay: 1000,
                packetsPerWave: 2,
                message: "⚠ Higher traffic load!"
            },
            stage4: {
                level: 4,
                trafficDelay: 800,
                packetsPerWave: 2,
                message: "Database under pressure..."
            },
            stage5: {
                level: 5,
                trafficDelay: 600,
                packetsPerWave: 3,
                message: "⛔ Heavy load!"
            },
            stage6: {
                level: 6,
                trafficDelay: 500,
                packetsPerWave: 3,
                message: "⛔ Peak load!"
            },
            stage7: {
                level: 7,
                trafficDelay: 400,
                packetsPerWave: 4,
                message: "Maximum load! Consider scaling databases!"
            }
        }
    },
    
    /**
     * Level 4 Configuration
     * Starts with 2 database servers, allows adding app servers for horizontal scaling
     */
    level4: {
        // Initial traffic generation settings
        initialTrafficDelay: 2000,      // Initial delay between traffic waves (ms)
        initialPacketsPerWave: 1,       // Starting number of packets per wave
        difficultyInterval: 10000,      // Time between difficulty increases (ms)
        
        // Server node configurations
        servers: {
            user: {
                capacity: 999,          // User nodes have unlimited capacity
                speed: 10               // Instant request generation (ms)
            },
            app: {
                capacity: 5,            // App server initial capacity
                speed: 600              // App server initial processing speed (ms)
            },
            database: {
                capacity: 12,           // Database initial capacity
                speed: 400              // Database initial processing speed (ms)
            }
        },
        
        // Difficulty progression stages
        difficulty: {
            stage1: {
                level: 1,
                trafficDelay: 1700,
                packetsPerWave: 1,
                message: "Traffic increasing..."
            },
            stage2: {
                level: 2,
                trafficDelay: 1400,
                packetsPerWave: 2,
                message: "Traffic increasing..."
            },
            stage3: {
                level: 3,
                trafficDelay: 1000,
                packetsPerWave: 2,
                message: "⚠ Higher traffic load!"
            },
            stage4: {
                level: 4,
                trafficDelay: 800,
                packetsPerWave: 3,
                message: "App servers under pressure..."
            },
            stage5: {
                level: 5,
                trafficDelay: 600,
                packetsPerWave: 3,
                message: "⛔ Heavy load!"
            },
            stage6: {
                level: 6,
                trafficDelay: 500,
                packetsPerWave: 4,
                message: "⛔ Peak load!"
            },
            stage7: {
                level: 7,
                trafficDelay: 400,
                packetsPerWave: 5,
                message: "Maximum load! Consider scaling app servers!"
            }
        }
    },
    
    level4Target: 1200,         // Level 4: Higher target to test app server scaling
    
    /**
     * Level 5 Configuration
     * Introduces caching layer between app and database servers
     */
    level5: {
        // Initial traffic generation settings
        initialTrafficDelay: 2000,      // Initial delay between traffic waves (ms)
        initialPacketsPerWave: 1,       // Starting number of packets per wave
        difficultyInterval: 10000,      // Time between difficulty increases (ms)
        
        // Server node configurations
        servers: {
            user: {
                capacity: 999,          // User nodes have unlimited capacity
                speed: 10               // Instant request generation (ms)
            },
            app: {
                capacity: 5,            // App server initial capacity
                speed: 600              // App server initial processing speed (ms)
            },
            cache: {
                capacity: 15,           // Cache initial capacity (higher than app/db)
                speed: 10,              // Cache is extremely fast (10ms) - 40x faster than database!
                hitRate: 0.7            // 70% cache hit rate for read requests
            },
            database: {
                capacity: 12,           // Database initial capacity
                speed: 400              // Database initial processing speed (ms)
            }
        },
        
        // Difficulty progression stages
        difficulty: {
            stage1: {
                level: 1,
                trafficDelay: 1700,
                packetsPerWave: 1,
                message: "Traffic increasing..."
            },
            stage2: {
                level: 2,
                trafficDelay: 1400,
                packetsPerWave: 2,
                message: "Traffic increasing..."
            },
            stage3: {
                level: 3,
                trafficDelay: 1000,
                packetsPerWave: 2,
                message: "⚠ Higher traffic load!"
            },
            stage4: {
                level: 4,
                trafficDelay: 800,
                packetsPerWave: 3,
                message: "Cache under pressure..."
            },
            stage5: {
                level: 5,
                trafficDelay: 600,
                packetsPerWave: 3,
                message: "⛔ Heavy load!"
            },
            stage6: {
                level: 6,
                trafficDelay: 500,
                packetsPerWave: 4,
                message: "⛔ Peak load!"
            },
            stage7: {
                level: 7,
                trafficDelay: 400,
                packetsPerWave: 5,
                message: "Maximum load! Cache is critical!"
            }
        }
    },
    
    level5Target: 1200,         // Level 5: Same as Level 4 but testing cache effectiveness
    
    /**
     * Level 6 Configuration
     * Introduces load balancer between users and app servers
     */
    level6: {
        // Initial traffic generation settings
        initialTrafficDelay: 2000,      // Initial delay between traffic waves (ms)
        initialPacketsPerWave: 1,       // Starting number of packets per wave
        difficultyInterval: 10000,      // Time between difficulty increases (ms)
        
        // Server node configurations
        servers: {
            user: {
                capacity: 999,          // User nodes have unlimited capacity
                speed: 10               // Instant request generation (ms)
            },
            app: {
                capacity: 5,            // App server initial capacity
                speed: 600              // App server initial processing speed (ms)
            },
            cache: {
                capacity: 15,           // Cache initial capacity (higher than app/db)
                speed: 10,              // Cache is extremely fast (10ms)
                hitRate: 0.7            // 70% cache hit rate for read requests
            },
            database: {
                capacity: 12,           // Database initial capacity
                speed: 400              // Database initial processing speed (ms)
            },
            loadbalancer: {
                capacity: 20,           // Load balancer has high capacity
                speed: 5                // Load balancer is very fast (5ms) - just routing logic
            }
        },
        
        // Difficulty progression stages
        difficulty: {
            stage1: {
                level: 1,
                trafficDelay: 1700,
                packetsPerWave: 2,
                message: "Traffic increasing..."
            },
            stage2: {
                level: 2,
                trafficDelay: 1400,
                packetsPerWave: 2,
                message: "Traffic increasing..."
            },
            stage3: {
                level: 3,
                trafficDelay: 1000,
                packetsPerWave: 3,
                message: "⚠ Higher traffic load!"
            },
            stage4: {
                level: 4,
                trafficDelay: 800,
                packetsPerWave: 3,
                message: "App servers under pressure..."
            },
            stage5: {
                level: 5,
                trafficDelay: 600,
                packetsPerWave: 4,
                message: "⛔ Heavy load!"
            },
            stage6: {
                level: 6,
                trafficDelay: 500,
                packetsPerWave: 4,
                message: "⛔ Peak load!"
            },
            stage7: {
                level: 7,
                trafficDelay: 400,
                packetsPerWave: 5,
                message: "Maximum load! Load balancer critical!"
            }
        }
    },
    
    level6Target: 1400          // Level 6: Testing load balancer effectiveness
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
    money: 1500,                 // Current budget for purchasing upgrades (starts at $500)
    
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
    isPaused: false,            // Whether the simulation is paused (can be resumed)
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
    console.log('resetGameState called with level:', level);
    console.trace('Call stack:'); // This will show where resetGameState was called from
    
    // Reset player resources to starting values
    GameState.money = 1500;
    
    // Clear all request processing statistics
    GameState.success = 0;
    GameState.errors = 0;
    GameState.total = 0;
    
    // Clear all server nodes (will be recreated by the level scene)
    GameState.nodes = {};
    
    // Reset simulation state flags
    GameState.isRunning = false;
    GameState.isPaused = false;
    GameState.isGameOver = false;
    
    // Reset difficulty to initial level
    GameState.difficultyLevel = 0;
    
    // Set the current level
    GameState.currentLevel = level;
    
    // Reset database storage (only relevant for Level 2+)
    GameState.databaseStorage = 0;
    
    console.log('resetGameState completed - isRunning set to false');
};
