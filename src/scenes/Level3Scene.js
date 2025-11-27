/**
 * Level 3 Scene - Multi-Database Scalability Challenge
 * 
 * This scene implements the third level of the game, which teaches the concept
 * of horizontal database scaling by allowing players to add multiple database servers.
 * 
 * Level Objectives:
 * - Process 1000 requests total (more than Level 2 to test multi-database scalability)
 * - Maintain error rate below 1%
 * - Learn to scale databases horizontally to handle increased load
 * 
 * Architecture:
 * - 3 User nodes (generate requests)
 * - 1 App Server (processes business logic)
 * - 1+ Database Servers (handle data storage - can be dynamically added)
 * - Three-tier architecture with horizontal database scaling capability
 * 
 * Difficulty Progression:
 * - Similar to Level 2 but with higher overall traffic
 * - Encourages players to add database servers to handle load
 * 
 * Key Concepts Taught:
 * - Horizontal database scaling
 * - Load distribution across multiple databases
 * - Database replication/sharding concepts
 */

import { CONFIG, GameState, resetGameState } from '../config.js';
import { ServerNode } from '../objects/ServerNode.js';
import { drawDualLines } from '../utils/animations.js';
import { updateUI } from '../utils/uiManager.js';

export class Level3Scene extends Phaser.Scene {
    /**
     * Constructor
     * 
     * Initializes the scene with a unique key identifier.
     */
    constructor() {
        super({ key: 'Level3Scene' });
        this.databaseCount = 1; // Track number of database servers
        this.addDbButton = null; // Reference to the add database button
    }

