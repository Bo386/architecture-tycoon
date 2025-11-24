/**
 * UI Manager
 * Handles UI updates and game state management
 */

import { CONFIG, GameState } from '../config.js';

/**
 * Update all UI elements with current game state
 */
export function updateUI() {
    document.getElementById('ui-money').innerText = GameState.money;
    
    // Update progress display based on current level
    const target = GameState.currentLevel === 2 ? CONFIG.level2Target : CONFIG.targetTotal;
    const statTotalEl = document.getElementById('stat-total');
    if (statTotalEl) {
        statTotalEl.innerText = GameState.total;
    }
    
    // Update progress label if needed
    const progressLabel = document.querySelector('.stat-item .stat-label');
    if (progressLabel && progressLabel.textContent.includes('Progress')) {
        progressLabel.textContent = `Progress (${target}):`;
    }
    
    document.getElementById('stat-success').innerText = GameState.success;
    document.getElementById('stat-errors').innerText = GameState.errors;

    updateErrorRate();
    updateLoadIndicator();
    updateUpgradeButton();
    updateStartButton();
}

/**
 * Update error rate display
 */
function updateErrorRate() {
    let rate = 0;
    if (GameState.total > 0) {
        rate = (GameState.errors / GameState.total) * 100;
    }
    
    const rateEl = document.getElementById('stat-rate');
    rateEl.innerText = rate.toFixed(1) + '%';
    
    if (rate > CONFIG.maxErrorRate && GameState.total > 10) {
        rateEl.style.color = '#ff4444';
    } else {
        rateEl.style.color = '#e0e0e0';
    }
}

/**
 * Update load indicator
 */
function updateLoadIndicator() {
    const loadEl = document.getElementById('stat-load');
    
    if (!GameState.isRunning) {
        loadEl.innerText = "Idle";
    } else if (GameState.difficultyLevel < 4) {
        loadEl.innerText = "Low/Med";
        loadEl.style.color = "#00ff00";
    } else if (GameState.difficultyLevel < 8) {
        loadEl.innerText = "High";
        loadEl.style.color = "#ffff00";
    } else {
        loadEl.innerText = "Extreme";
        loadEl.style.color = "#ff0000";
    }
}

/**
 * Update upgrade button state
 */
function updateUpgradeButton() {
    const upgradeBtn = document.getElementById('btn-upgrade');
    
    if (GameState.money < CONFIG.upgradeCost) {
        upgradeBtn.disabled = true;
        upgradeBtn.innerHTML = `<span>⬆ Insufficient Funds</span>`;
    } else {
        upgradeBtn.disabled = false;
        upgradeBtn.innerHTML = `<span>⬆ Upgrade Server ($${CONFIG.upgradeCost})</span>`;
    }
}

/**
 * Update start button state
 */
function updateStartButton() {
    const startBtn = document.getElementById('btn-start');
    
    if (GameState.isRunning || GameState.isGameOver) {
        startBtn.disabled = true;
        startBtn.style.opacity = 0.5;
        startBtn.innerHTML = GameState.isGameOver ? 
            `<span>Finished</span>` : 
            `<span>Running...</span>`;
    } else {
        startBtn.disabled = false;
        startBtn.style.opacity = 1;
        startBtn.innerHTML = `<span>▶ Start</span>`;
    }
}

/**
 * Check if game has ended
 */
export function checkGameEnd(scene) {
    if (GameState.isGameOver) return;

    const target = GameState.currentLevel === 2 ? CONFIG.level2Target : CONFIG.targetTotal;
    if (GameState.total >= target) {
        endGame(scene);
    }
}

/**
 * End the game and show results
 */
function endGame(scene) {
    GameState.isRunning = false;
    GameState.isGameOver = true;

    // Stop traffic
    if (scene.trafficTimer) scene.trafficTimer.remove();
    if (scene.difficultyTimer) scene.difficultyTimer.remove();

    const rate = (GameState.errors / GameState.total) * 100;
    const isWin = rate < CONFIG.maxErrorRate;

    showResultModal(isWin, rate);
}

/**
 * Display result modal
 */
function showResultModal(isWin, rate) {
    const modal = document.getElementById('result-modal');
    const title = document.getElementById('modal-title');
    const body = document.getElementById('modal-body');
    const btnNext = document.getElementById('btn-modal-next');

    modal.style.display = 'block';
    modal.classList.add('show');
    modal.className = isWin ? 'win-theme show' : 'lose-theme show';

    if (isWin) {
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
            btnNext.style.display = 'inline-block';
        } else if (GameState.currentLevel === 2) {
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
            btnNext.style.display = 'none'; // No Level 3 yet
        }
    } else {
        title.innerText = "Mission Failed";
        const target = GameState.currentLevel === 2 ? CONFIG.level2Target : CONFIG.targetTotal;
        body.innerHTML = `
            <p>Final Error Rate: <strong style="color:#ff4444">${rate.toFixed(2)}%</strong> (Exceeded 1%)</p>
            <p>System crashed under high pressure, user experience was poor.</p>
            <p>Suggestion: Upgrade servers earlier, or prepare before pressure arrives.</p>
        `;
        btnNext.style.display = 'none';
    }
}
