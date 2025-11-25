/**
 * Level 2 Scene - Database Integration Challenge
 * 
 * This scene implements the second level of the game, which teaches the concept
 * of adding a database layer to the architecture and managing the increased
 * complexity and latency that comes with it.
 * 
 * Level Objectives:
 * - Process 100 requests total (fewer than Level 1 due to complexity)
 * - Maintain error rate below 1%
 * - Manage the added latency from database operations
 * 
 * Architecture:
 * - 3 User nodes (generate requests)
 * - 1 App Server (processes business logic)
 * - 1 Database Server (handles data storage)
 * - Three-tier architecture (User → App → Database → App → User)
 * 
 * Difficulty Progression:
 * - Starts slower than Level 1 due to longer request paths
 * - Gradually increases traffic
 * - Database becomes the bottleneck
 * 
 * Key Concepts Taught:
 * - Multi-tier architecture
 * - Database as a bottleneck
 * - Increased latency with each layer
 * - Complexity vs scalability trade-offs
 */

import { CONFIG, GameState, resetGameState } from '../config.js';
import { ServerNode } from '../objects/ServerNode.js';
import { drawDualLines } from '../utils/animations.js';
import { updateUI } from '../utils/uiManager.js';

export class Level2Scene extends Phaser.Scene {
    /**
     * Constructor
     * 
     * Initializes the scene with a unique key identifier.
     */
    constructor() {
        super({ key: 'Level2Scene' });
    }

    /**
     * Create Method
     * 
     * Called automatically by Phaser when the scene starts.
     * Sets up Level 2 including UI updates, background, nodes, and initial state.
     */
    create() {
        /**
         * Show Game UI Elements
         * Make the HTML UI visible (carried over from Level 1)
         */
        const leftSidebar = document.getElementById('left-sidebar');
        const controlPanel = document.getElementById('control-panel');
        if (leftSidebar) leftSidebar.style.display = 'flex';
        if (controlPanel) controlPanel.style.display = 'flex';
        
        // Ensure result modal is hidden at start
        document.getElementById('result-modal').style.display = 'none';
        
        /**
         * Update Header for Level 2
         * Change the page title to reflect the new level
         */
        const header = document.querySelector('#header h1');
        if (header) header.textContent = 'Level 2: Database Integration';
        
        /**
         * Update Objectives Display
         * Show Level 2-specific objectives in the sidebar
         */
        const objectivesList = document.querySelector('.objectives-list');
        if (objectivesList) {
            objectivesList.innerHTML = `
                <li>Complete 100 requests</li>
                <li>Maintain error rate < 1%</li>
                <li>Database adds processing overhead</li>
            `;
        }
        
        /**
         * Reset Game State for Level 2
         * Clear Level 1 data and initialize with Level 2 defaults
         * Pass '2' to set currentLevel to 2
         */
        resetGameState(2);
        
        /**
         * Initialize Scene-Specific State Variables
         * These control the traffic generation and difficulty progression
         */
        this.trafficTimer = null;           // Timer for generating traffic waves
        this.difficultyTimer = null;        // Timer for difficulty increases
        this.currentTrafficDelay = 2000;   // Start slower due to longer request paths
        this.packetsPerWave = 1;            // Number of packets generated per wave

        // Update the UI to reflect initial state
        updateUI();

        // Set up visual elements and create server nodes
        this.setupBackground();
        this.createNodes();
    }

    /**
     * Setup Background Graphics
     * 
     * Creates the visual background for the game canvas.
     * Identical to Level 1 background setup.
     */
    setupBackground() {
        const w = this.cameras.main.width;
        const h = this.cameras.main.height;

        /**
         * Add Grid Background
         * Creates a subtle grid pattern for visual context
         */
        this.add.grid(
            w/2, h/2,           // Center position
            w, h,               // Full width and height
            40, 40,             // Grid cell size (40x40 pixels)
            0x000000,           // Grid fill color (black, invisible)
            0,                  // Fill alpha (0 = fully transparent)
            0x333333,           // Grid line color (dark gray)
            0.2                 // Line alpha (20% opacity for subtle effect)
        );
        
        /**
         * Graphics Object for Connection Lines
         * This will be redrawn every frame to show connections between nodes
         */
        this.graphics = this.add.graphics();
    }

