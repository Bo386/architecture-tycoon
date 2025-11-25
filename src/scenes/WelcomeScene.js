/**
 * Welcome Scene
 * 
 * This is the initial welcome/splash screen shown when the game first loads.
 * It displays the game title and allows the player to start the first level.
 * 
 * Key responsibilities:
 * - Display game title and subtitle
 * - Show interactive "Start Challenge" button
 * - Hide the game UI elements (sidebar, control panel) until level starts
 * - Transition to Level1Scene when player clicks start
 */

export class WelcomeScene extends Phaser.Scene {
    /**
     * Constructor
     * 
     * Initializes the scene with a unique key identifier.
     * The key is used to reference this scene when starting/stopping it.
     */
    constructor() {
        super({ key: 'WelcomeScene' });
    }

    /**
     * Create Method
     * 
     * Called automatically by Phaser when the scene starts.
     * Sets up all visual elements and interactive components for the welcome screen.
     */
    create() {
        // Get the camera dimensions to center elements on screen
        const w = this.cameras.main.width;
        const h = this.cameras.main.height;
        
        /**
         * Main Title
         * Large, bold title text positioned in the upper third of the screen
         */
        this.add.text(w/2, h/3, 'Architecture Tycoon', { 
            fontSize: '48px', 
            color: '#4fc1ff',      // Cyan color matching the theme
            fontStyle: 'bold' 
        }).setOrigin(0.5);           // Center the text horizontally and vertically
        
        /**
         * Subtitle
         * Displays the first level name below the title
         */
        this.add.text(w/2, h/3 + 60, 'Level 1: Vertical Scaling', { 
            fontSize: '20px', 
            color: '#aaa'           // Light gray, less prominent than title
        }).setOrigin(0.5);
        
        /**
         * Start Button Background
         * Interactive rectangle that acts as the button background
         * useHandCursor: true shows the pointer cursor when hovering
         */
        const btn = this.add.rectangle(w/2, h/2 + 60, 200, 60, 0x0e639c)
            .setInteractive({ useHandCursor: true });
        
        /**
         * Start Button Text
         * Text label overlaid on the button background
         */
        this.add.text(w/2, h/2 + 60, 'Start Challenge', { 
            fontSize: '24px', 
            color: '#fff'           // White text for good contrast
        }).setOrigin(0.5);
        
        /**
         * Button Interactions
         * Set up hover effects and click handler
         */
        
        // Hover effect - lighten button color when mouse is over it
        btn.on('pointerover', () => btn.fillColor = 0x1177bb);
        
        // Unhover effect - restore original color when mouse leaves
        btn.on('pointerout', () => btn.fillColor = 0x0e639c);
        
        // Click handler - transition to Level 1 when button is clicked
        btn.on('pointerdown', () => this.scene.start('Level1Scene'));
        
        /**
         * Hide Game UI Elements
         * 
         * The HTML UI (sidebar and control panel) should not be visible
         * on the welcome screen. They'll be shown when the level starts.
         */
        const leftSidebar = document.getElementById('left-sidebar');
        const controlPanel = document.getElementById('control-panel');
        
        // Hide sidebar if it exists in the DOM
        if (leftSidebar) leftSidebar.style.display = 'none';
        
        // Hide control panel if it exists in the DOM
        if (controlPanel) controlPanel.style.display = 'none';
    }
}
