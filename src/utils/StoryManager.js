/**
 * Story Manager
 * Manages story introduction overlays with multi-page text support
 * Uses DOM elements for true full-screen coverage (covers entire browser window)
 */

export class StoryManager {
    constructor(scene) {
        this.scene = scene;
        this.overlayElement = null;
        this.containerElement = null;
        this.textElement = null;
        this.buttonElement = null;
        this.currentPage = 0;
        this.pages = [];
        this.onComplete = null;
        this.isActive = false;
    }

    /**
     * Show story introduction with multiple pages
     * @param {Array<string>} pages - Array of story text for each page
     * @param {Function} onComplete - Callback when story is completed
     */
    show(pages, onComplete) {
        if (this.isActive) return;

        this.pages = pages;
        this.currentPage = 0;
        this.onComplete = onComplete;
        this.isActive = true;

        this.createOverlay();
        this.showCurrentPage();
    }

    createOverlay() {
        // Create full-screen overlay div
        this.overlayElement = document.createElement('div');
        this.overlayElement.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background-color: rgba(0, 0, 0, 0.85);
            z-index: 10000;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            opacity: 0;
            transition: opacity 0.5s ease;
        `;

        // Create text container
        this.textElement = document.createElement('div');
        this.textElement.style.cssText = `
            color: #FFFFFF;
            font-size: 24px;
            font-family: Arial, sans-serif;
            text-align: center;
            max-width: 80%;
            line-height: 1.6;
            white-space: pre-line;
            opacity: 0;
            transition: opacity 0.5s ease;
        `;

        // Create next button
        this.buttonElement = document.createElement('button');
        this.buttonElement.style.cssText = `
            position: fixed;
            bottom: 60px;
            right: 80px;
            width: 120px;
            height: 50px;
            background-color: #4CAF50;
            color: white;
            border: none;
            border-radius: 5px;
            font-size: 32px;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            justify-content: center;
        `;
        this.buttonElement.innerHTML = '→';

        // Button hover effects
        this.buttonElement.addEventListener('mouseenter', () => {
            this.buttonElement.style.backgroundColor = '#66BB6A';
            this.buttonElement.style.transform = 'translateX(5px)';
        });

        this.buttonElement.addEventListener('mouseleave', () => {
            this.buttonElement.style.backgroundColor = '#4CAF50';
            this.buttonElement.style.transform = 'translateX(0)';
        });

        // Button click handler
        this.buttonElement.addEventListener('click', () => {
            this.nextPage();
        });

        // Append elements to overlay
        this.overlayElement.appendChild(this.textElement);
        this.overlayElement.appendChild(this.buttonElement);

        // Append overlay to document body
        document.body.appendChild(this.overlayElement);

        // Trigger fade in
        setTimeout(() => {
            this.overlayElement.style.opacity = '1';
        }, 10);
    }

    showCurrentPage() {
        if (this.currentPage >= this.pages.length) {
            this.complete();
            return;
        }

        const pageText = this.pages[this.currentPage];
        
        // Fade out text
        this.textElement.style.opacity = '0';

        // After fade out, update text and fade in
        setTimeout(() => {
            this.textElement.textContent = pageText;
            this.textElement.style.opacity = '1';
        }, 300);

        // Update button text for last page
        if (this.currentPage === this.pages.length - 1) {
            this.buttonElement.innerHTML = '✓';
        } else {
            this.buttonElement.innerHTML = '→';
        }
    }

    nextPage() {
        this.currentPage++;
        this.showCurrentPage();
    }

    complete() {
        this.isActive = false;

        // Fade out overlay
        this.overlayElement.style.opacity = '0';

        // Remove from DOM after animation
        setTimeout(() => {
            if (this.overlayElement && this.overlayElement.parentNode) {
                this.overlayElement.parentNode.removeChild(this.overlayElement);
            }

            this.overlayElement = null;
            this.textElement = null;
            this.buttonElement = null;

            // Call completion callback
            if (this.onComplete) {
                this.onComplete();
            }
        }, 500);
    }

    destroy() {
        if (this.overlayElement && this.overlayElement.parentNode) {
            this.overlayElement.parentNode.removeChild(this.overlayElement);
        }

        this.overlayElement = null;
        this.textElement = null;
        this.buttonElement = null;
        this.isActive = false;
    }
}