    /**
     * Create Server Nodes
     * 
     * Instantiates all server nodes for Level 2:
     * - 3 User nodes (left side) that generate requests
     * - 1 App Server (center) that processes business logic
     * - 1 Database Server (right side) that handles data storage
     * 
     * Node positioning creates a left-to-right flow:
     * Users (15%) → App (50%) → Database (80%)
     */
    createNodes() {
        const w = this.cameras.main.width;
        const h = this.cameras.main.height;

        /**
         * Create User Nodes
         * Positioned on the left side at 15% of canvas width
         * 
         * Parameters: (scene, x, y, name, type, capacity, speed)
         * - capacity: 999 (unlimited, users never drop requests)
         * - speed: 10ms (instant request generation)
         */
        GameState.nodes['User1'] = new ServerNode(
            this, w * 0.15, h/2 - 100,      // Top user
            'User A', 'user', 999, 10
        );
        GameState.nodes['User2'] = new ServerNode(
            this, w * 0.15, h/2,            // Middle user
            'User B', 'user', 999, 10
        );
        GameState.nodes['User3'] = new ServerNode(
            this, w * 0.15, h/2 + 100,      // Bottom user
            'User C', 'user', 999, 10
        );
        
        /**
         * Create Application Server
         * Positioned in the center at 50% of canvas width
         * 
         * Initial stats:
         * - capacity: 5 (can handle 5 concurrent requests)
         * - speed: 600ms (faster than Level 1, but still a bottleneck)
         * 
         * This server now has to handle both incoming requests
         * and responses from the database.
         */
        GameState.nodes['App'] = new ServerNode(
            this, w * 0.5, h/2,
            'App Server', 'app', 5, 600
        );
        
        /**
         * Create Database Server
         * Positioned on the right at 80% of canvas width
         * 
         * Initial stats:
         * - capacity: 3 (lower than app, often becomes the bottleneck)
         * - speed: 800ms (slower than app, simulating disk I/O)
         * 
         * This is the new addition in Level 2. The database adds
         * an extra hop in the request path, increasing latency and
         * creating a new potential failure point.
         */
        GameState.nodes['Database'] = new ServerNode(
            this, w * 0.8, h/2,
            'Database', 'database', 3, 800
        );
    }

    /**
     * Start Simulation
     * 
     * Begins the level simulation by:
     * 1. Marking the game as running
     * 2. Starting traffic generation
     * 3. Starting difficulty progression timer (slower than Level 1)
     * 
     * Called when player clicks the "Start" button.
     */
    startSimulation() {
        // Prevent starting if already running or game is over
        if (GameState.isRunning || GameState.isGameOver) return;
        
        // Mark simulation as active
        GameState.isRunning = true;
        
        // Start generating traffic waves
        this.scheduleNextWave();
        
        /**
         * Start Difficulty Progression Timer
         * Every 10 seconds (slower than Level 1's 8 seconds)
         * This gives players more time to observe the database behavior
         */
        this.difficultyTimer = this.time.addEvent({
            delay: 10000,                           // 10 seconds between increases
            callback: () => this.increaseDifficulty(),
            loop: true                              // Repeat indefinitely
        });
        
        // Update UI to reflect running state
        updateUI();
    }

    /**
     * Schedule Next Traffic Wave
     * 
     * Generates a wave of request packets from random users and
     * schedules the next wave to occur after a delay.
     * 
     * Similar to Level 1 but with adjusted timing for database architecture.
     */
    scheduleNextWave() {
        // Don't generate traffic if simulation stopped
        if (!GameState.isRunning) return;
        
        // Array of user node identifiers
        const users = ['User1', 'User2', 'User3'];
        
        /**
         * Spawn Packets
         * Create multiple packets in this wave, staggered slightly
         * Slightly longer stagger (100ms vs 80ms) due to longer request paths
         */
        for (let i = 0; i < this.packetsPerWave; i++) {
            // Pick a random user to send from
            const userNode = GameState.nodes[users[Math.floor(Math.random() * users.length)]];
            
            // Delay each packet slightly (100ms apart) for smoother animation
            this.time.delayedCall(i * 100, () => this.spawnPacket(userNode));
        }
        
        /**
         * Schedule Next Wave
         * Set up a timer to call this method again after the traffic delay
         */
        this.trafficTimer = this.time.delayedCall(this.currentTrafficDelay, () => {
            this.scheduleNextWave();
        });
    }

