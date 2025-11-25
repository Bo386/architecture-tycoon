/**
 * ServerNode Class
 * 
 * Represents a server node in the architecture simulation.
 * This is a Phaser game object that visualizes and manages server behavior:
 * - Displays server status (load, level, stats)
 * - Processes incoming request/response packets
 * - Manages capacity and queuing
 * - Handles upgrades that improve performance
 * - Routes packets to appropriate destinations
 * 
 * There are three types of nodes:
 * 1. 'user' - Generates requests and receives responses
 * 2. 'app' - Application server that processes business logic
 * 3. 'database' - Data storage server (only in Level 2)
 */

import { CONFIG, GameState } from '../config.js';
import { updateUI, checkGameEnd } from '../utils/uiManager.js';
import { sendPacketAnim } from '../utils/animations.js';

export class ServerNode extends Phaser.GameObjects.Container {
    /**
     * Constructor - Initialize a new server node
     * 
     * @param {Phaser.Scene} scene - The scene this node belongs to
     * @param {number} x - X position on canvas
     * @param {number} y - Y position on canvas
     * @param {string} name - Display name of the node (e.g., "User", "App", "Database")
     * @param {string} type - Node type: 'user', 'app', or 'database'
     * @param {number} capacity - Maximum number of concurrent requests the node can handle
     * @param {number} speed - Processing time in milliseconds per request
     */
    constructor(scene, x, y, name, type, capacity, speed) {
        super(scene, x, y);
        
        // Store basic properties
        this.scene = scene;
        this.name = name;           // Display name shown above the node
        this.type = type;           // Node type: 'user', 'app', 'database'
        this.level = 1;             // Upgrade level (starts at 1, increases with upgrades)
        
        // Performance characteristics
        this.capacity = capacity;   // Max concurrent requests (queue size)
        this.speed = speed;         // Processing time per request in milliseconds
        this.baseSpeed = speed;     // Store original speed for database degradation calculations
        this.currentLoad = 0;       // Number of requests currently being processed
        
        // Local statistics (tracked per-node)
        this.localSuccess = 0;      // Successfully processed requests (user nodes only)
        this.localErrors = 0;       // Failed/dropped requests (user nodes only)
        
        // Ensure node is active for packet routing
        // This is required for Phaser's container system to process the node
        this.setActive(true);
        
        // Create all visual elements (rectangles, text, bars, etc.)
        this.createVisuals();
        
        // Add this container to the scene's display list
        scene.add.existing(this);
    }

    /**
     * Create Visual Elements
     * 
     * Constructs all the graphical elements that represent this node:
     * - Background rectangle with border
     * - Name label
     * - Load capacity bar (shows current load vs max capacity)
     * - Processing indicator (pulsing circle)
     * - Type-specific UI (stats for user, level badge for servers)
     */
    createVisuals() {
        // Node dimensions
        const w = 80;
        const h = 60;
        
        // Background rectangle representing the server
        this.bg = this.scene.add.rectangle(0, 0, w, h, CONFIG.colors.node);
        this.bg.setStrokeStyle(2, CONFIG.colors.nodeBorder);
        
        // Name label positioned above the node
        this.textName = this.scene.add.text(0, -h/2 - 15, this.name, { 
            fontSize: '14px', 
            color: '#fff', 
            fontFamily: 'Arial' 
        }).setOrigin(0.5);
        
        // Load bar background (dark bar showing max capacity)
        this.barBg = this.scene.add.rectangle(0, h/2 + 10, w, 6, 0x000000).setOrigin(0.5);
        
        // Load bar foreground (colored bar showing current load)
        // Starts at 0 width and grows as load increases
        this.barFg = this.scene.add.rectangle(-w/2, h/2 + 10, 0, 6, 0x00ff00).setOrigin(0, 0.5);
        
        // Processing indicator - white circle that pulses during processing
        this.processIndicator = this.scene.add.circle(0, 0, 6, 0xffffff, 1);
        this.processIndicator.setVisible(false); // Hidden until processing starts

        // Add all common visual elements to this container
        this.add([this.bg, this.textName, this.barBg, this.barFg, this.processIndicator]);

        // Add type-specific UI elements
        if (this.type === 'user') {
            this.createUserStats();      // Show success/error counts
        } else if (this.type === 'app' || this.type === 'database') {
            this.createServerStats();    // Show level badge
        }
    }

