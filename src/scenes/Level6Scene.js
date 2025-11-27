/**
 * Level 6 Scene - Load Balancer Introduction
 * 
 * This scene implements the sixth level of the game, which teaches the concept
 * of load balancing by introducing a load balancer between users and app servers.
 * 
 * Level Objectives:
 * - Process 1400 requests total
 * - Maintain error rate below 1%
 * - Learn how load balancing distributes traffic intelligently
 * 
 * Architecture:
 * - 3 User nodes (generate requests)
 * - 2 App Servers (process business logic)
 * - 1 Cache Server (cache layer)
 * - 1 Database Server (data storage)
 * - Optional Load Balancer (can be added by player)
 * 
 * Key Concepts Taught:
 * - Load balancing distributes requests based on server load
 * - Prevents hotspots and maximizes resource utilization
 * - Critical for horizontal scaling
 */

import { CONFIG, GameState, resetGameState } from '../config.js';
import { ServerNode } from '../objects/ServerNode.js';
import { drawDualLines } from '../utils/animations.js';
import { updateUI } from '../utils/uiManager.js';

export class Level6Scene extends Phaser.Scene {
    constructor() {
        super({ key: 'Level6Scene' });
    }

    create() {
        // Show Game UI Elements
        const leftSidebar = document.getElementById('left-sidebar');
        const controlPanel = document.getElementById('control-panel');
        if (leftSidebar) leftSidebar.style.display = 'flex';
        if (controlPanel) controlPanel.style.display = 'flex';
        
        document.getElementById('result-modal').style.display = 'none';
        
        // Update Header
        const header = document.querySelector('#header h1');
        if (header) header.textContent = 'Level 6: Load Balancer';
        
        // Update Objectives
        const objectivesList = document.querySelector('.objectives-list');
        if (objectivesList) {
            objectivesList.innerHTML = `
                <li>Complete ${CONFIG.level6Target} requests</li>
                <li>Maintain error rate < ${CONFIG.maxErrorRate}%</li>
                <li>Add a Load Balancer to distribute traffic</li>
            `;
        }
        
        // Reset Game State
        resetGameState(6);
        
        // Initialize Scene State
        this.trafficTimer = null;
        this.difficultyTimer = null;
        this.currentTrafficDelay = CONFIG.level6.initialTrafficDelay;
        this.packetsPerWave = CONFIG.level6.initialPacketsPerWave;
        this.hasLoadBalancer = false;

        updateUI();
        this.setupBackground();
        this.createNodes();
        this.setupZoom();
        this.setupCameraDrag();
        this.setupLoadBalancerButton();
    }

    setupCameraDrag() {
        this.isDraggingCamera = false;
        this.dragStartX = 0;
        this.dragStartY = 0;
        this.cameraStartX = 0;
        this.cameraStartY = 0;

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

        this.input.on('pointermove', (pointer) => {
            if (this.isDraggingCamera) {
                this.updateCameraDrag(pointer);
            }
        });

        this.input.on('pointerup', (pointer) => {
            if (this.isDraggingCamera) {
                this.endCameraDrag();
            }
        });

        this.input.on('pointerout', (pointer) => {
            if (this.isDraggingCamera) {
                this.endCameraDrag();
            }
        });
    }

    startCameraDrag(pointer) {
        this.isDraggingCamera = true;
        this.dragStartX = pointer.x;
        this.dragStartY = pointer.y;
        this.cameraStartX = this.cameras.main.scrollX;
        this.cameraStartY = this.cameras.main.scrollY;
        this.input.setDefaultCursor('grabbing');
    }

    updateCameraDrag(pointer) {
        const deltaX = pointer.x - this.dragStartX;
        const deltaY = pointer.y - this.dragStartY;
        this.cameras.main.scrollX = this.cameraStartX - deltaX / this.currentZoom;
        this.cameras.main.scrollY = this.cameraStartY - deltaY / this.currentZoom;
    }

    endCameraDrag() {
        this.isDraggingCamera = false;
        this.input.setDefaultCursor('default');
    }

    setupZoom() {
        this.cameras.main.setZoom(1);
        this.currentZoom = 1;
        this.minZoom = 0.5;
        this.maxZoom = 2.0;

        this.input.on('wheel', (pointer, gameObjects, deltaX, deltaY, deltaZ) => {
            const zoomDelta = deltaY > 0 ? -0.1 : 0.1;
            this.adjustZoom(zoomDelta);
        });
    }

