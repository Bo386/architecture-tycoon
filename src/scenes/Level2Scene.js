/**
 * Level 2 Scene - Database Integration Challenge
 * 
 * This scene implements the second level of the game, which teaches the concept
 * of adding a database layer to the architecture and managing the increased
 * complexity and latency that comes with it.
 * 
 * Level Objectives:
 * - Process 300 requests total
 * - Maintain error rate below 1%
 * - Manage the added latency from database operations
 * 
 * Architecture:
 * - 3 User nodes (generate requests)
 * - 1 App Server (processes business logic)
 * - 1 Database Server (handles data storage)
 * - Three-tier architecture (User → App → Database → App → User)
 * 
 * Key Concepts Taught:
 * - Multi-tier architecture
 * - Database as a bottleneck
 * - Increased latency with each layer
 * - Complexity vs scalability trade-offs
 */

import { CONFIG, GameState } from '../config.js';
import { ServerNode } from '../objects/ServerNode.js';
import { drawDualLines } from '../utils/animations.js';
import { BaseLevelScene } from './BaseLevelScene.js';

export class Level2Scene extends BaseLevelScene {
    /**
     * Constructor
     * 
     * Configures Level 2 with database integration and appropriate difficulty curve.
     */
    constructor() {
        super({
            key: 'Level2Scene',
            levelNumber: 2,
            targetTotal: CONFIG.level2Target,
            initialTrafficDelay: 1800,
            initialPacketsPerWave: 1,
            difficultyInterval: 10000,
            userNodeIds: ['User1', 'User2', 'User3'],
            difficultyStages: {
                stage1: {
                    trafficDelay: 1500,
                    packetsPerWave: 1,
                    message: "Database warming up..."
                },
                stage2: {
                    trafficDelay: 1200,
                    packetsPerWave: 1,
                    message: "Query load increasing..."
                },
                stage3: {
                    trafficDelay: 900,
                    packetsPerWave: 2,
                    message: "Database under pressure..."
                },
                stage4: {
                    trafficDelay: 600,
                    packetsPerWave: 2,
                    message: "⚠ High database load!"
                },
                stage5: {
                    trafficDelay: 400,
                    packetsPerWave: 3,
                    message: "⛔ Database bottleneck!"
                }
            }
        });
    }

    /**
     * Create Server Nodes
     * 
     * Instantiates all server nodes for Level 2:
     * - 3 User nodes (left side) that generate requests
     * - 1 App Server (center) that processes business logic
     * - 1 Database Server (right side) that handles data storage
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
        
        // Create Database Server
        GameState.nodes['Database'] = new ServerNode(
            this, w * 0.8, h/2,
            'Database', 'database', 3, 1200
        );
    }

    /**
     * Update Method
     * 
     * Called automatically by Phaser every frame.
     * Draws connection lines between nodes for Level 2's architecture.
     */
    update() {
        this.graphics.clear();
        
        const app = GameState.nodes['App'];
        const database = GameState.nodes['Database'];
        
        // Draw User → App connections
        ['User1', 'User2', 'User3'].forEach(uid => {
            const user = GameState.nodes[uid];
            drawDualLines(this.graphics, user, app);
        });
        
        // Draw App → Database connection
        if (database) {
            drawDualLines(this.graphics, app, database);
        }
    }

    /**
     * Spawn Packet
     * 
     * Creates a new request packet with read/write visualization.
     * 
     * @param {ServerNode} startNode - The user node generating the request
     */
    spawnPacket(startNode) {
        const isWrite = Math.random() * 100 < CONFIG.writeRequestPercentage;
        let packet;
        
        if (isWrite) {
            // Create Write Request Packet (Diamond Shape)
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
            // Create Read Request Packet (Circle Shape)
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
