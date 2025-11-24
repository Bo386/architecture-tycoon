/**
 * ServerNode Class
 * Represents a server node in the architecture simulation
 */

import { CONFIG, GameState } from '../config.js';
import { updateUI, checkGameEnd } from '../utils/uiManager.js';
import { sendPacketAnim } from '../utils/animations.js';

export class ServerNode extends Phaser.GameObjects.Container {
    constructor(scene, x, y, name, type, capacity, speed) {
        super(scene, x, y);
        this.scene = scene;
        this.name = name;
        this.type = type; // 'user', 'app', 'database'
        this.level = 1;   // Initial level
        
        this.capacity = capacity; 
        this.speed = speed; // ms
        this.currentLoad = 0;
        
        this.localSuccess = 0;
        this.localErrors = 0;
        
        // Ensure node is active for packet routing
        this.setActive(true);
        
        this.createVisuals();
        scene.add.existing(this);
    }

    createVisuals() {
        const w = 80;
        const h = 60;
        
        // Background
        this.bg = this.scene.add.rectangle(0, 0, w, h, CONFIG.colors.node);
        this.bg.setStrokeStyle(2, CONFIG.colors.nodeBorder);
        
        // Name label
        this.textName = this.scene.add.text(0, -h/2 - 15, this.name, { 
            fontSize: '14px', 
            color: '#fff', 
            fontFamily: 'Arial' 
        }).setOrigin(0.5);
        
        // Load bar background
        this.barBg = this.scene.add.rectangle(0, h/2 + 10, w, 6, 0x000000).setOrigin(0.5);
        
        // Load bar foreground
        this.barFg = this.scene.add.rectangle(-w/2, h/2 + 10, 0, 6, 0x00ff00).setOrigin(0, 0.5);
        
        // Processing indicator
        this.processIndicator = this.scene.add.circle(0, 0, 6, 0xffffff, 1);
        this.processIndicator.setVisible(false);

        this.add([this.bg, this.textName, this.barBg, this.barFg, this.processIndicator]);

        // Type-specific UI elements
        if (this.type === 'user') {
            this.createUserStats();
        } else if (this.type === 'app' || this.type === 'database') {
            this.createServerStats();
        }
    }

