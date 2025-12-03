/**
 * UserNode Class
 * 
 * Represents a user/client node that generates requests and receives responses.
 * - Circle shape
 * - Tracks success/error statistics
 * - No capacity management (can generate unlimited requests)
 * - Routes to: CDN → LoadBalancer → App
 */

import { CONFIG, GameState } from '../config.js';
import { updateUI, checkGameEnd, addRevenue } from '../utils/uiManager.js';
import { sendPacketAnim } from '../utils/animations.js';
import { BaseNode } from './BaseNode.js';

export class UserNode extends BaseNode {
    constructor(scene, x, y, name) {
        super(scene, x, y, name, 'user', 999, 10);
        this.localSuccess = 0;
        this.localErrors = 0;
    }

    /**
     * Create Circle Shape
     */
    createShape(w, h) {
        this.bg = this.scene.add.circle(0, 0, 35, CONFIG.colors.node);
        this.bg.setStrokeStyle(2, CONFIG.colors.nodeBorder);
        this.bg.width = 70;
        this.bg.height = 70;
    }

    /**
     * Create User-Specific Statistics Display
     */
    createTypeSpecificUI() {
        this.statsTextSuccess = this.scene.add.text(-50, -12, '✔ 0', { 
            fontSize: '12px', 
            color: '#00ff00', 
            align: 'right', 
            fontFamily: 'Courier New' 
        }).setOrigin(1, 0.5);
        
        this.statsTextError = this.scene.add.text(-50, 8, '✖ 0', { 
            fontSize: '12px', 
            color: '#ff4444', 
            align: 'right', 
            fontFamily: 'Courier New' 
        }).setOrigin(1, 0.5);
        
        this.add([this.statsTextSuccess, this.statsTextError]);
    }

    /**
     * Receive Packet
     * Users only receive response packets
     */
    receivePacket(packet) {
        if (GameState.isGameOver) { 
            packet.destroy(); 
            return; 
        }

        // User receives response - request completed successfully
        if (packet.isResponse) {
            packet.destroy();
            
            GameState.success++;
            GameState.total++;
            this.localSuccess++;
            
            // Add revenue for successful request (if level has revenue system)
            addRevenue(this.scene);
            
            this.updateStatsDisplay();
            updateUI();
            checkGameEnd(this.scene);
        }
    }

    /**
     * Route Packet (Send Request)
     * Routes to CDN, LoadBalancer, or App based on availability
     */
    routePacket(packet) {
        // Check for CDN (Level 7)
        const cdn = GameState.nodes['CDN1'];
        
        if (cdn && cdn.active) {
            sendPacketAnim(this.scene, packet, cdn, this);
        } else {
            // Check for LoadBalancer (Level 6)
            const loadBalancer = GameState.nodes['LoadBalancer1'];
            
            if (loadBalancer && loadBalancer.active) {
                sendPacketAnim(this.scene, packet, loadBalancer, this);
            } else {
                // Find available app servers (Levels 1-5)
                const appServers = Object.keys(GameState.nodes)
                    .filter(key => key.startsWith('App'))
                    .map(key => GameState.nodes[key])
                    .filter(app => app && app.active);
                
                if (appServers.length > 0) {
                    const randomIndex = Math.floor(Math.random() * appServers.length);
                    const target = appServers[randomIndex];
                    sendPacketAnim(this.scene, packet, target, this);
                }
            }
        }
    }

    /**
     * Update Statistics Display
     */
    updateStatsDisplay() {
        this.statsTextSuccess.setText('✔ ' + this.localSuccess);
        this.statsTextError.setText('✖ ' + this.localErrors);
    }

    /**
     * Record Error
     */
    recordError() {
        this.localErrors++;
        this.updateStatsDisplay();
    }
}