    /**
     * Create User-Specific Statistics Display
     * 
     * For 'user' nodes, displays:
     * - Green checkmark with success count
     * - Red X with error count
     */
    createUserStats() {
        // Success count with checkmark (green)
        this.statsTextSuccess = this.scene.add.text(-50, -12, '✔ 0', { 
            fontSize: '12px', 
            color: '#00ff00', 
            align: 'right', 
            fontFamily: 'Courier New' 
        }).setOrigin(1, 0.5);
        
        // Error count with X mark (red)
        this.statsTextError = this.scene.add.text(-50, 8, '✖ 0', { 
            fontSize: '12px', 
            color: '#ff4444', 
            align: 'right', 
            fontFamily: 'Courier New' 
        }).setOrigin(1, 0.5);
        
        // Add these text elements to the container
        this.add([this.statsTextSuccess, this.statsTextError]);
    }

    /**
     * Create Server-Specific Statistics Display
     * 
     * For 'app' and 'database' nodes, displays:
     * - Level badge (Lv.1, Lv.2, etc.) showing upgrade level
     */
    createServerStats() {
        // Level badge positioned at top-right of node
        this.levelText = this.scene.add.text(this.bg.width/2 + 5, -this.bg.height/2, 'Lv.1', { 
            fontSize: '10px', 
            color: '#ffd700', 
            fontStyle: 'bold' 
        }).setOrigin(0, 0.5);
        
        // Add level badge to the container
        this.add(this.levelText);
    }

    /**
     * Upgrade Node
     * 
     * Improves the server's performance characteristics:
     * - Increases capacity (can handle more concurrent requests)
     * - Decreases processing time (faster responses)
     * - Changes visual appearance (border color, thickness)
     * 
     * Called when player clicks the upgrade button and has sufficient funds.
     */
    upgrade() {
        // Increment level
        this.level++;
        
        // Increase capacity by 2.4x (rounded down)
        // Example: Level 1 capacity 2 → Level 2 capacity 4 → Level 3 capacity 9
        this.capacity = Math.floor(this.capacity * 2.4); 
        
        // Reduce processing time by 50%, minimum 50ms
        // Example: 800ms → 400ms → 200ms → 100ms → 50ms (floor)
        this.speed = Math.max(50, this.speed * 0.5); 

        // Update visual appearance based on level
        const newStrokeWidth = 2 + (this.level - 1) * 2; // Thicker border for higher levels
        let newBorderColor = CONFIG.colors.nodeBorder;   // Default cyan
        if (this.level === 2) newBorderColor = 0xbd00ff; // Purple for level 2
        if (this.level >= 3) newBorderColor = 0xffd700;  // Gold for level 3+

        // Apply new border style
        this.bg.setStrokeStyle(newStrokeWidth, newBorderColor);
        
        // Update level badge text and color
        if (this.levelText) {
            this.levelText.setText('Lv.' + this.level);
            this.levelText.setColor(this.level >= 3 ? '#ffd700' : '#bd00ff');
        }

        // Play visual effects
        this.playUpgradeAnimation(newBorderColor);
        this.showFloatText('UPGRADE!', '#ffd700');
    }

    /**
     * Play Upgrade Animation
     * 
     * Creates a visual "aura" effect that expands outward from the node
     * when it's upgraded, providing feedback to the player.
     * 
     * @param {number} color - Color of the aura (hexadecimal)
     */
    playUpgradeAnimation(color) {
        // Create a semi-transparent circle at the node's position
        const aura = this.scene.add.circle(this.x, this.y, 40, color, 0.5);
        
        // Animate the aura expanding and fading out
        this.scene.tweens.add({
            targets: aura,
            scale: 2.5,         // Expand to 2.5x original size
            alpha: 0,           // Fade to transparent
            duration: 600,      // Animation duration in ms
            onComplete: () => aura.destroy() // Remove after animation
        });
    }

    /**
     * Update Statistics Display
     * 
     * Refreshes the visual display of success/error counts for user nodes.
     * Called after processing each request.
     */
    updateStatsDisplay() {
        if (this.type === 'user') {
            this.statsTextSuccess.setText('✔ ' + this.localSuccess);
            this.statsTextError.setText('✖ ' + this.localErrors);
        }
    }

    /**
     * Record Error
     * 
     * Increments the local error count for this node (user nodes only).
     * Called when a packet is dropped due to capacity overflow.
     */
    recordError() {
        if (this.type === 'user') {
            this.localErrors++;
            this.updateStatsDisplay();
        }
    }

