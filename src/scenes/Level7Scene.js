/**
 * Level 7 Scene - CDN Introduction
 * 
 * This scene implements the seventh level of the game, which teaches the concept
 * of Content Delivery Network (CDN) by introducing a CDN layer between users and load balancer.
 * 
 * Level Objectives:
 * - Process 1600 requests total
 * - Maintain error rate below 1%
 * - Learn how CDN reduces load on backend infrastructure
 * 
 * Architecture:
 * - 3 User nodes (generate requests)
 * - 1 CDN Server (optional, can be added by player)
 * - 1 Load Balancer (distribute traffic)
 * - 2 App Servers (process business logic)
 * - 1 Cache Server (cache layer)
 * - 1 Database Server (data storage)
 * 
 * Key Concepts Taught:
 * - CDN reduces latency with edge caching
 * - CDN offloads traffic from backend infrastructure
 * - CDN is especially effective for static content and read requests
 */

import { CONFIG, GameState, resetGameState } from '../config.js';
import { ServerNode } from '../objects/ServerNode.js';
import { drawDualLines } from '../utils/animations.js';
import { updateUI } from '../utils/uiManager.js';

export class Level7Scene extends Phaser.Scene {
    constructor() {
        super({ key: 'Level7Scene' });
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
        if (header) header.textContent = 'Level 7: CDN Layer';
        
        // Update Objectives
        const objectivesList = document.querySelector('.objectives-list');
        if (objectivesList) {
            objectivesList.innerHTML = `
                <li>Complete ${CONFIG.level7Target} requests</li>
                <li>Maintain error rate < ${CONFIG.maxErrorRate}%</li>
                <li>Add a CDN to reduce backend load</li>
            `;
        }
        
        // Reset Game State
        resetGameState(7);
        
        // Initialize Scene State
        this.trafficTimer = null;
        this.difficultyTimer = null;
        this.currentTrafficDelay = CONFIG.level7.initialTrafficDelay;
        this.packetsPerWave = CONFIG.level7.initialPacketsPerWave;
        this.hasCDN = false;
        this.hasLoadBalancer = true; // Load balancer is already present

        updateUI();
        this.setupBackground();
        this.createNodes();
        this.setupZoom();
        this.setupCDNButton();
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
        const userConfig = CONFIG.level7.servers.user;
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
        
        // Create Load Balancer (already present)
        const lbConfig = CONFIG.level7.servers.loadbalancer;
        GameState.nodes['LoadBalancer1'] = new ServerNode(
            this, w * 0.33, h/2,
            'Load Balancer', 'loadbalancer', lbConfig.capacity, lbConfig.speed
        );
        
        // Create 2 Application Servers (center-left, stacked vertically)
        const appConfig = CONFIG.level7.servers.app;
        GameState.nodes['App1'] = new ServerNode(
            this, w * 0.50, h/2 - 60,
            'App Server 1', 'app', appConfig.capacity, appConfig.speed
        );
        GameState.nodes['App2'] = new ServerNode(
            this, w * 0.50, h/2 + 60,
            'App Server 2', 'app', appConfig.capacity, appConfig.speed
        );
        
        // Create Cache Server (above app servers)
        const cacheConfig = CONFIG.level7.servers.cache;
        GameState.nodes['Cache1'] = new ServerNode(
            this, w * 0.70, h/2 - 180,
            'Cache', 'cache', cacheConfig.capacity, cacheConfig.speed
        );
        
        // Create Database Server (right side)
        const dbConfig = CONFIG.level7.servers.database;
        GameState.nodes['Database1'] = new ServerNode(
            this, w * 0.70, h/2,
            'Database', 'database', dbConfig.capacity, dbConfig.speed
        );
    }

