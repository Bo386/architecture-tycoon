/**
 * LoadBalancerNode Class
 * 
 * Represents a load balancer that distributes traffic intelligently.
 * - Hexagon shape
 * - Monitors all app servers
 * - Selects least loaded server for each request
 * - Routes responses back to users
 */

import { CONFIG, GameState } from '../config.js';
import { sendPacketAnim } from '../utils/animations.js';
import { ProcessingNode } from './ProcessingNode.js';

export class LoadBalancerNode extends ProcessingNode {
    constructor(scene, x, y, name, capacity, speed) {
        super(scene, x, y, name, 'loadbalancer', capacity, speed);
    }

    /**
     * Create Hexagon Shape
     */
    createShape(w, h) {
        this.bg = this.scene.add.graphics();
        this.drawHexagon(this.bg, 0, 0, 40);
        this.bg.width = 80;
        this.bg.height = 80;
        this.bg.isGraphics = true;
    }

    /**
     * Route Packet
     * Implements intelligent load balancing
     */
    routePacket(packet) {
        // LoadBalancer receives request - intelligently route to least loaded app server
        if (!packet.isResponse) {
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
        else {
            if (packet.sourceNode && packet.sourceNode.active) {
                sendPacketAnim(this.scene, packet, packet.sourceNode, this);
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
        this.drawHexagon(this.bg, 0, 0, 40, borderColor, strokeWidth);
    }
}
