/**
 * Level 2 Scene
 * Placeholder for next level featuring horizontal scaling
 */

export class Level2Scene extends Phaser.Scene {
    constructor() {
        super({ key: 'Level2Scene' });
    }

    create() {
        // Clean up Level 1 UI
        document.getElementById('game-ui').style.display = 'none';
        document.getElementById('result-modal').style.display = 'none';

        const w = this.cameras.main.width;
        const h = this.cameras.main.height;

        // Title
        this.add.text(w/2, h/3, 'Level 2: Coming Soon', { 
            fontSize: '40px', 
            color: '#4fc1ff', 
            fontStyle: 'bold' 
        }).setOrigin(0.5);
        
        // Description
        this.add.text(w/2, h/2, 'Next Level Theme: Horizontal Scaling', { 
            fontSize: '24px', 
            color: '#fff' 
        }).setOrigin(0.5);
        
        this.add.text(w/2, h/2 + 50, 'We will introduce Load Balancers (LB) and Clusters', { 
            fontSize: '18px', 
            color: '#aaa' 
        }).setOrigin(0.5);
    }
}
