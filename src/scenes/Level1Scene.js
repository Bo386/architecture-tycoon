/**
 * Level 1 Scene
 * Main gameplay scene for vertical scaling simulation
 */

import { CONFIG, GameState, resetGameState } from '../config.js';
import { ServerNode } from '../objects/ServerNode.js';
import { drawDualLines } from '../utils/animations.js';
import { updateUI } from '../utils/uiManager.js';

export class Level1Scene extends Phaser.Scene {
    constructor() {
        super({ key: 'Level1Scene' });
    }

    create() {
        // Show game UI
        document.getElementById('game-ui').style.display = 'block';
        document.getElementById('result-modal').style.display = 'none';
        
        // Reset game state
        resetGameState();
        
        // Initialize scene state
        this.trafficTimer = null;
        this.difficultyTimer = null;
        this.currentTrafficDelay = 1500; 
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
        const h = this.cameras.main.height;

        // Create user nodes
        GameState.nodes['User1'] = new ServerNode(this, 150, h/2 - 100, 'User A', 'user', 999, 10);
        GameState.nodes['User2'] = new ServerNode(this, 150, h/2, 'User B', 'user', 999, 10);
        GameState.nodes['User3'] = new ServerNode(this, 150, h/2 + 100, 'User C', 'user', 999, 10);
        
        // Create app server
        GameState.nodes['App'] = new ServerNode(this, 550, h/2, 'App Server', 'app', 5, 800);
    }

    startSimulation() {
        if (GameState.isRunning || GameState.isGameOver) return;
        
        GameState.isRunning = true;
        this.scheduleNextWave();
        
        // Start difficulty progression
        this.difficultyTimer = this.time.addEvent({
            delay: 8000, 
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
            this.time.delayedCall(i * 80, () => this.spawnPacket(userNode));
        }
        
        // Schedule next wave
        this.trafficTimer = this.time.delayedCall(this.currentTrafficDelay, () => {
            this.scheduleNextWave();
        });
    }

    increaseDifficulty() {
        GameState.difficultyLevel++;
        let msg = "";
        
        if (GameState.difficultyLevel <= 3) {
            this.currentTrafficDelay = Math.max(800, this.currentTrafficDelay - 250);
            msg = "Traffic increasing...";
        } 
        else if (GameState.difficultyLevel === 4) {
            this.currentTrafficDelay = 350;
            this.packetsPerWave = 2;
            msg = "⚠ High traffic alert!";
        }
        else if (GameState.difficultyLevel <= 7) {
            this.currentTrafficDelay = 300;
            msg = "Sustained high load...";
        }
        else if (GameState.difficultyLevel === 8) {
            this.currentTrafficDelay = 200;
            this.packetsPerWave = 5;
            msg = "⛔ Extreme pressure! System near collapse!";
        }
        else {
            msg = "Maximum pressure sustained";
            return;
        }
        
        this.showDifficultyToast(msg);
        updateUI();
    }

    showDifficultyToast(msg) {
        const toast = document.getElementById('difficulty-toast');
        toast.innerText = msg;
        toast.style.opacity = 1;
        setTimeout(() => toast.style.opacity = 0, 3000);
    }

    update() {
        // Redraw connections
        this.graphics.clear();
        const app = GameState.nodes['App'];
        
        ['User1', 'User2', 'User3'].forEach(uid => {
            const user = GameState.nodes[uid];
            drawDualLines(this.graphics, user, app);
        });
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
}
