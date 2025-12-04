/**
 * Story Manager with Interactive Spotlight
 * Manages story introduction overlays with multi-page text support and spotlight highlights
 * Uses DOM elements for true full-screen coverage
 */

export class StoryManager {
    constructor(scene) {
        this.scene = scene;
        this.overlayElement = null;
        this.spotlightCanvas = null;
        this.spotlightCtx = null;
        this.textElement = null;
        this.buttonElement = null;
        this.currentPage = 0;
        this.pages = [];
        this.onComplete = null;
        this.isActive = false;
        this.currentSpotlight = null;
        this.spotlightRadius = 80;
    }

    /**
     * Show story introduction with multiple pages
     * @param {Array<Object>} pages - Array of page objects with text and optional spotlight
     *   Example: { text: "...", spotlight: { x: 100, y: 200, radius: 80 } }
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
        // Create full-screen overlay container
        this.overlayElement = document.createElement('div');
        this.overlayElement.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            z-index: 10000;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            opacity: 0;
            transition: opacity 0.5s ease;
        `;

        // Create canvas for spotlight effect
        this.spotlightCanvas = document.createElement('canvas');
        this.spotlightCanvas.width = window.innerWidth;
        this.spotlightCanvas.height = window.innerHeight;
        this.spotlightCanvas.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
        `;
        this.spotlightCtx = this.spotlightCanvas.getContext('2d');

        // Create text container
        this.textElement = document.createElement('div');
        this.textElement.style.cssText = `
            color: #FFFFFF;
            font-size: 24px;
            font-family: Arial, sans-serif;
            text-align: center;
            max-width: 600px;
            line-height: 1.8;
            white-space: pre-line;
            opacity: 0;
            transition: opacity 0.5s ease;
            z-index: 1;
            padding: 20px;
            background-color: rgba(0, 0, 0, 0.6);
            border-radius: 10px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
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
            border-radius: 8px;
            font-size: 32px;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
        `;
        this.buttonElement.innerHTML = '→';

        // Button hover effects
        this.buttonElement.addEventListener('mouseenter', () => {
            this.buttonElement.style.backgroundColor = '#66BB6A';
            this.buttonElement.style.transform = 'translateX(5px) scale(1.05)';
        });

        this.buttonElement.addEventListener('mouseleave', () => {
            this.buttonElement.style.backgroundColor = '#4CAF50';
            this.buttonElement.style.transform = 'translateX(0) scale(1)';
        });

        // Button click handler
        this.buttonElement.addEventListener('click', () => {
            this.nextPage();
        });

        // Create skip button
        this.skipButtonElement = document.createElement('button');
        this.skipButtonElement.style.cssText = `
            position: fixed;
            top: 30px;
            right: 30px;
            padding: 10px 20px;
            background-color: rgba(255, 255, 255, 0.1);
            color: #FFFFFF;
            border: 1px solid rgba(255, 255, 255, 0.3);
            border-radius: 6px;
            font-size: 16px;
            font-family: Arial, sans-serif;
            cursor: pointer;
            transition: all 0.3s ease;
            z-index: 1;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        `;
        this.skipButtonElement.textContent = 'Skip ⏭';

        // Skip button hover effects
        this.skipButtonElement.addEventListener('mouseenter', () => {
            this.skipButtonElement.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
            this.skipButtonElement.style.borderColor = 'rgba(255, 255, 255, 0.6)';
            this.skipButtonElement.style.transform = 'scale(1.05)';
        });

        this.skipButtonElement.addEventListener('mouseleave', () => {
            this.skipButtonElement.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
            this.skipButtonElement.style.borderColor = 'rgba(255, 255, 255, 0.3)';
            this.skipButtonElement.style.transform = 'scale(1)';
        });

        // Skip button click handler
        this.skipButtonElement.addEventListener('click', () => {
            this.skipStory();
        });

        // Append elements to overlay
        this.overlayElement.appendChild(this.spotlightCanvas);
        this.overlayElement.appendChild(this.textElement);
        this.overlayElement.appendChild(this.buttonElement);
        this.overlayElement.appendChild(this.skipButtonElement);

        // Append overlay to document body
        document.body.appendChild(this.overlayElement);

        // Trigger fade in
        setTimeout(() => {
            this.overlayElement.style.opacity = '1';
        }, 10);
    }

    drawSpotlight(x, y, radius) {
        const canvas = this.spotlightCanvas;
        const ctx = this.spotlightCtx;

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw dark overlay with spotlight hole
        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Create spotlight (clear circle)
        ctx.globalCompositeOperation = 'destination-out';
        
        // Draw main spotlight circle
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 1)';
        ctx.fill();

        // Draw glow effect
        const gradient = ctx.createRadialGradient(x, y, radius, x, y, radius + 30);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, radius + 30, 0, Math.PI * 2);
        ctx.fill();

        // Reset composite operation
        ctx.globalCompositeOperation = 'source-over';

        // Draw pulsing ring around spotlight
        ctx.strokeStyle = 'rgba(76, 175, 80, 0.6)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(x, y, radius + 5, 0, Math.PI * 2);
        ctx.stroke();
    }

    animateSpotlight(fromX, fromY, toX, toY, radius, duration = 800) {
        const startTime = Date.now();
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing function (ease-in-out)
            const eased = progress < 0.5
                ? 2 * progress * progress
                : 1 - Math.pow(-2 * progress + 2, 2) / 2;
            
            const currentX = fromX + (toX - fromX) * eased;
            const currentY = fromY + (toY - fromY) * eased;
            
            this.drawSpotlight(currentX, currentY, radius);
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        
        animate();
    }

    showCurrentPage() {
        if (this.currentPage >= this.pages.length) {
            this.complete();
            return;
        }

        const page = this.pages[this.currentPage];
        const pageText = typeof page === 'string' ? page : page.text;
        const spotlight = typeof page === 'object' ? page.spotlight : null;

        // Fade out text
        this.textElement.style.opacity = '0';

        // After fade out, update text and spotlight
        setTimeout(() => {
            this.textElement.textContent = pageText;
            this.textElement.style.opacity = '1';

            // Handle spotlight
            if (spotlight) {
                const newSpotlight = {
                    x: spotlight.x || window.innerWidth / 2,
                    y: spotlight.y || window.innerHeight / 2,
                    radius: spotlight.radius || this.spotlightRadius
                };

                if (this.currentSpotlight) {
                    // Animate from old spotlight to new
                    this.animateSpotlight(
                        this.currentSpotlight.x,
                        this.currentSpotlight.y,
                        newSpotlight.x,
                        newSpotlight.y,
                        newSpotlight.radius
                    );
                } else {
                    // Draw new spotlight
                    this.drawSpotlight(newSpotlight.x, newSpotlight.y, newSpotlight.radius);
                }

                this.currentSpotlight = newSpotlight;
            } else {
                // No spotlight, just show dark overlay
                const ctx = this.spotlightCtx;
                ctx.clearRect(0, 0, this.spotlightCanvas.width, this.spotlightCanvas.height);
                ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
                ctx.fillRect(0, 0, this.spotlightCanvas.width, this.spotlightCanvas.height);
                this.currentSpotlight = null;
            }
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

    skipStory() {
        // Skip all pages and go directly to completion
        this.currentPage = this.pages.length;
        this.complete();
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
            this.spotlightCanvas = null;
            this.spotlightCtx = null;
            this.textElement = null;
            this.buttonElement = null;
            this.skipButtonElement = null;
            this.currentSpotlight = null;

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
        this.spotlightCanvas = null;
        this.spotlightCtx = null;
        this.textElement = null;
        this.buttonElement = null;
        this.skipButtonElement = null;
        this.currentSpotlight = null;
        this.isActive = false;
    }
}
