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
    document.getElementById('stat-total').innerText = GameState.total;
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

    if (GameState.total >= CONFIG.targetTotal) {
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
    modal.className = isWin ? 'win-theme' : 'lose-theme';

    if (isWin) {
        title.innerText = "Level 1 Complete!";
        body.innerHTML = `
            <p>Final Error Rate: <strong style="color:#00ff00">${rate.toFixed(2)}%</strong> (Goal < 1%)</p>
            <p>You successfully handled ${CONFIG.targetTotal} high-concurrency requests!</p>
            
            <div class="concept-box">
                <strong>Architect's Notes: Vertical Scaling</strong><br/>
                What you just did is typical "vertical scaling" - improving performance by increasing a single server's resources (CPU, memory).
                <br/><br/>
                <ul>
                    <li>✅ Advantages: Simple architecture, no code changes needed, quick results.</li>
                    <li>❌ Disadvantages: Hardware has physical limits (can't upgrade past Level 3), costs increase exponentially, single point of failure risk.</li>
                </ul>
            </div>
        `;
        btnNext.style.display = 'inline-block';
    } else {
        title.innerText = "Mission Failed";
        body.innerHTML = `
            <p>Final Error Rate: <strong style="color:#ff4444">${rate.toFixed(2)}%</strong> (Exceeded 1%)</p>
            <p>System crashed under high pressure, user experience was poor.</p>
            <p>Suggestion: Upgrade servers earlier, or prepare before pressure arrives.</p>
        `;
        btnNext.style.display = 'none';
    }
}
