/**
 * CDNNode Class
 * 
 * Represents a Content Delivery Network node for edge caching.
 * - Star shape
 * - Hit/miss logic for static content (80% hit rate)
 * - Serves content from edge locations
 * - Bypasses CDN for write requests
 */

import { CONFIG, GameState } from '../config.js';
import { sendPacketAnim } from '../utils/animations.js';
import { ProcessingNode } from './ProcessingNode.js';

export class CDNNode extends ProcessingNode {
    constructor(scene, x, y, name, capacity, speed) {
        super(scene, x, y, name, 'cdn', capacity, speed);
        this.hitRate = CONFIG.level7?.servers?.cdn?.hitRate || 0.8;
    }

    /**
     * Create Star Shape
     */
    createShape(w, h) {
        this.bg = this.scene.add.graphics();
        this.drawStar(this.bg, 0, 0, 5, 35, 18);
        this.bg.width = 70;
        this.bg.height = 70;
        this.bg.isGraphics = true;
    }

    /**
     * Route Packet
     * Implements CDN hit/miss logic
     */
    routePacket(packet) {
        // Write requests always bypass CDN (go to backend)
        if (packet.isWrite) {
            const loadBalancer = GameState.nodes['LoadBalancer1'];
            if (loadBalancer && loadBalancer.active) {
                sendPacketAnim(this.scene, packet, loadBalancer, this);
            } else {
                packet.destroy();
            }
        }
        // CDN receives response from backend - forward to user
        else if (packet.isResponse) {
            if (packet.sourceNode && packet.sourceNode.active) {
                sendPacketAnim(this.scene, packet, packet.sourceNode, this);
            } else {
                packet.destroy();
            }
        }
        // Read request - check for CDN hit
        else {
            const isCDNHit = Math.random() < this.hitRate;
            
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

    /**
     * Redraw Shape (for upgrade visuals)
     */
    redrawShape(borderColor, strokeWidth) {
        this.bg.clear();
        this.drawStar(this.bg, 0, 0, 5, 35, 18, borderColor, strokeWidth);
    }
}