    /**
     * Receive Packet
     * 
     * Main packet processing method. Handles an incoming packet:
     * 1. Checks if game is over (destroy packet if true)
     * 2. For user nodes receiving responses: record success
     * 3. For other nodes: check capacity and process or drop
     * 4. Simulates processing delay
     * 5. Routes packet to next destination
     * 
     * @param {Phaser.GameObjects.Arc} packet - The packet object to process
     */
    receivePacket(packet) {
        // If game is already over, destroy any incoming packets
        if (GameState.isGameOver) { 
            packet.destroy(); 
            return; 
        }

        // Special case: User receives a response packet (request completed)
        if (this.type === 'user' && packet.isResponse) {
            packet.destroy();
            
            // Record successful request completion
            GameState.success++;
            GameState.total++;
            this.localSuccess++;
            
            // Update UI and check if level objectives are met
            this.updateStatsDisplay();
            updateUI();
            checkGameEnd(this.scene);
            return;
        }

        // Check if server is at capacity (queue is full)
        if (this.currentLoad >= this.capacity) {
            this.flashRed();        // Visual feedback for overload
            this.dropPacket(packet); // Drop the packet (timeout/error)
            return;
        }

        // Accept packet for processing
        this.currentLoad++;
        this.updateVisuals();  // Update load bar
        
        // Start visual processing indicator
        this.startProcessing();

        // Simulate processing delay, then route packet to next destination
        this.scene.time.delayedCall(this.speed, () => {
            // Processing complete, free up capacity
            this.currentLoad--;
            this.stopProcessing();
            this.updateVisuals();
            
            // Send packet to its next destination
            this.routePacket(packet);
        });
    }

    /**
     * Start Processing Visual Indicator
     * 
     * Shows and animates the white processing indicator circle
     * to provide visual feedback that the server is working.
     */
    startProcessing() {
        this.processIndicator.setVisible(true);
        
        // Create pulsing animation
        this.scene.tweens.add({
            targets: this.processIndicator,
            alpha: 0.3,         // Fade to 30% opacity
            scale: 1.2,         // Slightly enlarge
            duration: 200,      // Animation duration
            yoyo: true,         // Reverse animation
            repeat: -1          // Repeat indefinitely
        });
    }

    /**
     * Stop Processing Visual Indicator
     * 
     * Hides the processing indicator and stops its animation.
     */
    stopProcessing() {
        this.processIndicator.setVisible(false);
        this.scene.tweens.killTweensOf(this.processIndicator);
    }

    /**
     * Route Packet to Next Destination
     * 
     * Determines where a packet should go next based on:
     * - Current node type
     * - Whether packet is a request or response
     * - Whether it's a read or write request
     * - Architecture configuration (Level 1 vs Level 2)
     * 
     * Packet flow:
     * - Level 1: User → App → User
     * - Level 2: User → App → Database → App → User
     * 
     * @param {Phaser.GameObjects.Arc} packet - The packet to route
     */
    routePacket(packet) {
        // Database finished processing - send response back to app
        if (this.type === 'database' && !packet.isResponse) {
            // If this is a write request, increase database storage
            if (packet.isWrite) {
                GameState.databaseStorage += 1;
                
                // Update database processing speed based on storage
                // As storage grows, operations become slower
                // Formula: baseSpeed * (1 + storage / 100)
                // Example: 800ms * (1 + 50/100) = 800ms * 1.5 = 1200ms
                this.speed = Math.floor(this.baseSpeed * (1 + GameState.databaseStorage / 100));
                
                // Show visual feedback for write operation
                this.showFloatText('+1 Data', '#ff6b35');
            }
            
            packet.isResponse = true;
            
            // Change packet color to response (gold)
            // Handle different packet types: circles, sprites, and polygons
            if (packet.setFillStyle) {
                packet.setFillStyle(CONFIG.colors.packetRes); // Circle packets
            } else if (packet.fillColor !== undefined) {
                packet.fillColor = CONFIG.colors.packetRes; // Polygon packets (diamonds)
            } else if (packet.setTint) {
                packet.setTint(CONFIG.colors.packetRes); // Sprite packets
            }
            
            // Send back to the app that forwarded this request
            if (packet.appNode && packet.appNode.active) {
                sendPacketAnim(this.scene, packet, packet.appNode, this);
            } else {
                packet.destroy(); // App node no longer exists
            }
        }
        // App receives response from database - forward to original user
        else if (this.type === 'app' && packet.isResponse) {
            if (packet.sourceNode && packet.sourceNode.active) {
                sendPacketAnim(this.scene, packet, packet.sourceNode, this);
            } else {
                packet.destroy(); // Source user no longer exists
            }
        }
        // App receives request - route based on architecture
        else if (this.type === 'app' && !packet.isResponse) {
            const database = GameState.nodes['Database'];
            console.log('App processing request. Database exists?', database ? 'YES' : 'NO');
            console.log('All nodes:', Object.keys(GameState.nodes));
            
            if (database) {
                // Level 2: Microservices architecture - forward to database
                console.log('Forwarding to database');
                packet.appNode = this; // Store reference for return path
                sendPacketAnim(this.scene, packet, database, this);
            } else {
                // Level 1: Monolithic architecture - no database, respond directly
                console.log('No database, sending response back');
                packet.isResponse = true;
                
                // Change packet color to response (gold)
                // Handle both circle packets (setFillStyle) and sprite packets (setTint)
                if (packet.setFillStyle) {
                    packet.setFillStyle(CONFIG.colors.packetRes); // Circle packets
                } else if (packet.setTint) {
                    packet.setTint(CONFIG.colors.packetRes); // Sprite packets (diamonds)
                }
                
                if (packet.sourceNode && packet.sourceNode.active) {
                    sendPacketAnim(this.scene, packet, packet.sourceNode, this);
                } else {
                    packet.destroy(); // Source user no longer exists
                }
            }
        }
        // User sends request to app
        else if (this.type === 'user' && !packet.isResponse) {
            const target = GameState.nodes['App'];
            if (target) {
                sendPacketAnim(this.scene, packet, target, this);
            }
        }
    }

