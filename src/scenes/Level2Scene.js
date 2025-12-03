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
import { LAYOUT_CONFIG, ECONOMICS_CONFIG } from '../config/index.js';
import { UserNode, AppServerNode, DatabaseNode } from '../objects/nodes.js';
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
            userNodeIds: ['User1'],
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
        const spacing = LAYOUT_CONFIG.spacing.vertical.medium;

        // Create User Node (using new UserNode class)
        GameState.nodes['User1'] = new UserNode(
            this, w * 0.15, h/2, 'User'
        );
        
        // Create Application Server (using new AppServerNode class)
        GameState.nodes['App'] = new AppServerNode(
            this, 
            w * 0.5, 
            h/2, 
            'App Server', 
            ECONOMICS_CONFIG.initialValues.appServerCapacity, 
            ECONOMICS_CONFIG.initialValues.processingDelay
        );
        
        // Create Database Server (using new DatabaseNode class)
        GameState.nodes['Database'] = new DatabaseNode(
            this, 
            w * 0.8, 
            h/2, 
            'Database', 
            ECONOMICS_CONFIG.initialValues.databaseCapacity, 
            ECONOMICS_CONFIG.initialValues.databaseDelay
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
        
        // Draw User → App connection
        const user = GameState.nodes['User1'];
        if (user) {
            drawDualLines(this.graphics, user, app);
        }
        
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
            // Create Read Request Packet (Circle Shape)
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
