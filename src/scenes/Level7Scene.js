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
import { LAYOUT_CONFIG, ECONOMICS_CONFIG, UI_CONFIG } from '../config/index.js';
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
            userNodeIds: ['User1'],
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
        const spacing = LAYOUT_CONFIG.spacing.vertical.medium;
        const smallSpacing = LAYOUT_CONFIG.spacing.vertical.small;
        const vertOffset = LAYOUT_CONFIG.spacing.vertical.extraLarge;

        // Create User Node (using new UserNode class)
        GameState.nodes['User1'] = new UserNode(this, w * 0.15, h/2, 'User');
        
        // Create Load Balancer (using new LoadBalancerNode class)
        GameState.nodes['LoadBalancer1'] = new LoadBalancerNode(
            this, w * 0.30, h/2, 'Load Balancer', 
            ECONOMICS_CONFIG.initialValues.loadBalancerCapacity, 
            ECONOMICS_CONFIG.initialValues.loadBalancerDelay
        );
        
        // Create App Servers (using new AppServerNode class)
        GameState.nodes['App1'] = new AppServerNode(
            this, w * 0.45, h/2 - smallSpacing, 'App Server 1', 
            ECONOMICS_CONFIG.initialValues.appServerCapacity, 
            ECONOMICS_CONFIG.initialValues.processingDelay
        );
        GameState.nodes['App2'] = new AppServerNode(
            this, w * 0.45, h/2 + smallSpacing, 'App Server 2', 
            ECONOMICS_CONFIG.initialValues.appServerCapacity, 
            ECONOMICS_CONFIG.initialValues.processingDelay
        );
        
        // Create Cache (using new CacheNode class)
        GameState.nodes['Cache1'] = new CacheNode(
            this, w * 0.65, h/2 - vertOffset, 'Cache', 
            ECONOMICS_CONFIG.initialValues.cacheCapacity, 
            ECONOMICS_CONFIG.initialValues.cacheDelay
        );
        
        // Create Database (using new DatabaseNode class)
        GameState.nodes['Database1'] = new DatabaseNode(
            this, w * 0.65, h/2, 'Database', 
            ECONOMICS_CONFIG.initialValues.databaseCapacity, 
            ECONOMICS_CONFIG.initialValues.databaseDelay
        );
    }

    setupCDNButton() {
        const w = this.cameras.main.width;
        const h = this.cameras.main.height;
        const cost = ECONOMICS_CONFIG.purchases.cdn;
        
        this.cdnButtonBg = this.add.rectangle(
            w * 0.15, h - 50, 
            UI_CONFIG.buttons.medium.width, 
            UI_CONFIG.buttons.medium.height, 
            UI_CONFIG.buttonColors.success
        );
        this.cdnButtonBg.setStrokeStyle(2, UI_CONFIG.buttonColors.successHover);
        this.cdnButtonBg.setInteractive({ useHandCursor: true });
        
        this.cdnButtonText = this.add.text(
            w * 0.15, h - 50, 
            `+ Add CDN ($${cost})`, 
            {
                fontSize: UI_CONFIG.fonts.button,
                color: UI_CONFIG.textColors.light,
                fontStyle: 'bold',
                fontFamily: UI_CONFIG.fontFamily
            }
        ).setOrigin(0.5);
        
        this.cdnButtonBg.on('pointerover', () => this.cdnButtonBg.setFillStyle(UI_CONFIG.buttonColors.successHover));
        this.cdnButtonBg.on('pointerout', () => { 
            if (!this.hasCDN) this.cdnButtonBg.setFillStyle(UI_CONFIG.buttonColors.success); 
        });
        this.cdnButtonBg.on('pointerdown', () => this.addCDN());
    }

    addCDN() {
        if (this.hasCDN) {
            this.showToast('CDN already added!');
            return;
        }

        const cost = ECONOMICS_CONFIG.purchases.cdn;
        if (GameState.money < cost) {
            this.showToast(`Not enough money! Need $${cost}`);
            return;
        }

        GameState.money -= cost;
        this.hasCDN = true;

        const w = this.cameras.main.width;
        const h = this.cameras.main.height;
        
        // Create CDN (using new CDNNode class)
        GameState.nodes['CDN1'] = new CDNNode(
            this, w * 0.15, h/2 - LAYOUT_CONFIG.spacing.vertical.extraLarge * 1.1, 'CDN', 
            ECONOMICS_CONFIG.initialValues.cdnCapacity, 
            ECONOMICS_CONFIG.initialValues.cdnDelay
        );

        this.cdnButtonText.setText('✓ CDN Added');
        this.cdnButtonBg.setFillStyle(UI_CONFIG.buttonColors.disabled);
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
        
        const user = GameState.nodes['User1'];
        if (user) {
            if (cdn) drawDualLines(this.graphics, user, cdn);
            if (lb) drawDualLines(this.graphics, user, lb);
        }
        
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
