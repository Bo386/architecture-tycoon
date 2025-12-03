/**
 * Base Level Scene Class
 * 
 * Abstract base class that contains all common functionality shared across
 * all level scenes. This eliminates code duplication and provides a consistent
 * structure for creating new levels.
 * 
 * Child classes only need to:
 * 1. Provide level configuration in constructor
 * 2. Implement createNodes() to define the architecture
 * 
 * All other functionality (UI setup, traffic generation, difficulty progression,
 * zoom controls, camera dragging, etc.) is handled by this base class.
 */

import { CONFIG, GameState, resetGameState } from '../config.js';
import { LAYOUT_CONFIG, UI_CONFIG } from '../config/index.js';
import { drawDualLines } from '../utils/animations.js';
import { updateUI, checkGameEnd, updateObjectivesDisplay } from '../utils/uiManager.js';

export class BaseLevelScene extends Phaser.Scene {
    /**
     * Constructor
     * 
     * @param {Object} config - Level configuration object
     * @param {string} config.key - Unique scene key (e.g., 'Level1Scene')
     * @param {number} config.levelNumber - Level number (1-8)
     * @param {number} config.targetTotal - Total requests needed to complete
     * @param {number} config.maxErrorRate - Maximum acceptable error rate percentage (optional, default from CONFIG)
     * @param {number} config.initialTrafficDelay - Initial delay between traffic waves (ms)
     * @param {number} config.initialPacketsPerWave - Starting packets per wave
     * @param {number} config.difficultyInterval - Time between difficulty increases (ms)
     * @param {Object} config.difficultyStages - Difficulty progression configuration
     * @param {Array<string>} config.userNodeIds - Array of user node IDs (e.g., ['User1', 'User2'])
     * @param {number} config.revenuePerRequest - Revenue earned per successful request (optional, default 0)
     */
    constructor(config) {
        super({ key: config.key });
        
        // Store level configuration
        this.levelConfig = config;
        this.levelNumber = config.levelNumber;
        this.targetTotal = config.targetTotal;
        this.maxErrorRate = config.maxErrorRate !== undefined ? config.maxErrorRate : CONFIG.maxErrorRate;
        this.initialTrafficDelay = config.initialTrafficDelay || 1500;
        this.initialPacketsPerWave = config.initialPacketsPerWave || 1;
        this.difficultyInterval = config.difficultyInterval || 8000;
        this.difficultyStages = config.difficultyStages || {};
        this.userNodeIds = config.userNodeIds || ['User1', 'User2', 'User3'];
        this.revenuePerRequest = config.revenuePerRequest || 0;  // Revenue per successful request
    }

    /**
     * Create Method
     * 
     * Called automatically by Phaser when the scene starts.
     * Sets up the entire level including UI, background, nodes, and initial state.
     */
    create() {
        // Restore normal layout - reset main-content from fullscreen
        const mainContent = document.getElementById('main-content');
        if (mainContent) {
            mainContent.style.position = '';
            mainContent.style.top = '';
            mainContent.style.left = '';
            mainContent.style.width = '';
            mainContent.style.height = '';
            mainContent.style.zIndex = '';
        }
        
        // Show Game UI Elements
        const leftSidebar = document.getElementById('left-sidebar');
        const controlPanel = document.getElementById('control-panel');
        if (leftSidebar) leftSidebar.style.display = 'flex';
        if (controlPanel) controlPanel.style.display = 'flex';
        
        // Show header elements
        const header = document.getElementById('header');
        const levelSelector = document.getElementById('level-selector');
        const legend = document.querySelector('.legend-box');
        
        if (header) header.style.display = 'flex';
        if (levelSelector) levelSelector.style.display = 'block';
        if (legend) legend.style.display = 'flex';
        
        // Ensure result modal is hidden at start
        document.getElementById('result-modal').style.display = 'none';
        
        // Reset Game State for this level
        resetGameState(this.levelNumber);
        
        // Initialize Scene-Specific State Variables
        this.trafficTimer = null;
        this.difficultyTimer = null;
        this.currentTrafficDelay = this.initialTrafficDelay;
        this.packetsPerWave = this.initialPacketsPerWave;

        // Update the UI to reflect initial state
        updateObjectivesDisplay(); // Update objectives with level-specific targets
        updateUI();

        // Set up visual elements and create server nodes
        this.setupBackground();
        this.createNodes(); // Must be implemented by child classes
        this.setupCameraDrag();
        this.setupCameraZoom();
    }

