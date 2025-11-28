/**
 * Level 4 Scene - App Server Horizontal Scaling Challenge
 * 
 * This scene implements the fourth level of the game, which teaches the concept
 * of horizontal application server scaling by allowing players to add multiple app servers.
 * 
 * Level Objectives:
 * - Process 1200 requests total
 * - Maintain error rate below 1%
 * - Learn to scale app servers horizontally to handle increased load
 * 
 * Architecture:
 * - 3 User nodes (generate requests)
 * - 1+ App Servers (process business logic - can be dynamically added)
 * - 2 Database Servers (handle data storage - fixed count)
 * 
 * Key Concepts Taught:
 * - Horizontal app server scaling
 * - Load balancing across multiple app servers
 * - Distributed application architecture
 */

import { CONFIG, GameState } from '../config.js';
import { LAYOUT_CONFIG, ECONOMICS_CONFIG, UI_CONFIG } from '../config/index.js';
import { UserNode, AppServerNode, DatabaseNode } from '../objects/nodes.js';
import { drawDualLines } from '../utils/animations.js';
import { BaseLevelScene } from './BaseLevelScene.js';

export class Level4Scene extends BaseLevelScene {
    /**
     * Constructor
     * 
     * Configures Level 4 with multi-app-server scaling capability.
     */
    constructor() {
        super({
            key: 'Level4Scene',
            levelNumber: 4,
            targetTotal: CONFIG.level4Target,
            initialTrafficDelay: 1400,
            initialPacketsPerWave: 1,
            difficultyInterval: 8500,
            userNodeIds: ['User1', 'User2', 'User3'],
            difficultyStages: {
                stage1: {
                    trafficDelay: 1100,
                    packetsPerWave: 2,
                    message: "Traffic increasing..."
                },
                stage2: {
                    trafficDelay: 800,
                    packetsPerWave: 2,
                    message: "Load rising..."
                },
                stage3: {
                    trafficDelay: 600,
                    packetsPerWave: 3,
                    message: "⚠ High traffic!"
                },
                stage4: {
                    trafficDelay: 400,
                    packetsPerWave: 3,
                    message: "⚠ Consider adding app servers!"
                },
                stage5: {
                    trafficDelay: 300,
                    packetsPerWave: 4,
                    message: "⛔ System under heavy load!"
                },
                stage6: {
                    trafficDelay: 200,
                    packetsPerWave: 5,
                    message: "⛔ Critical load!"
                }
            }
        });
        this.appServerCount = 1;
        this.addAppButton = null;
        this.addAppButtonText = null;
    }

    /**
     * Create Method Override
     * 
     * Extends base create() to add the app server addition button.
     */
    create() {
        super.create();
        this.createAddAppServerButton();
    }

    /**
     * Create Server Nodes
     * 
     * Instantiates initial server nodes for Level 4.
     */
    createNodes() {
        const w = this.cameras.main.width;
        const h = this.cameras.main.height;
        const spacing = LAYOUT_CONFIG.spacing.vertical.medium;
        const largeSpacing = LAYOUT_CONFIG.spacing.vertical.large;

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
        
        // Create Initial App Server (using new AppServerNode class)
        GameState.nodes['App1'] = new AppServerNode(
            this, w * 0.5, h/2, 'App Server 1', 
            ECONOMICS_CONFIG.initialValues.appServerCapacity, 
            ECONOMICS_CONFIG.initialValues.processingDelay
        );
        
        // Create Database Servers (2 fixed databases, using new DatabaseNode class)
        const dbStartY = h/2 - largeSpacing/2;
        
        GameState.nodes['Database1'] = new DatabaseNode(
            this, w * 0.8, dbStartY, 'Database 1', 
            ECONOMICS_CONFIG.initialValues.databaseCapacity, 
            ECONOMICS_CONFIG.initialValues.databaseDelay
        );
        
        GameState.nodes['Database2'] = new DatabaseNode(
            this, w * 0.8, dbStartY + largeSpacing, 'Database 2', 
            ECONOMICS_CONFIG.initialValues.databaseCapacity, 
            ECONOMICS_CONFIG.initialValues.databaseDelay
        );
    }