    createUserStats() {
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

    createServerStats() {
        this.levelText = this.scene.add.text(this.bg.width/2 + 5, -this.bg.height/2, 'Lv.1', { 
            fontSize: '10px', 
            color: '#ffd700', 
            fontStyle: 'bold' 
        }).setOrigin(0, 0.5);
        
        this.add(this.levelText);
    }

    upgrade() {
        this.level++;
        this.capacity = Math.floor(this.capacity * 2.4); 
        this.speed = Math.max(50, this.speed * 0.5); 

        const newStrokeWidth = 2 + (this.level - 1) * 2;
        let newBorderColor = CONFIG.colors.nodeBorder;
        if (this.level === 2) newBorderColor = 0xbd00ff;
        if (this.level >= 3) newBorderColor = 0xffd700;

        this.bg.setStrokeStyle(newStrokeWidth, newBorderColor);
        
        if (this.levelText) {
            this.levelText.setText('Lv.' + this.level);
            this.levelText.setColor(this.level >= 3 ? '#ffd700' : '#bd00ff');
        }

        this.playUpgradeAnimation(newBorderColor);
        this.showFloatText('UPGRADE!', '#ffd700');
    }

    playUpgradeAnimation(color) {
        const aura = this.scene.add.circle(this.x, this.y, 40, color, 0.5);
        this.scene.tweens.add({
            targets: aura,
            scale: 2.5,
            alpha: 0,
            duration: 600,
            onComplete: () => aura.destroy()
        });
    }

    updateStatsDisplay() {
        if (this.type === 'user') {
            this.statsTextSuccess.setText('✔ ' + this.localSuccess);
            this.statsTextError.setText('✖ ' + this.localErrors);
        }
    }

    recordError() {
        if (this.type === 'user') {
            this.localErrors++;
            this.updateStatsDisplay();
        }
    }

    receivePacket(packet) {
        if (GameState.isGameOver) { 
            packet.destroy(); 
            return; 
        }

        // User receives response
        if (this.type === 'user' && packet.isResponse) {
            packet.destroy();
            GameState.success++;
            GameState.total++;
            this.localSuccess++;
            this.updateStatsDisplay();
            updateUI();
            checkGameEnd(this.scene);
            return;
        }

        // Check capacity
        if (this.currentLoad >= this.capacity) {
            this.flashRed();
            this.dropPacket(packet);
            return;
        }

        // Process packet
        this.currentLoad++;
        this.updateVisuals();
        
        this.startProcessing();

        this.scene.time.delayedCall(this.speed, () => {
            this.currentLoad--;
            this.stopProcessing();
            this.updateVisuals();
            this.routePacket(packet);
        });
    }

    startProcessing() {
        this.processIndicator.setVisible(true);
        this.scene.tweens.add({
            targets: this.processIndicator,
            alpha: 0.3,
            scale: 1.2,
            duration: 200,
            yoyo: true,
            repeat: -1
        });
    }

    stopProcessing() {
        this.processIndicator.setVisible(false);
        this.scene.tweens.killTweensOf(this.processIndicator);
    }

    routePacket(packet) {
        // Database processing complete - send response back to app
        if (this.type === 'database' && !packet.isResponse) {
            packet.isResponse = true;
            packet.setFillStyle(CONFIG.colors.packetRes);
            if (packet.appNode && packet.appNode.active) {
                sendPacketAnim(this.scene, packet, packet.appNode, this);
            } else {
                packet.destroy();
            }
        }
        // App receives response from database - forward to user
        else if (this.type === 'app' && packet.isResponse) {
            if (packet.sourceNode && packet.sourceNode.active) {
                sendPacketAnim(this.scene, packet, packet.sourceNode, this);
            } else {
                packet.destroy();
            }
        }
        // App receives request - check if database exists
        else if (this.type === 'app' && !packet.isResponse) {
            const database = GameState.nodes['Database'];
            console.log('App processing request. Database exists?', database ? 'YES' : 'NO');
            console.log('All nodes:', Object.keys(GameState.nodes));
            if (database) {
                // Level 2: Forward request to database
                console.log('Forwarding to database');
                packet.appNode = this; // Store app node reference for return path
                sendPacketAnim(this.scene, packet, database, this);
            } else {
                // Level 1: No database, send response directly
                console.log('No database, sending response back');
                packet.isResponse = true;
                packet.setFillStyle(CONFIG.colors.packetRes);
                if (packet.sourceNode && packet.sourceNode.active) {
                    sendPacketAnim(this.scene, packet, packet.sourceNode, this);
                } else {
                    packet.destroy();
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

    showFloatText(msg, color) {
        const txt = this.scene.add.text(this.x, this.y - 50, msg, { 
            fontSize: '14px', 
            color: color, 
            fontStyle: 'bold',
            stroke: '#000',
            strokeThickness: 2
        }).setOrigin(0.5);
        
        this.scene.tweens.add({ 
            targets: txt, 
            y: this.y - 80, 
            alpha: 0, 
            duration: 1000, 
            onComplete: () => txt.destroy() 
        });
    }

    flashRed() {
        this.scene.tweens.add({ 
            targets: this.bg, 
            strokeColor: 0xff0000, 
            duration: 100, 
            yoyo: true, 
            onComplete: () => {
                let color = CONFIG.colors.nodeBorder;
                if (this.level === 2) color = 0xbd00ff;
                if (this.level >= 3) color = 0xffd700;
                this.bg.setStrokeStyle(this.bg.lineWidth, color);
            } 
        });
    }

    updateVisuals() {
        const ratio = Math.min(this.currentLoad / this.capacity, 1);
        this.barFg.width = this.bg.width * ratio;
        this.barFg.fillColor = this.getLoadColor(ratio);
    }
    
    getLoadColor(ratio) {
        if (ratio < 0.5) return 0x00ff00;
        if (ratio < 0.9) return 0xffff00;
        return 0xff0000;
    }
}
