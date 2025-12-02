/**
 * Level 9 Scene - Pubsub Queue Introduction
 * 
 * This scene implements the ninth level teaching asynchronous message queue concepts.
 * 
 * Level Objectives:
 * - Process 2000 requests total
 * - Maintain error rate below 1%
 * - Learn how message queues decouple write operations
 * 
 * Architecture:
 * - 3 User nodes
 * - 1 CDN
 * - 1 Load Balancer
 * - 2 App Servers
 * - 1 Cache Server
 * - 1 Pubsub Queue (can add more)
 * - 1 Primary Database
 * 
 * Key Concepts Taught:
 * - Asynchronous write processing
 * - Message queues buffer write requests
 * - App servers get immediate acknowledgment
 * - Database processes queue at its own pace
 * - Improved write throughput and reliability
 */

import { CONFIG, GameState } from '../config.js';
import { LAYOUT_CONFIG, ECONOMICS_CONFIG, UI_CONFIG } from '../config/index.js';
import { UserNode, AppServerNode, CacheNode, DatabaseNode, LoadBalancerNode, CDNNode } from '../objects/nodes.js';
import { PubsubQueueNode } from '../objects/PubsubQueueNode.js';
import { drawDualLines } from '../utils/animations.js';
import { BaseLevelScene } from './BaseLevelScene.js';

export class Level9Scene extends BaseLevelScene {
    constructor() {
        super({
            key: 'Level9Scene',
            levelNumber: 9,
            targetTotal: CONFIG.level9Target,
            initialTrafficDelay: 1000,
            initialPacketsPerWave: 2,
            difficultyInterval: 6500,
            userNodeIds: ['User1', 'User2', 'User3'],
            difficultyStages: {
                stage1: { trafficDelay: 800, packetsPerWave: 2, message: "Traffic increasing..." },
                stage2: { trafficDelay: 600, packetsPerWave: 3, message: "Load rising..." },
                stage3: { trafficDelay: 400, packetsPerWave: 4, message: "⚠ High traffic!" },
                stage4: { trafficDelay: 280, packetsPerWave: 5, message: "⚠ Heavy write load!" },
                stage5: { trafficDelay: 200, packetsPerWave: 6, message: "⛔ Add Queue capacity!" },
                stage6: { trafficDelay: 130, packetsPerWave: 7, message: "⛔ Maximum throughput!" }
            }
        });
        this.queueCount = 0;
        this.queueButtonBg = null;
        this.queueButtonText = null;
    }

    create() {
        super.create();
        this.setupQueueButton();
    }

    createNodes() {
        const w = this.cameras.main.width;
        const h = this.cameras.main.height;
        const spacing = LAYOUT_CONFIG.spacing.vertical.medium;
        const smallSpacing = LAYOUT_CONFIG.spacing.vertical.small;
        const vertOffset = LAYOUT_CONFIG.spacing.vertical.extraLarge;

        // Create User Nodes
        GameState.nodes['User1'] = new UserNode(this, w * 0.12, h/2 - spacing, 'User A');
        GameState.nodes['User2'] = new UserNode(this, w * 0.12, h/2, 'User B');
        GameState.nodes['User3'] = new UserNode(this, w * 0.12, h/2 + spacing, 'User C');
        
        // Create CDN
        GameState.nodes['CDN1'] = new CDNNode(
            this, w * 0.12, h/2 - vertOffset * 1.2, 'CDN', 
            ECONOMICS_CONFIG.initialValues.cdnCapacity, 
            ECONOMICS_CONFIG.initialValues.cdnDelay
        );
        
        // Create Load Balancer
        GameState.nodes['LoadBalancer1'] = new LoadBalancerNode(
            this, w * 0.27, h/2, 'Load Balancer', 
            ECONOMICS_CONFIG.initialValues.loadBalancerCapacity, 
            ECONOMICS_CONFIG.initialValues.loadBalancerDelay
        );
        
        // Create App Servers
        GameState.nodes['App1'] = new AppServerNode(
            this, w * 0.42, h/2 - smallSpacing, 'App Server 1', 
            ECONOMICS_CONFIG.initialValues.appServerCapacity, 
            ECONOMICS_CONFIG.initialValues.processingDelay
        );
        GameState.nodes['App2'] = new AppServerNode(
            this, w * 0.42, h/2 + smallSpacing, 'App Server 2', 
            ECONOMICS_CONFIG.initialValues.appServerCapacity, 
            ECONOMICS_CONFIG.initialValues.processingDelay
        );
        
        // Create Cache
        GameState.nodes['Cache1'] = new CacheNode(
            this, w * 0.58, h/2 - vertOffset, 'Cache', 
            ECONOMICS_CONFIG.initialValues.cacheCapacity, 
            ECONOMICS_CONFIG.initialValues.cacheDelay
        );
        
        // Create initial Pubsub Queue
        GameState.nodes['Queue1'] = new PubsubQueueNode(
            this, w * 0.58, h/2 + vertOffset * 0.5, 'Queue 1',
            20, // capacity
            200 // processing speed
        );
        this.queueCount = 1;
        
        // Create Primary Database
        GameState.nodes['Database1'] = new DatabaseNode(
            this, w * 0.74, h/2, 'Primary DB', 
            ECONOMICS_CONFIG.initialValues.databaseCapacity, 
            ECONOMICS_CONFIG.initialValues.databaseDelay
        );
    }

