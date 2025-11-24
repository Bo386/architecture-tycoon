/**
 * Level 2 Scene
 * Database integration - requests must go through App -> Database -> App -> User
 */

import { CONFIG, GameState, resetGameState } from '../config.js';
import { ServerNode } from '../objects/ServerNode.js';
import { drawDualLines } from '../utils/animations.js';
import { updateUI } from '../utils/uiManager.js';

export class Level2Scene extends Phaser.Scene {
    constructor() {
        super({ key: 'Level2Scene' });
    }

    create() {
        // Show game UI elements
        const leftSidebar = document.getElementById('left-sidebar');
        const controlPanel = document.getElementById('control-panel');
        if (leftSidebar) leftSidebar.style.display = 'flex';
        if (controlPanel) controlPanel.style.display = 'flex';
        document.getElementById('result-modal').style.display = 'none';
        
        // Update header for Level 2
        const header = document.querySelector('#header h1');
        if (header) header.textContent = 'Level 2: Database Integration';
        
        // Update objectives
        const objectivesList = document.querySelector('.objectives-list');
        if (objectivesList) {
            objectivesList.innerHTML = `
                <li>Complete 100 requests</li>
                <li>Maintain error rate < 1%</li>
                <li>Database adds processing overhead</li>
            `;
        }
        
        // Reset game state for Level 2
        resetGameState(2);
        
        // Initialize scene state
        this.trafficTimer = null;
        this.difficultyTimer = null;
        this.currentTrafficDelay = 2000; 
        this.packetsPerWave = 1;

        updateUI();

        this.setupBackground();
        this.createNodes();
    }

    setupBackground() {
        const w = this.cameras.main.width;
        const h = this.cameras.main.height;

        // Add grid background
        this.add.grid(w/2, h/2, w, h, 40, 40, 0x000000, 0, 0x333333, 0.2);
        
        // Graphics for connections
        this.graphics = this.add.graphics();
    }

    createNodes() {
        const w = this.cameras.main.width;
        const h = this.cameras.main.height;

        // Create user nodes on the left
        GameState.nodes['User1'] = new ServerNode(this, w * 0.15, h/2 - 100, 'User A', 'user', 999, 10);
        GameState.nodes['User2'] = new ServerNode(this, w * 0.15, h/2, 'User B', 'user', 999, 10);
        GameState.nodes['User3'] = new ServerNode(this, w * 0.15, h/2 + 100, 'User C', 'user', 999, 10);
        
        // Create app server in the middle
        GameState.nodes['App'] = new ServerNode(this, w * 0.5, h/2, 'App Server', 'app', 5, 600);
        
        // Create database server on the right
        GameState.nodes['Database'] = new ServerNode(this, w * 0.8, h/2, 'Database', 'database', 3, 800);
    }

    startSimulation() {
        if (GameState.isRunning || GameState.isGameOver) return;
        
        GameState.isRunning = true;
        this.scheduleNextWave();
        
        // Start difficulty progression (slower than Level 1)
        this.difficultyTimer = this.time.addEvent({
            delay: 10000, 
            callback: () => this.increaseDifficulty(),
            loop: true
        });
        
        updateUI();
    }

    scheduleNextWave() {
        if (!GameState.isRunning) return;
        
        const users = ['User1', 'User2', 'User3'];
        
        // Spawn packets
        for (let i = 0; i < this.packetsPerWave; i++) {
            const userNode = GameState.nodes[users[Math.floor(Math.random() * users.length)]];
            this.time.delayedCall(i * 100, () => this.spawnPacket(userNode));
        }
        
        // Schedule next wave
        this.trafficTimer = this.time.delayedCall(this.currentTrafficDelay, () => {
            this.scheduleNextWave();
        });
    }

    increaseDifficulty() {
        GameState.difficultyLevel++;
        let msg = "";
        
        if (GameState.difficultyLevel <= 2) {
            this.currentTrafficDelay = Math.max(1200, this.currentTrafficDelay - 300);
            msg = "Traffic increasing...";
        } 
        else if (GameState.difficultyLevel === 3) {
            this.currentTrafficDelay = 800;
            this.packetsPerWave = 2;
            msg = "⚠ Higher traffic load!";
        }
        else if (GameState.difficultyLevel <= 5) {
            this.currentTrafficDelay = 600;
            msg = "Database under pressure...";
        }
        else if (GameState.difficultyLevel === 6) {
            this.currentTrafficDelay = 400;
            this.packetsPerWave = 3;
            msg = "⛔ Peak load! Watch the database!";
        }
        else {
            msg = "Maximum database load";
            return;
        }
        
        this.showDifficultyToast(msg);
        updateUI();
    }

    showDifficultyToast(msg) {
        const toast = document.getElementById('difficulty-toast');
        toast.innerText = msg;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 3000);
    }

    update() {
        // Redraw connections
        this.graphics.clear();
        const app = GameState.nodes['App'];
        const database = GameState.nodes['Database'];
        
        // Draw user -> app connections
        ['User1', 'User2', 'User3'].forEach(uid => {
            const user = GameState.nodes[uid];
            drawDualLines(this.graphics, user, app);
        });
        
        // Draw app -> database connection
        if (database) {
            drawDualLines(this.graphics, app, database);
        }
    }

    spawnPacket(startNode) {
        const packet = this.add.circle(
            startNode.x, 
            startNode.y, 
            5, 
            CONFIG.colors.packetReq
        );
        
        packet.sourceNode = startNode;
        packet.isResponse = false;
        startNode.routePacket(packet);
    }

    skipLevel() {
        // Stop any running timers
        if (this.trafficTimer) this.trafficTimer.remove();
        if (this.difficultyTimer) this.difficultyTimer.remove();

        // Set winning game state (100 requests target for Level 2)
        GameState.total = 100;
        GameState.success = 100;
        GameState.errors = 0;
        GameState.isRunning = false;
        GameState.isGameOver = true;

        // Update UI and show success modal
        updateUI();
        
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
        btnNext.style.display = 'none'; // No Level 3 yet
    }
}
