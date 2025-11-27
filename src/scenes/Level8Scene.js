/**
 * Level 8 Scene - Read-Write Splitting
 * 
 * This scene implements the eighth level of the game, which teaches the concept
 * of read-write splitting by introducing a read replica database.
 * 
 * Level Objectives:
 * - Process 1800 requests total
 * - Maintain error rate below 1%
 * - Learn how read-write splitting optimizes database performance
 * 
 * Architecture:
 * - 3 User nodes (generate requests)
 * - 1 CDN Server (provided by default)
 * - 1 Load Balancer (distribute traffic)
 * - 2 App Servers (process business logic)
 * - 1 Cache Server (cache layer)
 * - 1 Master Database (handles writes, provided by default)
 * - 1 Read Replica Database (optional, handles reads)
 * 
 * Key Concepts Taught:
 * - Read-write splitting reduces load on master database
 * - Read replicas are optimized for read operations
 * - Write operations always go to master to maintain consistency
 */

import { CONFIG, GameState, resetGameState } from '../config.js';
import { ServerNode } from '../objects/ServerNode.js';
import { drawDualLines } from '../utils/animations.js';
import { updateUI } from '../utils/uiManager.js';

export class Level8Scene extends Phaser.Scene {
    constructor() {
        super({ key: 'Level8Scene' });
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
        if (header) header.textContent = 'Level 8: Read-Write Splitting';
        
        // Update Objectives
        const objectivesList = document.querySelector('.objectives-list');
        if (objectivesList) {
            objectivesList.innerHTML = `
                <li>Complete ${CONFIG.level8Target} requests</li>
                <li>Maintain error rate < ${CONFIG.maxErrorRate}%</li>
                <li>Add Read Replica to separate read/write traffic</li>
            `;
        }
        
        // Reset Game State
        resetGameState(8);
        
        // Initialize Scene State
        this.trafficTimer = null;
        this.difficultyTimer = null;
        this.currentTrafficDelay = CONFIG.level8.initialTrafficDelay;
        this.packetsPerWave = CONFIG.level8.initialPacketsPerWave;
        this.hasCDN = true; // CDN is provided by default in Level 8
        this.hasLoadBalancer = true; // Load balancer is already present
        this.hasReadReplica = false; // Read replica can be added

        updateUI();
        this.setupBackground();
        this.createNodes();
        this.setupZoom();
        this.setupReadReplicaButton();
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
        this.add.grid(w/2, h/2, w, h, 40, 40, 0x2a2a2a, 0, 0x444444, 0.3);
        this.graphics = this.add.graphics();
    }

    createNodes() {
        const w = this.cameras.main.width;
        const h = this.cameras.main.height;

        // Create User Nodes (left side)
        const userConfig = CONFIG.level8.servers.user;
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
        
        // Create CDN (provided by default)
        const cdnConfig = CONFIG.level8.servers.cdn;
        GameState.nodes['CDN1'] = new ServerNode(
            this, w * 0.24, h/2,
            'CDN', 'cdn', cdnConfig.capacity, cdnConfig.speed
        );
        
        // Create Load Balancer (already present)
        const lbConfig = CONFIG.level8.servers.loadbalancer;
        GameState.nodes['LoadBalancer1'] = new ServerNode(
            this, w * 0.33, h/2,
            'Load Balancer', 'loadbalancer', lbConfig.capacity, lbConfig.speed
        );
        
        // Create 2 Application Servers (center-left, stacked vertically)
        const appConfig = CONFIG.level8.servers.app;
        GameState.nodes['App1'] = new ServerNode(
            this, w * 0.50, h/2 - 60,
            'App Server 1', 'app', appConfig.capacity, appConfig.speed
        );
        GameState.nodes['App2'] = new ServerNode(
            this, w * 0.50, h/2 + 60,
            'App Server 2', 'app', appConfig.capacity, appConfig.speed
        );
        
        // Create Cache Server (above app servers)
        const cacheConfig = CONFIG.level8.servers.cache;
        GameState.nodes['Cache1'] = new ServerNode(
            this, w * 0.70, h/2 - 180,
            'Cache', 'cache', cacheConfig.capacity, cacheConfig.speed
        );
        
        // Create Master Database Server (right side)
        const dbConfig = CONFIG.level8.servers.database;
        GameState.nodes['Database1'] = new ServerNode(
            this, w * 0.70, h/2,
            'Master DB', 'database', dbConfig.capacity, dbConfig.speed
        );
    }

