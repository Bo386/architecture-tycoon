/**
 * BaseNode Class (Abstract)
 * 
 * Base class for all node types in the architecture simulation.
 * Provides common functionality:
 * - Visual management (shapes, colors, text, animations)
 * - Dragging functionality
 * - Upgrade system
 * - Visual effects (flash, float text)
 * - Abstract methods for type-specific behavior
 */

import { CONFIG, GameState } from '../config.js';
import { updateUI } from '../utils/uiManager.js';

export class BaseNode extends Phaser.GameObjects.Container {
    constructor(scene, x, y, name, type, capacity, speed) {
        super(scene, x, y);
        
        this.scene = scene;
        this.name = name;
        this.type = type;
        this.level = 1;
        
        this.capacity = capacity;
        this.speed = speed;
        this.baseSpeed = speed;
        this.currentLoad = 0;
        
        this.setActive(true);
        this.createVisuals();
        scene.add.existing(this);
    }

    /**
     * Create Visual Elements
     * Template method - calls createShape() which subclasses override
     */
    createVisuals() {
        const w = 80;
        const h = 60;
        
        // Create shape (subclass-specific)
        this.createShape(w, h);
        
        // Name label
        this.textName = this.scene.add.text(0, -h/2 - 15, this.name, { 
            fontSize: '14px', 
            color: '#fff', 
            fontFamily: 'Arial' 
        }).setOrigin(0.5);
        
        // Processing indicator
        this.processIndicator = this.scene.add.circle(0, 0, 6, 0xffffff, 1);
        this.processIndicator.setVisible(false);
        
        // Add common elements
        this.add([this.bg, this.textName, this.processIndicator]);
        
        // Create type-specific UI
        this.createTypeSpecificUI();
        
        this.setupDragging();
    }

    /**
     * Abstract method - subclasses must implement
     */
    createShape(w, h) {
        throw new Error('createShape() must be implemented by subclass');
    }

    /**
     * Abstract method - subclasses must implement
     */
    createTypeSpecificUI() {
        // Default: no additional UI
    }

    /**
     * Abstract method - subclasses must implement
     */
    routePacket(packet) {
        throw new Error('routePacket() must be implemented by subclass');
    }

    /**
     * Setup Dragging Functionality
     */
    setupDragging() {
        this.originalX = this.x;
        this.originalY = this.y;
        
        const hitAreaSize = 100;
        const hitArea = new Phaser.Geom.Circle(0, 0, hitAreaSize / 2);
        
        this.setInteractive(hitArea, Phaser.Geom.Circle.Contains);
        this.scene.input.setDraggable(this);
        
        this.on('pointerover', () => {
            if (!GameState.isRunning) {
                this.scene.input.setDefaultCursor('pointer');
            }
        });
        
        this.on('pointerout', () => {
            this.scene.input.setDefaultCursor('default');
        });
        
        this.on('dragstart', () => {
            if (!GameState.isRunning) {
                this.setAlpha(0.7);
                this.setDepth(1000);
            }
        });
        
        this.on('drag', (pointer, dragX, dragY) => {
            if (!GameState.isRunning) {
                this.x = dragX;
                this.y = dragY;
            }
        });
        
        this.on('dragend', () => {
            if (!GameState.isRunning) {
                this.setAlpha(1);
                this.setDepth(0);
            }
        });
    }

    /**
     * Upgrade Node
     */
    upgrade() {
        // Check if capacity has reached maximum (if maxCapacity is set)
        if (this.maxCapacity && this.capacity >= this.maxCapacity) {
            this.showFloatText('Max Capacity!', '#ff6600');
            return false; // Upgrade failed
        }
        
        this.level++;
        const newCapacity = Math.floor(this.capacity * 2.4);
        
        // Apply max capacity limit if set
        if (this.maxCapacity) {
            this.capacity = Math.min(newCapacity, this.maxCapacity);
        } else {
            this.capacity = newCapacity;
        }
        
        this.speed = Math.max(50, this.speed * 0.5);

        const newStrokeWidth = 2 + (this.level - 1) * 2;
        let newBorderColor = CONFIG.colors.nodeBorder;
        if (this.level === 2) newBorderColor = 0xbd00ff;
        if (this.level >= 3) newBorderColor = 0xffd700;

        if (this.bg.isGraphics) {
            this.redrawShape(newBorderColor, newStrokeWidth);
        } else {
            this.bg.setStrokeStyle(newStrokeWidth, newBorderColor);
        }
        
        if (this.levelText) {
            this.levelText.setText('Lv.' + this.level);
            this.levelText.setColor(this.level >= 3 ? '#ffd700' : '#bd00ff');
        }
        
        // Update server info display if it exists (for ProcessingNode subclasses)
        if (typeof this.updateServerInfo === 'function') {
            this.updateServerInfo();
        }

        this.playUpgradeAnimation(newBorderColor);
        this.showFloatText('UPGRADE!', '#ffd700');
        
        return true; // Upgrade successful
    }