    /**
     * Increase Difficulty
     * 
     * Progressively makes the level harder by:
     * - Reducing delay between traffic waves
     * - Increasing packets per wave
     * 
     * Level 2 difficulty progression is more gradual than Level 1
     * because the database adds inherent complexity.
     * 
     * Difficulty Levels:
     * 0-2: Gentle warm-up
     * 3: First spike (2 packets per wave)
     * 4-5: Sustained pressure
     * 6+: Peak load (3 packets per wave)
     */
    increaseDifficulty() {
        // Increment difficulty counter
        GameState.difficultyLevel++;
        let msg = "";
        
        /**
         * Levels 1-2: Gentle Increase
         * Decrease delay gradually, giving time to learn the database flow
         */
        if (GameState.difficultyLevel <= 2) {
            this.currentTrafficDelay = Math.max(1200, this.currentTrafficDelay - 300);
            msg = "Traffic increasing...";
        } 
        /**
         * Level 3: First Spike
         * Increase to 2 packets per wave
         * Database starts to show strain
         */
        else if (GameState.difficultyLevel === 3) {
            this.currentTrafficDelay = 800;
            this.packetsPerWave = 2;
            msg = "⚠ Higher traffic load!";
        }
        /**
         * Levels 4-5: Sustained Pressure
         * Maintain high load to test database capacity
         */
        else if (GameState.difficultyLevel <= 5) {
            this.currentTrafficDelay = 600;
            msg = "Database under pressure...";
        }
        /**
         * Level 6+: Peak Load
         * Maximum difficulty for Level 2
         * 3 packets per wave, database is likely the bottleneck
         */
        else if (GameState.difficultyLevel === 6) {
            this.currentTrafficDelay = 400;
            this.packetsPerWave = 3;
            msg = "⛔ Peak load! Watch the database!";
        }
        /**
         * Level 7+: Sustained Peak
         * No further increases
         */
        else {
            msg = "Maximum database load";
            return; // No further difficulty changes
        }
        
        // Show toast notification about difficulty change
        this.showDifficultyToast(msg);
        
        // Update UI to reflect new difficulty level
        updateUI();
    }

    /**
     * Show Difficulty Toast Notification
     * 
     * Displays a temporary message on screen when difficulty increases.
     * Uses CSS class 'show' instead of opacity manipulation.
     * 
     * @param {string} msg - Message to display in the toast
     */
    showDifficultyToast(msg) {
        const toast = document.getElementById('difficulty-toast');
        toast.innerText = msg;
        toast.classList.add('show');  // Add CSS class to show toast
        
        // Remove 'show' class after 3 seconds to hide toast
        setTimeout(() => toast.classList.remove('show'), 3000);
    }

    /**
     * Update Method
     * 
     * Called automatically by Phaser every frame (60 times per second).
     * Redraws the connection lines between nodes.
     * 
     * Level 2 has more connections than Level 1:
     * - User to App (3 connections)
     * - App to Database (1 connection)
     */
    update() {
        /**
         * Redraw Connection Lines
         * Clear previous frame's lines and draw fresh ones
         */
        this.graphics.clear();
        
        // Get server nodes
        const app = GameState.nodes['App'];
        const database = GameState.nodes['Database'];
        
        /**
         * Draw User → App Connections
         * Three parallel connections from each user to the app server
         */
        ['User1', 'User2', 'User3'].forEach(uid => {
            const user = GameState.nodes[uid];
            drawDualLines(this.graphics, user, app);
        });
        
        /**
         * Draw App → Database Connection
         * Single connection showing the app-to-database communication
         * This is the new connection that doesn't exist in Level 1
         */
        if (database) {
            drawDualLines(this.graphics, app, database);
        }
    }