    setupReadReplicaButton() {
        const w = this.cameras.main.width;
        const h = this.cameras.main.height;
        
        // Create button background
        this.rrButtonBg = this.add.rectangle(w * 0.24, h - 50, 280, 40, 0x4caf50);
        this.rrButtonBg.setStrokeStyle(2, 0x66bb6a);
        this.rrButtonBg.setInteractive({ useHandCursor: true });
        
        // Create button text
        this.rrButtonText = this.add.text(w * 0.24, h - 50, '+ Add Read Replica ($500)', {
            fontSize: '16px',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        
        // Add hover effect
        this.rrButtonBg.on('pointerover', () => {
            this.rrButtonBg.setFillStyle(0x66bb6a);
        });
        
        this.rrButtonBg.on('pointerout', () => {
            if (!this.hasReadReplica) {
                this.rrButtonBg.setFillStyle(0x4caf50);
            }
        });
        
        // Add click handler
        this.rrButtonBg.on('pointerdown', () => {
            this.addReadReplica();
        });
    }

    addReadReplica() {
        if (this.hasReadReplica) {
            alert('Read Replica already added!');
            return;
        }

        const cost = 500;
        if (GameState.money < cost) {
            alert(`Not enough money! Need $${cost}, have $${GameState.money}`);
            return;
        }

        // Deduct cost
        GameState.money -= cost;
        this.hasReadReplica = true;

        // Create Read Replica node next to master database
        const w = this.cameras.main.width;
        const h = this.cameras.main.height;
        
        const rrConfig = CONFIG.level8.servers.readreplica;
        GameState.nodes['ReadReplica1'] = new ServerNode(
            this, w * 0.70, h/2 + 120,
            'Read Replica', 'database', rrConfig.capacity, rrConfig.speed
        );

        // Update button appearance
        this.rrButtonBg.setFillStyle(0x666666);
        this.rrButtonText.setText('✓ Read Replica Added');

        updateUI();
        this.showDifficultyToast('Read Replica added! Read requests will be handled separately.');
    }

    startSimulation() {
        if (GameState.isRunning || GameState.isGameOver) return;
        
        GameState.isRunning = true;
        GameState.isPaused = false;
        this.time.paused = false;
        this.tweens.resumeAll();
        
        this.scheduleNextWave();
        
        this.difficultyTimer = this.time.addEvent({
            delay: CONFIG.level8.difficultyInterval,
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
        const stage = CONFIG.level8.difficulty[stageName];
        
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
        
        const cdn = GameState.nodes['CDN1'];
        const lb = GameState.nodes['LoadBalancer1'];
        const app1 = GameState.nodes['App1'];
        const app2 = GameState.nodes['App2'];
        const cache = GameState.nodes['Cache1'];
        const masterDb = GameState.nodes['Database1'];
        const readReplica = GameState.nodes['ReadReplica1'];
        
        // Draw User → CDN connections
        ['User1', 'User2', 'User3'].forEach(uid => {
            const user = GameState.nodes[uid];
            if (cdn) {
                drawDualLines(this.graphics, user, cdn);
            }
        });
        
        // Draw CDN → LoadBalancer connection
        if (cdn && lb) {
            drawDualLines(this.graphics, cdn, lb);
        }
        
        // Draw LoadBalancer → App connections
        if (lb) {
            if (app1) drawDualLines(this.graphics, lb, app1);
            if (app2) drawDualLines(this.graphics, lb, app2);
        }
        
        // Draw App → Cache connections
        if (app1 && cache) drawDualLines(this.graphics, app1, cache);
        if (app2 && cache) drawDualLines(this.graphics, app2, cache);
        
        // Draw App → Database connections
        if (app1 && masterDb) drawDualLines(this.graphics, app1, masterDb);
        if (app2 && masterDb) drawDualLines(this.graphics, app2, masterDb);
        
        // Draw App → Read Replica connections (if exists)
        if (readReplica) {
            if (app1) drawDualLines(this.graphics, app1, readReplica);
            if (app2) drawDualLines(this.graphics, app2, readReplica);
        }
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

        GameState.total = CONFIG.level8Target;
        GameState.success = CONFIG.level8Target;
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

        title.innerText = "Level 8 Complete!";
        body.innerHTML = `
            <p>Final Error Rate: <strong style="color:#00ff00">${rate.toFixed(2)}%</strong> (Goal < 1%)</p>
            <p>You successfully handled ${CONFIG.level8Target} requests with read-write splitting!</p>
            
            <div class="concept-box" style="background: rgba(76, 175, 80, 0.1); border: 1px solid #4caf50; border-radius: 8px; padding: 15px; margin-top: 15px;">
                <strong>Architect's Notes: Read-Write Splitting</strong><br/>
                Separating read and write operations provides significant benefits:
                <br/><br/>
                <ul style="text-align: left; margin-left: 20px;">
                    <li>✅ Offloads 70% of database traffic to read replicas</li>
                    <li>✅ Master database focuses on write consistency</li>
                    <li>✅ Read replicas can be optimized for query performance</li>
                    <li>✅ Enables horizontal scaling of read capacity</li>
                    <li>❌ Replication lag (eventual consistency)</li>
                    <li>❌ Complexity in maintaining data consistency</li>
                    <li>❌ Additional infrastructure costs</li>
                </ul>
                <br/>
                <strong>Key Insight:</strong> Read-write splitting is essential for scaling databases under heavy traffic. By directing all write operations to a master database and distributing read operations across multiple replicas, you can handle much higher traffic loads while maintaining data consistency.
            </div>
        `;
        
        // This is the last level - hide next button
        btnNext.style.display = 'none';
        
        const btnRetry = document.getElementById('btn-modal-retry');
        if (btnRetry) {
            btnRetry.textContent = 'Select Another Level';
            btnRetry.style.display = 'inline-block';
            btnRetry.onclick = () => {
                modal.style.display = 'none';
                modal.classList.remove('show');
                const levelSelector = document.getElementById('level-selector');
                if (levelSelector) {
                    levelSelector.scrollIntoView({ behavior: 'smooth', block: 'center' });
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