    /**
     * Create Method
     * 
     * Called automatically by Phaser when the scene starts.
     * Sets up Level 3 including UI updates, background, nodes, and initial state.
     */
    create() {
        /**
         * Show Game UI Elements
         * Make the HTML UI visible
         */
        const leftSidebar = document.getElementById('left-sidebar');
        const controlPanel = document.getElementById('control-panel');
        if (leftSidebar) leftSidebar.style.display = 'flex';
        if (controlPanel) controlPanel.style.display = 'flex';
        
        // Ensure result modal is hidden at start
        document.getElementById('result-modal').style.display = 'none';
        
        /**
         * Update Header for Level 3
         * Change the page title to reflect the new level
         */
        const header = document.querySelector('#header h1');
        if (header) header.textContent = 'Level 3: Database Scaling';
        
        /**
         * Update Objectives Display
         * Show Level 3-specific objectives in the sidebar
         */
        const objectivesList = document.querySelector('.objectives-list');
        if (objectivesList) {
            objectivesList.innerHTML = `
                <li>Complete ${CONFIG.level3Target} requests</li>
                <li>Maintain error rate < ${CONFIG.maxErrorRate}%</li>
                <li>Scale databases horizontally when needed</li>
            `;
        }
        
        /**
         * Reset Game State for Level 3
         * Clear previous level data and initialize with Level 3 defaults
         */
        resetGameState(3);
        
        /**
         * Initialize Scene-Specific State Variables
         */
        this.trafficTimer = null;
        this.difficultyTimer = null;
        this.currentTrafficDelay = CONFIG.level3.initialTrafficDelay;
        this.packetsPerWave = CONFIG.level3.initialPacketsPerWave;
        this.databaseCount = 1; // Start with one database

        // Update the UI to reflect initial state
        updateUI();

        // Set up visual elements and create server nodes
        this.setupBackground();
        this.createNodes();
        this.createAddDatabaseButton();
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
     * Creates the visual background for the game canvas.
     */
    setupBackground() {
        const w = this.cameras.main.width;
        const h = this.cameras.main.height;

        /**
         * Set Camera Background Color
         */
        this.cameras.main.setBackgroundColor('#2a2a2a');

        /**
         * Add Grid Background
         */
        const gridSize = 6;
        this.add.grid(
            0, 0,
            w * gridSize, h * gridSize,
            40, 40,
            0x2a2a2a,
            0,
            0x444444,
            0.3
        ).setOrigin(0.5, 0.5);
        
        /**
         * Graphics Object for Connection Lines
         */
        this.graphics = this.add.graphics();
    }

    /**
     * Create Server Nodes
     * 
     * Instantiates all server nodes for Level 3:
     * - 3 User nodes (left side)
     * - 1 App Server (center)
     * - 1 Database Server initially (right side)
     */
    createNodes() {
        const w = this.cameras.main.width;
        const h = this.cameras.main.height;

        /**
         * Create User Nodes
         */
        const userConfig = CONFIG.level3.servers.user;
        GameState.nodes['User1'] = new ServerNode(
            this, w * 0.15, h/2 - 100,
            'User A', 'user', userConfig.capacity, userConfig.speed
        );
        GameState.nodes['User2'] = new ServerNode(
            this, w * 0.15, h/2,
            'User B', 'user', userConfig.capacity, userConfig.speed
        );
        GameState.nodes['User3'] = new ServerNode(
            this, w * 0.15, h/2 + 100,
            'User C', 'user', userConfig.capacity, userConfig.speed
        );
        
        /**
         * Create Application Server
         */
        const appConfig = CONFIG.level3.servers.app;
        GameState.nodes['App'] = new ServerNode(
            this, w * 0.5, h/2,
            'App Server', 'app', appConfig.capacity, appConfig.speed
        );
        
        /**
         * Create Initial Database Server
         */
        const dbConfig = CONFIG.level3.servers.database;
        GameState.nodes['Database1'] = new ServerNode(
            this, w * 0.8, h/2,
            'Database 1', 'database', dbConfig.capacity, dbConfig.speed
        );
    }

    /**
     * Create Add Database Button
     * 
     * Creates a button in the game canvas that allows adding new database servers.
     */
    createAddDatabaseButton() {
        const w = this.cameras.main.width;
        const h = this.cameras.main.height;

        // Create button background
        this.addDbButton = this.add.rectangle(
            w * 0.8, h - 50,
            180, 40,
            0x4a90e2
        ).setInteractive({ useHandCursor: true });

        // Create button text
        const buttonText = this.add.text(
            w * 0.8, h - 50,
            '+ Add Database ($300)',
            {
                fontSize: '14px',
                color: '#ffffff',
                fontFamily: 'Arial'
            }
        ).setOrigin(0.5);

        // Button hover effects
        this.addDbButton.on('pointerover', () => {
            this.addDbButton.setFillStyle(0x5aa0f2);
        });

        this.addDbButton.on('pointerout', () => {
            this.addDbButton.setFillStyle(0x4a90e2);
        });

        // Button click handler
        this.addDbButton.on('pointerdown', () => {
            this.addDatabaseServer();
        });

        // Store reference to button text for updates
        this.addDbButtonText = buttonText;
    }

    /**
     * Add Database Server
     * 
     * Adds a new database server to the architecture if the player has enough money.
     */
    addDatabaseServer() {
        const cost = 300;

        // Check if player has enough money
        if (GameState.money < cost) {
            this.showToast('Not enough money! Need $' + cost);
            return;
        }

        // Check maximum limit (prevent too many databases)
        if (this.databaseCount >= 5) {
            this.showToast('Maximum database limit reached!');
            return;
        }

        // Deduct cost
        GameState.money -= cost;

        // Increment database count
        this.databaseCount++;

        // Calculate position for new database
        const w = this.cameras.main.width;
        const h = this.cameras.main.height;
        const dbConfig = CONFIG.level3.servers.database;
        
        // Arrange databases vertically with adequate spacing
        // Increased spacing to prevent overlap (node height + labels + margin)
        const spacing = 140;
        const startY = h/2 - ((this.databaseCount - 1) * spacing) / 2;

        // Reposition existing databases
        for (let i = 1; i < this.databaseCount; i++) {
            const db = GameState.nodes['Database' + i];
            if (db) {
                db.y = startY + (i - 1) * spacing;
            }
        }

        // Create new database server
        const newY = startY + (this.databaseCount - 1) * spacing;
        GameState.nodes['Database' + this.databaseCount] = new ServerNode(
            this, w * 0.8, newY,
            'Database ' + this.databaseCount, 'database', dbConfig.capacity, dbConfig.speed
        );

        // Update UI
        updateUI();
        this.showToast('Database ' + this.databaseCount + ' added!');
    }

    /**
     * Show Toast Notification
     */
    showToast(msg) {
        const toast = document.getElementById('difficulty-toast');
        toast.innerText = msg;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 2000);
    }

    /**
     * Start Simulation
     */
    startSimulation() {
        if (GameState.isRunning || GameState.isGameOver) return;
        
        GameState.isRunning = true;
        GameState.isPaused = false;
        this.time.paused = false;
        this.tweens.resumeAll();
        
        this.scheduleNextWave();
        
        this.difficultyTimer = this.time.addEvent({
            delay: CONFIG.level3.difficultyInterval,
            callback: () => this.increaseDifficulty(),
            loop: true
        });
        
        updateUI();
    }

    /**
     * Pause Simulation
     */
    pauseSimulation() {
        if (!GameState.isRunning || GameState.isPaused || GameState.isGameOver) return;
        
        GameState.isPaused = true;
        this.time.paused = true;
        this.tweens.pauseAll();
        updateUI();
    }

    /**
     * Resume Simulation
     */
    resumeSimulation() {
        if (!GameState.isRunning || !GameState.isPaused || GameState.isGameOver) return;
        
        GameState.isPaused = false;
        this.time.paused = false;
        this.tweens.resumeAll();
        updateUI();
    }

