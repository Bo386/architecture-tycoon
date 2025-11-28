/**
 * Level 5 Scene - Cache Layer Introduction
 * 
 * This scene implements the fifth level of the game, which teaches the concept
 * of caching by introducing a cache layer between app and database servers.
 * 
 * Level Objectives:
 * - Process 1200 requests total
 * - Maintain error rate below 1%
 * - Learn how caching reduces database load and improves performance
 * 
 * Architecture:
 * - 3 User nodes (generate requests)
 * - 1 App Server (process business logic)
 * - 1 Cache Server (cache layer with hit/miss logic)
 * - 1 Database Server (handle data storage)
 * 
 * Key Concepts Taught:
 * - Cache hit/miss mechanics
 * - How caching reduces database load
 * - Cache effectiveness for read-heavy workloads
 */

import { CONFIG, GameState } from '../config.js';
import { LAYOUT_CONFIG, ECONOMICS_CONFIG } from '../config/index.js';
import { UserNode, AppServerNode, CacheNode, DatabaseNode } from '../objects/nodes.js';
import { drawDualLines } from '../utils/animations.js';
import { BaseLevelScene } from './BaseLevelScene.js';

export class Level5Scene extends BaseLevelScene {
    /**
     * Constructor
     * 
     * Configures Level 5 with cache layer introduction.
     */
    constructor() {
        super({
            key: 'Level5Scene',
            levelNumber: 5,
            targetTotal: CONFIG.level5Target,
            initialTrafficDelay: 1300,
            initialPacketsPerWave: 1,
            difficultyInterval: 8000,
            userNodeIds: ['User1', 'User2', 'User3'],
            difficultyStages: {
                stage1: {
                    trafficDelay: 1000,
                    packetsPerWave: 2,
                    message: "Traffic increasing..."
                },
                stage2: {
                    trafficDelay: 750,
                    packetsPerWave: 2,
                    message: "Load rising..."
                },
                stage3: {
                    trafficDelay: 550,
                    packetsPerWave: 3,
                    message: "⚠ High traffic!"
                },
                stage4: {
                    trafficDelay: 400,
                    packetsPerWave: 3,
                    message: "⚠ Cache warming up..."
                },
                stage5: {
                    trafficDelay: 300,
                    packetsPerWave: 4,
                    message: "⛔ Heavy load! Cache helping..."
                },
                stage6: {
                    trafficDelay: 200,
                    packetsPerWave: 5,
                    message: "⛔ Maximum throughput!"
                }
            }
        });
    }

    /**
     * Create Server Nodes
     * 
     * Instantiates server nodes for Level 5 with cache layer.
     */
    createNodes() {
        const w = this.cameras.main.width;
        const h = this.cameras.main.height;
        const spacing = LAYOUT_CONFIG.spacing.vertical.medium;
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
        
        // Create Application Server (using new AppServerNode class)
        GameState.nodes['App1'] = new AppServerNode(
            this, w * 0.45, h/2, 'App Server', 
            ECONOMICS_CONFIG.initialValues.appServerCapacity, 
            ECONOMICS_CONFIG.initialValues.processingDelay
        );
        
        // Create Cache Server (using new CacheNode class)
        GameState.nodes['Cache1'] = new CacheNode(
            this, w * 0.45, h/2 - vertOffset, 'Cache', 
            ECONOMICS_CONFIG.initialValues.cacheCapacity, 
            ECONOMICS_CONFIG.initialValues.cacheDelay
        );
        
        // Create Database Server (using new DatabaseNode class)
        GameState.nodes['Database1'] = new DatabaseNode(
            this, w * 0.70, h/2, 'Database', 
            ECONOMICS_CONFIG.initialValues.databaseCapacity, 
            ECONOMICS_CONFIG.initialValues.databaseDelay
        );
    }

    /**
     * Update Method
     * 
     * Draws connection lines for cache architecture.
     */
    update() {
        this.graphics.clear();
        
        const app = GameState.nodes['App1'];
        const cache = GameState.nodes['Cache1'];
        const db = GameState.nodes['Database1'];
        
        // Draw User → App connections
        ['User1', 'User2', 'User3'].forEach(uid => {
            const user = GameState.nodes[uid];
            if (app) {
                drawDualLines(this.graphics, user, app);
            }
        });
        
        // Draw App → Cache connection (vertical)
        if (app && cache) {
            drawDualLines(this.graphics, app, cache);
        }
        
        // Draw App → Database connection (horizontal)
        if (app && db) {
            drawDualLines(this.graphics, app, db);
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
