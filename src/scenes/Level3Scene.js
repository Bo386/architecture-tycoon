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

import { CONFIG, GameState } from '../config.js';
import { ServerNode } from '../objects/ServerNode.js';
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
            userNodeIds: ['User1', 'User2', 'User3'],
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

        // Create User Nodes
        GameState.nodes['User1'] = new ServerNode(
            this, w * 0.15, h/2 - 100,
            'User A', 'user', 999, 10
        );
        GameState.nodes['User2'] = new ServerNode(
            this, w * 0.15, h/2,
            'User B', 'user', 999, 10
        );
        GameState.nodes['User3'] = new ServerNode(
            this, w * 0.15, h/2 + 100,
            'User C', 'user', 999, 10
        );
        
        // Create Application Server
        GameState.nodes['App'] = new ServerNode(
            this, w * 0.5, h/2,
            'App Server', 'app', 5, 800
        );
        
        // Create Initial Database Server
        GameState.nodes['Database1'] = new ServerNode(
            this, w * 0.8, h/2,
            'Database 1', 'database', 3, 1200
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
            w * 0.8, h - 50,
            180, 40,
            0x4a90e2
        ).setInteractive({ useHandCursor: true });

        this.addDbButtonText = this.add.text(
            w * 0.8, h - 50,
            '+ Add Database ($300)',
            {
                fontSize: '14px',
                color: '#ffffff',
                fontFamily: 'Arial'
            }
        ).setOrigin(0.5);

        this.addDbButton.on('pointerover', () => {
            this.addDbButton.setFillStyle(0x5aa0f2);
        });

        this.addDbButton.on('pointerout', () => {
            this.addDbButton.setFillStyle(0x4a90e2);
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
        const cost = 300;

        if (GameState.money < cost) {
            this.showToast('Not enough money! Need $' + cost);
            return;
        }

        if (this.databaseCount >= 5) {
            this.showToast('Maximum database limit reached!');
            return;
        }

        GameState.money -= cost;
        this.databaseCount++;

        const w = this.cameras.main.width;
        const h = this.cameras.main.height;
        const spacing = 140;
        const startY = h/2 - ((this.databaseCount - 1) * spacing) / 2;

        // Reposition existing databases
        for (let i = 1; i < this.databaseCount; i++) {
            const db = GameState.nodes['Database' + i];
            if (db) {
                db.y = startY + (i - 1) * spacing;
            }
        }

        // Create new database
        const newY = startY + (this.databaseCount - 1) * spacing;
        GameState.nodes['Database' + this.databaseCount] = new ServerNode(
            this, w * 0.8, newY,
            'Database ' + this.databaseCount, 'database', 3, 1200
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
        
        // Draw User → App connections
        ['User1', 'User2', 'User3'].forEach(uid => {
            const user = GameState.nodes[uid];
            drawDualLines(this.graphics, user, app);
        });
        
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
                startNode.x, startNode.y, 5,
                CONFIG.colors.packetReq
            );
            packet.isWrite = false;
        }
        
        packet.sourceNode = startNode;
        packet.isResponse = false;
        startNode.routePacket(packet);
    }
}
