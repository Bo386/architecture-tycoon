/**
 * Level 5 Scene - Cache Layer Introduction
 * 
 * This scene implements the fifth level of the game, which teaches the concept
 * of caching by introducing a cache layer between app and database servers.
 * 
 * Level Objectives:
 * - Process 1200 requests total
 * - Maintain error rate below 1%
 * - Learn how caching reduces database load and improves performance
 * 
 * Architecture:
 * - 3 User nodes (generate requests)
 * - 1 App Server (process business logic - fixed count)
 * - 1 Cache Server (cache layer with hit/miss logic)
 * - 1 Database Server (handle data storage - fixed count)
 * - Four-tier architecture with caching layer
 * 
 * Key Concepts Taught:
 * - Cache hit/miss mechanics
 * - How caching reduces database load
 * - Cache effectiveness for read-heavy workloads
 */

import { CONFIG, GameState, resetGameState } from '../config.js';
import { ServerNode } from '../objects/ServerNode.js';
import { drawDualLines } from '../utils/animations.js';
import { updateUI } from '../utils/uiManager.js';

export class Level5Scene extends Phaser.Scene {
    /**
     * Constructor
     * 
     * Initializes the scene with a unique key identifier.
     */
    constructor() {
        super({ key: 'Level5Scene' });
    }

    /**
     * Create Method
     * 
     * Called automatically by Phaser when the scene starts.
     * Sets up Level 5 including UI updates, background, nodes, and initial state.
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
         * Update Header for Level 5
         * Change the page title to reflect the new level
         */
        const header = document.querySelector('#header h1');
        if (header) header.textContent = 'Level 5: Cache Layer';
        
        /**
         * Update Objectives Display
         * Show Level 5-specific objectives in the sidebar
         */
        const objectivesList = document.querySelector('.objectives-list');
        if (objectivesList) {
            objectivesList.innerHTML = `
                <li>Complete ${CONFIG.level5Target} requests</li>
                <li>Maintain error rate < ${CONFIG.maxErrorRate}%</li>
                <li>Understand cache hit/miss mechanics</li>
            `;
        }
        
        /**
         * Reset Game State for Level 5
         * Clear previous level data and initialize with Level 5 defaults
         */
        resetGameState(5);
        
        /**
         * Initialize Scene-Specific State Variables
         */
        this.trafficTimer = null;
        this.difficultyTimer = null;
        this.currentTrafficDelay = CONFIG.level5.initialTrafficDelay;
        this.packetsPerWave = CONFIG.level5.initialPacketsPerWave;

        // Update the UI to reflect initial state
        updateUI();

        // Set up visual elements and create server nodes
        this.setupBackground();
        this.createNodes();
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
     * Instantiates all server nodes for Level 5:
     * - 3 User nodes (left side)
     * - 1 App Server (center-left)
     * - 1 Cache Server (center)
     * - 1 Database Server (right side)
     */
    createNodes() {
        const w = this.cameras.main.width;
        const h = this.cameras.main.height;

        /**
         * Create User Nodes
         */
        const userConfig = CONFIG.level5.servers.user;
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
         * Create Application Server (center)
         */
        const appConfig = CONFIG.level5.servers.app;
        GameState.nodes['App1'] = new ServerNode(
            this, w * 0.45, h/2,
            'App Server', 'app', appConfig.capacity, appConfig.speed
        );
        
        /**
         * Create Cache Server (above App Server)
         */
        const cacheConfig = CONFIG.level5.servers.cache;
        GameState.nodes['Cache1'] = new ServerNode(
            this, w * 0.45, h/2 - 180,
            'Cache', 'cache', cacheConfig.capacity, cacheConfig.speed
        );
        
        /**
         * Create Database Server (right side)
         */
        const dbConfig = CONFIG.level5.servers.database;
        GameState.nodes['Database1'] = new ServerNode(
            this, w * 0.70, h/2,
            'Database', 'database', dbConfig.capacity, dbConfig.speed
        );
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
            delay: CONFIG.level5.difficultyInterval,
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
        const stage = CONFIG.level5.difficulty[stageName];
        
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
        
        const app = GameState.nodes['App1'];
        const cache = GameState.nodes['Cache1'];
        const db = GameState.nodes['Database1'];
        
        // Draw User → App Connections
        ['User1', 'User2', 'User3'].forEach(uid => {
            const user = GameState.nodes[uid];
            if (app) {
                drawDualLines(this.graphics, user, app);
            }
        });
        
        // Draw App → Cache Connection (vertical)
        if (app && cache) {
            drawDualLines(this.graphics, app, cache);
        }
        
        // Draw App → Database Connection (horizontal)
        if (app && db) {
            drawDualLines(this.graphics, app, db);
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

        GameState.total = CONFIG.level5Target;
        GameState.success = CONFIG.level5Target;
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

        title.innerText = "Level 5 Complete!";
        body.innerHTML = `
            <p>Final Error Rate: <strong style="color:#00ff00">${rate.toFixed(2)}%</strong> (Goal < 1%)</p>
            <p>You successfully handled ${CONFIG.level5Target} requests with caching!</p>
            
            <div class="concept-box" style="background: rgba(74, 144, 226, 0.1); border: 1px solid #4a90e2; border-radius: 8px; padding: 15px; margin-top: 15px;">
                <strong>Architect's Notes: Caching Layer</strong><br/>
                Adding a cache layer provides significant benefits:
                <br/><br/>
                <ul style="text-align: left; margin-left: 20px;">
                    <li>✅ Dramatically reduces database load (70% hit rate = 70% fewer DB queries)</li>
                    <li>✅ Much faster response times (50ms vs 400ms)</li>
                    <li>✅ Better scalability for read-heavy workloads</li>
                    <li>❌ Cache invalidation complexity</li>
                    <li>❌ Additional infrastructure to maintain</li>
                    <li>❌ Stale data risks if not properly managed</li>
                </ul>
                <br/>
                <strong>Key Insight:</strong> Caching is one of the most effective performance optimizations. By storing frequently accessed data in fast memory, you reduce expensive database operations and improve response times dramatically.
            </div>
        `;
        
        // No Level 6 yet, hide next button
        btnNext.style.display = 'none';
    }
}
