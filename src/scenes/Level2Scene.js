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

    skipLevel() {
        // Show a message that this level is not yet implemented
        const modal = document.getElementById('result-modal');
        const title = document.getElementById('modal-title');
        const body = document.getElementById('modal-body');
        const btnNext = document.getElementById('btn-modal-next');

        modal.style.display = 'block';
        modal.className = 'win-theme';

        title.innerText = "Level 2 - Coming Soon!";
        body.innerHTML = `
            <p>This level is still under development.</p>
            <p>Level 2 will feature <strong>Horizontal Scaling</strong> with Load Balancers and Server Clusters.</p>
            <p>Stay tuned for updates!</p>
        `;
        btnNext.style.display = 'none';
    }
}
