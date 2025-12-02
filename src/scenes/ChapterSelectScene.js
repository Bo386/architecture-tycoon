/**
 * Chapter Select Scene
 * 
 * Displays available chapters for the player to choose from.
 * Shows 6 chapters in a card grid layout, with only Chapter 1 currently unlocked.
 */

export class ChapterSelectScene extends Phaser.Scene {
    constructor() {
        super({ key: 'ChapterSelectScene' });
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
        
        // Hide header elements
        this.hideHeader();
        
        // Hide game UI
        const leftSidebar = document.getElementById('left-sidebar');
        const controlPanel = document.getElementById('control-panel');
        
        if (leftSidebar) leftSidebar.style.display = 'none';
        if (controlPanel) controlPanel.style.display = 'none';
        
        // Background
        this.add.rectangle(0, 0, w, h, 0x1a1a2e).setOrigin(0);
        
        // Title
        this.add.text(w/2, 80, 'Select Chapter', { 
            fontSize: '42px', 
            color: '#4fc1ff',
            fontStyle: 'bold',
            fontFamily: 'Arial'
        }).setOrigin(0.5);
        
        // Subtitle
        this.add.text(w/2, 130, 'Master System Design Concepts', { 
            fontSize: '18px', 
            color: '#888888',
            fontFamily: 'Arial'
        }).setOrigin(0.5);
        
        // Chapter data
        const chapters = [
            {
                number: 1,
                title: 'Chapter 1',
                subtitle: 'System Design Fundamentals',
                levelCount: '9 Levels',
                isUnlocked: true,
                onClick: () => this.scene.start('Level1Scene')
            },
            {
                number: 2,
                title: 'Chapter 2',
                subtitle: 'Advanced Patterns',
                levelCount: 'Coming Soon',
                isUnlocked: false
            },
            {
                number: 3,
                title: 'Chapter 3',
                subtitle: 'Microservices',
                levelCount: 'Coming Soon',
                isUnlocked: false
            },
            {
                number: 4,
                title: 'Chapter 4',
                subtitle: 'Cloud Architecture',
                levelCount: 'Coming Soon',
                isUnlocked: false
            },
            {
                number: 5,
                title: 'Chapter 5',
                subtitle: 'Performance Optimization',
                levelCount: 'Coming Soon',
                isUnlocked: false
            },
            {
                number: 6,
                title: 'Chapter 6',
                subtitle: 'Reliability & Resilience',
                levelCount: 'Coming Soon',
                isUnlocked: false
            }
        ];
        
        // Calculate grid layout (3 columns x 2 rows)
        const cols = 3;
        const rows = 2;
        const cardWidth = 300;
        const cardHeight = 200;
        const spacing = 40;
        
        const totalWidth = (cardWidth * cols) + (spacing * (cols - 1));
        const totalHeight = (cardHeight * rows) + (spacing * (rows - 1));
        const startX = (w - totalWidth) / 2 + cardWidth / 2;
        const startY = 200;
        
        // Create chapter cards in grid
        chapters.forEach((chapter, index) => {
            const col = index % cols;
            const row = Math.floor(index / cols);
            const x = startX + (col * (cardWidth + spacing));
            const y = startY + (row * (cardHeight + spacing));
            
            this.createChapterCard(
                x, y,
                chapter.title,
                chapter.subtitle,
                chapter.levelCount,
                chapter.isUnlocked,
                chapter.onClick
            );
        });
        
        // Back button
        this.createBackButton();
    }
    
    createChapterCard(x, y, title, subtitle, levelCount, isUnlocked, onClick) {
        const cardWidth = 300;
        const cardHeight = 200;
        
        // Card background
        const bgColor = isUnlocked ? 0x2a2a40 : 0x1a1a25;
        const card = this.add.rectangle(x, y, cardWidth, cardHeight, bgColor);
        
        if (isUnlocked) {
            card.setInteractive({ useHandCursor: true })
                .setStrokeStyle(2, 0x4fc1ff);
        } else {
            card.setStrokeStyle(2, 0x333333);
        }
        
        // Lock icon for locked chapters
        if (!isUnlocked) {
            this.add.text(x, y - 60, '🔒', { 
                fontSize: '36px'
            }).setOrigin(0.5);
        }
        
        // Chapter title
        const titleColor = isUnlocked ? '#ffffff' : '#555555';
        this.add.text(x, y - 30, title, { 
            fontSize: '28px', 
            color: titleColor,
            fontStyle: 'bold',
            fontFamily: 'Arial'
        }).setOrigin(0.5);
        
        // Chapter subtitle
        const subtitleColor = isUnlocked ? '#aaaaaa' : '#444444';
        this.add.text(x, y + 10, subtitle, { 
            fontSize: '16px', 
            color: subtitleColor,
            fontFamily: 'Arial'
        }).setOrigin(0.5);
        
        // Level count
        const levelCountColor = isUnlocked ? '#4fc1ff' : '#333333';
        this.add.text(x, y + 45, levelCount, { 
            fontSize: '14px', 
            color: levelCountColor,
            fontFamily: 'Arial'
        }).setOrigin(0.5);
        
        if (isUnlocked) {
            // Play button
            const playBtn = this.add.rectangle(x, y + 80, 120, 40, 0x0e639c)
                .setInteractive({ useHandCursor: true });
            
            this.add.text(x, y + 80, 'Start', { 
                fontSize: '18px', 
                color: '#ffffff',
                fontFamily: 'Arial'
            }).setOrigin(0.5);
            
            // Hover effects
            card.on('pointerover', () => {
                card.setStrokeStyle(3, 0x6fd9ff);
            });
            
            card.on('pointerout', () => {
                card.setStrokeStyle(2, 0x4fc1ff);
            });
            
            playBtn.on('pointerover', () => playBtn.fillColor = 0x1177bb);
            playBtn.on('pointerout', () => playBtn.fillColor = 0x0e639c);
            
            // Click handlers
            card.on('pointerdown', onClick);
            playBtn.on('pointerdown', onClick);
        }
    }
    
    createBackButton() {
        const w = this.cameras.main.width;
        const h = this.cameras.main.height;
        
        const backBtn = this.add.text(50, h - 50, '← Back to Home', { 
            fontSize: '18px', 
            color: '#888888',
            fontFamily: 'Arial'
        }).setInteractive({ useHandCursor: true });
        
        backBtn.on('pointerover', () => backBtn.setColor('#ffffff'));
        backBtn.on('pointerout', () => backBtn.setColor('#888888'));
        backBtn.on('pointerdown', () => this.scene.start('WelcomeScene'));
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
