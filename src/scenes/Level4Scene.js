/**
 * Level 4 Scene - App Server Horizontal Scaling Challenge
 * 
 * This scene implements the fourth level of the game, which teaches the concept
 * of horizontal application server scaling by allowing players to add multiple app servers.
 * 
 * Level Objectives:
 * - Process 1200 requests total (more than Level 3 to test multi-app-server scalability)
 * - Maintain error rate below 1%
 * - Learn to scale app servers horizontally to handle increased load
 * 
 * Architecture:
 * - 3 User nodes (generate requests)
 * - 1+ App Servers (process business logic - can be dynamically added)
 * - 2 Database Servers (handle data storage - fixed count)
 * - Three-tier architecture with horizontal app server scaling capability
 * 
 * Difficulty Progression:
 * - Similar to Level 3 but with higher overall traffic
 * - Encourages players to add app servers to handle load
 * 
 * Key Concepts Taught:
 * - Horizontal app server scaling
 * - Load balancing across multiple app servers
 * - Distributed application architecture
 */

import { CONFIG, GameState, resetGameState } from '../config.js';
import { ServerNode } from '../objects/ServerNode.js';
import { drawDualLines } from '../utils/animations.js';
import { updateUI } from '../utils/uiManager.js';

export class Level4Scene extends Phaser.Scene {
    /**
     * Constructor
     * 
     * Initializes the scene with a unique key identifier.
     */
    constructor() {
        super({ key: 'Level4Scene' });
        this.appServerCount = 1; // Track number of app servers
        this.addAppButton = null; // Reference to the add app server button
    }

    /**
     * Create Method
     * 
     * Called automatically by Phaser when the scene starts.
     * Sets up Level 4 including UI updates, background, nodes, and initial state.
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
         * Update Header for Level 4
         * Change the page title to reflect the new level
         */
        const header = document.querySelector('#header h1');
        if (header) header.textContent = 'Level 4: App Server Scaling';
        
        /**
         * Update Objectives Display
         * Show Level 4-specific objectives in the sidebar
         */
        const objectivesList = document.querySelector('.objectives-list');
        if (objectivesList) {
            objectivesList.innerHTML = `
                <li>Complete ${CONFIG.level4Target} requests</li>
                <li>Maintain error rate < ${CONFIG.maxErrorRate}%</li>
                <li>Scale app servers horizontally when needed</li>
            `;
        }
        
        /**
         * Reset Game State for Level 4
         * Clear previous level data and initialize with Level 4 defaults
         */
        resetGameState(4);
        
        /**
         * Initialize Scene-Specific State Variables
         */
        this.trafficTimer = null;
        this.difficultyTimer = null;
        this.currentTrafficDelay = CONFIG.level4.initialTrafficDelay;
        this.packetsPerWave = CONFIG.level4.initialPacketsPerWave;
        this.appServerCount = 1; // Start with one app server

        // Update the UI to reflect initial state
        updateUI();

        // Set up visual elements and create server nodes
        this.setupBackground();
        this.createNodes();
        this.createAddAppServerButton();
        this.setupZoom();
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
        this.add.grid(
            w/2, h/2,
            w, h,
            40, 40,
            0x2a2a2a,
            0,
            0x444444,
            0.3
        );
        