    /**
     * Spawn Packet
     * 
     * Creates a new request packet at a user node and starts it
     * on its journey through the system.
     * 
     * In Level 2, packets will travel:
     * User → App → Database → App → User
     * 
     * Packet types:
     * - Read requests (70%): Cyan circles - retrieve data from database
     * - Write requests (30%): Orange diamonds - add data to database
     * 
     * @param {ServerNode} startNode - The user node generating the request
     */
    spawnPacket(startNode) {
        /**
         * Determine Request Type
         * Randomly decide if this is a write request based on configured percentage
         */
        const isWrite = Math.random() * 100 < CONFIG.writeRequestPercentage;
        
        let packet;
        
        if (isWrite) {
            /**
             * Create Write Request Packet (Diamond Shape)
             * Write requests are represented by cyan diamond shapes
             * Diamond is drawn as a filled polygon with 4 vertices
             * Same color as read requests to maintain consistency
             */
            const size = 6; // Half-size of diamond
            
            // Create graphics object and set fill color
            const graphics = this.add.graphics();
            graphics.fillStyle(CONFIG.colors.packetReq, 1); // Cyan color
            
            // Draw diamond shape using beginPath and lineTo
            // Diamond has 4 points: top, right, bottom, left
            graphics.beginPath();
            graphics.moveTo(size, 0);      // Start at right point
            graphics.lineTo(0, size);       // Draw to bottom point
            graphics.lineTo(-size, 0);      // Draw to left point
            graphics.lineTo(0, -size);      // Draw to top point
            graphics.closePath();           // Close back to right point
            graphics.fillPath();            // Fill the shape
            
            // Generate unique texture to avoid caching
            const textureName = 'diamondPacket_' + Math.random().toString(36).substring(7);
            graphics.generateTexture(textureName, size * 2 + 4, size * 2 + 4);
            graphics.destroy();
            
            // Create sprite from texture
            packet = this.add.sprite(startNode.x, startNode.y, textureName);
            packet.isWrite = true; // Mark as write request
        } else {
            /**
             * Create Read Request Packet (Circle Shape)
             * Read requests are represented by cyan circles (traditional request color)
             */
            packet = this.add.circle(
                startNode.x,
                startNode.y, 
                5,                          // 5 pixel radius
                CONFIG.colors.packetReq     // Cyan color for read requests
            );
            packet.isWrite = false; // Mark as read request
        }
        
        /**
         * Set Common Packet Metadata
         * Track where it came from and its type (request vs response)
         */
        packet.sourceNode = startNode;      // Remember originating user
        packet.isResponse = false;          // This is a request, not a response
        
        /**
         * Start Packet Routing
         * The packet will be routed through the multi-tier architecture:
         * 1. User routes to App
         * 2. App routes to Database
         * 3. Database processes and sends response back to App
         *    - If write request: increases database storage, slows down database
         * 4. App forwards response back to User
         */
        startNode.routePacket(packet);
    }

    /**
     * Skip Level (Debug/Testing Feature)
     * 
     * Allows bypassing Level 2 by automatically setting a winning state.
     * Useful for testing or demonstrating the level completion.
     * 
     * Called when player clicks a "Skip Level" button (if implemented).
     */
    skipLevel() {
        /**
         * Stop All Active Timers
         * Prevent further traffic generation and difficulty increases
         */
        if (this.trafficTimer) this.trafficTimer.remove();
        if (this.difficultyTimer) this.difficultyTimer.remove();

        /**
         * Set Winning Game State
         * Simulate a perfect completion:
         * - 100 requests processed (Level 2 target)
         * - 100% success rate (0 errors)
         */
        GameState.total = 100;              // Level 2 only requires 100 requests
        GameState.success = 100;
        GameState.errors = 0;
        GameState.isRunning = false;
        GameState.isGameOver = true;

        // Update UI to reflect completed state
        updateUI();
        
        /**
         * Show Success Modal
         * Display the completion modal with educational content
         */
        const rate = (GameState.errors / GameState.total) * 100;
        const modal = document.getElementById('result-modal');
        const title = document.getElementById('modal-title');
        const body = document.getElementById('modal-body');
        const btnNext = document.getElementById('btn-modal-next');

        modal.style.display = 'block';
        modal.classList.add('show');

        title.innerText = "Level 2 Skipped - Auto Complete!";
        body.innerHTML = `
            <p>Final Error Rate: <strong style="color:#00ff00">${rate.toFixed(2)}%</strong> (Goal < 1%)</p>
            <p>You successfully handled 100 requests with database integration!</p>
            
            <div class="concept-box" style="background: rgba(74, 144, 226, 0.1); border: 1px solid #4a90e2; border-radius: 8px; padding: 15px; margin-top: 15px;">
                <strong>Architect's Notes: Database Layer</strong><br/>
                Adding a database introduces new challenges:
                <br/><br/>
                <ul style="text-align: left; margin-left: 20px;">
                    <li>✅ Persistent data storage and shared state</li>
                    <li>✅ Centralized data management</li>
                    <li>❌ Additional latency in request path</li>
                    <li>❌ Database becomes a potential bottleneck</li>
                    <li>❌ More complex failure scenarios</li>
                </ul>
                <br/>
                <strong>Key Insight:</strong> Every layer you add increases complexity and latency. Database optimization and caching strategies become critical at scale.
            </div>
        `;
        
        // No Level 3 yet, hide next button
        btnNext.style.display = 'none';
    }
}
