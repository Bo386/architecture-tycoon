/**
 * PubsubQueueNode Class
 * 
 * Represents a message queue (Pub/Sub) that accepts write requests asynchronously.
 * Write requests are queued and processed to the database in the background.
 * The app server gets an immediate response without waiting for database processing.
 * 
 * Key Features:
 * - Asynchronous write processing
 * - Queue visualization showing pending messages
 * - Configurable queue capacity and processing rate
 * - Returns immediately to app server (fire and forget)
 */

import { CONFIG, GameState } from '../config.js';
import { updateUI, checkGameEnd } from '../utils/uiManager.js';
import { ProcessingNode } from './ProcessingNode.js';

export class PubsubQueueNode extends ProcessingNode {
    constructor(scene, x, y, name, capacity = 20, speed = 200) {
        super(scene, x, y, name, 'pubsub', capacity, speed);
        
        // Queue for storing pending write requests
        this.messageQueue = [];
        this.isProcessing = false;
        this.queueText = null;
        
        this.createQueueUI();
    }

    /**
     * Create Star Shape for Queue
     */
    createShape(w, h) {
        this.bg = this.scene.add.graphics();
        const radius = Math.min(w, h) / 2;
        this.drawStar(this.bg, 0, 0, 5, radius, radius * 0.5);
        this.bg.width = w;
        this.bg.height = h;
        this.bg.isGraphics = true;
    }

    /**
     * Redraw Shape (for upgrade visuals)
     */
    redrawShape(borderColor, strokeWidth) {
        this.bg.clear();
        const radius = Math.min(this.bg.width, this.bg.height) / 2;
        this.drawStar(this.bg, 0, 0, 5, radius, radius * 0.5, borderColor, strokeWidth);
    }

    /**
     * Create Queue-Specific UI Elements
     */
    createQueueUI() {
        const h = this.bg.height || 60;
        
        // Queue size indicator
        this.queueText = this.scene.add.text(0, h/2 + 30, 'Queue: 0', {
            fontSize: '10px',
            color: '#00ffff',
            fontFamily: 'Arial',
            fontStyle: 'bold'
        }).setOrigin(0.5, 0);
        
        this.add(this.queueText);
    }

    /**
     * Receive Packet (Write Request)
     * Accept immediately and add to queue
     */
    receivePacket(packet) {
        if (GameState.isGameOver) {
            packet.destroy();
            return;
        }

        // Check if queue is full
        if (this.messageQueue.length >= this.capacity) {
            this.flashRed();
            this.dropPacket(packet);
            return;
        }

        // Add to queue
        this.messageQueue.push(packet);
        this.updateQueueUI();
        
        // Return immediately to sender (async behavior)
        this.sendImmediateAck(packet);
        
        // Start processing if not already processing
        if (!this.isProcessing) {
            this.processQueue();
        }
    }

    /**
     * Send Immediate Acknowledgment
     * The app server gets instant response
     */
    sendImmediateAck(packet) {
        if (packet.sourceNode && packet.sourceNode.active) {
            // Create response packet
            const responsePacket = this.scene.add.circle(
                this.x, this.y,
                packet.radius || 5,
                CONFIG.colors.packetRes
            );
            responsePacket.isResponse = true;
            responsePacket.targetNode = packet.sourceNode;
            
            // Send back to source immediately (no delay)
            this.scene.time.delayedCall(50, () => {
                if (responsePacket.targetNode && responsePacket.targetNode.active) {
                    responsePacket.targetNode.receivePacket(responsePacket);
                } else {
                    responsePacket.destroy();
                }
            });
        }
    }

    /**
     * Process Queue
     * Continuously process messages from the queue to database
     */
    processQueue() {
        if (this.messageQueue.length === 0) {
            this.isProcessing = false;
            this.stopProcessing();
            return;
        }

        this.isProcessing = true;
        this.startProcessing();

        // Get next message from queue
        const packet = this.messageQueue.shift();
        this.updateQueueUI();

        // Process to database
        this.scene.time.delayedCall(this.speed, () => {
            // Route to database
            this.routePacket(packet);
            
            // Continue processing queue
            this.processQueue();
        });
    }

    /**
     * Route Packet to Database
     */
    routePacket(packet) {
        if (GameState.isGameOver) {
            packet.destroy();
            return;
        }

        // Find primary database
        const database = GameState.nodes['Database1'];
        
        if (database && database.active) {
            // Create tween to database
            this.scene.tweens.add({
                targets: packet,
                x: database.x,
                y: database.y,
                duration: 200,
                onComplete: () => {
                    database.receivePacket(packet);
                }
            });
        } else {
            // No database available, drop packet
            this.dropPacket(packet);
        }
    }

    /**
     * Update Queue UI
     */
    updateQueueUI() {
        if (this.queueText) {
            this.queueText.setText(`Queue: ${this.messageQueue.length}`);
            
            // Color based on queue fullness
            const ratio = this.messageQueue.length / this.capacity;
            if (ratio < 0.5) {
                this.queueText.setColor('#00ff00');
            } else if (ratio < 0.8) {
                this.queueText.setColor('#ffff00');
            } else {
                this.queueText.setColor('#ff0000');
            }
        }
    }

    /**
     * Drop Packet
     */
    dropPacket(packet) {
        if (packet.sourceNode && packet.sourceNode.active) {
            packet.sourceNode.recordError();
        }
        
        packet.destroy();
        
        GameState.errors++;
        GameState.total++;
        
        updateUI();
        checkGameEnd(this.scene);
        
        this.showFloatText('Queue Full!', '#ff0000');
    }

    /**
     * Update Visuals
     * Override to show queue status
     */
    updateVisuals() {
        const queueRatio = this.messageQueue.length / this.capacity;
        
        this.barFg.width = this.bg.width * queueRatio;
        this.barFg.fillColor = this.getLoadColor(queueRatio);
        
        this.capacityText.setText(this.messageQueue.length + '/' + this.capacity);
        
        if (queueRatio < 0.5) {
            this.capacityText.setColor('#00ff00');
        } else if (queueRatio < 0.9) {
            this.capacityText.setColor('#ffff00');
        } else {
            this.capacityText.setColor('#ff0000');
        }
    }
}
