/**
 * UI Manager Module
 * 
 * Manages all updates to the HTML user interface based on game state changes.
 * This module bridges the gap between the Phaser game engine and the DOM UI,
 * keeping all displayed statistics, button states, and modal dialogs synchronized
 * with the current game state.
 * 
 * Key responsibilities:
 * - Update statistics display (money, requests, errors, error rate)
 * - Manage button states (enable/disable based on game state)
 * - Show/hide result modals with level completion information
 * - Check win/lose conditions and trigger game end
 */

import { CONFIG, GameState } from '../config.js';

/**
 * Update All UI Elements
 * 
 * Main UI update function that refreshes all HTML elements to reflect
 * the current game state. Called frequently throughout the game
 * (after each request, upgrade, state change, etc.)
 * 
 * Updates:
 * - Money/budget display
 * - Request statistics (total, success, errors)
 * - Progress label (adjusts target based on current level)
 * - Error rate percentage
 * - System load indicator
 * - Upgrade button availability
 * - Start button state
 */
export function updateUI() {
    // Update budget display
    document.getElementById('ui-money').innerText = GameState.money;
    
    /**
     * Update progress display with level-specific target
     * Level 1 requires 1000 requests, Level 2 requires 300
     */
    const target = GameState.currentLevel === 2 ? CONFIG.level2Target : CONFIG.targetTotal;
    const statTotalEl = document.getElementById('stat-total');
    if (statTotalEl) {
        statTotalEl.innerText = GameState.total;
    }
    
    /**
     * Update progress label to show the correct target
     * This changes the "Progress (1000):" text based on current level
     */
    const progressLabel = document.querySelector('.stat-item .stat-label');
    if (progressLabel && progressLabel.textContent.includes('Progress')) {
        progressLabel.textContent = `Progress (${target}):`;
    }
    
    // Update success count (green text)
    document.getElementById('stat-success').innerText = GameState.success;
    
    // Update error count (red text)
    document.getElementById('stat-errors').innerText = GameState.errors;

    // Update derived/calculated UI elements
    updateErrorRate();          // Calculate and display error percentage
    updateLoadIndicator();      // Show current system load level
    updateDatabaseStats();      // Update database storage and speed (Level 2 only)
    updateUpgradeButton();      // Enable/disable upgrade button based on money
    updateStartButton();        // Update start button state and text
}

/**
 * Update Error Rate Display
 * 
 * Calculates the error rate percentage and updates both the display text
 * and color based on whether it's within acceptable limits.
 * 
 * Error rate calculation: (errors / total) * 100
 * 
 * Color coding:
 * - White (#e0e0e0): Error rate is acceptable (< 1%)
 * - Red (#ff4444): Error rate exceeded threshold (> 1%) with enough samples
 */
function updateErrorRate() {
    let rate = 0;
    
    // Only calculate if we have processed requests
    if (GameState.total > 0) {
        rate = (GameState.errors / GameState.total) * 100;
    }
    
    // Update the displayed percentage
    const rateEl = document.getElementById('stat-rate');
    rateEl.innerText = rate.toFixed(1) + '%';
    
    /**
     * Color the error rate red if it exceeds the maximum allowed
     * Only apply red coloring after 10 requests to avoid false alarms
     * from early random variations
     */
    if (rate > CONFIG.maxErrorRate && GameState.total > 10) {
        rateEl.style.color = '#ff4444'; // Red - failing
    } else {
        rateEl.style.color = '#e0e0e0'; // White - acceptable
    }
}

/**
 * Update Load Indicator
 * 
 * Updates the "Current Load" display to show system stress level.
 * The load level is determined by the difficulty level, which increases
 * as the simulation progresses.
 * 
 * Load levels:
 * - Idle: Simulation not running
 * - Low/Med (green): Difficulty level 0-3
 * - High (yellow): Difficulty level 4-7
 * - Extreme (red): Difficulty level 8+
 */