    adjustZoom(delta) {
        this.currentZoom += delta;
        this.currentZoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.currentZoom));
        this.cameras.main.setZoom(this.currentZoom);
        
        const zoomDisplay = document.getElementById('zoom-level');
        if (zoomDisplay) {
            zoomDisplay.textContent = Math.round(this.currentZoom * 100) + '%';
        }
    }

    resetZoom() {
        this.currentZoom = 1;
        this.cameras.main.setZoom(1);
        
        const zoomDisplay = document.getElementById('zoom-level');
        if (zoomDisplay) {
            zoomDisplay.textContent = '100%';
        }
    }

    setupBackground() {
        const w = this.cameras.main.width;
        const h = this.cameras.main.height;

        this.cameras.main.setBackgroundColor('#2a2a2a');
        const gridSize = 6;
        this.add.grid(0, 0, w * gridSize, h * gridSize, 40, 40, 0x2a2a2a, 0, 0x444444, 0.3).setOrigin(0.5, 0.5);
        this.graphics = this.add.graphics();
    }

    createNodes() {
        const w = this.cameras.main.width;
        const h = this.cameras.main.height;

        // Create User Nodes (left side)
        const userConfig = CONFIG.level6.servers.user;
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
        
        // Create 2 Application Servers (center-left, stacked vertically)
        const appConfig = CONFIG.level6.servers.app;
        GameState.nodes['App1'] = new ServerNode(
            this, w * 0.40, h/2 - 60,
            'App Server 1', 'app', appConfig.capacity, appConfig.speed
        );
        GameState.nodes['App2'] = new ServerNode(
            this, w * 0.40, h/2 + 60,
            'App Server 2', 'app', appConfig.capacity, appConfig.speed
        );
        
        // Create Cache Server (above app servers)
        const cacheConfig = CONFIG.level6.servers.cache;
        GameState.nodes['Cache1'] = new ServerNode(
            this, w * 0.60, h/2 - 180,
            'Cache', 'cache', cacheConfig.capacity, cacheConfig.speed
        );
        
        // Create Database Server (right side)
        const dbConfig = CONFIG.level6.servers.database;
        GameState.nodes['Database1'] = new ServerNode(
            this, w * 0.60, h/2,
            'Database', 'database', dbConfig.capacity, dbConfig.speed
        );
    }

    setupLoadBalancerButton() {
        const w = this.cameras.main.width;
        const h = this.cameras.main.height;
        
        // Create button background
        this.lbButtonBg = this.add.rectangle(w * 0.27, h - 50, 250, 40, 0x9c27b0);
        this.lbButtonBg.setStrokeStyle(2, 0xbd5dd1);
        this.lbButtonBg.setInteractive({ useHandCursor: true });
        
        // Create button text
        this.lbButtonText = this.add.text(w * 0.27, h - 50, '+ Add Load Balancer ($300)', {
            fontSize: '16px',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        
        // Add hover effect
        this.lbButtonBg.on('pointerover', () => {
            this.lbButtonBg.setFillStyle(0xbd5dd1);
        });
        
        this.lbButtonBg.on('pointerout', () => {
            if (!this.hasLoadBalancer) {
                this.lbButtonBg.setFillStyle(0x9c27b0);
            }
        });
        
        // Add click handler
        this.lbButtonBg.on('pointerdown', () => {
            this.addLoadBalancer();
        });
    }

    addLoadBalancer() {
        if (this.hasLoadBalancer) {
            alert('Load Balancer already added!');
            return;
        }

        const cost = 300;
        if (GameState.money < cost) {
            alert(`Not enough money! Need $${cost}, have $${GameState.money}`);
            return;
        }

        // Deduct cost
        GameState.money -= cost;
        this.hasLoadBalancer = true;

        // Create Load Balancer node between users and app servers
        const w = this.cameras.main.width;
        const h = this.cameras.main.height;
        
        const lbConfig = CONFIG.level6.servers.loadbalancer;
        GameState.nodes['LoadBalancer1'] = new ServerNode(
            this, w * 0.27, h/2,
            'Load Balancer', 'loadbalancer', lbConfig.capacity, lbConfig.speed
        );

        // Disable the button
        const lbButton = document.getElementById('btn-add-loadbalancer');
        if (lbButton) {
            lbButton.disabled = true;
            lbButton.innerHTML = '✓ Load Balancer Added';
            lbButton.style.backgroundColor = '#666';
        }

        updateUI();
        this.showDifficultyToast('Load Balancer added! Traffic will be distributed intelligently.');
    }

    startSimulation() {
        if (GameState.isRunning || GameState.isGameOver) return;
        
        GameState.isRunning = true;
        GameState.isPaused = false;
        this.time.paused = false;
        this.tweens.resumeAll();
        
        this.scheduleNextWave();
        
        this.difficultyTimer = this.time.addEvent({
            delay: CONFIG.level6.difficultyInterval,
            callback: () => this.increaseDifficulty(),
            loop: true
        });
        
        updateUI();
    }

    pauseSimulation() {
        if (!GameState.isRunning || GameState.isPaused || GameState.isGameOver) return;
        
        GameState.isPaused = true;
        this.time.paused = true;
        this.tweens.pauseAll();
        updateUI();
    }

    resumeSimulation() {
        if (!GameState.isRunning || !GameState.isPaused || GameState.isGameOver) return;
        
        GameState.isPaused = false;
        this.time.paused = false;
        this.tweens.resumeAll();
        updateUI();
    }

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

    increaseDifficulty() {
        GameState.difficultyLevel++;
        
        const stageName = `stage${GameState.difficultyLevel}`;
        const stage = CONFIG.level6.difficulty[stageName];
        
        if (!stage) {
            this.showDifficultyToast("Maximum load reached");
            return;
        }
        
        this.currentTrafficDelay = stage.trafficDelay;
        this.packetsPerWave = stage.packetsPerWave;
        this.showDifficultyToast(stage.message);
        updateUI();
    }

    showDifficultyToast(msg) {
        const toast = document.getElementById('difficulty-toast');
        toast.innerText = msg;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 3000);
    }

    update() {
        this.graphics.clear();
        
        const lb = GameState.nodes['LoadBalancer1'];
        const app1 = GameState.nodes['App1'];
        const app2 = GameState.nodes['App2'];
        const cache = GameState.nodes['Cache1'];
        const db = GameState.nodes['Database1'];
        
        // Draw User → LoadBalancer or User → App connections
        ['User1', 'User2', 'User3'].forEach(uid => {
            const user = GameState.nodes[uid];
            if (lb) {
                // If load balancer exists, users connect to it
                drawDualLines(this.graphics, user, lb);
            } else {
                // Otherwise, users connect directly to both app servers
                if (app1) drawDualLines(this.graphics, user, app1);
                if (app2) drawDualLines(this.graphics, user, app2);
            }
        });
        
        // Draw LoadBalancer → App connections
        if (lb) {
            if (app1) drawDualLines(this.graphics, lb, app1);
            if (app2) drawDualLines(this.graphics, lb, app2);
        }
        
        // Draw App → Cache connections
        if (app1 && cache) drawDualLines(this.graphics, app1, cache);
        if (app2 && cache) drawDualLines(this.graphics, app2, cache);
        
        // Draw App → Database connections
        if (app1 && db) drawDualLines(this.graphics, app1, db);
        if (app2 && db) drawDualLines(this.graphics, app2, db);
    }

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

    skipLevel() {
        if (this.trafficTimer) this.trafficTimer.remove();
        if (this.difficultyTimer) this.difficultyTimer.remove();

        GameState.total = CONFIG.level6Target;
        GameState.success = CONFIG.level6Target;
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

        title.innerText = "Level 6 Complete!";
        body.innerHTML = `
            <p>Final Error Rate: <strong style="color:#00ff00">${rate.toFixed(2)}%</strong> (Goal < 1%)</p>
            <p>You successfully handled ${CONFIG.level6Target} requests with load balancing!</p>
            
            <div class="concept-box" style="background: rgba(156, 39, 176, 0.1); border: 1px solid #9c27b0; border-radius: 8px; padding: 15px; margin-top: 15px;">
                <strong>Architect's Notes: Load Balancer</strong><br/>
                Adding a load balancer provides critical benefits:
                <br/><br/>
                <ul style="text-align: left; margin-left: 20px;">
                    <li>✅ Intelligently distributes traffic based on server load</li>
                    <li>✅ Prevents hotspots and overload on individual servers</li>
                    <li>✅ Maximizes resource utilization across all servers</li>
                    <li>✅ Essential for horizontal scaling with multiple servers</li>
                    <li>❌ Single point of failure (needs redundancy in production)</li>
                    <li>❌ Additional latency (small overhead)</li>
                </ul>
                <br/>
                <strong>Key Insight:</strong> Load balancers are the traffic directors of modern architectures. By monitoring server health and capacity, they ensure requests go to the server best equipped to handle them, preventing individual servers from becoming bottlenecks.
            </div>
        `;
        
        // Show next button to go to Level 7
        btnNext.style.display = 'inline-block';
        btnNext.onclick = () => {
            this.scene.start('Level7Scene');
        };
        
        // Also keep the retry button for replaying
        const btnRetry = document.getElementById('btn-modal-retry');
        if (btnRetry) {
            btnRetry.textContent = 'Select Another Level';
            btnRetry.style.display = 'inline-block';
            btnRetry.onclick = () => {
                modal.style.display = 'none';
                modal.classList.remove('show');
                // Show level selector dropdown and focus it
                const levelSelector = document.getElementById('level-selector');
                if (levelSelector) {
                    // Scroll to make level selector visible
                    levelSelector.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    // Highlight the level selector briefly
                    levelSelector.style.border = '3px solid #ffd700';
                    levelSelector.style.boxShadow = '0 0 20px rgba(255, 215, 0, 0.5)';
                    setTimeout(() => {
                        levelSelector.style.border = '';
                        levelSelector.style.boxShadow = '';
                    }, 2000);
                }
            };
        }
    }
}
