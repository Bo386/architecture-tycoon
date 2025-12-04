/**
 * ProcessingNode Class (Abstract)
 * 
 * Extends BaseNode to add capacity management and load visualization.
 * Base class for all processing nodes (App, Database, Cache, CDN, LoadBalancer).
 */

import { CONFIG, GameState } from '../config.js';
import { updateUI, checkGameEnd } from '../utils/uiManager.js';
import { BaseNode } from './BaseNode.js';

export class ProcessingNode extends BaseNode {
    constructor(scene, x, y, name, type, capacity, speed) {
        super(scene, x, y, name, type, capacity, speed);
    }

    /**
     * Create Type-Specific UI
     * Adds capacity bar and level badge
     */
    createTypeSpecificUI() {
        const w = this.bg.width || 80;
        const h = this.bg.height || 60;
        
        // Load bar background
        this.barBg = this.scene.add.rectangle(0, h/2 + 10, w, 6, 0x000000).setOrigin(0.5);
        
        // Load bar foreground
        this.barFg = this.scene.add.rectangle(-w/2, h/2 + 10, 0, 6, 0x00ff00).setOrigin(0, 0.5);
        
        // Capacity text
        this.capacityText = this.scene.add.text(0, h/2 + 20, '0/' + this.capacity, {
            fontSize: '10px',
            color: '#ffffff',
            fontFamily: 'Arial'
        }).setOrigin(0.5, 0);
        
        // Level badge
        this.levelText = this.scene.add.text(w/2 + 5, -h/2, 'Lv.1', { 
            fontSize: '10px', 
            color: '#ffd700', 
            fontStyle: 'bold' 
        }).setOrigin(0, 0.5);
        
        // Server capacity info (for app servers only)
        if (this.type === 'app') {
            this.serverInfoText = this.scene.add.text(w/2 + 10, 0, 
                `Capacity: ${this.capacity}\nSpeed: ${this.speed}ms`, 
                {
                    fontSize: '11px',
                    color: '#4fc1ff',
                    fontFamily: 'Courier New',
                    align: 'left'
                }
            ).setOrigin(0, 0.5);
            
            this.add([this.serverInfoText]);
        }
        
        this.add([this.barBg, this.barFg, this.capacityText, this.levelText]);
    }

    /**
     * Receive Packet
     * Handles capacity management and processing
     */
    receivePacket(packet) {
        if (GameState.isGameOver) { 
            packet.destroy(); 
            return; 
        }

        // Check capacity
        if (this.currentLoad >= this.capacity) {
            this.flashRed();
            this.dropPacket(packet);
            return;
        }

        // Accept packet
        this.currentLoad++;
        this.updateVisuals();
        this.startProcessing();

        // Process after delay
        this.scene.time.delayedCall(this.speed, () => {
            this.currentLoad--;
            this.stopProcessing();
            this.updateVisuals();
            this.routePacket(packet);
        });
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
        
        this.showFloatText('Timeout', '#ff0000');
    }

    /**
     * Update Visual Elements
     */
    updateVisuals() {
        const ratio = Math.min(this.currentLoad / this.capacity, 1);
        
        this.barFg.width = this.bg.width * ratio;
        this.barFg.fillColor = this.getLoadColor(ratio);
        
        this.capacityText.setText(this.currentLoad + '/' + this.capacity);
        
        if (ratio < 0.5) {
            this.capacityText.setColor('#00ff00');
        } else if (ratio < 0.9) {
            this.capacityText.setColor('#ffff00');
        } else {
            this.capacityText.setColor('#ff0000');
        }
        
        // Update server info display if exists (for app servers)
        this.updateServerInfo();
    }
    
    /**
     * Update Server Info Display
     * Updates the capacity and speed display on the right side of app servers
     */
    updateServerInfo() {
        if (this.type === 'app' && this.serverInfoText) {
            this.serverInfoText.setText(`Capacity: ${this.capacity}\nSpeed: ${this.speed}ms`);
        }
    }

    /**
     * Get Load Bar Color
     */
    getLoadColor(ratio) {
        if (ratio < 0.5) return 0x00ff00;
        if (ratio < 0.9) return 0xffff00;
        return 0xff0000;
    }
}
