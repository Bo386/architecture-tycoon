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
import { LAYOUT_CONFIG, ECONOMICS_CONFIG } from '../config/index.js';
import { UserNode, AppServerNode } from '../objects/nodes.js';
import { BaseLevelScene } from './BaseLevelScene.js';
import { StoryManager } from '../utils/StoryManager.js';

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
            userNodeIds: ['User1'],
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
        
        this.storyManager = null;
    }

    /**
     * Create method - called after constructor
     * Initializes the story introduction before starting the level
     */
    create() {
        // Call parent create first
        super.create();
        
        // Initialize story manager
        this.storyManager = new StoryManager(this);
        
        // Define story pages
        const storyPages = [
            "Welcome to Architecture Tycoon!\n\nYou are a system architect tasked with building\nand scaling web applications.",
            
            "Your first client has launched a simple web service.\nIt's running on a single server with limited capacity.",
            
            "As their architect, you need to ensure the system\ncan handle growing user traffic without failures.",
            
            "Your Mission:\n• Handle 100 user requests\n• Keep error rate below 1%\n• Upgrade the server when needed",
            
            "Use the 'Upgrade Server' button to increase capacity.\nBut watch your budget - upgrades cost money!",
            
            "Click the green 'Start' button when ready.\nGood luck, Architect!"
        ];
        
        // Show story introduction
        this.storyManager.show(storyPages, () => {
            // Story completed - game is ready to start
            // User can now click the Start button
            console.log('Story introduction completed');
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
        const w = this.cameras.main.width;
        const h = this.cameras.main.height;
        const userX = w * LAYOUT_CONFIG.positions.user.x;
        const serverX = w * LAYOUT_CONFIG.positions.appServer.x;
        const spacing = LAYOUT_CONFIG.spacing.vertical.medium;

        // Create User Node (using new UserNode class)
        GameState.nodes['User1'] = new UserNode(
            this, userX, h/2, 'User'
        );
        
        // Create Application Server (using new AppServerNode class)
        GameState.nodes['App'] = new AppServerNode(
            this, 
            serverX, 
            h/2, 
            'App Server', 
            ECONOMICS_CONFIG.initialValues.appServerCapacity, 
            ECONOMICS_CONFIG.initialValues.processingDelay
        );
    }
}