function updateLoadIndicator() {
    const loadEl = document.getElementById('stat-load');
    
    // If simulation isn't running, show Idle
    if (!GameState.isRunning) {
        loadEl.innerText = "Idle";
        loadEl.style.color = "#00ffff"; // Cyan (default color)
    } 
    // Low to medium difficulty
    else if (GameState.difficultyLevel < 4) {
        loadEl.innerText = "Low/Med";
        loadEl.style.color = "#00ff00"; // Green
    } 
    // High difficulty
    else if (GameState.difficultyLevel < 8) {
        loadEl.innerText = "High";
        loadEl.style.color = "#ffff00"; // Yellow - warning
    } 
    // Extreme difficulty
    else {
        loadEl.innerText = "Extreme";
        loadEl.style.color = "#ff0000"; // Red - critical
    }
}

/**
 * Update Database Statistics Display
 * 
 * Updates the database storage and speed indicators.
 * Only visible in Level 2 when database exists.
 * 
 * Shows:
 * - Database storage: Number of write operations performed
 * - Database speed: Current processing time (increases as storage grows)
 */
function updateDatabaseStats() {
    const storageContainer = document.getElementById('stat-db-storage-container');
    const speedContainer = document.getElementById('stat-db-speed-container');
    const storageValue = document.getElementById('stat-db-storage');
    const speedValue = document.getElementById('stat-db-speed');
    
    // Only show database stats in Level 2 and beyond
    if (GameState.currentLevel >= 2 && GameState.nodes['Database']) {
        // Show the containers
        if (storageContainer) storageContainer.style.display = 'flex';
        if (speedContainer) speedContainer.style.display = 'flex';
        
        // Update storage value
        if (storageValue) {
            storageValue.innerText = GameState.databaseStorage;
            
            // Color coding based on storage size
            // Green: Low storage (0-20)
            // Yellow: Medium storage (21-50)
            // Orange: High storage (51-100)
            // Red: Very high storage (100+)
            if (GameState.databaseStorage <= 20) {
                storageValue.style.color = '#00ff00';
            } else if (GameState.databaseStorage <= 50) {
                storageValue.style.color = '#ffff00';
            } else if (GameState.databaseStorage <= 100) {
                storageValue.style.color = '#ff6b35';
            } else {
                storageValue.style.color = '#ff0000';
            }
        }
        
        // Update speed value from the actual database node
        const dbNode = GameState.nodes['Database'];
        if (speedValue && dbNode) {
            speedValue.innerText = dbNode.speed + 'ms';
            
            // Color coding based on speed degradation
            // Green: Fast (< 1000ms)
            // Yellow: Medium (1000-1500ms)
            // Orange: Slow (1500-2000ms)
            // Red: Very slow (2000ms+)
            if (dbNode.speed < 1000) {
                speedValue.style.color = '#00ff00';
            } else if (dbNode.speed < 1500) {
                speedValue.style.color = '#ffff00';
            } else if (dbNode.speed < 2000) {
                speedValue.style.color = '#ff6b35';
            } else {
                speedValue.style.color = '#ff0000';
            }
        }
    } else {
        // Hide database stats for Level 1
        if (storageContainer) storageContainer.style.display = 'none';
        if (speedContainer) speedContainer.style.display = 'none';
    }
}

/**
 * Update Upgrade Button State
 * 
 * Enables or disables the upgrade button based on available funds.
 * Also updates the button text to show cost or "Insufficient Funds".
 * 
 * Button states:
 * - Enabled: Player has enough money (≥ $200)
 * - Disabled: Player doesn't have enough money (< $200)
 */
function updateUpgradeButton() {
    const upgradeBtn = document.getElementById('btn-upgrade');
    
    // Check if player has enough money for an upgrade
    if (GameState.money < CONFIG.upgradeCost) {
        // Insufficient funds - disable button and show message
        upgradeBtn.disabled = true;
        upgradeBtn.innerHTML = `<span>⬆ Insufficient Funds</span>`;
    } else {
        // Sufficient funds - enable button and show cost
        upgradeBtn.disabled = false;
        upgradeBtn.innerHTML = `<span>⬆ Upgrade Server ($${CONFIG.upgradeCost})</span>`;
    }
}

