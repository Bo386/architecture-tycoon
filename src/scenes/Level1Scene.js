/**
 * Level 1 Scene - Vertical Scaling Challenge
 * 
 * This scene implements the first level of the game, which teaches the concept
 * of vertical scaling (improving a single server's capacity).
 * 
 * Level Objectives:
 * - Process 1000 requests total
 * - Maintain error rate below 1%
 * - Manage budget wisely when upgrading the server
 * 
 * Architecture:
 * - 3 User nodes (generate requests)
 * - 1 App Server node (processes all requests)
 * - No database (monolithic architecture)
 * 
 * Key Concepts Taught:
 * - Vertical scaling (upgrading single server capacity)
 * - Load balancing challenges
 * - Resource management
 * - Trade-offs between cost and performance
 */

import { CONFIG, GameState } from '../config.js';
import { ServerNode } from '../objects/ServerNode.js';
import { BaseLevelScene } from './BaseLevelScene.js';

export class Level1Scene extends BaseLevelScene {
    /**
     * Constructor
     * 
     * Configures Level 1 with appropriate difficulty curve and targets.
     */
    constructor() {
        super({
            key: 'Level1Scene',
            levelNumber: 1,
            targetTotal: CONFIG.targetTotal,
            initialTrafficDelay: 1500,
            initialPacketsPerWave: 1,
            difficultyInterval: 8000,
            userNodeIds: ['User1', 'User2', 'User3'],
            difficultyStages: {
                stage1: {
                    trafficDelay: 1250,
                    packetsPerWave: 1,
                    message: "Traffic increasing..."
                },
                stage2: {
                    trafficDelay: 1000,
                    packetsPerWave: 1,
                    message: "Traffic increasing..."
                },
                stage3: {
                    trafficDelay: 750,
                    packetsPerWave: 1,
                    message: "Traffic increasing..."
                },
                stage4: {
                    trafficDelay: 350,
                    packetsPerWave: 2,
                    message: "⚠ High traffic alert!"
                },
                stage5: {
                    trafficDelay: 300,
                    packetsPerWave: 2,
                    message: "Sustained high load..."
                },
                stage6: {
                    trafficDelay: 300,
                    packetsPerWave: 2,
                    message: "Sustained high load..."
                },
                stage7: {
                    trafficDelay: 300,
                    packetsPerWave: 2,
                    message: "Sustained high load..."
                },
                stage8: {
                    trafficDelay: 200,
                    packetsPerWave: 5,
                    message: "⛔ Extreme pressure! System near collapse!"
                }
            }
        });
    }

    /**
     * Create Server Nodes
     * 
     * Instantiates all server nodes for Level 1:
     * - 3 User nodes (left side) that generate requests
     * - 1 App Server (center) that processes all requests
     */
    createNodes() {
        const h = this.cameras.main.height;

        // Create User Nodes
        GameState.nodes['User1'] = new ServerNode(
            this, 150, h/2 - 100,
            'User A', 'user', 999, 10
        );
        GameState.nodes['User2'] = new ServerNode(
            this, 150, h/2,
            'User B', 'user', 999, 10
        );
        GameState.nodes['User3'] = new ServerNode(
            this, 150, h/2 + 100,
            'User C', 'user', 999, 10
        );
        
        // Create Application Server
        GameState.nodes['App'] = new ServerNode(
            this, 550, h/2,
            'App Server', 'app', 5, 800
        );
    }
}