    /**
     * Setup Camera Drag
     * 
     * Enables dragging the entire canvas by clicking and dragging the background.
     */
    setupCameraDrag() {
        // Camera drag state
        this.isDraggingCamera = false;
        this.dragStartX = 0;
        this.dragStartY = 0;
        this.cameraStartX = 0;
        this.cameraStartY = 0;

        // Listen for pointer down
        this.input.on('pointerdown', (pointer) => {
            if (pointer.rightButtonDown() || pointer.middleButtonDown()) {
                this.startCameraDrag(pointer);
            } else if (pointer.leftButtonDown() && !pointer.event.target.closest('.server-node')) {
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

        // End drag if pointer leaves canvas
        this.input.on('pointerout', (pointer) => {
            if (this.isDraggingCamera) {
                this.endCameraDrag();
            }
        });
    }

    /**
     * Start Camera Drag
     */
    startCameraDrag(pointer) {
        this.isDraggingCamera = true;
        this.dragStartX = pointer.x;
        this.dragStartY = pointer.y;
        this.cameraStartX = this.cameras.main.scrollX;
        this.cameraStartY = this.cameras.main.scrollY;
        this.input.setDefaultCursor('grabbing');
    }

    /**
     * Update Camera Drag
     */
    updateCameraDrag(pointer) {
        const deltaX = pointer.x - this.dragStartX;
        const deltaY = pointer.y - this.dragStartY;
        this.cameras.main.scrollX = this.cameraStartX - deltaX;
        this.cameras.main.scrollY = this.cameraStartY - deltaY;
    }

    /**
     * End Camera Drag
     */
    endCameraDrag() {
        this.isDraggingCamera = false;
        this.input.setDefaultCursor('default');
    }

    /**
     * Setup Camera Zoom
     * 
     * Enables zooming in/out using mouse wheel.
     */
    setupCameraZoom() {
        this.input.on('wheel', (pointer, gameObjects, deltaX, deltaY, deltaZ) => {
            // deltaY > 0 means scroll down (zoom out)
            // deltaY < 0 means scroll up (zoom in)
            const zoomFactor = deltaY > 0 ? 0.9 : 1.1;
            const newZoom = Phaser.Math.Clamp(
                this.cameras.main.zoom * zoomFactor,
                0.5,  // Minimum zoom (zoomed out)
                2.0   // Maximum zoom (zoomed in)
            );
            this.cameras.main.setZoom(newZoom);
        });
    }

    /**
     * Setup Background Graphics
     */
    setupBackground() {
        const w = this.cameras.main.width;
        const h = this.cameras.main.height;

        // Set Camera Background Color
        this.cameras.main.setBackgroundColor('#2a2a2a');

        // Add Grid Background
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
        
        // Graphics Object for Connection Lines
        this.graphics = this.add.graphics();
    }

    /**
     * Create Server Nodes
     * 
     * MUST be implemented by child classes to define the level's architecture.
     * Child classes should create nodes and add them to GameState.nodes.
     */
    createNodes() {
        throw new Error('createNodes() must be implemented by child class');
    }

    /**
     * Start Simulation
     */
    startSimulation() {
        console.log(`${this.levelConfig.key}.startSimulation called`);
        
        if (GameState.isRunning || GameState.isGameOver) {
            console.log('Prevented start - already running or game over');
            return;
        }
        
        GameState.isRunning = true;
        GameState.isPaused = false;
        this.time.paused = false;
        this.tweens.resumeAll();
        
        console.log('Calling scheduleNextWave...');
        this.scheduleNextWave();
        
        // Start Difficulty Progression Timer
        this.difficultyTimer = this.time.addEvent({
            delay: this.difficultyInterval,
            callback: () => this.increaseDifficulty(),
            loop: true
        });
        
        updateUI();
        console.log('startSimulation completed');
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
        
        // Spawn Packets
        for (let i = 0; i < this.packetsPerWave; i++) {
            const userNode = GameState.nodes[this.userNodeIds[Math.floor(Math.random() * this.userNodeIds.length)]];
            this.time.delayedCall(i * 80, () => this.spawnPacket(userNode));
        }
        
        // Schedule Next Wave
        this.trafficTimer = this.time.delayedCall(this.currentTrafficDelay, () => {
            this.scheduleNextWave();
        });
    }

    /**
     * Increase Difficulty
     * 
     * Uses the difficulty stages configuration to progressively increase challenge.
     */
    increaseDifficulty() {
        GameState.difficultyLevel++;
        
        // Find the stage configuration for current difficulty level
        const stageKey = `stage${GameState.difficultyLevel}`;
        const stage = this.difficultyStages[stageKey];
        
        if (stage) {
            this.currentTrafficDelay = stage.trafficDelay;
            this.packetsPerWave = stage.packetsPerWave;
            this.showDifficultyToast(stage.message);
        } else {
            // No more stages defined, maintain current difficulty
            this.showDifficultyToast("Maximum pressure sustained");
            return;
        }
        
        updateUI();
    }

    /**
     * Show Difficulty Toast Notification
     */
    showDifficultyToast(msg) {
        const toast = document.getElementById('difficulty-toast');
        toast.innerText = msg;
        toast.style.opacity = 1;
        setTimeout(() => toast.style.opacity = 0, UI_CONFIG.toast.displayDuration);
    }

    /**
     * Show Toast Notification
     * General purpose toast for any message
     */
    showToast(msg) {
        this.showDifficultyToast(msg);
    }

    /**
     * Update UI
     * Wrapper for the updateUI utility function
     */
    updateUI() {
        updateUI();
    }

    /**
     * Update Method
     * 
     * Called every frame by Phaser. Redraws connection lines between nodes.
     * Can be overridden by child classes for custom drawing logic.
     */
    update() {
        this.graphics.clear();
        this.drawConnections();
    }

    /**
     * Draw Connections
     * 
     * Can be overridden by child classes to customize connection drawing.
     * Default implementation draws lines from all users to all app servers.
     */
    drawConnections() {
        // Find all app servers (or load balancers)
        const targets = this.getConnectionTargets();
        
        // Draw lines from each user to each target
        this.userNodeIds.forEach(uid => {
            const user = GameState.nodes[uid];
            if (user) {
                targets.forEach(target => {
                    if (target) {
                        drawDualLines(this.graphics, user, target);
                    }
                });
            }
        });
    }

    /**
     * Get Connection Targets
     * 
     * Returns array of nodes that users connect to.
     * Can be overridden by child classes.
     * 
     * Default: Returns all app servers
     */
    getConnectionTargets() {
        // Default: connect to app servers
        return Object.keys(GameState.nodes)
            .filter(key => key.startsWith('App'))
            .map(key => GameState.nodes[key])
            .filter(node => node && node.active);
    }

    /**
     * Spawn Packet
     */
    spawnPacket(startNode) {
        // Determine if this is a write request (based on config percentage)
        const isWrite = Math.random() * 100 < CONFIG.writeRequestPercentage;
        
        // Create Packet Visual with appropriate color
        const packet = this.add.circle(
            startNode.x,
            startNode.y, 
            LAYOUT_CONFIG.packets.circleRadius,
            isWrite ? CONFIG.colors.packetWrite : CONFIG.colors.packetReq
        );
        
        // Set Packet Metadata
        packet.sourceNode = startNode;
        packet.isResponse = false;
        packet.isWrite = isWrite;
        
        // Start Packet Routing
        startNode.routePacket(packet);
    }

    /**
     * Skip Level
     * 
     * Debug/testing feature to auto-complete the level.
     */
    skipLevel() {
        // Stop All Active Timers
        if (this.trafficTimer) this.trafficTimer.remove();
        if (this.difficultyTimer) this.difficultyTimer.remove();

        // Set Winning Game State
        GameState.total = this.targetTotal;
        GameState.success = this.targetTotal - 5;
        GameState.errors = 5;
        GameState.isRunning = false;
        GameState.isGameOver = true;

        updateUI();
        
        // Show Success Modal
        const rate = (GameState.errors / GameState.total) * 100;
        const modal = document.getElementById('result-modal');
        const title = document.getElementById('modal-title');
        const body = document.getElementById('modal-body');
        const btnNext = document.getElementById('btn-modal-next');

        modal.style.display = 'block';
        modal.className = 'win-theme';

        title.innerText = `Level ${this.levelNumber} Skipped - Auto Complete!`;
        body.innerHTML = `
            <p>Final Error Rate: <strong style="color:#00ff00">${rate.toFixed(2)}%</strong> (Goal < 1%)</p>
            <p>You successfully handled ${this.targetTotal} high-concurrency requests!</p>
            
            <div class="concept-box">
                <strong>Level ${this.levelNumber} Complete!</strong><br/>
                This level was skipped for testing purposes.
            </div>
        `;
        
        // Show next button if not last level
        if (this.levelNumber < 9) {
            btnNext.style.display = 'inline-block';
        } else {
            btnNext.style.display = 'none';
        }
    }
}
