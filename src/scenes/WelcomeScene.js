/**
 * Welcome Scene
 * Initial welcome screen for the game
 */

export class WelcomeScene extends Phaser.Scene {
    constructor() {
        super({ key: 'WelcomeScene' });
    }

    create() {
        const w = this.cameras.main.width;
        const h = this.cameras.main.height;
        
        // Title
        this.add.text(w/2, h/3, 'Architecture Tycoon', { 
            fontSize: '48px', 
            color: '#4fc1ff', 
            fontStyle: 'bold' 
        }).setOrigin(0.5);
        
        // Subtitle
        this.add.text(w/2, h/3 + 60, 'Level 1: Vertical Scaling', { 
            fontSize: '20px', 
            color: '#aaa' 
        }).setOrigin(0.5);
        
        // Start button
        const btn = this.add.rectangle(w/2, h/2 + 60, 200, 60, 0x0e639c)
            .setInteractive({ useHandCursor: true });
        
        this.add.text(w/2, h/2 + 60, 'Start Challenge', { 
            fontSize: '24px', 
            color: '#fff' 
        }).setOrigin(0.5);
        
        // Button interactions
        btn.on('pointerover', () => btn.fillColor = 0x1177bb);
        btn.on('pointerout', () => btn.fillColor = 0x0e639c);
        btn.on('pointerdown', () => this.scene.start('Level1Scene'));
        
        // Hide game UI
        document.getElementById('game-ui').style.display = 'none';
    }
}