    /**
     * Create Add App Server Button
     * 
     * Creates a button in the game canvas that allows adding new app servers.
     */
    createAddAppServerButton() {
        const w = this.cameras.main.width;
        const h = this.cameras.main.height;
        const cost = ECONOMICS_CONFIG.purchases.appServer;

        this.addAppButton = this.add.rectangle(
            w * 0.5, h - 50,
            UI_CONFIG.buttons.medium.width, 
            UI_CONFIG.buttons.medium.height,
            UI_CONFIG.buttonColors.primary
        ).setInteractive({ useHandCursor: true });

        this.addAppButtonText = this.add.text(
            w * 0.5, h - 50,
            `+ Add App Server ($${cost})`,
            {
                fontSize: UI_CONFIG.fonts.button,
                color: UI_CONFIG.textColors.light,
                fontFamily: UI_CONFIG.fontFamily
            }
        ).setOrigin(0.5);

        this.addAppButton.on('pointerover', () => {
            this.addAppButton.setFillStyle(UI_CONFIG.buttonColors.hover);
        });

        this.addAppButton.on('pointerout', () => {
            this.addAppButton.setFillStyle(UI_CONFIG.buttonColors.primary);
        });

        this.addAppButton.on('pointerdown', () => {
            this.addAppServer();
        });
    }

    /**
     * Add App Server
     * 
     * Adds a new app server to the architecture if the player has enough money.
     */
    addAppServer() {
        const cost = ECONOMICS_CONFIG.purchases.appServer;
        const maxServers = ECONOMICS_CONFIG.limits.appServers;

        if (GameState.money < cost) {
            this.showToast('Not enough money! Need $' + cost);
            return;
        }

        if (this.appServerCount >= maxServers) {
            this.showToast('Maximum app server limit reached!');
            return;
        }

        GameState.money -= cost;
        this.appServerCount++;

        const w = this.cameras.main.width;
        const h = this.cameras.main.height;
        const spacing = LAYOUT_CONFIG.spacing.vertical.large;
        const startY = h/2 - ((this.appServerCount - 1) * spacing) / 2;

        // Reposition existing app servers
        for (let i = 1; i < this.appServerCount; i++) {
            const app = GameState.nodes['App' + i];
            if (app) {
                app.y = startY + (i - 1) * spacing;
            }
        }

        // Create new app server (using new AppServerNode class)
        const newY = startY + (this.appServerCount - 1) * spacing;
        GameState.nodes['App' + this.appServerCount] = new AppServerNode(
            this, w * 0.5, newY,
            'App Server ' + this.appServerCount, 
            ECONOMICS_CONFIG.initialValues.appServerCapacity, 
            ECONOMICS_CONFIG.initialValues.processingDelay
        );

        this.updateUI();
        this.showToast('App Server ' + this.appServerCount + ' added!');
    }

    /**
     * Update Method
     * 
     * Draws connection lines for all app servers and databases.
     */
    update() {
        this.graphics.clear();
        
        // Draw User → App connections (for all app servers)
        ['User1', 'User2', 'User3'].forEach(uid => {
            const user = GameState.nodes[uid];
            for (let i = 1; i <= this.appServerCount; i++) {
                const app = GameState.nodes['App' + i];
                if (app) {
                    drawDualLines(this.graphics, user, app);
                }
            }
        });
        
        // Draw App → Database connections (for all app servers to all databases)
        for (let i = 1; i <= this.appServerCount; i++) {
            const app = GameState.nodes['App' + i];
            if (app) {
                const db1 = GameState.nodes['Database1'];
                const db2 = GameState.nodes['Database2'];
                if (db1) drawDualLines(this.graphics, app, db1);
                if (db2) drawDualLines(this.graphics, app, db2);
            }
        }
    }

    /**
     * Spawn Packet
     * 
     * Creates request packets with read/write visualization.
     */
    spawnPacket(startNode) {
        if (!startNode || !startNode.active) {
            console.error('spawnPacket called with invalid startNode:', startNode);
            return;
        }
        
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
