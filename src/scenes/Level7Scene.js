/**
 * Level 7 Scene - CDN Introduction
 * 
 * This scene implements the seventh level teaching CDN (Content Delivery Network) concepts.
 * 
 * Level Objectives:
 * - Process 1600 requests total
 * - Maintain error rate below 1%
 * - Learn how CDNs reduce latency for static content
 * 
 * Architecture:
 * - 3 User nodes
 * - 1 Load Balancer
 * - 2 App Servers
 * - 1 Cache Server
 * - 1 Database Server
 * - Optional CDN (can be added by player)
 * 
 * Key Concepts Taught:
 * - CDNs serve static content from edge locations
 * - Reduces load on origin servers
 * - Improves response times for geographically distributed users
 */

import { CONFIG, GameState } from '../config.js';
import { UserNode, AppServerNode, CacheNode, DatabaseNode, LoadBalancerNode, CDNNode } from '../objects/nodes.js';
import { drawDualLines } from '../utils/animations.js';
import { BaseLevelScene } from './BaseLevelScene.js';

export class Level7Scene extends BaseLevelScene {
    constructor() {
        super({
            key: 'Level7Scene',
            levelNumber: 7,
            targetTotal: CONFIG.level7Target,
            initialTrafficDelay: 1100,
            initialPacketsPerWave: 2,
            difficultyInterval: 7000,
            userNodeIds: ['User1', 'User2', 'User3'],
            difficultyStages: {
                stage1: { trafficDelay: 850, packetsPerWave: 2, message: "Traffic increasing..." },
                stage2: { trafficDelay: 650, packetsPerWave: 3, message: "Load rising..." },
                stage3: { trafficDelay: 450, packetsPerWave: 3, message: "⚠ High traffic!" },
                stage4: { trafficDelay: 320, packetsPerWave: 4, message: "⚠ Consider adding CDN!" },
                stage5: { trafficDelay: 220, packetsPerWave: 5, message: "⛔ Heavy load!" },
                stage6: { trafficDelay: 150, packetsPerWave: 6, message: "⛔ Maximum throughput!" }
            }
        });
        this.hasCDN = false;
        this.cdnButtonBg = null;
        this.cdnButtonText = null;
    }

    create() {
        super.create();
        this.setupCDNButton();
    }

    createNodes() {
        const w = this.cameras.main.width;
        const h = this.cameras.main.height;

        // Create User Nodes (using new UserNode class)
        GameState.nodes['User1'] = new UserNode(this, w * 0.15, h/2 - 100, 'User A');
        GameState.nodes['User2'] = new UserNode(this, w * 0.15, h/2, 'User B');
        GameState.nodes['User3'] = new UserNode(this, w * 0.15, h/2 + 100, 'User C');
        
        // Create Load Balancer (using new LoadBalancerNode class)
        GameState.nodes['LoadBalancer1'] = new LoadBalancerNode(this, w * 0.30, h/2, 'Load Balancer', 30, 100);
        
        // Create App Servers (using new AppServerNode class)
        GameState.nodes['App1'] = new AppServerNode(this, w * 0.45, h/2 - 60, 'App Server 1', 5, 800);
        GameState.nodes['App2'] = new AppServerNode(this, w * 0.45, h/2 + 60, 'App Server 2', 5, 800);
        
        // Create Cache (using new CacheNode class)
        GameState.nodes['Cache1'] = new CacheNode(this, w * 0.65, h/2 - 180, 'Cache', 20, 50);
        
        // Create Database (using new DatabaseNode class)
        GameState.nodes['Database1'] = new DatabaseNode(this, w * 0.65, h/2, 'Database', 3, 1200);
    }

    setupCDNButton() {
        const w = this.cameras.main.width;
        const h = this.cameras.main.height;
        
        this.cdnButtonBg = this.add.rectangle(w * 0.15, h - 50, 200, 40, 0x4caf50);
        this.cdnButtonBg.setStrokeStyle(2, 0x66bb6a);
        this.cdnButtonBg.setInteractive({ useHandCursor: true });
        
        this.cdnButtonText = this.add.text(w * 0.15, h - 50, '+ Add CDN ($400)', {
            fontSize: '16px',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        
        this.cdnButtonBg.on('pointerover', () => this.cdnButtonBg.setFillStyle(0x66bb6a));
        this.cdnButtonBg.on('pointerout', () => { if (!this.hasCDN) this.cdnButtonBg.setFillStyle(0x4caf50); });
        this.cdnButtonBg.on('pointerdown', () => this.addCDN());
    }

    addCDN() {
        if (this.hasCDN) {
            this.showToast('CDN already added!');
            return;
        }

        const cost = 400;
        if (GameState.money < cost) {
            this.showToast(`Not enough money! Need $${cost}`);
            return;
        }

        GameState.money -= cost;
        this.hasCDN = true;

        const w = this.cameras.main.width;
        const h = this.cameras.main.height;
        
        // Create CDN (using new CDNNode class)
        GameState.nodes['CDN1'] = new CDNNode(this, w * 0.15, h/2 - 200, 'CDN', 50, 30);

        this.cdnButtonText.setText('✓ CDN Added');
        this.cdnButtonBg.setFillStyle(0x666666);
        this.cdnButtonBg.disableInteractive();

        this.updateUI();
        this.showToast('CDN added! Static content served faster.');
    }

    update() {
        this.graphics.clear();
        
        const cdn = GameState.nodes['CDN1'];
        const lb = GameState.nodes['LoadBalancer1'];
        const app1 = GameState.nodes['App1'];
        const app2 = GameState.nodes['App2'];
        const cache = GameState.nodes['Cache1'];
        const db = GameState.nodes['Database1'];
        
        ['User1', 'User2', 'User3'].forEach(uid => {
            const user = GameState.nodes[uid];
            if (cdn) drawDualLines(this.graphics, user, cdn);
            if (lb) drawDualLines(this.graphics, user, lb);
        });
        
        if (cdn && lb) drawDualLines(this.graphics, cdn, lb);
        if (lb && app1) drawDualLines(this.graphics, lb, app1);
        if (lb && app2) drawDualLines(this.graphics, lb, app2);
        if (app1 && cache) drawDualLines(this.graphics, app1, cache);
        if (app2 && cache) drawDualLines(this.graphics, app2, cache);
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
            packet = this.add.circle(startNode.x, startNode.y, 5, CONFIG.colors.packetReq);
            packet.isWrite = false;
        }
        
        packet.sourceNode = startNode;
        packet.isResponse = false;
        startNode.routePacket(packet);
    }
}