    /**
     * Schedule Next Traffic Wave
     */
    scheduleNextWave() {
        if (!GameState.isRunning) return;
        
        const users = ['User1', 'User2', 'User3'];
        
        for (let i = 0; i < this.packetsPerWave; i++) {
            const userNode = GameState.nodes[users[Math.floor(Math.random() * users.length)]];
            this.time.delayedCall(i * 100, () => this.spawnPacket(userNode));
        }
        
        this.trafficTimer = this.time.delayedCall(this.currentTrafficDelay, () => {
            this.scheduleNextWave();
        });
    }

    /**
     * Increase Difficulty
     */
    increaseDifficulty() {
        GameState.difficultyLevel++;
        
        const stageName = `stage${GameState.difficultyLevel}`;
        const stage = CONFIG.level3.difficulty[stageName];
        
        if (!stage) {
            this.showDifficultyToast("Maximum load reached");
            return;
        }
        
        this.currentTrafficDelay = stage.trafficDelay;
        this.packetsPerWave = stage.packetsPerWave;
        this.showDifficultyToast(stage.message);
        updateUI();
    }

    /**
     * Show Difficulty Toast Notification
     */
    showDifficultyToast(msg) {
        const toast = document.getElementById('difficulty-toast');
        toast.innerText = msg;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 3000);
    }

    /**
     * Update Method
     * 
     * Called every frame. Redraws connection lines.
     */
    update() {
        this.graphics.clear();
        
        const app = GameState.nodes['App'];
        
        // Draw User → App Connections
        ['User1', 'User2', 'User3'].forEach(uid => {
            const user = GameState.nodes[uid];
            drawDualLines(this.graphics, user, app);
        });
        
        // Draw App → Database Connections (for all databases)
        for (let i = 1; i <= this.databaseCount; i++) {
            const database = GameState.nodes['Database' + i];
            if (database) {
                drawDualLines(this.graphics, app, database);
            }
        }
    }

    /**
     * Spawn Packet
     * 
     * Creates a new request packet and routes it through the system.
     */
    spawnPacket(startNode) {
        const isWrite = Math.random() * 100 < CONFIG.writeRequestPercentage;
        
        let packet;
        
        if (isWrite) {
            const size = 6;
            packet = this.add.graphics();
            packet.fillStyle(CONFIG.colors.packetReq, 1);
            packet.beginPath();
            packet.moveTo(0, -size);
            packet.lineTo(size, 0);
            packet.lineTo(0, size);
            packet.lineTo(-size, 0);
            packet.closePath();
            packet.fillPath();
            packet.x = startNode.x;
            packet.y = startNode.y;
            packet.isWrite = true;
        } else {
            packet = this.add.circle(
                startNode.x,
                startNode.y, 
                5,
                CONFIG.colors.packetReq
            );
            packet.isWrite = false;
        }
        
        packet.sourceNode = startNode;
        packet.isResponse = false;
        
        startNode.routePacket(packet);
    }

    /**
     * Skip Level (Debug/Testing Feature)
     */
    skipLevel() {
        if (this.trafficTimer) this.trafficTimer.remove();
        if (this.difficultyTimer) this.difficultyTimer.remove();

        GameState.total = CONFIG.level3Target;
        GameState.success = CONFIG.level3Target;
        GameState.errors = 0;
        GameState.isRunning = false;
        GameState.isGameOver = true;

        updateUI();
        
        const rate = (GameState.errors / GameState.total) * 100;
        const modal = document.getElementById('result-modal');
        const title = document.getElementById('modal-title');
        const body = document.getElementById('modal-body');
        const btnNext = document.getElementById('btn-modal-next');

        modal.style.display = 'block';
        modal.classList.add('show');

        title.innerText = "Level 3 Complete!";
        body.innerHTML = `
            <p>Final Error Rate: <strong style="color:#00ff00">${rate.toFixed(2)}%</strong> (Goal < 1%)</p>
            <p>You successfully handled ${CONFIG.level3Target} requests with database scaling!</p>
            
            <div class="concept-box" style="background: rgba(74, 144, 226, 0.1); border: 1px solid #4a90e2; border-radius: 8px; padding: 15px; margin-top: 15px;">
                <strong>Architect's Notes: Horizontal Database Scaling</strong><br/>
                Adding multiple databases introduces new patterns:
                <br/><br/>
                <ul style="text-align: left; margin-left: 20px;">
                    <li>✅ Distribute load across multiple servers</li>
                    <li>✅ Increased overall throughput and capacity</li>
                    <li>✅ Better fault tolerance (redundancy)</li>
                    <li>❌ Data consistency challenges</li>
                    <li>❌ More complex synchronization requirements</li>
                    <li>❌ Increased infrastructure cost</li>
                </ul>
                <br/>
                <strong>Key Insight:</strong> Horizontal scaling (adding more servers) is often more cost-effective than vertical scaling (upgrading existing servers), but requires careful architecture design.
            </div>
        `;
        
        btnNext.style.display = 'none';
    }
}