    setupCDNButton() {
        const w = this.cameras.main.width;
        const h = this.cameras.main.height;
        
        // Create button background
        this.cdnButtonBg = this.add.rectangle(w * 0.24, h - 50, 220, 40, 0x00bcd4);
        this.cdnButtonBg.setStrokeStyle(2, 0x00e5ff);
        this.cdnButtonBg.setInteractive({ useHandCursor: true });
        
        // Create button text
        this.cdnButtonText = this.add.text(w * 0.24, h - 50, '+ Add CDN ($400)', {
            fontSize: '16px',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        
        // Add hover effect
        this.cdnButtonBg.on('pointerover', () => {
            this.cdnButtonBg.setFillStyle(0x00e5ff);
        });
        
        this.cdnButtonBg.on('pointerout', () => {
            if (!this.hasCDN) {
                this.cdnButtonBg.setFillStyle(0x00bcd4);
            }
        });
        
        // Add click handler
        this.cdnButtonBg.on('pointerdown', () => {
            this.addCDN();
        });
    }

    addCDN() {
        if (this.hasCDN) {
            alert('CDN already added!');
            return;
        }

        const cost = 400;
        if (GameState.money < cost) {
            alert(`Not enough money! Need $${cost}, have $${GameState.money}`);
            return;
        }

        // Deduct cost
        GameState.money -= cost;
        this.hasCDN = true;

        // Create CDN node between users and load balancer
        const w = this.cameras.main.width;
        const h = this.cameras.main.height;
        
        const cdnConfig = CONFIG.level7.servers.cdn;
        GameState.nodes['CDN1'] = new ServerNode(
            this, w * 0.24, h/2,
            'CDN', 'cdn', cdnConfig.capacity, cdnConfig.speed
        );

        // Update button appearance
        this.cdnButtonBg.setFillStyle(0x666666);
        this.cdnButtonText.setText('✓ CDN Added');

        updateUI();
        this.showDifficultyToast('CDN added! Static content will be served from the edge.');
    }

    startSimulation() {
        if (GameState.isRunning || GameState.isGameOver) return;
        
        GameState.isRunning = true;
        GameState.isPaused = false;
        this.time.paused = false;
        this.tweens.resumeAll();
        
        this.scheduleNextWave();
        
        this.difficultyTimer = this.time.addEvent({
            delay: CONFIG.level7.difficultyInterval,
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
        const stage = CONFIG.level7.difficulty[stageName];
        
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
        const db = GameState.nodes['Database1'];
        
        // Draw User → CDN or User → LoadBalancer connections
        ['User1', 'User2', 'User3'].forEach(uid => {
            const user = GameState.nodes[uid];
            if (cdn) {
                // If CDN exists, users connect to it
                drawDualLines(this.graphics, user, cdn);
            } else if (lb) {
                // Otherwise, users connect directly to load balancer
                drawDualLines(this.graphics, user, lb);
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

        GameState.total = CONFIG.level7Target;
        GameState.success = CONFIG.level7Target;
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

        title.innerText = "Level 7 Complete!";
        body.innerHTML = `
            <p>Final Error Rate: <strong style="color:#00ff00">${rate.toFixed(2)}%</strong> (Goal < 1%)</p>
            <p>You successfully handled ${CONFIG.level7Target} requests with CDN!</p>
            
            <div class="concept-box" style="background: rgba(0, 188, 212, 0.1); border: 1px solid #00bcd4; border-radius: 8px; padding: 15px; margin-top: 15px;">
                <strong>Architect's Notes: Content Delivery Network (CDN)</strong><br/>
                Adding a CDN layer provides significant benefits:
                <br/><br/>
                <ul style="text-align: left; margin-left: 20px;">
                    <li>✅ Dramatically reduces latency with edge caching (5ms vs 600ms)</li>
                    <li>✅ Offloads 80% of read traffic from backend infrastructure</li>
                    <li>✅ Improved user experience with faster page loads</li>
                    <li>✅ Reduced bandwidth costs on origin servers</li>
                    <li>❌ Additional service costs</li>
                    <li>❌ Cache invalidation complexity</li>
                    <li>❌ Not suitable for dynamic or personalized content</li>
                </ul>
                <br/>
                <strong>Key Insight:</strong> CDNs are essential for modern web applications. By caching content at edge locations close to users, CDNs provide the fastest possible response times while dramatically reducing load on your backend infrastructure.
            </div>
        `;
        
        // This is the last level - hide next button and show level selector option
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
