/**
 * Level 1 Scene - Vertical Scaling Challenge
 * 
 * This scene implements the first level of the game, which teaches the concept
 * of vertical scaling (improving a single server's capacity).
 * 
 * Level Objectives:
 * - Process 1000 requests total
 * - Maintain error rate below 1%
 * - Manage budget wisely when upgrading the server
 * 
 * Architecture:
 * - 3 User nodes (generate requests)
 * - 1 App Server node (processes all requests)
 * - No database (monolithic architecture)
 * 
 * Difficulty Progression:
 * - Starts easy with low request rate
 * - Gradually increases traffic over time
 * - Forces player to upgrade server to handle increased load
 * 
 * Key Concepts Taught:
 * - Vertical scaling (upgrading single server capacity)
 * - Load balancing challenges
 * - Resource management
 * - Trade-offs between cost and performance
 */

import { CONFIG, GameState, resetGameState } from '../config.js';
import { ServerNode } from '../objects/ServerNode.js';
import { drawDualLines } from '../utils/animations.js';
import { updateUI } from '../utils/uiManager.js';

export class Level1Scene extends Phaser.Scene {
    /**
     * Constructor
     * 
     * Initializes the scene with a unique key identifier.
     */
    constructor() {
        super({ key: 'Level1Scene' });
    }

    /**
     * Create Method
     * 
     * Called automatically by Phaser when the scene starts.
     * Sets up the entire level including UI, background, nodes, and initial state.
     */
    create() {
        /**
         * Show Game UI Elements
         * Make the HTML UI visible (it's hidden on the welcome screen)
         */
        const leftSidebar = document.getElementById('left-sidebar');
        const controlPanel = document.getElementById('control-panel');
        if (leftSidebar) leftSidebar.style.display = 'flex';
        if (controlPanel) controlPanel.style.display = 'flex';
        
        // Ensure result modal is hidden at start
        document.getElementById('result-modal').style.display = 'none';
        
        /**
         * Reset Game State
         * Clear any previous level data and initialize with Level 1 defaults
         */
        resetGameState();
        
        /**
         * Initialize Scene-Specific State Variables
         * These control the traffic generation and difficulty progression
         */
        this.trafficTimer = null;           // Timer for generating traffic waves
        this.difficultyTimer = null;        // Timer for difficulty increases
        this.currentTrafficDelay = 1500;   // Delay between traffic waves (ms)
        this.packetsPerWave = 1;            // Number of packets generated per wave

        // Update the UI to reflect initial state
        updateUI();

        // Set up visual elements and create server nodes
        this.setupBackground();
        this.createNodes();
        this.setupZoom();
        this.setupCameraDrag();
    }

    /**
     * Setup Camera Drag
     * 
     * Enables dragging the entire canvas by clicking and dragging the background.
     * Works regardless of game state (running, paused, or stopped).
     */
    setupCameraDrag() {
        // Camera drag state
        this.isDraggingCamera = false;
        this.dragStartX = 0;
        this.dragStartY = 0;
        this.cameraStartX = 0;
        this.cameraStartY = 0;

        // Listen for pointer down on the canvas (not on game objects)
        this.input.on('pointerdown', (pointer) => {
            // Only start camera drag if not clicking on a game object
            // Right mouse button or middle mouse button can also be used
            if (pointer.rightButtonDown() || pointer.middleButtonDown()) {
                this.startCameraDrag(pointer);
            } else if (pointer.leftButtonDown() && !pointer.event.target.closest('.server-node')) {
                // Left button can drag if not over a node
                // Check if we're over any interactive object
                const objectsUnderPointer = this.input.hitTestPointer(pointer);
                if (objectsUnderPointer.length === 0) {
                    this.startCameraDrag(pointer);
                }
            }
        });

        // Listen for pointer move
        this.input.on('pointermove', (pointer) => {
            if (this.isDraggingCamera) {
                this.updateCameraDrag(pointer);
            }
        });

        // Listen for pointer up
        this.input.on('pointerup', (pointer) => {
            if (this.isDraggingCamera) {
                this.endCameraDrag();
            }
        });

        // Also end drag if pointer leaves the canvas
        this.input.on('pointerout', (pointer) => {
            if (this.isDraggingCamera) {
                this.endCameraDrag();
            }
        });
    }

