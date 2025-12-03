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
            targetTotal: CONFIG.level1.targetTotal,
            maxErrorRate: CONFIG.level1.maxErrorRate,
            initialTrafficDelay: CONFIG.level1.initialTrafficDelay,
            initialPacketsPerWave: CONFIG.level1.initialPacketsPerWave,
            difficultyInterval: CONFIG.level1.difficultyInterval,
            userNodeIds: ['User1'],
            difficultyStages: CONFIG.level1.difficulty,
            revenuePerRequest: CONFIG.level1.revenuePerRequest
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
        
        // Wait a frame for all elements to be positioned
        this.time.delayedCall(100, () => {
            this.showTutorial();
        });
    }

    /**
     * Show interactive tutorial with spotlights
     */
    showTutorial() {
        // Get element positions (screen coordinates)
        const gameCanvas = document.getElementById('game-canvas');
        const canvasRect = gameCanvas ? gameCanvas.getBoundingClientRect() : { left: 0, top: 0 };
        
        // Calculate positions of key elements
        const w = this.cameras.main.width;
        const h = this.cameras.main.height;
        
        // User node position (left side)
        const userX = canvasRect.left + w * 0.15;
        const userY = canvasRect.top + h / 2;
        
        // App server position (center)
        const serverX = canvasRect.left + w * 0.5;
        const serverY = canvasRect.top + h / 2;
        
        // UI buttons position (estimated)
        const startBtnX = canvasRect.left + 100;
        const startBtnY = canvasRect.top + 50;
        
        const upgradeBtnX = canvasRect.left + w - 150;
        const upgradeBtnY = canvasRect.top + h - 100;
        
        // Initialize story manager
        this.storyManager = new StoryManager(this);
        
        // Define tutorial pages with spotlights
        const tutorialPages = [
            {
                text: "🎉 Welcome to InstaBuy!\n\nLevel 1: The MVP\nCloud Startup\n\nYour e-commerce journey begins here!"
            },
            {
                text: "Hey! InstaBuy 1.0 just went live!\n\nYou rented the cheapest cloud server\nyou could find. Only a few classmates\nare testing it now. ☁️💰"
            },
            {
                text: "These are your early users.\n\nThey're your classmates testing your\ne-commerce platform, sending orders\nand browsing products.",
                spotlight: { x: userX, y: userY, radius: 100 }
            },
            {
                text: "This is your budget cloud server.\n\nBoth the app AND database run here!\n\n⚡ Current capacity: 3 concurrent requests\n💸 Very limited, but it's a start!",
                spotlight: { x: serverX, y: serverY, radius: 100 }
            },
            {
                text: "Watch the money flow:\n\n🔵 Blue circles = User requests\n   (orders, product views)\n\n🟡 Gold circles = Responses\n   💰 Each success = $1 revenue!",
                spotlight: { x: serverX - 100, y: serverY, radius: 150 }
            },
            {
                text: "Your Startup Economics:\n\n💵 Starting budget: $100\n💰 Revenue: $1 per successful request\n⚠️ Failed requests = $0 revenue\n\n🎯 Goal: Earn money to upgrade!"
            },
            {
                text: "Your Mission:\n\n✓ Complete 100 user requests\n✓ Keep failure rate below 10%\n✓ Earn revenue to upgrade server\n\n💡 Smart timing is everything!"
            },
            {
                text: "Server Upgrade Available:\n\n💸 Cost: $150\n⚡ Speed: 2x faster processing\n📈 Capacity: 3 → 5 concurrent requests\n\n💡 This is 'Vertical Scaling'",
                spotlight: { x: upgradeBtnX, y: upgradeBtnY, radius: 80 }
            },
            {
                text: "Monitor your business:\n\n💰 Current Budget & Revenue\n📊 Total Requests Processed\n✅ Successful Transactions\n❌ Failed Requests\n📈 Server Load Status",
                spotlight: { x: canvasRect.left + w - 150, y: canvasRect.top + 150, radius: 120 }
            },
            {
                text: "Strategy Tips:\n\n1️⃣ Watch server load carefully\n2️⃣ Upgrade BEFORE overload hits\n3️⃣ Failed requests = lost revenue\n4️⃣ Leftover budget carries forward!",
                spotlight: { x: startBtnX, y: startBtnY, radius: 60 }
            },
            {
                text: "Ready to launch your startup?\n\nClick 'Start' to begin serving customers.\n\nFrom $100 to NASDAQ! 🚀\n\nGood luck, future CTO!"
            }
        ];
        
        // Show tutorial
        this.storyManager.show(tutorialPages, () => {
            console.log('Tutorial completed - game ready to start');
        });
    }

    /**
     * Create Server Nodes
     * 
     * Instantiates all server nodes for Level 1:
     * - 1 User node (left side) that generates requests  
     * - 1 App Server (center) that processes all requests - BUDGET CLOUD SERVER
     */
    createNodes() {
        const w = this.cameras.main.width;
        const h = this.cameras.main.height;
        const userX = w * LAYOUT_CONFIG.positions.user.x;
        const serverX = w * LAYOUT_CONFIG.positions.appServer.x;

        // Create User Node (using new UserNode class)
        GameState.nodes['User1'] = new UserNode(
            this, userX, h/2, 'User'
        );
        
        // Create Budget Cloud Server (using new AppServerNode class)
        // Level 1 uses special budget server configuration
        GameState.nodes['App'] = new AppServerNode(
            this, 
            serverX, 
            h/2, 
            'Budget Cloud Server', 
            CONFIG.level1.servers.app.capacity,     // 3 concurrent requests
            CONFIG.level1.servers.app.speed         // 300ms processing time
        );
        
        // Store Level 1 upgrade configuration for later use
        this.level1AppServer = GameState.nodes['App'];
        this.level1UpgradeCost = CONFIG.level1.servers.app.upgradeCost;
        this.level1UpgradedCapacity = CONFIG.level1.servers.app.upgradedCapacity;
        this.level1UpgradedSpeed = CONFIG.level1.servers.app.upgradedSpeed;
    }
}
