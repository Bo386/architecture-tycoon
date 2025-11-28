/**
 * DatabaseNode Class
 * 
 * Represents a database server that stores and retrieves data.
 * - Cylinder shape
 * - Manages data storage (write operations increase storage)
 * - Performance degrades as storage grows
 * - Visual storage fill indicator
 * - Routes responses back to app servers
 */

import { CONFIG, GameState } from '../config.js';
import { sendPacketAnim } from '../utils/animations.js';
import { ProcessingNode } from './ProcessingNode.js';

export class DatabaseNode extends ProcessingNode {
    constructor(scene, x, y, name, capacity, speed) {
        super(scene, x, y, name, 'database', capacity, speed);
        this.databaseStorage = 0;
    }

    /**
     * Create Cylinder Shape
     */
    createShape(w, h) {
        this.bg = this.scene.add.graphics();
        this.drawCylinder(this.bg, 0, 0, w, h);
        this.bg.width = w;
        this.bg.height = h;
        this.bg.isGraphics = true;
    }

    /**
     * Create Database-Specific UI
     * Adds storage fill indicator and storage text
     */
    createTypeSpecificUI() {
        super.createTypeSpecificUI();
        
        const w = this.bg.width;
        const h = this.bg.height;
        
        // Create visual fill indicator (cyan rectangle that grows from bottom upward)
        this.storageFill = this.scene.add.rectangle(0, h/2 - 5, w, 5, 0x00ffff, 0.5);
        this.storageFill.setOrigin(0.5, 0);
        
        // Create text display showing current storage amount
        this.storageText = this.scene.add.text(w/2 + 15, 0, 'Data: 0', {
            fontSize: '14px',
            color: '#00ff00',
            fontStyle: 'bold',
            backgroundColor: '#000000',
            padding: { x: 4, y: 2 }
        }).setOrigin(0, 0.5);
        
        this.add([this.storageFill, this.storageText]);
    }

    /**
     * Route Packet
     * Processes database operations and returns responses to app
     */
    routePacket(packet) {
        // If this is a write request, increase THIS database's storage
        if (packet.isWrite) {
            this.databaseStorage += 1;
            
            // Also update global counter for UI display
            GameState.databaseStorage += 1;
            
            // Update THIS database's processing speed based on its own storage
            // As storage grows, operations become slower
            this.speed = Math.floor(this.baseSpeed * (1 + this.databaseStorage / 100));
            
            // Update the visual storage fill indicator
            this.updateStorageFill();
            
            // Show visual feedback for write operation
            this.showFloatText('+1 Data', '#ff6b35');
        }
        
        packet.isResponse = true;
        
        // Change packet color to response (gold)
        if (packet.setFillStyle) {
            packet.setFillStyle(CONFIG.colors.packetRes);
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
            packet.setTint(CONFIG.colors.packetRes);
        }
        
        // Always send back to the app that forwarded this request
        if (packet.appNode && packet.appNode.active) {
            sendPacketAnim(this.scene, packet, packet.appNode, this);
        } else {
            packet.destroy();
        }
    }

    /**
     * Update Storage Fill Indicator
     */
    updateStorageFill() {
        if (!this.storageText) {
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
        const maxStorage = 100;
        const fillRatio = Math.min(this.databaseStorage / maxStorage, 1);
        const maxHeight = this.bg.height;
        const newHeight = Math.max(5, maxHeight * fillRatio);
        
        // Calculate new Y position to grow upward from bottom
        const newY = (this.bg.height / 2) - newHeight;
        
        // Determine fill color based on storage amount
        let fillColor = 0x00ffff;  // Cyan - low storage
        if (fillRatio >= 0.8) {
            fillColor = 0xff0000;  // Red - very high storage
        } else if (fillRatio >= 0.5) {
            fillColor = 0xff6b35;  // Orange - high storage
        } else if (fillRatio >= 0.2) {
            fillColor = 0xffff00;  // Yellow - medium storage
        }
        
        // Animate both height, Y position, and fill color smoothly
        this.scene.tweens.add({
            targets: this.storageFill,
            height: newHeight,
            y: newY,
            fillColor: fillColor,
            duration: 300,
            ease: 'Power2'
        });
    }

    /**
     * Redraw Shape (for upgrade visuals)
     */
    redrawShape(borderColor, strokeWidth) {
        this.bg.clear();
        this.drawCylinder(this.bg, 0, 0, this.bg.width, this.bg.height, borderColor, strokeWidth);
    }
}