/**
 * Update Start Button State
 * 
 * Updates the start button's enabled state and text based on game status.
 * The button toggles between Start, Pause, and Resume states.
 * 
 * Button states:
 * - "▶ Start" (enabled): Ready to begin simulation
 * - "⏸ Pause" (enabled): Simulation running, can be paused
 * - "▶ Resume" (enabled): Simulation paused, can be resumed
 * - "Finished" (disabled): Level completed
 */
function updateStartButton() {
    const startBtn = document.getElementById('btn-start');
    
    console.log('updateStartButton - isRunning:', GameState.isRunning, 'isPaused:', GameState.isPaused, 'isGameOver:', GameState.isGameOver);
    
    // Game over - disable button
    if (GameState.isGameOver) {
        startBtn.disabled = true;
        startBtn.style.opacity = 0.5;
        startBtn.innerHTML = `<span>Finished</span>`;
        startBtn.className = 'start';
    }
    // Running and paused - show Resume button
    else if (GameState.isRunning === true && GameState.isPaused === true) {
        startBtn.disabled = false;
        startBtn.style.opacity = 1;
        startBtn.innerHTML = `<span>▶ Resume</span>`;
        startBtn.className = 'start'; // Green color
    }
    // Running and not paused - show Pause button
    else if (GameState.isRunning === true && GameState.isPaused === false) {
        startBtn.disabled = false;
        startBtn.style.opacity = 1;
        startBtn.innerHTML = `<span>⏸ Pause</span>`;
        startBtn.className = 'pause'; // Yellow color
    }
    // Not running - show Start button
    else {
        startBtn.disabled = false;
        startBtn.style.opacity = 1;
        startBtn.innerHTML = `<span>▶ Start</span>`;
        startBtn.className = 'start'; // Green color
    }
}

/**
 * Check Game End Condition
 * 
 * Evaluates whether the level objectives have been met and triggers
 * the end-game sequence if complete.
 * 
 * Called after each request is processed to check if we've reached
 * the target number of requests.
 * 
 * @param {Phaser.Scene} scene - The active game scene (needed to stop timers)
 */
export function checkGameEnd(scene) {
    // Don't check again if game already ended
    if (GameState.isGameOver) return;

    // Get the target based on current level
    const target = GameState.currentLevel === 2 ? CONFIG.level2Target : CONFIG.targetTotal;
    
    // Check if we've processed enough requests
    if (GameState.total >= target) {
        endGame(scene);
    }
}

/**
 * End Game and Show Results
 * 
 * Terminates the current simulation and displays the results modal.
 * Stops all timers, calculates final statistics, and determines win/lose status.
 * 
 * Win condition: Error rate < 1%
 * Lose condition: Error rate ≥ 1%
 * 
 * @param {Phaser.Scene} scene - The active game scene (needed to stop timers)
 */
function endGame(scene) {
    // Update game state flags
    GameState.isRunning = false;
    GameState.isGameOver = true;

    /**
     * Stop All Active Timers
     * This prevents new requests from being generated and stops
     * difficulty increases after the level ends
     */
    if (scene.trafficTimer) scene.trafficTimer.remove();
    if (scene.difficultyTimer) scene.difficultyTimer.remove();

    // Calculate final error rate
    const rate = (GameState.errors / GameState.total) * 100;
    
    // Determine win/lose based on error rate
    const isWin = rate < CONFIG.maxErrorRate;

    // Display the results modal
    showResultModal(isWin, rate);
}

/**
 * Display Result Modal
 * 
 * Shows a modal dialog with the level completion results, including:
 * - Win/lose status
 * - Final error rate
 * - Educational content about architecture concepts
 * - Option to retry or proceed to next level
 * 
 * The modal content is customized based on:
 * - Win vs lose status
 * - Current level (Level 1 vs Level 2)
 * 
 * @param {boolean} isWin - Whether the player met the win condition
 * @param {number} rate - Final error rate percentage
 */