        /**
         * Graphics Object for Connection Lines
         */
        this.graphics = this.add.graphics();
    }

    /**
     * Create Server Nodes
     * 
     * Instantiates all server nodes for Level 4:
     * - 3 User nodes (left side)
     * - 1 App Server initially (center)
     * - 2 Database Servers (right side)
     */
    createNodes() {
        const w = this.cameras.main.width;
        const h = this.cameras.main.height;

        /**
         * Create User Nodes
         */
        const userConfig = CONFIG.level4.servers.user;
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
         * Create Initial Application Server
         */
        const appConfig = CONFIG.level4.servers.app;
        GameState.nodes['App1'] = new ServerNode(
            this, w * 0.5, h/2,
            'App Server 1', 'app', appConfig.capacity, appConfig.speed
        );
        
        /**
         * Create Database Servers (2 databases)
         */
        const dbConfig = CONFIG.level4.servers.database;
        const dbSpacing = 140;
        const dbStartY = h/2 - dbSpacing/2;
        
        GameState.nodes['Database1'] = new ServerNode(
            this, w * 0.8, dbStartY,
            'Database 1', 'database', dbConfig.capacity, dbConfig.speed
        );
        
        GameState.nodes['Database2'] = new ServerNode(
            this, w * 0.8, dbStartY + dbSpacing,
            'Database 2', 'database', dbConfig.capacity, dbConfig.speed
        );
    }

    /**
     * Create Add App Server Button
     * 
     * Creates a button in the game canvas that allows adding new app servers.
     */
    createAddAppServerButton() {
        const w = this.cameras.main.width;
        const h = this.cameras.main.height;

        // Create button background
        this.addAppButton = this.add.rectangle(
            w * 0.5, h - 50,
            200, 40,
            0x4a90e2
        ).setInteractive({ useHandCursor: true });

        // Create button text
        const buttonText = this.add.text(
            w * 0.5, h - 50,
            '+ Add App Server ($300)',
            {
                fontSize: '14px',
                color: '#ffffff',
                fontFamily: 'Arial'
            }
        ).setOrigin(0.5);

        // Button hover effects
        this.addAppButton.on('pointerover', () => {
            this.addAppButton.setFillStyle(0x5aa0f2);
        });

        this.addAppButton.on('pointerout', () => {
            this.addAppButton.setFillStyle(0x4a90e2);
        });

        // Button click handler
        this.addAppButton.on('pointerdown', () => {
            this.addAppServer();
        });

        // Store reference to button text for updates
        this.addAppButtonText = buttonText;
    }

    /**
     * Add App Server
     * 
     * Adds a new app server to the architecture if the player has enough money.
     */
    addAppServer() {
        const cost = 300;

        // Check if player has enough money
        if (GameState.money < cost) {
            this.showToast('Not enough money! Need $' + cost);
            return;
        }

        // Check maximum limit (prevent too many app servers)
        if (this.appServerCount >= 5) {
            this.showToast('Maximum app server limit reached!');
            return;
        }

        // Deduct cost
        GameState.money -= cost;

        // Increment app server count
        this.appServerCount++;

        // Calculate position for new app server
        const w = this.cameras.main.width;
        const h = this.cameras.main.height;
        const appConfig = CONFIG.level4.servers.app;
        
        // Arrange app servers vertically with adequate spacing
        const spacing = 140;
        const startY = h/2 - ((this.appServerCount - 1) * spacing) / 2;

        // Reposition existing app servers
        for (let i = 1; i < this.appServerCount; i++) {
            const app = GameState.nodes['App' + i];
            if (app) {
                app.y = startY + (i - 1) * spacing;
            }
        }

        // Create new app server
        const newY = startY + (this.appServerCount - 1) * spacing;
        GameState.nodes['App' + this.appServerCount] = new ServerNode(
            this, w * 0.5, newY,
            'App Server ' + this.appServerCount, 'app', appConfig.capacity, appConfig.speed
        );

        // Update UI
        updateUI();
        this.showToast('App Server ' + this.appServerCount + ' added!');
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
            delay: CONFIG.level4.difficultyInterval,
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
        const stage = CONFIG.level4.difficulty[stageName];
        
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
        
        // Draw User → App Connections (for all app servers)
        ['User1', 'User2', 'User3'].forEach(uid => {
            const user = GameState.nodes[uid];
            for (let i = 1; i <= this.appServerCount; i++) {
                const app = GameState.nodes['App' + i];
                if (app) {
                    drawDualLines(this.graphics, user, app);
                }
            }
        });
        
        // Draw App → Database Connections (for all app servers to all databases)
        for (let i = 1; i <= this.appServerCount; i++) {
            const app = GameState.nodes['App' + i];
            if (app) {
                const db1 = GameState.nodes['Database1'];
                const db2 = GameState.nodes['Database2'];
                if (db1) drawDualLines(this.graphics, app, db1);
                if (db2) drawDualLines(this.graphics, app, db2);
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

        GameState.total = CONFIG.level4Target;
        GameState.success = CONFIG.level4Target;
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

        title.innerText = "Level 4 Complete!";
        body.innerHTML = `
            <p>Final Error Rate: <strong style="color:#00ff00">${rate.toFixed(2)}%</strong> (Goal < 1%)</p>
            <p>You successfully handled ${CONFIG.level4Target} requests with app server scaling!</p>
            
            <div class="concept-box" style="background: rgba(74, 144, 226, 0.1); border: 1px solid #4a90e2; border-radius: 8px; padding: 15px; margin-top: 15px;">
                <strong>Architect's Notes: Horizontal App Server Scaling</strong><br/>
                Adding multiple app servers introduces new capabilities:
                <br/><br/>
                <ul style="text-align: left; margin-left: 20px;">
                    <li>✅ Distributed processing load across multiple servers</li>
                    <li>✅ Better fault tolerance and availability</li>
                    <li>✅ Easier to scale than vertical scaling</li>
                    <li>❌ Requires load balancing strategy</li>
                    <li>❌ Session management complexity</li>
                    <li>❌ More servers = higher infrastructure cost</li>
                </ul>
                <br/>
                <strong>Key Insight:</strong> Horizontal scaling of application servers allows you to handle more traffic by adding more servers. This is more flexible than vertical scaling but requires proper load balancing.
            </div>
        `;
        
        // Show next button to go to Level 5
        btnNext.style.display = 'inline-block';
        btnNext.onclick = () => {
            this.scene.start('Level5Scene');
        };
    }
}
