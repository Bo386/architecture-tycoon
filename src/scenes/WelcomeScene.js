/**
 * Welcome Scene
 * 
 * Beautiful welcome screen with modern design.
 * Shows game title, tagline, and start button.
 * No header elements are displayed on this screen.
 */

export class WelcomeScene extends Phaser.Scene {
    constructor() {
        super({ key: 'WelcomeScene' });
    }

    create() {
        const w = this.cameras.main.width;
        const h = this.cameras.main.height;
        
        // Make main-content fullscreen
        const mainContent = document.getElementById('main-content');
        if (mainContent) {
            mainContent.style.position = 'fixed';
            mainContent.style.top = '0';
            mainContent.style.left = '0';
            mainContent.style.width = '100vw';
            mainContent.style.height = '100vh';
            mainContent.style.zIndex = '1000';
        }
        
        // Hide all header UI elements
        this.hideHeader();
        
        // Hide game UI elements
        const leftSidebar = document.getElementById('left-sidebar');
        const controlPanel = document.getElementById('control-panel');
        
        if (leftSidebar) leftSidebar.style.display = 'none';
        if (controlPanel) controlPanel.style.display = 'none';
        
        // Dark background
        this.add.rectangle(0, 0, w, h, 0x0f0f1e).setOrigin(0);
        
        // Decorative background pattern
        this.createBackgroundPattern();
        
        // Main title with glow effect
        const title = this.add.text(w/2, h * 0.35, 'Architecture Tycoon', { 
            fontSize: '64px', 
            color: '#4fc1ff',
            fontStyle: 'bold',
            fontFamily: 'Arial'
        }).setOrigin(0.5);
        
        // Add subtle shadow effect
        title.setShadow(0, 0, '#1a8acc', 20, true, true);
        
        // Tagline
        this.add.text(w/2, h * 0.35 + 70, 'Master the Art of System Design', { 
            fontSize: '24px', 
            color: '#aaaaaa',
            fontFamily: 'Arial',
            fontStyle: 'italic'
        }).setOrigin(0.5);
        
        // Feature highlights
        const features = [
            '🏗️  Build scalable architectures',
            '⚡  Optimize performance',
            '🎯  Complete challenges'
        ];
        
        features.forEach((feature, index) => {
            this.add.text(w/2, h * 0.55 + (index * 35), feature, { 
                fontSize: '18px', 
                color: '#888888',
                fontFamily: 'Arial'
            }).setOrigin(0.5);
        });
        
        // Start button with modern design
        this.createStartButton(w/2, h * 0.75);
        
        // Skip button in top-right corner
        this.createSkipButton(w - 100, 40);
        
        // Version/credits at bottom
        this.add.text(w/2, h - 30, 'v1.0 | Learn System Design Through Play', { 
            fontSize: '14px', 
            color: '#555555',
            fontFamily: 'Arial'
        }).setOrigin(0.5);
    }
    
    createBackgroundPattern() {
        const w = this.cameras.main.width;
        const h = this.cameras.main.height;
        
        // Create subtle grid pattern
        const graphics = this.add.graphics();
        graphics.lineStyle(1, 0x1a1a2e, 0.3);
        
        const gridSize = 50;
        for (let x = 0; x < w; x += gridSize) {
            graphics.lineBetween(x, 0, x, h);
        }
        for (let y = 0; y < h; y += gridSize) {
            graphics.lineBetween(0, y, w, y);
        }
        
        // Add some decorative circles
        graphics.lineStyle(2, 0x4fc1ff, 0.1);
        graphics.strokeCircle(w * 0.2, h * 0.3, 100);
        graphics.strokeCircle(w * 0.8, h * 0.7, 150);
        graphics.strokeCircle(w * 0.9, h * 0.2, 80);
    }
    
    createStartButton(x, y) {
        const buttonWidth = 280;
        const buttonHeight = 70;
        
        // Button background with gradient-like effect
        const btnBg = this.add.rectangle(x, y, buttonWidth, buttonHeight, 0x0e639c)
            .setInteractive({ useHandCursor: true });
        
        // Button border for depth
        const btnBorder = this.add.rectangle(x, y, buttonWidth + 4, buttonHeight + 4)
            .setStrokeStyle(2, 0x4fc1ff, 0.5);
        btnBorder.setDepth(-1);
        
        // Button text
        const btnText = this.add.text(x, y, 'Start Your Journey', { 
            fontSize: '28px', 
            color: '#ffffff',
            fontStyle: 'bold',
            fontFamily: 'Arial'
        }).setOrigin(0.5);
        
        // Hover effects
        btnBg.on('pointerover', () => {
            btnBg.fillColor = 0x1177bb;
            btnBorder.setStrokeStyle(3, 0x6fd9ff, 1);
            btnText.setScale(1.05);
        });
        
        btnBg.on('pointerout', () => {
            btnBg.fillColor = 0x0e639c;
            btnBorder.setStrokeStyle(2, 0x4fc1ff, 0.5);
            btnText.setScale(1);
        });
        
        // Click handler - go to chapter selection
        btnBg.on('pointerdown', () => {
            // Add a slight animation before transition
            this.tweens.add({
                targets: btnBg,
                scaleX: 0.95,
                scaleY: 0.95,
                duration: 100,
                yoyo: true,
                onComplete: () => {
                    this.scene.start('ChapterSelectScene');
                }
            });
        });
    }
    
    createSkipButton(x, y) {
        const buttonWidth = 120;
        const buttonHeight = 45;
        
        // Button background - subtle design
        const btnBg = this.add.rectangle(x, y, buttonWidth, buttonHeight, 0x1a1a2e, 0.7)
            .setInteractive({ useHandCursor: true });
        
        // Button border
        const btnBorder = this.add.rectangle(x, y, buttonWidth + 2, buttonHeight + 2)
            .setStrokeStyle(1, 0x4fc1ff, 0.3);
        btnBorder.setDepth(-1);
        
        // Button text
        const btnText = this.add.text(x, y, 'Skip ⏭', { 
            fontSize: '18px', 
            color: '#888888',
            fontFamily: 'Arial'
        }).setOrigin(0.5);
        
        // Hover effects
        btnBg.on('pointerover', () => {
            btnBg.fillColor = 0x2a2a3e;
            btnBg.fillAlpha = 0.9;
            btnBorder.setStrokeStyle(2, 0x6fd9ff, 0.8);
            btnText.setColor('#ffffff');
        });
        
        btnBg.on('pointerout', () => {
            btnBg.fillColor = 0x1a1a2e;
            btnBg.fillAlpha = 0.7;
            btnBorder.setStrokeStyle(1, 0x4fc1ff, 0.3);
            btnText.setColor('#888888');
        });
        
        // Click handler - skip directly to chapter selection
        btnBg.on('pointerdown', () => {
            this.scene.start('ChapterSelectScene');
        });
    }
    
    hideHeader() {
        // Hide the header bar completely
        const header = document.getElementById('header');
        const levelSelector = document.getElementById('level-selector');
        const legend = document.querySelector('.legend-box');
        
        if (header) header.style.display = 'none';
        if (levelSelector) levelSelector.style.display = 'none';
        if (legend) legend.style.display = 'none';
    }
}