    /**
     * Start Camera Drag
     * 
     * @param {Phaser.Input.Pointer} pointer - The pointer that initiated the drag
     */
    startCameraDrag(pointer) {
        this.isDraggingCamera = true;
        this.dragStartX = pointer.x;
        this.dragStartY = pointer.y;
        this.cameraStartX = this.cameras.main.scrollX;
        this.cameraStartY = this.cameras.main.scrollY;
        
        // Change cursor to grabbing hand
        this.input.setDefaultCursor('grabbing');
    }

    /**
     * Update Camera Drag
     * 
     * @param {Phaser.Input.Pointer} pointer - The pointer being moved
     */
    updateCameraDrag(pointer) {
        // Calculate how far the pointer has moved
        const deltaX = pointer.x - this.dragStartX;
        const deltaY = pointer.y - this.dragStartY;
        
        // Move camera in opposite direction (to create dragging effect)
        this.cameras.main.scrollX = this.cameraStartX - deltaX / this.currentZoom;
        this.cameras.main.scrollY = this.cameraStartY - deltaY / this.currentZoom;
    }

    /**
     * End Camera Drag
     */
    endCameraDrag() {
        this.isDraggingCamera = false;
        this.input.setDefaultCursor('default');
    }

    /**
     * Setup Zoom Controls
     * 
     * Enables camera zoom functionality with mouse wheel and programmatic controls.
     */
    setupZoom() {
        // Set initial zoom level
        this.cameras.main.setZoom(1);
        this.currentZoom = 1;
        this.minZoom = 0.5;
        this.maxZoom = 2.0;

        // Enable mouse wheel zoom
        this.input.on('wheel', (pointer, gameObjects, deltaX, deltaY, deltaZ) => {
            // deltaY > 0 means scroll down (zoom out), < 0 means scroll up (zoom in)
            const zoomDelta = deltaY > 0 ? -0.1 : 0.1;
            this.adjustZoom(zoomDelta);
        });
    }