    /**
     * Redraw Shape (for Graphics objects)
     */
    redrawShape(borderColor, strokeWidth) {
        // Subclasses with Graphics shapes override this
    }

    /**
     * Play Upgrade Animation
     */
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

    /**
     * Show Floating Text
     */
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

    /**
     * Flash Red Effect
     */
    flashRed() {
        if (this.bg.isGraphics) {
            const strokeWidth = 2 + (this.level - 1) * 2;
            this.redrawShape(0xff0000, strokeWidth);
            
            this.scene.time.delayedCall(100, () => {
                let color = CONFIG.colors.nodeBorder;
                if (this.level === 2) color = 0xbd00ff;
                if (this.level >= 3) color = 0xffd700;
                this.redrawShape(color, strokeWidth);
            });
        } else {
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
    }

    /**
     * Start Processing Visual Indicator
     */
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

    /**
     * Stop Processing Visual Indicator
     */
    stopProcessing() {
        this.processIndicator.setVisible(false);
        this.scene.tweens.killTweensOf(this.processIndicator);
    }

    /**
     * Helper: Draw Cylinder Shape
     */
    drawCylinder(graphics, x, y, w, h, borderColor, strokeWidth) {
        const topHeight = h * 0.15;
        
        graphics.fillStyle(CONFIG.colors.node, 1);
        graphics.lineStyle(strokeWidth || 2, borderColor || CONFIG.colors.nodeBorder);
        
        graphics.fillRect(x - w/2, y - h/2 + topHeight, w, h - topHeight * 2);
        graphics.strokeRect(x - w/2, y - h/2 + topHeight, w, h - topHeight * 2);
        
        graphics.fillEllipse(x, y + h/2 - topHeight, w/2, topHeight);
        graphics.strokeEllipse(x, y + h/2 - topHeight, w/2, topHeight);
        
        graphics.fillEllipse(x, y - h/2 + topHeight, w/2, topHeight);
        graphics.strokeEllipse(x, y - h/2 + topHeight, w/2, topHeight);
    }

    /**
     * Helper: Draw Diamond Shape
     */
    drawDiamond(graphics, x, y, w, h, borderColor, strokeWidth) {
        graphics.fillStyle(CONFIG.colors.node, 1);
        graphics.lineStyle(strokeWidth || 2, borderColor || CONFIG.colors.nodeBorder);
        
        graphics.beginPath();
        graphics.moveTo(x, y - h/2);
        graphics.lineTo(x + w/2, y);
        graphics.lineTo(x, y + h/2);
        graphics.lineTo(x - w/2, y);
        graphics.closePath();
        
        graphics.fillPath();
        graphics.strokePath();
    }

    /**
     * Helper: Draw Hexagon Shape
     */
    drawHexagon(graphics, x, y, radius, borderColor, strokeWidth) {
        graphics.fillStyle(CONFIG.colors.node, 1);
        graphics.lineStyle(strokeWidth || 2, borderColor || CONFIG.colors.nodeBorder);
        
        graphics.beginPath();
        
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 3) * i - Math.PI / 2;
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
     * Helper: Draw Star Shape
     */
    drawStar(graphics, x, y, points, outerRadius, innerRadius, borderColor, strokeWidth) {
        graphics.fillStyle(CONFIG.colors.node, 1);
        graphics.lineStyle(strokeWidth || 2, borderColor || CONFIG.colors.nodeBorder);
        
        graphics.beginPath();
        
        for (let i = 0; i < points * 2; i++) {
            const angle = (Math.PI / points) * i - Math.PI / 2;
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
}
