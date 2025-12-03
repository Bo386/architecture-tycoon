/**
 * Level 3 Scene - Multi-Database Scalability Challenge
 * 
 * This scene implements the third level of the game, which teaches the concept
 * of horizontal database scaling by allowing players to add multiple database servers.
 * 
 * Level Objectives:
 * - Process 1000 requests total
 * - Maintain error rate below 1%
 * - Learn to scale databases horizontally to handle increased load
 * 
 * Architecture:
 * - 3 User nodes (generate requests)
 * - 1 App Server (processes business logic)
 * - 1+ Database Servers (handle data storage - can be dynamically added)
 * 
 * Key Concepts Taught:
 * - Horizontal database scaling
 * - Load distribution across multiple databases
 * - Database replication/sharding concepts
 */

import { CONFIG, GameState, UI_CONFIG, LAYOUT_CONFIG, ECONOMICS_CONFIG } from '../config/index.js';
import { UserNode, AppServerNode, DatabaseNode } from '../objects/nodes.js';
import { drawDualLines } from '../utils/animations.js';
import { BaseLevelScene } from './BaseLevelScene.js';

export class Level3Scene extends BaseLevelScene {
    /**
     * Constructor
     * 
     * Configures Level 3 with multi-database scaling capability.
     */
    constructor() {
        super({
            key: 'Level3Scene',
            levelNumber: 3,
            targetTotal: CONFIG.level3Target,
            initialTrafficDelay: 1600,
            initialPacketsPerWave: 1,
            difficultyInterval: 9000,
            userNodeIds: ['User1'],
            difficultyStages: {
                stage1: {
                    trafficDelay: 1300,
                    packetsPerWave: 1,
                    message: "Traffic increasing..."
                },
                stage2: {
                    trafficDelay: 1000,
                    packetsPerWave: 2,
                    message: "Load rising..."
                },
                stage3: {
                    trafficDelay: 700,
                    packetsPerWave: 2,
                    message: "⚠ High traffic!"
                },
                stage4: {
                    trafficDelay: 500,
                    packetsPerWave: 3,
                    message: "⚠ Consider adding databases!"
                },
                stage5: {
                    trafficDelay: 350,
                    packetsPerWave: 3,
                    message: "⛔ System under heavy load!"
                },
                stage6: {
                    trafficDelay: 250,
                    packetsPerWave: 4,
                    message: "⛔ Critical load!"
                }
            }
        });
        this.databaseCount = 1;
        this.addDbButton = null;
        this.addDbButtonText = null;
    }

    /**
     * Create Method Override
     * 
     * Extends base create() to add the database addition button.
     */
    create() {
        super.create();
        this.createAddDatabaseButton();
    }

    /**
     * Create Server Nodes
     * 
     * Instantiates initial server nodes for Level 3.
     */
    createNodes() {
        const w = this.cameras.main.width;
        const h = this.cameras.main.height;

        // Create User Node (using new UserNode class)
        GameState.nodes['User1'] = new UserNode(
            this, w * LAYOUT_CONFIG.positions.leftMid, h/2, 'User'
        );
        
        // Create Application Server (using new AppServerNode class)
        GameState.nodes['App'] = new AppServerNode(
            this, w * LAYOUT_CONFIG.positions.centerRight, h/2, 'App Server', 5, 800
        );
        
        // Create Initial Database Server (using new DatabaseNode class)
        GameState.nodes['Database1'] = new DatabaseNode(
            this, w * LAYOUT_CONFIG.positions.farRight, h/2, 'Database 1', 3, 1200
        );
    }

    /**
     * Create Add Database Button
     * 
     * Creates a button in the game canvas that allows adding new database servers.
     */
    createAddDatabaseButton() {
        const w = this.cameras.main.width;
        const h = this.cameras.main.height;

        this.addDbButton = this.add.rectangle(
            w * LAYOUT_CONFIG.positions.farRight, 
            h - LAYOUT_CONFIG.buttons.bottomOffset,
            UI_CONFIG.buttons.small.width, 
            UI_CONFIG.buttons.small.height,
            UI_CONFIG.buttonColors.primary
        ).setInteractive({ useHandCursor: true });

        this.addDbButtonText = this.add.text(
            w * LAYOUT_CONFIG.positions.farRight, 
            h - LAYOUT_CONFIG.buttons.bottomOffset,
            `+ Add Database ($${ECONOMICS_CONFIG.purchases.database})`,
            {
                fontSize: UI_CONFIG.fonts.stat,
                color: UI_CONFIG.textColors.white,
                fontFamily: 'Arial'
            }
        ).setOrigin(0.5);

        this.addDbButton.on('pointerover', () => {
            this.addDbButton.setFillStyle(UI_CONFIG.buttonColors.primaryHighlight);
        });

        this.addDbButton.on('pointerout', () => {
            this.addDbButton.setFillStyle(UI_CONFIG.buttonColors.primary);
        });

        this.addDbButton.on('pointerdown', () => {
            this.addDatabaseServer();
        });
    }

    /**
     * Add Database Server
     * 
     * Adds a new database server to the architecture if the player has enough money.
     */
    addDatabaseServer() {
        const cost = ECONOMICS_CONFIG.purchases.database;

        if (GameState.money < cost) {
            this.showToast('Not enough money! Need $' + cost);
            return;
        }

        if (this.databaseCount >= ECONOMICS_CONFIG.limits.databases) {
            this.showToast('Maximum database limit reached!');
            return;
        }

        GameState.money -= cost;
        this.databaseCount++;

        const w = this.cameras.main.width;
        const h = this.cameras.main.height;
        const spacing = LAYOUT_CONFIG.spacing.nodes;
        const startY = h/2 - ((this.databaseCount - 1) * spacing) / 2;

        // Reposition existing databases
        for (let i = 1; i < this.databaseCount; i++) {
            const db = GameState.nodes['Database' + i];
            if (db) {
                db.y = startY + (i - 1) * spacing;
            }
        }

        // Create new database (using new DatabaseNode class)
        const newY = startY + (this.databaseCount - 1) * spacing;
        GameState.nodes['Database' + this.databaseCount] = new DatabaseNode(
            this, w * LAYOUT_CONFIG.positions.farRight, newY,
            'Database ' + this.databaseCount, 3, 1200
        );

        this.updateUI();
        this.showToast('Database ' + this.databaseCount + ' added!');
    }

    /**
     * Update Method
     * 
     * Draws connection lines for all databases.
     */
    update() {
        this.graphics.clear();
        
        const app = GameState.nodes['App'];
        
        // Draw User → App connection
        const user = GameState.nodes['User1'];
        if (user) {
            drawDualLines(this.graphics, user, app);
        }
        
        // Draw App → Database connections (for all databases)
        for (let i = 1; i <= this.databaseCount; i++) {
            const database = GameState.nodes['Database' + i];
            if (database) {
                drawDualLines(this.graphics, app, database);
            }
        }
    }

    /**
     * Spawn Packet
     * 
     * Creates request packets with read/write visualization.
     */
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
                startNode.x, startNode.y, LAYOUT_CONFIG.packets.circleRadius,
                CONFIG.colors.packetReq
            );
            packet.isWrite = false;
        }
        
        packet.sourceNode = startNode;
        packet.isResponse = false;
        startNode.routePacket(packet);
    }
}