    /**
     * Adjust Zoom Level
     * 
     * @param {number} delta - Amount to change zoom (positive = zoom in, negative = zoom out)
     */
    adjustZoom(delta) {
        this.currentZoom += delta;
        this.currentZoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.currentZoom));
        
        this.cameras.main.setZoom(this.currentZoom);
        
        // Update zoom display if it exists
        const zoomDisplay = document.getElementById('zoom-level');
        if (zoomDisplay) {
            zoomDisplay.textContent = Math.round(this.currentZoom * 100) + '%';
        }
    }

    /**
     * Reset Zoom to Default
     */
    resetZoom() {
        this.currentZoom = 1;
        this.cameras.main.setZoom(1);
        
        const zoomDisplay = document.getElementById('zoom-level');
        if (zoomDisplay) {
            zoomDisplay.textContent = '100%';
        }
    }

    /**
     * Setup Background Graphics
     * 
     * Creates the visual background for the game canvas:
     * - Grid pattern for visual context
     * - Graphics object for drawing connection lines
     */
    setupBackground() {
        const w = this.cameras.main.width;
        const h = this.cameras.main.height;

        /**
         * Set Camera Background Color
         * Set the scene background to light gray instead of black
         */
        this.cameras.main.setBackgroundColor('#2a2a2a');

        /**
         * Add Grid Background
         * Creates a large grid pattern that covers the entire draggable canvas area
         * Grid is 6x larger than viewport to ensure coverage when panning/zooming
         */
        const gridSize = 6; // Multiplier for grid coverage
        this.add.grid(
            0, 0,                       // Position at world origin
            w * gridSize, h * gridSize, // Large grid (6x viewport size)
            40, 40,                     // Grid cell size (40x40 pixels)
            0x2a2a2a,                   // Grid fill color (matches background)
            0,                          // Fill alpha (0 = fully transparent)
            0x444444,                   // Grid line color (medium gray)
            0.3                         // Line alpha (30% opacity for subtle effect)
        ).setOrigin(0.5, 0.5);          // Center the grid
        
        /**
         * Graphics Object for Connection Lines
         * This will be redrawn every frame to show connections between nodes
         */
        this.graphics = this.add.graphics();
    }

    /**
     * Create Server Nodes
     * 
     * Instantiates all server nodes for Level 1:
     * - 3 User nodes (left side) that generate requests
     * - 1 App Server (center) that processes all requests
     * 
     * Node positioning:
     * - Users stacked vertically on the left (x=150)
     * - App Server centered (x=550)
     */
    createNodes() {
        const h = this.cameras.main.height;

        /**
         * Create User Nodes
         * These represent end users making requests to the system.
         * 
         * Parameters: (scene, x, y, name, type, capacity, speed)
         * - capacity: 999 (unlimited, users never drop requests)
         * - speed: 10ms (instant request generation)
         */
        GameState.nodes['User1'] = new ServerNode(
            this, 150, h/2 - 100,   // Top user
            'User A', 'user', 999, 10
        );
        GameState.nodes['User2'] = new ServerNode(
            this, 150, h/2,         // Middle user
            'User B', 'user', 999, 10
        );
        GameState.nodes['User3'] = new ServerNode(
            this, 150, h/2 + 100,   // Bottom user
            'User C', 'user', 999, 10
        );
        
        /**
         * Create Application Server
         * This is the main server that players must manage and upgrade.
         * 
         * Initial stats:
         * - capacity: 5 (can handle 5 concurrent requests)
         * - speed: 800ms (takes 0.8 seconds to process each request)
         * 
         * This server is the bottleneck that players must upgrade
         * as traffic increases.
         */
        GameState.nodes['App'] = new ServerNode(
            this, 550, h/2,
            'App Server', 'app', 5, 800
        );
    }

    /**
     * Start Simulation
     * 
     * Begins the level simulation by:
     * 1. Marking the game as running
     * 2. Starting traffic generation
     * 3. Starting difficulty progression timer
     * 
     * Called when player clicks the "Start" button.
     */
    startSimulation() {
        console.log('Level1Scene.startSimulation called');
        console.log('Before: isRunning=', GameState.isRunning, 'isPaused=', GameState.isPaused, 'isGameOver=', GameState.isGameOver);
        
        // Prevent starting if already running or game is over
        if (GameState.isRunning || GameState.isGameOver) {
            console.log('Prevented start - already running or game over');
            return;
        }
        
        // Mark simulation as active
        GameState.isRunning = true;
        GameState.isPaused = false;
        
        console.log('After state change: isRunning=', GameState.isRunning, 'isPaused=', GameState.isPaused);
        
        // Ensure Phaser's time system is running (not paused)
        this.time.paused = false;
        console.log('Phaser time.paused set to:', this.time.paused);
        
        // Resume all tweens in case they were paused
        this.tweens.resumeAll();
        
        // Start generating traffic waves
        console.log('Calling scheduleNextWave...');
        this.scheduleNextWave();
        
        /**
         * Start Difficulty Progression Timer
         * Every 8 seconds, increase the difficulty by:
         * - Reducing delay between traffic waves
         * - Increasing packets per wave
         * This forces the player to upgrade servers to keep up
         */
        this.difficultyTimer = this.time.addEvent({
            delay: 8000,                            // 8 seconds between increases
            callback: () => this.increaseDifficulty(),
            loop: true                              // Repeat indefinitely
        });
        console.log('Difficulty timer created');
        
        // Update UI to reflect running state
        console.log('Calling updateUI...');
        updateUI();
        console.log('startSimulation completed');
    }

    /**
     * Pause Simulation
     * 
     * Pauses the simulation by:
     * 1. Setting paused flag
     * 2. Pausing Phaser's time system (stops all timers and tweens)
     * 3. Updating UI to show pause state
     * 
     * Called when player clicks the "Pause" button.
     */
    pauseSimulation() {
        // Only pause if running and not already paused
        if (!GameState.isRunning || GameState.isPaused || GameState.isGameOver) return;
        
        // Mark as paused
        GameState.isPaused = true;
        
        // Pause Phaser's clock system - this stops all time.delayedCall and time.addEvent timers
        this.time.paused = true;
        
        // Pause all tweens (packet animations)
        this.tweens.pauseAll();
        
        // Update UI to show paused state
        updateUI();
    }

    /**
     * Resume Simulation
     * 
     * Resumes a paused simulation by:
     * 1. Clearing paused flag
     * 2. Resuming Phaser's time system
     * 3. Updating UI to show running state
     * 
     * Called when player clicks the "Resume" button.
     */
    resumeSimulation() {
        // Only resume if paused
        if (!GameState.isRunning || !GameState.isPaused || GameState.isGameOver) return;
        
        // Clear paused flag
        GameState.isPaused = false;
        
        // Resume Phaser's clock system - restarts all timers
        this.time.paused = false;
        
        // Resume all tweens (packet animations)
        this.tweens.resumeAll();
        
        // Update UI to show running state
        updateUI();
    }

    /**
     * Schedule Next Traffic Wave
     * 
     * Generates a wave of request packets from random users and
     * schedules the next wave to occur after a delay.
     * 
     * This creates continuous traffic flow with controllable intensity.
     */
    scheduleNextWave() {
        // Don't generate traffic if simulation stopped
        if (!GameState.isRunning) return;
        
        // Array of user node identifiers
        const users = ['User1', 'User2', 'User3'];
        
        /**
         * Spawn Packets
         * Create multiple packets in this wave, staggered slightly
         * to avoid all hitting the server at exactly the same time
         */
        for (let i = 0; i < this.packetsPerWave; i++) {
            // Pick a random user to send from
            const userNode = GameState.nodes[users[Math.floor(Math.random() * users.length)]];
            
            // Delay each packet slightly (80ms apart) for smoother animation
            this.time.delayedCall(i * 80, () => this.spawnPacket(userNode));
        }
        
        /**
         * Schedule Next Wave
         * Set up a timer to call this method again after the traffic delay
         * This creates a continuous loop of traffic generation
         */
        this.trafficTimer = this.time.delayedCall(this.currentTrafficDelay, () => {
            this.scheduleNextWave();
        });
    }

    /**
     * Increase Difficulty
     * 
     * Progressively makes the level harder by:
     * - Reducing delay between traffic waves (more frequent requests)
     * - Increasing packets per wave (more concurrent load)
     * 
     * This simulates real-world traffic growth and forces players
     * to upgrade their server to maintain performance.
     * 
     * Difficulty Levels:
     * 0-3: Gradual warm-up, decreasing delays
     * 4: First major spike (2 packets per wave)
     * 5-7: Sustained high load
     * 8+: Extreme pressure (5 packets per wave, very fast)
     */
    increaseDifficulty() {
        // Increment difficulty counter
        GameState.difficultyLevel++;
        let msg = "";
        
        /**
         * Levels 1-3: Gradual Increase
         * Decrease delay between waves, still manageable
         */
        if (GameState.difficultyLevel <= 3) {
            this.currentTrafficDelay = Math.max(800, this.currentTrafficDelay - 250);
            msg = "Traffic increasing...";
        } 
        /**
         * Level 4: First Major Spike
         * Sudden increase in concurrency - 2 packets per wave
         * This is where unupgraded servers start to struggle
         */
        else if (GameState.difficultyLevel === 4) {
            this.currentTrafficDelay = 350;
            this.packetsPerWave = 2;
            msg = "⚠ High traffic alert!";
        }
        /**
         * Levels 5-7: Sustained High Load
         * Maintain pressure to test if player upgraded adequately
         */
        else if (GameState.difficultyLevel <= 7) {
            this.currentTrafficDelay = 300;
            msg = "Sustained high load...";
        }
        /**
         * Level 8+: Extreme Pressure
         * Maximum difficulty - 5 packets per wave, very fast
         * Only well-upgraded servers can handle this
         */
        else if (GameState.difficultyLevel === 8) {
            this.currentTrafficDelay = 200;
            this.packetsPerWave = 5;
            msg = "⛔ Extreme pressure! System near collapse!";
        }
        /**
         * Level 9+: Sustained Maximum
         * No further increases, maintain extreme pressure
         */
        else {
            msg = "Maximum pressure sustained";
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
     * The toast fades in and out automatically.
     * 
     * @param {string} msg - Message to display in the toast
     */
    showDifficultyToast(msg) {
        const toast = document.getElementById('difficulty-toast');
        toast.innerText = msg;
        toast.style.opacity = 1;  // Make visible
        
        // Fade out after 3 seconds
        setTimeout(() => toast.style.opacity = 0, 3000);
    }

    /**
     * Update Method
     * 
     * Called automatically by Phaser every frame (60 times per second).
     * Redraws the connection lines between nodes to keep them updated
     * as packets move and node states change.
     */
    update() {
        /**
         * Redraw Connection Lines
         * Clear previous frame's lines and draw fresh ones
         */
        this.graphics.clear();
        
        // Get the app server (all users connect to it)
        const app = GameState.nodes['App'];
        
        /**
         * Draw Lines from Each User to App Server
         * Creates dual directional lines showing request/response flow
         */
        ['User1', 'User2', 'User3'].forEach(uid => {
            const user = GameState.nodes[uid];
            drawDualLines(this.graphics, user, app);
        });
    }

    /**
     * Spawn Packet
     * 
     * Creates a new request packet at a user node and starts it
     * on its journey through the system.
     * 
     * @param {ServerNode} startNode - The user node generating the request
     */
    spawnPacket(startNode) {
        /**
         * Create Packet Visual
         * A small colored circle representing a request
         */
        const packet = this.add.circle(
            startNode.x,                    // Start at user's position
            startNode.y, 
            5,                              // 5 pixel radius
            CONFIG.colors.packetReq         // Cyan color for requests
        );
        
        /**
         * Set Packet Metadata
         * Track where it came from and its type (request vs response)
         */
        packet.sourceNode = startNode;      // Remember originating user
        packet.isResponse = false;          // This is a request, not a response
        
        /**
         * Start Packet Routing
         * Let the user node route this packet to its destination
         */
        startNode.routePacket(packet);
    }

    /**
     * Skip Level (Debug/Testing Feature)
     * 
     * Allows bypassing the level by automatically setting a winning state.
     * Useful for testing Level 2 without playing through Level 1.
     * 
     * Called when player clicks the "Skip Level" button.
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
         * Simulate a successful completion with:
         * - All 1000 requests processed
         * - 995 successes, 5 errors (0.5% error rate - well below 1% threshold)
         */
        GameState.total = CONFIG.targetTotal;
        GameState.success = CONFIG.targetTotal - 5;
        GameState.errors = 5;
        GameState.isRunning = false;
        GameState.isGameOver = true;

        // Update UI to reflect completed state
        updateUI();
        
        /**
         * Show Success Modal
         * Display the same modal as a real win, but with "Skipped" message
         */
        const rate = (GameState.errors / GameState.total) * 100;
        const modal = document.getElementById('result-modal');
        const title = document.getElementById('modal-title');
        const body = document.getElementById('modal-body');
        const btnNext = document.getElementById('btn-modal-next');

        modal.style.display = 'block';
        modal.className = 'win-theme';

        title.innerText = "Level 1 Skipped - Auto Complete!";
        body.innerHTML = `
            <p>Final Error Rate: <strong style="color:#00ff00">${rate.toFixed(2)}%</strong> (Goal < 1%)</p>
            <p>You successfully handled ${CONFIG.targetTotal} high-concurrency requests!</p>
            
            <div class="concept-box">
                <strong>Architect's Notes: Vertical Scaling</strong><br/>
                What you just did is typical "vertical scaling" - improving performance by increasing a single server's resources (CPU, memory).
                <br/><br/>
                <ul>
                    <li>✅ Advantages: Simple architecture, no code changes needed, quick results.</li>
                    <li>❌ Disadvantages: Hardware has physical limits (can't upgrade past Level 3), costs increase exponentially, single point of failure risk.</li>
                </ul>
            </div>
        `;
        
        // Show button to proceed to Level 2
        btnNext.style.display = 'inline-block';
    }
}
