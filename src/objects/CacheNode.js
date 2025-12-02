/**
 * CacheNode Class
 * 
 * Represents a cache server that speeds up data access.
 * - Diamond shape
 * - Hit/miss logic (70% hit rate by default)
 * - Fast responses on cache hits
 * - Forwards cache misses back to app for database access
 */

import { CONFIG, GameState } from '../config.js';
import { sendPacketAnim } from '../utils/animations.js';
import { ProcessingNode } from './ProcessingNode.js';

export class CacheNode extends ProcessingNode {
    constructor(scene, x, y, name, capacity, speed) {
        super(scene, x, y, name, 'cache', capacity, speed);
        this.hitRate = CONFIG.level5?.servers?.cache?.hitRate || 0.7;
    }

    /**
     * Create Diamond Shape
     */
    createShape(w, h) {
        this.bg = this.scene.add.graphics();
        this.drawDiamond(this.bg, 0, 0, w * 0.9, h * 0.9);
        this.bg.width = w * 0.9;
        this.bg.height = h * 0.9;
        this.bg.isGraphics = true;
    }

    /**
     * Route Packet
     * Implements cache hit/miss logic
     */
    routePacket(packet) {
        // Cache receives read request from app - check for hit/miss
        const isCacheHit = Math.random() < this.hitRate;
        
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
            // Cache MISS - return to app so it can go to database
            packet.cacheMissed = true;
            
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

    /**
     * Redraw Shape (for upgrade visuals)
     */
    redrawShape(borderColor, strokeWidth) {
        this.bg.clear();
        this.drawDiamond(this.bg, 0, 0, this.bg.width, this.bg.height, borderColor, strokeWidth);
    }
}