    /**
     * Drop Packet (Handle Timeout/Error)
     * 
     * Called when a packet cannot be processed due to capacity overflow.
     * This represents a timeout or error condition in the system.
     * 
     * @param {Phaser.GameObjects.Arc} packet - The packet being dropped
     */
    dropPacket(packet) {
        // Record error on the source node (where request originated)
        if (packet.sourceNode && packet.sourceNode.active) {
            packet.sourceNode.recordError();
        }
        
        // Destroy the packet (it won't be processed)
        packet.destroy();
        
        // Update global error statistics
        GameState.errors++;
        GameState.total++;
        
        // Update UI and check if error rate exceeded (game over condition)
        updateUI();
        checkGameEnd(this.scene);
        
        // Show visual feedback
        this.showFloatText('Timeout', '#ff0000');
    }

    /**
     * Show Floating Text
     * 
     * Displays temporary animated text that floats upward and fades out.
     * Used for feedback like "UPGRADE!", "Timeout", etc.
     * 
     * @param {string} msg - Message to display
     * @param {string} color - Text color (CSS color string)
     */
    showFloatText(msg, color) {
        // Create text positioned above the node
        const txt = this.scene.add.text(this.x, this.y - 50, msg, { 
            fontSize: '14px', 
            color: color, 
            fontStyle: 'bold',
            stroke: '#000',          // Black outline for visibility
            strokeThickness: 2
        }).setOrigin(0.5);
        
        // Animate upward movement and fade out
        this.scene.tweens.add({ 
            targets: txt, 
            y: this.y - 80,     // Move up 30 pixels
            alpha: 0,           // Fade to transparent
            duration: 1000,     // 1 second animation
            onComplete: () => txt.destroy() // Remove after animation
        });
    }

    /**
     * Flash Red Effect
     * 
     * Briefly flashes the node's border red to indicate an error condition.
     * Used when a packet is dropped due to capacity overflow.
     */
    flashRed() {
        this.scene.tweens.add({ 
            targets: this.bg, 
            strokeColor: 0xff0000,  // Change to red
            duration: 100,          // Brief flash
            yoyo: true,             // Return to original color
            onComplete: () => {
                // Restore original border color based on level
                let color = CONFIG.colors.nodeBorder;
                if (this.level === 2) color = 0xbd00ff;     // Purple
                if (this.level >= 3) color = 0xffd700;      // Gold
                this.bg.setStrokeStyle(this.bg.lineWidth, color);
            } 
        });
    }

    /**
     * Update Visual Elements
     * 
     * Updates the load bar to reflect current capacity usage.
     * Bar width and color change based on load percentage.
     */
    updateVisuals() {
        // Calculate load as a ratio (0.0 to 1.0)
        const ratio = Math.min(this.currentLoad / this.capacity, 1);
        
        // Update bar width to represent load percentage
        this.barFg.width = this.bg.width * ratio;
        
        // Change bar color based on load level
        this.barFg.fillColor = this.getLoadColor(ratio);
    }
    
    /**
     * Get Load Bar Color
     * 
     * Returns appropriate color based on current load percentage:
     * - Green (0x00ff00): Low load (< 50%)
     * - Yellow (0xffff00): Medium load (50-89%)
     * - Red (0xff0000): High load (90-100%)
     * 
     * @param {number} ratio - Load ratio from 0.0 to 1.0
     * @returns {number} Hexadecimal color value
     */
    getLoadColor(ratio) {
        if (ratio < 0.5) return 0x00ff00;  // Green - plenty of capacity
        if (ratio < 0.9) return 0xffff00;  // Yellow - getting busy
        return 0xff0000;                    // Red - near/at capacity
    }
}
