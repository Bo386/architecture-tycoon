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
 * - 3 User nodes
 * - 2 App Servers
 * - 1 Cache Server
 * - 1 Database Server
 * - Optional Load Balancer (can be added by player)
 * 
 * Key Concepts Taught:
 * - Load balancing distributes requests based on server load
 * - Prevents hotspots and maximizes resource utilization
 * - Critical for horizontal scaling
 */

import { CONFIG, GameState } from '../config.js';
import { LAYOUT_CONFIG, ECONOMICS_CONFIG, UI_CONFIG } from '../config/index.js';
import { UserNode, AppServerNode, CacheNode, DatabaseNode, LoadBalancerNode } from '../objects/nodes.js';
import { drawDualLines } from '../utils/animations.js';
import { BaseLevelScene } from './BaseLevelScene.js';

export class Level6Scene extends BaseLevelScene {
    constructor() {
        super({
            key: 'Level6Scene',
            levelNumber: 6,
            targetTotal: CONFIG.level6Target,
            initialTrafficDelay: 1200,
            initialPacketsPerWave: 1,
            difficultyInterval: 7500,
            userNodeIds: ['User1', 'User2', 'User3'],
            difficultyStages: {
                stage1: {
                    trafficDelay: 900,
                    packetsPerWave: 2,
                    message: "Traffic increasing..."
                },
                stage2: {
                    trafficDelay: 700,
                    packetsPerWave: 2,
                    message: "Load rising..."
                },
                stage3: {
                    trafficDelay: 500,
                    packetsPerWave: 3,
                    message: "⚠ High traffic!"
                },
                stage4: {
                    trafficDelay: 350,
                    packetsPerWave: 3,
                    message: "⚠ Consider adding Load Balancer!"
                },
                stage5: {
                    trafficDelay: 250,
                    packetsPerWave: 4,
                    message: "⛔ Heavy load!"
                },
                stage6: {
                    trafficDelay: 180,
                    packetsPerWave: 5,
                    message: "⛔ Maximum throughput!"
                }
            }
        });
        this.hasLoadBalancer = false;
        this.lbButtonBg = null;
        this.lbButtonText = null;
    }

    create() {
        super.create();
        this.setupLoadBalancerButton();
    }

    createNodes() {
        const w = this.cameras.main.width;
        const h = this.cameras.main.height;
        const spacing = LAYOUT_CONFIG.spacing.vertical.medium;
        const smallSpacing = LAYOUT_CONFIG.spacing.vertical.small;
        const vertOffset = LAYOUT_CONFIG.spacing.vertical.extraLarge;

        // Create User Nodes (using new UserNode class)
        GameState.nodes['User1'] = new UserNode(
            this, w * 0.15, h/2 - spacing, 'User A'
        );
        GameState.nodes['User2'] = new UserNode(
            this, w * 0.15, h/2, 'User B'
        );
        GameState.nodes['User3'] = new UserNode(
            this, w * 0.15, h/2 + spacing, 'User C'
        );
        
        // Create 2 Application Servers (using new AppServerNode class)
        GameState.nodes['App1'] = new AppServerNode(
            this, w * 0.40, h/2 - smallSpacing, 'App Server 1', 
            ECONOMICS_CONFIG.initialValues.appServerCapacity, 
            ECONOMICS_CONFIG.initialValues.processingDelay
        );
        GameState.nodes['App2'] = new AppServerNode(
            this, w * 0.40, h/2 + smallSpacing, 'App Server 2', 
            ECONOMICS_CONFIG.initialValues.appServerCapacity, 
            ECONOMICS_CONFIG.initialValues.processingDelay
        );
        
        // Create Cache Server (using new CacheNode class)
        GameState.nodes['Cache1'] = new CacheNode(
            this, w * 0.60, h/2 - vertOffset, 'Cache', 
            ECONOMICS_CONFIG.initialValues.cacheCapacity, 
            ECONOMICS_CONFIG.initialValues.cacheDelay
        );
        
        // Create Database Server (using new DatabaseNode class)
        GameState.nodes['Database1'] = new DatabaseNode(
            this, w * 0.60, h/2, 'Database', 
            ECONOMICS_CONFIG.initialValues.databaseCapacity, 
            ECONOMICS_CONFIG.initialValues.databaseDelay
        );
    }

    setupLoadBalancerButton() {
        const w = this.cameras.main.width;
        const h = this.cameras.main.height;
        const cost = ECONOMICS_CONFIG.purchases.loadBalancer;
        
        this.lbButtonBg = this.add.rectangle(
            w * 0.27, h - 50, 
            UI_CONFIG.buttons.large.width, 
            UI_CONFIG.buttons.large.height, 
            UI_CONFIG.buttonColors.accent
        );
        this.lbButtonBg.setStrokeStyle(2, UI_CONFIG.buttonColors.accentHover);
        this.lbButtonBg.setInteractive({ useHandCursor: true });
        
        this.lbButtonText = this.add.text(
            w * 0.27, h - 50, 
            `+ Add Load Balancer ($${cost})`, 
            {
                fontSize: UI_CONFIG.fonts.button,
                color: UI_CONFIG.textColors.light,
                fontStyle: 'bold',
                fontFamily: UI_CONFIG.fontFamily
            }
        ).setOrigin(0.5);
        
        this.lbButtonBg.on('pointerover', () => {
            this.lbButtonBg.setFillStyle(UI_CONFIG.buttonColors.accentHover);
        });
        
        this.lbButtonBg.on('pointerout', () => {
            if (!this.hasLoadBalancer) {
                this.lbButtonBg.setFillStyle(UI_CONFIG.buttonColors.accent);
            }
        });
        
        this.lbButtonBg.on('pointerdown', () => {
            this.addLoadBalancer();
        });
    }

    addLoadBalancer() {
        if (this.hasLoadBalancer) {
            this.showToast('Load Balancer already added!');
            return;
        }

        const cost = ECONOMICS_CONFIG.purchases.loadBalancer;
        if (GameState.money < cost) {
            this.showToast(`Not enough money! Need $${cost}`);
            return;
        }

        GameState.money -= cost;
        this.hasLoadBalancer = true;

        const w = this.cameras.main.width;
        const h = this.cameras.main.height;
        
        // Create Load Balancer (using new LoadBalancerNode class)
        GameState.nodes['LoadBalancer1'] = new LoadBalancerNode(
            this, w * 0.27, h/2, 'Load Balancer', 
            ECONOMICS_CONFIG.initialValues.loadBalancerCapacity, 
            ECONOMICS_CONFIG.initialValues.loadBalancerDelay
        );

        this.lbButtonText.setText('✓ Load Balancer Added');
        this.lbButtonBg.setFillStyle(UI_CONFIG.buttonColors.disabled);
        this.lbButtonBg.disableInteractive();

        this.updateUI();
        this.showToast('Load Balancer added! Traffic distributed intelligently.');
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
                drawDualLines(this.graphics, user, lb);
            } else {
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
