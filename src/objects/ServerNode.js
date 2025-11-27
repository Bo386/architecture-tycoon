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
        
        // Database-specific storage (each database tracks its own storage independently)
        this.databaseStorage = 0;   // Storage for this specific database instance
        
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
        
        // Create shape based on node type and store dimensions
        if (this.type === 'user') {
            // User: Circle (represents client/user)
            this.bg = this.scene.add.circle(0, 0, 35, CONFIG.colors.node);
            this.bg.setStrokeStyle(2, CONFIG.colors.nodeBorder);
            this.bg.width = 70;  // Diameter
            this.bg.height = 70;
        } else if (this.type === 'database') {
            // Database: Cylinder (industry standard for database)
            // Draw using Graphics for cylinder shape
            this.bg = this.scene.add.graphics();
            this.drawCylinder(this.bg, 0, 0, w, h);
            this.bg.width = w;   // Store dimensions for later use
            this.bg.height = h;
            this.bg.isGraphics = true;  // Flag to identify Graphics objects
        } else if (this.type === 'cache') {
            // Cache: Diamond (represents cache layer)
            this.bg = this.scene.add.graphics();
            this.drawDiamond(this.bg, 0, 0, w * 0.9, h * 0.9);
            this.bg.width = w * 0.9;
            this.bg.height = h * 0.9;
            this.bg.isGraphics = true;
        } else if (this.type === 'loadbalancer') {
            // Load Balancer: Hexagon (represents traffic distributor)
            this.bg = this.scene.add.graphics();
            this.drawHexagon(this.bg, 0, 0, 40);
            this.bg.width = 80;  // Approximate width
            this.bg.height = 80;
            this.bg.isGraphics = true;
        } else if (this.type === 'cdn') {
            // CDN: Star (represents edge/distributed network)
            this.bg = this.scene.add.graphics();
            this.drawStar(this.bg, 0, 0, 5, 35, 18);
            this.bg.width = 70;  // Approximate width
            this.bg.height = 70;
            this.bg.isGraphics = true;
        } else {
            // App Server: Rectangle (standard server shape)
            this.bg = this.scene.add.rectangle(0, 0, w, h, CONFIG.colors.node);
            this.bg.setStrokeStyle(2, CONFIG.colors.nodeBorder);
        }
        
        // Database-specific: Storage display
        if (this.type === 'database') {
            // Create visual fill indicator (cyan rectangle that grows from bottom upward)
            // Strategy: Set origin at TOP of rectangle, position it at bottom of node
            // As height increases, the top stays fixed and bottom extends downward
            // But we want it to grow upward, so we need to adjust Y as height changes
            this.storageFill = this.scene.add.rectangle(0, h/2 - 5, w, 5, 0x00ffff, 0.5);
            this.storageFill.setOrigin(0.5, 0); // Anchor at TOP center
            
            // Create text display showing current storage amount (positioned to the right)
            this.storageText = this.scene.add.text(w/2 + 15, 0, 'Data: 0', {
                fontSize: '14px',
                color: '#00ff00',  // Green color for visibility
                fontStyle: 'bold',
                backgroundColor: '#000000',  // Black background
                padding: { x: 4, y: 2 }
            }).setOrigin(0, 0.5);
            
            console.log('Created storage fill and text for database:', this.name);
        }
        
        // Name label positioned above the node
        this.textName = this.scene.add.text(0, -h/2 - 15, this.name, { 
            fontSize: '14px', 
            color: '#fff', 
            fontFamily: 'Arial' 
        }).setOrigin(0.5);
        
        // Load bar and capacity text (only for non-user nodes)
        if (this.type !== 'user') {
            // Load bar background (dark bar showing max capacity)
            this.barBg = this.scene.add.rectangle(0, h/2 + 10, w, 6, 0x000000).setOrigin(0.5);
            
            // Load bar foreground (colored bar showing current load)
            // Starts at 0 width and grows as load increases
            this.barFg = this.scene.add.rectangle(-w/2, h/2 + 10, 0, 6, 0x00ff00).setOrigin(0, 0.5);
            
            // Capacity text (shows current load / max capacity)
            this.capacityText = this.scene.add.text(0, h/2 + 20, '0/' + this.capacity, {
                fontSize: '10px',
                color: '#ffffff',
                fontFamily: 'Arial'
            }).setOrigin(0.5, 0);
        }
        
        // Processing indicator - white circle that pulses during processing
        this.processIndicator = this.scene.add.circle(0, 0, 6, 0xffffff, 1);
        this.processIndicator.setVisible(false); // Hidden until processing starts

        // Add all common visual elements to this container
        if (this.type === 'database') {
            this.add([this.bg, this.storageFill, this.textName, this.barBg, this.barFg, this.capacityText, this.processIndicator, this.storageText]);
        } else if (this.type === 'user') {
            // User nodes don't have capacity bars
            this.add([this.bg, this.textName, this.processIndicator]);
        } else {
            // App nodes have capacity bars
            this.add([this.bg, this.textName, this.barBg, this.barFg, this.capacityText, this.processIndicator]);
        }

        // Add type-specific UI elements
        if (this.type === 'user') {
            this.createUserStats();      // Show success/error counts
        } else if (this.type === 'app' || this.type === 'database') {
            this.createServerStats();    // Show level badge
        }
    }

    /**
     * Draw Cylinder Shape (for Database nodes)
     * 
     * @param {Phaser.GameObjects.Graphics} graphics - Graphics object to draw on
     * @param {number} x - Center X position
     * @param {number} y - Center Y position
     * @param {number} w - Width
     * @param {number} h - Height
     * @param {number} borderColor - Border color (optional)
     * @param {number} strokeWidth - Stroke width (optional)
     */
    drawCylinder(graphics, x, y, w, h, borderColor, strokeWidth) {
        const topHeight = h * 0.15; // Ellipse height at top
        
        graphics.fillStyle(CONFIG.colors.node, 1);
        graphics.lineStyle(strokeWidth || 2, borderColor || CONFIG.colors.nodeBorder);
        
        // Draw main body (rectangle)
        graphics.fillRect(x - w/2, y - h/2 + topHeight, w, h - topHeight * 2);
        graphics.strokeRect(x - w/2, y - h/2 + topHeight, w, h - topHeight * 2);
        
        // Draw bottom ellipse
        graphics.fillEllipse(x, y + h/2 - topHeight, w/2, topHeight);
        graphics.strokeEllipse(x, y + h/2 - topHeight, w/2, topHeight);
        
        // Draw top ellipse (appears above the body)
        graphics.fillEllipse(x, y - h/2 + topHeight, w/2, topHeight);
        graphics.strokeEllipse(x, y - h/2 + topHeight, w/2, topHeight);
    }
    
    /**
     * Draw Diamond Shape (for Cache nodes)
     * 
     * @param {Phaser.GameObjects.Graphics} graphics - Graphics object to draw on
     * @param {number} x - Center X position
     * @param {number} y - Center Y position
     * @param {number} w - Width
     * @param {number} h - Height
     * @param {number} borderColor - Border color (optional)
     * @param {number} strokeWidth - Stroke width (optional)
     */
    drawDiamond(graphics, x, y, w, h, borderColor, strokeWidth) {
        graphics.fillStyle(CONFIG.colors.node, 1);
        graphics.lineStyle(strokeWidth || 2, borderColor || CONFIG.colors.nodeBorder);
        
        // Draw diamond shape
        graphics.beginPath();
        graphics.moveTo(x, y - h/2);           // Top point
        graphics.lineTo(x + w/2, y);           // Right point
        graphics.lineTo(x, y + h/2);           // Bottom point
        graphics.lineTo(x - w/2, y);           // Left point
        graphics.closePath();
        
        graphics.fillPath();
        graphics.strokePath();
    }
    
    /**
     * Draw Hexagon Shape (for Load Balancer nodes)
     * 
     * @param {Phaser.GameObjects.Graphics} graphics - Graphics object to draw on
     * @param {number} x - Center X position
     * @param {number} y - Center Y position
     * @param {number} radius - Radius of hexagon
     * @param {number} borderColor - Border color (optional)
     * @param {number} strokeWidth - Stroke width (optional)
     */
    drawHexagon(graphics, x, y, radius, borderColor, strokeWidth) {
        graphics.fillStyle(CONFIG.colors.node, 1);
        graphics.lineStyle(strokeWidth || 2, borderColor || CONFIG.colors.nodeBorder);
        
        graphics.beginPath();
        
        // Draw hexagon with 6 points
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 3) * i - Math.PI / 2; // Start from top
            const px = x + radius * Math.cos(angle);
            const py = y + radius * Math.sin(angle);
            
            if (i === 0) {
                graphics.moveTo(px, py);
            } else {
                graphics.lineTo(px, py);
            }
        }
        
        graphics.closePath();
        graphics.fillPath();
        graphics.strokePath();
    }

    /**
     * Draw Star Shape (for CDN nodes)
     * 
     * @param {Phaser.GameObjects.Graphics} graphics - Graphics object to draw on
     * @param {number} x - Center X position
     * @param {number} y - Center Y position
     * @param {number} points - Number of star points
     * @param {number} outerRadius - Outer radius (tip of star)
     * @param {number} innerRadius - Inner radius (between points)
     * @param {number} borderColor - Border color (optional)
     * @param {number} strokeWidth - Stroke width (optional)
     */
    drawStar(graphics, x, y, points, outerRadius, innerRadius, borderColor, strokeWidth) {
        graphics.fillStyle(CONFIG.colors.node, 1);
        graphics.lineStyle(strokeWidth || 2, borderColor || CONFIG.colors.nodeBorder);
        
        graphics.beginPath();
        
        // Draw star with alternating outer and inner points
        for (let i = 0; i < points * 2; i++) {
            const angle = (Math.PI / points) * i - Math.PI / 2; // Start from top
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
            const px = x + radius * Math.cos(angle);
            const py = y + radius * Math.sin(angle);
            
            if (i === 0) {
                graphics.moveTo(px, py);
            } else {
                graphics.lineTo(px, py);
            }
        }
        
        graphics.closePath();
        graphics.fillPath();
        graphics.strokePath();
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

        // Apply new border style - different for Graphics vs Rectangle/Circle
        if (this.bg.isGraphics) {
            // For Graphics objects, redraw the shape with new border
            this.redrawShape(newBorderColor, newStrokeWidth);
        } else {
            // For Rectangle/Circle objects
            this.bg.setStrokeStyle(newStrokeWidth, newBorderColor);
        }
        
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
     * Redraw Shape (for Graphics objects)
     * 
     * Redraws the shape with a new border color and width.
     * Used when upgrading nodes that use Graphics objects.
     * 
     * @param {number} borderColor - New border color
     * @param {number} strokeWidth - New stroke width
     */
    redrawShape(borderColor, strokeWidth) {
        if (!this.bg.isGraphics) return;
        
        // Clear existing graphics
        this.bg.clear();
        
        // Redraw based on type
        const w = this.bg.width;
        const h = this.bg.height;
        
        if (this.type === 'database') {
            this.drawCylinder(this.bg, 0, 0, w, h, borderColor, strokeWidth);
        } else if (this.type === 'cache') {
            this.drawDiamond(this.bg, 0, 0, w, h, borderColor, strokeWidth);
        } else if (this.type === 'loadbalancer') {
            this.drawHexagon(this.bg, 0, 0, 40, borderColor, strokeWidth);
        } else if (this.type === 'cdn') {
            this.drawStar(this.bg, 0, 0, 5, 35, 18, borderColor, strokeWidth);
        }
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
     * - Architecture configuration (Level 1 vs Level 2+)
     * 
     * Packet flow:
     * - Level 1: User → App → User
     * - Level 2-4: User → App → Database → App → User
     * - Level 5: User → App → Cache → [Database if miss] → Cache → App → User
     * 
     * @param {Phaser.GameObjects.Arc} packet - The packet to route
     */
    routePacket(packet) {
        // Cache receives read request from app - check for hit/miss
        if (this.type === 'cache' && !packet.isResponse) {
            const cacheConfig = CONFIG.level5?.servers?.cache;
            const hitRate = cacheConfig?.hitRate || 0.7;
            const isCacheHit = Math.random() < hitRate;
            
            if (isCacheHit) {
                // Cache HIT - return directly to app
                packet.isResponse = true;
                packet.isCacheHit = true;
                
                // Change packet color to response (gold)
                if (packet.setFillStyle) {
                    packet.setFillStyle(CONFIG.colors.packetRes);
                } else if (packet.setTint) {
                    packet.setTint(CONFIG.colors.packetRes);
                }
                
                // Show cache hit feedback
                this.showFloatText('HIT', '#00ff00');
                
                // Return to app
                if (packet.appNode && packet.appNode.active) {
                    sendPacketAnim(this.scene, packet, packet.appNode, this);
                } else {
                    packet.destroy();
                }
            } else {
                // Cache MISS - return to app so it can go to DB
                packet.cacheMissed = true; // Mark as cache miss
                
                // Show cache miss feedback
                this.showFloatText('MISS', '#ff6b35');
                
                // Return to app
                if (packet.appNode && packet.appNode.active) {
                    sendPacketAnim(this.scene, packet, packet.appNode, this);
                } else {
                    packet.destroy();
                }
            }
        }
        // Database finished processing - send response back to app
        else if (this.type === 'database' && !packet.isResponse) {
            // If this is a write request, increase THIS database's storage
            if (packet.isWrite) {
                this.databaseStorage += 1;
                
                // Also update global counter for UI display (total across all DBs)
                GameState.databaseStorage += 1;
                
                // Update THIS database's processing speed based on its own storage
                // As storage grows, operations become slower
                // Formula: baseSpeed * (1 + storage / 100)
                // Example: 800ms * (1 + 50/100) = 800ms * 1.5 = 1200ms
                this.speed = Math.floor(this.baseSpeed * (1 + this.databaseStorage / 100));
                
                // Update the visual storage fill indicator
                this.updateStorageFill();
                
                // Show visual feedback for write operation
                this.showFloatText('+1 Data', '#ff6b35');
            }
            
            packet.isResponse = true;
            
            // Change packet color to response (gold)
            // Handle different packet types: circles, graphics (diamonds), and sprites
            if (packet.setFillStyle) {
                packet.setFillStyle(CONFIG.colors.packetRes); // Circle packets
            } else if (packet.clear) {
                // Graphics packets (diamonds) - need to redraw with new color
                packet.clear();
                packet.fillStyle(CONFIG.colors.packetRes, 1);
                const size = 6;
                packet.beginPath();
                packet.moveTo(0, -size);
                packet.lineTo(size, 0);
                packet.lineTo(0, size);
                packet.lineTo(-size, 0);
                packet.closePath();
                packet.fillPath();
            } else if (packet.setTint) {
                packet.setTint(CONFIG.colors.packetRes); // Sprite packets
            }
            
            // Always send back to the app that forwarded this request
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
            // Check if this is a cache miss returning to app
            if (packet.cacheMissed) {
                // Cache missed, now go to database
                packet.cacheMissed = false; // Clear the flag
                
                // Check for read-write splitting (Level 8)
                const readReplica = GameState.nodes['ReadReplica1'];
                
                if (readReplica && readReplica.active) {
                    // Read-write splitting: cache miss reads go to read replica
                    packet.appNode = this;
                    sendPacketAnim(this.scene, packet, readReplica, this);
                } else {
                    // No read replica: use any available database
                    const databases = Object.keys(GameState.nodes)
                        .filter(key => key.startsWith('Database'))
                        .map(key => GameState.nodes[key])
                        .filter(db => db && db.active);
                    
                    if (databases.length > 0) {
                        const randomIndex = Math.floor(Math.random() * databases.length);
                        const selectedDatabase = databases[randomIndex];
                        packet.appNode = this; // Store reference for return path
                        sendPacketAnim(this.scene, packet, selectedDatabase, this);
                    } else {
                        packet.destroy();
                    }
                }
            } else {
                // New request from user
                const cache = GameState.nodes['Cache1'];
                
                // Write requests always go directly to master database (skip cache)
                if (packet.isWrite) {
                    // Check for ReadReplica - if it exists, only send writes to Database1 (master)
                    const readReplica = GameState.nodes['ReadReplica1'];
                    
                    if (readReplica && readReplica.active) {
                        // Read-write splitting enabled: send writes ONLY to master (Database1)
                        const masterDb = GameState.nodes['Database1'];
                        if (masterDb && masterDb.active) {
                            packet.appNode = this;
                            sendPacketAnim(this.scene, packet, masterDb, this);
                        } else {
                            packet.destroy();
                        }
                    } else {
                        // No read-write splitting: use all databases
                        const databases = Object.keys(GameState.nodes)
                            .filter(key => key.startsWith('Database'))
                            .map(key => GameState.nodes[key])
                            .filter(db => db && db.active);
                        
                        if (databases.length > 0) {
                            const randomIndex = Math.floor(Math.random() * databases.length);
                            const selectedDatabase = databases[randomIndex];
                            packet.appNode = this;
                            sendPacketAnim(this.scene, packet, selectedDatabase, this);
                        } else {
                            packet.destroy();
                        }
                    }
                }
                // Read requests go through cache if available (Level 5+)
                else if (cache && cache.active) {
                    packet.appNode = this; // Store reference for return path
                    sendPacketAnim(this.scene, packet, cache, this);
                } else {
                    // Check for read-write splitting (Level 8)
                    const readReplica = GameState.nodes['ReadReplica1'];
                    
                    if (readReplica && readReplica.active) {
                        // Read-write splitting enabled: send reads to read replica
                        packet.appNode = this;
                        sendPacketAnim(this.scene, packet, readReplica, this);
                    } else {
                        // Find all available database servers
                        const databases = Object.keys(GameState.nodes)
                            .filter(key => key.startsWith('Database'))
                            .map(key => GameState.nodes[key])
                            .filter(db => db && db.active);
                        
                        console.log('App processing request. Databases found:', databases.length);
                        console.log('All nodes:', Object.keys(GameState.nodes));
                        
                        if (databases.length > 0) {
                            // Level 2/3/4: Architecture with database(s) - forward to a database
                            // Use round-robin or random selection for load balancing
                            const randomIndex = Math.floor(Math.random() * databases.length);
                            const selectedDatabase = databases[randomIndex];
                            
                            console.log('Forwarding to database:', selectedDatabase.name);
                            packet.appNode = this; // Store reference for return path
                            sendPacketAnim(this.scene, packet, selectedDatabase, this);
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
                }
            }
        }
        // LoadBalancer receives request - intelligently route to least loaded app server
        else if (this.type === 'loadbalancer' && !packet.isResponse) {
            // Find all available app servers
            const appServers = Object.keys(GameState.nodes)
                .filter(key => key.startsWith('App'))
                .map(key => GameState.nodes[key])
                .filter(app => app && app.active);
            
            if (appServers.length > 0) {
                // Select app server with lowest current load (intelligent load balancing)
                let selectedServer = appServers[0];
                let lowestLoadRatio = selectedServer.currentLoad / selectedServer.capacity;
                
                for (let i = 1; i < appServers.length; i++) {
                    const server = appServers[i];
                    const loadRatio = server.currentLoad / server.capacity;
                    if (loadRatio < lowestLoadRatio) {
                        lowestLoadRatio = loadRatio;
                        selectedServer = server;
                    }
                }
                
                // Debug logging to verify load balancing is working
                console.log('Load Balancer routing decision:');
                appServers.forEach(server => {
                    const ratio = (server.currentLoad / server.capacity * 100).toFixed(1);
                    const isSelected = server === selectedServer;
                    console.log(`  ${server.name}: ${server.currentLoad}/${server.capacity} (${ratio}%) ${isSelected ? '← SELECTED' : ''}`);
                });
                
                // Show visual feedback on load balancer
                const serverNum = selectedServer.name.includes('1') ? '1' : '2';
                this.showFloatText(`→ App ${serverNum}`, '#9c27b0');
                
                sendPacketAnim(this.scene, packet, selectedServer, this);
            } else {
                packet.destroy();
            }
        }
        // LoadBalancer receives response - forward back to original user
        else if (this.type === 'loadbalancer' && packet.isResponse) {
            if (packet.sourceNode && packet.sourceNode.active) {
                sendPacketAnim(this.scene, packet, packet.sourceNode, this);
            } else {
                packet.destroy();
            }
        }
        // CDN receives request from user - check for hit/miss
        else if (this.type === 'cdn' && !packet.isResponse) {
            const cdnConfig = CONFIG.level7?.servers?.cdn;
            const hitRate = cdnConfig?.hitRate || 0.8;
            
            // Write requests always bypass CDN (go to backend)
            if (packet.isWrite) {
                const loadBalancer = GameState.nodes['LoadBalancer1'];
                if (loadBalancer && loadBalancer.active) {
                    sendPacketAnim(this.scene, packet, loadBalancer, this);
                } else {
                    packet.destroy();
                }
            } else {
                // Read request - check for CDN hit
                const isCDNHit = Math.random() < hitRate;
                
                if (isCDNHit) {
                    // CDN HIT - return directly to user
                    packet.isResponse = true;
                    packet.isCDNHit = true;
                    
                    // Change packet color to response (gold)
                    if (packet.setFillStyle) {
                        packet.setFillStyle(CONFIG.colors.packetRes);
                    } else if (packet.setTint) {
                        packet.setTint(CONFIG.colors.packetRes);
                    }
                    
                    // Show CDN hit feedback
                    this.showFloatText('HIT', '#00ff00');
                    
                    // Return to user
                    if (packet.sourceNode && packet.sourceNode.active) {
                        sendPacketAnim(this.scene, packet, packet.sourceNode, this);
                    } else {
                        packet.destroy();
                    }
                } else {
                    // CDN MISS - forward to backend
                    this.showFloatText('MISS', '#ff6b35');
                    
                    const loadBalancer = GameState.nodes['LoadBalancer1'];
                    if (loadBalancer && loadBalancer.active) {
                        sendPacketAnim(this.scene, packet, loadBalancer, this);
                    } else {
                        packet.destroy();
                    }
                }
            }
        }
        // CDN receives response from backend - forward to user
        else if (this.type === 'cdn' && packet.isResponse) {
            if (packet.sourceNode && packet.sourceNode.active) {
                sendPacketAnim(this.scene, packet, packet.sourceNode, this);
            } else {
                packet.destroy();
            }
        }
        // User sends request to CDN, load balancer, or app
        else if (this.type === 'user' && !packet.isResponse) {
            // Check if CDN exists (Level 7)
            const cdn = GameState.nodes['CDN1'];
            
            if (cdn && cdn.active) {
                // Route through CDN
                sendPacketAnim(this.scene, packet, cdn, this);
            } else {
                // Check if load balancer exists
                const loadBalancer = GameState.nodes['LoadBalancer1'];
                
                if (loadBalancer && loadBalancer.active) {
                    // Route through load balancer
                    sendPacketAnim(this.scene, packet, loadBalancer, this);
                } else {
                    // Find all available app servers
                    const appServers = Object.keys(GameState.nodes)
                        .filter(key => key.startsWith('App'))
                        .map(key => GameState.nodes[key])
                        .filter(app => app && app.active);
                    
                    if (appServers.length > 0) {
                        // Use random selection without load balancer
                        const randomIndex = Math.floor(Math.random() * appServers.length);
                        const target = appServers[randomIndex];
                        sendPacketAnim(this.scene, packet, target, this);
                    }
                }
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
        // For Graphics objects, we need to redraw instead of tweening strokeColor
        if (this.bg.isGraphics) {
            // Get current stroke width
            const strokeWidth = 2 + (this.level - 1) * 2;
            
            // Flash red temporarily
            this.redrawShape(0xff0000, strokeWidth);
            
            // After 100ms, restore original color
            this.scene.time.delayedCall(100, () => {
                let color = CONFIG.colors.nodeBorder;
                if (this.level === 2) color = 0xbd00ff;     // Purple
                if (this.level >= 3) color = 0xffd700;      // Gold
                this.redrawShape(color, strokeWidth);
            });
        } else {
            // For Rectangle/Circle objects, use tween
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
    }

    /**
     * Update Visual Elements
     * 
     * Updates the load bar to reflect current capacity usage.
     * Bar width and color change based on load percentage.
     * Note: User nodes don't have capacity bars.
     */
    updateVisuals() {
        // Skip updating visuals for user nodes (they don't have capacity bars)
        if (this.type === 'user') {
            return;
        }
        
        // Calculate load as a ratio (0.0 to 1.0)
        const ratio = Math.min(this.currentLoad / this.capacity, 1);
        
        // Update bar width to represent load percentage
        this.barFg.width = this.bg.width * ratio;
        
        // Change bar color based on load level
        this.barFg.fillColor = this.getLoadColor(ratio);
        
        // Update capacity text to show current load / max capacity
        this.capacityText.setText(this.currentLoad + '/' + this.capacity);
        
        // Also update text color based on load
        if (ratio < 0.5) {
            this.capacityText.setColor('#00ff00');  // Green
        } else if (ratio < 0.9) {
            this.capacityText.setColor('#ffff00');  // Yellow
        } else {
            this.capacityText.setColor('#ff0000');  // Red
        }
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

    /**
     * Update Storage Fill (Database Only)
     * 
     * Updates the cyan fill indicator to show current database storage.
     * The fill grows from bottom to top as data is added.
     * Uses smooth animation for a pleasing visual effect.
     * 
     * Max storage is assumed to be 100 items for visual purposes.
     */
    updateStorageFill() {
        // Only apply to database nodes
        if (this.type !== 'database' || !this.storageText) {
            return;
        }

        // Update the storage text display with THIS database's storage
        this.storageText.setText('Data: ' + this.databaseStorage);
        
        // Change color based on storage amount for visual feedback
        if (this.databaseStorage < 20) {
            this.storageText.setColor('#00ff00');  // Green - low storage
        } else if (this.databaseStorage < 50) {
            this.storageText.setColor('#ffff00');  // Yellow - medium storage
        } else if (this.databaseStorage < 80) {
            this.storageText.setColor('#ff6b35');  // Orange - high storage
        } else {
            this.storageText.setColor('#ff0000');  // Red - very high storage
        }
        
        // Update the visual fill indicator
        // Max storage is 100 for visual purposes
        const maxStorage = 100;
        const fillRatio = Math.min(this.databaseStorage / maxStorage, 1);
        const maxHeight = this.bg.height;
        const newHeight = Math.max(5, maxHeight * fillRatio); // Minimum 5px height
        
        // Calculate new Y position
        // Origin is at top (0, 0), so Y represents the top of the rectangle
        // To grow upward from bottom: Y = (bottom position) - (new height)
        // Bottom of node is at h/2, so: Y = h/2 - newHeight
        const newY = (this.bg.height / 2) - newHeight;
        
        // Determine fill color based on storage amount
        let fillColor = 0x00ffff;  // Cyan - low storage (default)
        if (fillRatio >= 0.8) {
            fillColor = 0xff0000;  // Red - very high storage (≥80%)
        } else if (fillRatio >= 0.5) {
            fillColor = 0xff6b35;  // Orange - high storage (≥50%)
        } else if (fillRatio >= 0.2) {
            fillColor = 0xffff00;  // Yellow - medium storage (≥20%)
        }
        
        // Animate both height, Y position, and fill color smoothly
        // As height increases, Y moves upward (becomes more negative)
        // This makes the rectangle grow from bottom to top
        this.scene.tweens.add({
            targets: this.storageFill,
            height: newHeight,
            y: newY,
            fillColor: fillColor,
            duration: 300,
            ease: 'Power2'
        });
    }
}