function showResultModal(isWin, rate) {
    // Get modal elements from DOM
    const modal = document.getElementById('result-modal');
    const title = document.getElementById('modal-title');
    const body = document.getElementById('modal-body');
    const btnNext = document.getElementById('btn-modal-next');

    // Show the modal
    modal.style.display = 'block';
    modal.classList.add('show');
    
    // Apply theme class for win/lose styling (can be used for CSS)
    modal.className = isWin ? 'win-theme show' : 'lose-theme show';

    /**
     * Win Condition - Show Success Message and Educational Content
     */
    if (isWin) {
        /**
         * Level 1 Success
         * Explains vertical scaling concept and its trade-offs
         */
        if (GameState.currentLevel === 1) {
            title.innerText = "Level 1 Complete!";
            body.innerHTML = `
                <p>Final Error Rate: <strong style="color:#00ff00">${rate.toFixed(2)}%</strong> (Goal < 1%)</p>
                <p>You successfully handled ${CONFIG.targetTotal} high-concurrency requests!</p>
                
                <div class="concept-box" style="background: rgba(74, 144, 226, 0.1); border: 1px solid #4a90e2; border-radius: 8px; padding: 15px; margin-top: 15px;">
                    <strong>Architect's Notes: Vertical Scaling</strong><br/>
                    What you just did is typical "vertical scaling" - improving performance by increasing a single server's resources (CPU, memory).
                    <br/><br/>
                    <ul style="text-align: left; margin-left: 20px;">
                        <li>✅ Advantages: Simple architecture, no code changes needed, quick results.</li>
                        <li>❌ Disadvantages: Hardware has physical limits (can't upgrade past Level 3), costs increase exponentially, single point of failure risk.</li>
                    </ul>
                </div>
            `;
            // Show "Enter Level 2" button
            btnNext.style.display = 'inline-block';
        } 
        /**
         * Level 2 Success
         * Explains database layer concepts and challenges
         */
        else if (GameState.currentLevel === 2) {
            title.innerText = "Level 2 Complete!";
            body.innerHTML = `
                <p>Final Error Rate: <strong style="color:#00ff00">${rate.toFixed(2)}%</strong> (Goal < 1%)</p>
                <p>You successfully handled ${CONFIG.level2Target} requests with database integration!</p>
                
                <div class="concept-box" style="background: rgba(74, 144, 226, 0.1); border: 1px solid #4a90e2; border-radius: 8px; padding: 15px; margin-top: 15px;">
                    <strong>Architect's Notes: Database Layer</strong><br/>
                    Adding a database introduces new challenges:
                    <br/><br/>
                    <ul style="text-align: left; margin-left: 20px;">
                        <li>✅ Persistent data storage and shared state</li>
                        <li>✅ Centralized data management</li>
                        <li>❌ Additional latency in request path</li>
                        <li>❌ Database becomes a potential bottleneck</li>
                        <li>❌ More complex failure scenarios</li>
                    </ul>
                    <br/>
                    <strong>Key Insight:</strong> Every layer you add increases complexity and latency. Database optimization and caching strategies become critical at scale.
                </div>
            `;
            // No Level 3 yet, hide next button
            btnNext.style.display = 'none';
        }
    } 
    /**
     * Lose Condition - Show Failure Message and Suggestions
     */
    else {
        title.innerText = "Mission Failed";
        const target = GameState.currentLevel === 2 ? CONFIG.level2Target : CONFIG.targetTotal;
        body.innerHTML = `
            <p>Final Error Rate: <strong style="color:#ff4444">${rate.toFixed(2)}%</strong> (Exceeded 1%)</p>
            <p>System crashed under high pressure, user experience was poor.</p>
            <p>Suggestion: Upgrade servers earlier, or prepare before pressure arrives.</p>
        `;
        // Hide next level button on failure
        btnNext.style.display = 'none';
    }
}