    setupQueueButton() {
        const w = this.cameras.main.width;
        const h = this.cameras.main.height;
        const cost = 300; // Cost to add a queue
        
        this.queueButtonBg = this.add.rectangle(
            w * 0.58, h - 50, 
            UI_CONFIG.buttons.large.width, 
            UI_CONFIG.buttons.large.height, 
            UI_CONFIG.buttonColors.warning
        );
        this.queueButtonBg.setStrokeStyle(2, UI_CONFIG.buttonColors.warningHover);
        this.queueButtonBg.setInteractive({ useHandCursor: true });
        
        this.queueButtonText = this.add.text(
            w * 0.58, h - 50, 
            `+ Add Queue ($${cost})`, 
            {
                fontSize: UI_CONFIG.fonts.button,
                color: UI_CONFIG.textColors.light,
                fontStyle: 'bold',
                fontFamily: UI_CONFIG.fontFamily
            }
        ).setOrigin(0.5);
        
        this.queueButtonBg.on('pointerover', () => this.queueButtonBg.setFillStyle(UI_CONFIG.buttonColors.warningHover));
        this.queueButtonBg.on('pointerout', () => this.queueButtonBg.setFillStyle(UI_CONFIG.buttonColors.warning));
        this.queueButtonBg.on('pointerdown', () => this.addQueue());
    }

    addQueue() {
        const maxQueues = 3;
        
        if (this.queueCount >= maxQueues) {
            this.showToast(`Maximum ${maxQueues} Queues!`);
            return;
        }

        const cost = 300;
        if (GameState.money < cost) {
            this.showToast(`Not enough money! Need $${cost}`);
            return;
        }

        GameState.money -= cost;
        this.queueCount++;

        const w = this.cameras.main.width;
        const h = this.cameras.main.height;
        const vertOffset = LAYOUT_CONFIG.spacing.vertical.extraLarge;
        const spacing = LAYOUT_CONFIG.spacing.vertical.medium;
        const startY = h/2 + vertOffset * 0.5;
        
        // Create new Queue
        GameState.nodes[`Queue${this.queueCount}`] = new PubsubQueueNode(
            this, w * 0.58, startY + (this.queueCount - 1) * spacing,
            `Queue ${this.queueCount}`,
            20, // capacity
            200 // processing speed
        );

        if (this.queueCount >= maxQueues) {
            this.queueButtonText.setText('✓ Max Queues');
            this.queueButtonBg.setFillStyle(UI_CONFIG.buttonColors.disabled);
            this.queueButtonBg.disableInteractive();
        }

        this.updateUI();
        this.showToast(`Queue ${this.queueCount} added!`);
    }

    update() {
        this.graphics.clear();
        
        const cdn = GameState.nodes['CDN1'];
        const lb = GameState.nodes['LoadBalancer1'];
        const app1 = GameState.nodes['App1'];
        const app2 = GameState.nodes['App2'];
        const cache = GameState.nodes['Cache1'];
        const database = GameState.nodes['Database1'];
        
        // Draw connections between users, CDN, and load balancer
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
        if (cache && database) drawDualLines(this.graphics, cache, database);
        if (app1 && database) drawDualLines(this.graphics, app1, database);
        if (app2 && database) drawDualLines(this.graphics, app2, database);
        
        // Draw connections to queues
        for (let i = 1; i <= this.queueCount; i++) {
            const queue = GameState.nodes[`Queue${i}`];
            if (queue) {
                if (app1) drawDualLines(this.graphics, app1, queue);
                if (app2) drawDualLines(this.graphics, app2, queue);
                if (database) drawDualLines(this.graphics, queue, database);
            }
        }
    }

    spawnPacket(startNode) {
        const isWrite = Math.random() * 100 < CONFIG.writeRequestPercentage;
        let packet;
        
        if (isWrite) {
            // Write request (diamond shape)
            const size = LAYOUT_CONFIG.packets.diamondSize;
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
            // Read request (circle)
            packet = this.add.circle(
                startNode.x, startNode.y, 
                LAYOUT_CONFIG.packets.circleRadius, 
                CONFIG.colors.packetReq
            );
            packet.isWrite = false;
        }
        
        packet.sourceNode = startNode;
        packet.isResponse = false;
        startNode.routePacket(packet);
    }
}
