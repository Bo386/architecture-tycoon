/**
 * Level 8 Scene - Read Replica Introduction
 * 
 * This scene implements the eighth level teaching database read replica concepts.
 * 
 * Level Objectives:
 * - Process 2000 requests total
 * - Maintain error rate below 1%
 * - Learn how read replicas scale database read operations
 * 
 * Architecture:
 * - 3 User nodes
 * - 1 CDN
 * - 1 Load Balancer
 * - 2 App Servers
 * - 1 Cache Server
 * - 1 Primary Database
 * - Optional Read Replicas (can be added by player)
 * 
 * Key Concepts Taught:
 * - Read replicas handle read-only queries
 * - Primary database handles all writes
 * - Reduces load on primary database
 * - Improves read scalability
 */

import { CONFIG, GameState } from '../config.js';
import { UserNode, AppServerNode, CacheNode, DatabaseNode, LoadBalancerNode, CDNNode } from '../objects/nodes.js';
import { drawDualLines } from '../utils/animations.js';
import { BaseLevelScene } from './BaseLevelScene.js';

export class Level8Scene extends BaseLevelScene {
    constructor() {
        super({
            key: 'Level8Scene',
            levelNumber: 8,
            targetTotal: CONFIG.level8Target,
            initialTrafficDelay: 1000,
            initialPacketsPerWave: 2,
            difficultyInterval: 6500,
            userNodeIds: ['User1', 'User2', 'User3'],
            difficultyStages: {
                stage1: { trafficDelay: 800, packetsPerWave: 2, message: "Traffic increasing..." },
                stage2: { trafficDelay: 600, packetsPerWave: 3, message: "Load rising..." },
                stage3: { trafficDelay: 400, packetsPerWave: 4, message: "⚠ High traffic!" },
                stage4: { trafficDelay: 280, packetsPerWave: 5, message: "⚠ Add Read Replicas!" },
                stage5: { trafficDelay: 200, packetsPerWave: 6, message: "⛔ Heavy load!" },
                stage6: { trafficDelay: 130, packetsPerWave: 7, message: "⛔ Maximum throughput!" }
            }
        });
        this.readReplicaCount = 0;
        this.rrButtonBg = null;
        this.rrButtonText = null;
    }

    create() {
        super.create();
        this.setupReadReplicaButton();
    }

    createNodes() {
        const w = this.cameras.main.width;
        const h = this.cameras.main.height;

        // Create User Nodes (using new UserNode class)
        GameState.nodes['User1'] = new UserNode(this, w * 0.12, h/2 - 100, 'User A');
        GameState.nodes['User2'] = new UserNode(this, w * 0.12, h/2, 'User B');
        GameState.nodes['User3'] = new UserNode(this, w * 0.12, h/2 + 100, 'User C');
        
        // Create CDN (using new CDNNode class)
        GameState.nodes['CDN1'] = new CDNNode(this, w * 0.12, h/2 - 220, 'CDN', 50, 30);
        
        // Create Load Balancer (using new LoadBalancerNode class)
        GameState.nodes['LoadBalancer1'] = new LoadBalancerNode(this, w * 0.27, h/2, 'Load Balancer', 30, 100);
        
        // Create App Servers (using new AppServerNode class)
        GameState.nodes['App1'] = new AppServerNode(this, w * 0.42, h/2 - 60, 'App Server 1', 5, 800);
        GameState.nodes['App2'] = new AppServerNode(this, w * 0.42, h/2 + 60, 'App Server 2', 5, 800);
        
        // Create Cache (using new CacheNode class)
        GameState.nodes['Cache1'] = new CacheNode(this, w * 0.58, h/2 - 180, 'Cache', 20, 50);
        
        // Create Primary Database (using new DatabaseNode class)
        GameState.nodes['Database1'] = new DatabaseNode(this, w * 0.58, h/2, 'Primary DB', 3, 1200);
    }

    setupReadReplicaButton() {
        const w = this.cameras.main.width;
        const h = this.cameras.main.height;
        
        this.rrButtonBg = this.add.rectangle(w * 0.58, h - 50, 230, 40, 0xff9800);
        this.rrButtonBg.setStrokeStyle(2, 0xffa726);
        this.rrButtonBg.setInteractive({ useHandCursor: true });
        
        this.rrButtonText = this.add.text(w * 0.58, h - 50, '+ Add Read Replica ($350)', {
            fontSize: '16px',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        
        this.rrButtonBg.on('pointerover', () => this.rrButtonBg.setFillStyle(0xffa726));
        this.rrButtonBg.on('pointerout', () => this.rrButtonBg.setFillStyle(0xff9800));
        this.rrButtonBg.on('pointerdown', () => this.addReadReplica());
    }

    addReadReplica() {
        if (this.readReplicaCount >= 3) {
            this.showToast('Maximum 3 Read Replicas!');
            return;
        }

        const cost = 350;
        if (GameState.money < cost) {
            this.showToast(`Not enough money! Need $${cost}`);
            return;
        }

        GameState.money -= cost;
        this.readReplicaCount++;

        const w = this.cameras.main.width;
        const h = this.cameras.main.height;
        const spacing = 140;
        const startY = h/2 + 100;
        
        // Create Read Replica (using new DatabaseNode class)
        GameState.nodes[`ReadReplica${this.readReplicaCount}`] = new DatabaseNode(
            this, w * 0.58, startY + (this.readReplicaCount - 1) * spacing,
            `Read Replica ${this.readReplicaCount}`, 5, 800
        );

        if (this.readReplicaCount >= 3) {
            this.rrButtonText.setText('✓ Max Replicas');
            this.rrButtonBg.setFillStyle(0x666666);
            this.rrButtonBg.disableInteractive();
        }

        this.updateUI();
        this.showToast(`Read Replica ${this.readReplicaCount} added!`);
    }

    update() {
        this.graphics.clear();
        
        const cdn = GameState.nodes['CDN1'];
        const lb = GameState.nodes['LoadBalancer1'];
        const app1 = GameState.nodes['App1'];
        const app2 = GameState.nodes['App2'];
        const cache = GameState.nodes['Cache1'];
        const primaryDb = GameState.nodes['Database1'];
        
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
        if (app1 && primaryDb) drawDualLines(this.graphics, app1, primaryDb);
        if (app2 && primaryDb) drawDualLines(this.graphics, app2, primaryDb);
        
        // Draw connections to read replicas
        for (let i = 1; i <= this.readReplicaCount; i++) {
            const replica = GameState.nodes[`ReadReplica${i}`];
            if (replica) {
                if (app1) drawDualLines(this.graphics, app1, replica);
                if (app2) drawDualLines(this.graphics, app2, replica);
                if (primaryDb) drawDualLines(this.graphics, primaryDb, replica);
            }
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
            packet = this.add.circle(startNode.x, startNode.y, 5, CONFIG.colors.packetReq);
            packet.isWrite = false;
        }
        
        packet.sourceNode = startNode;
        packet.isResponse = false;
        startNode.routePacket(packet);
    }
}
