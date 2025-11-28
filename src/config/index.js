/**
 * Configuration Index
 * 
 * Central export point for all configuration modules.
 * Import all configs from here for convenience.
 * 
 * Usage:
 *   import { CONFIG, UI_CONFIG, LAYOUT_CONFIG, ECONOMICS_CONFIG, SCENE_CONFIG } from '../config';
 * 
 * Or import specific configs:
 *   import { UI_CONFIG } from '../config/uiConfig.js';
 */

// Game mechanics and level configurations
export { CONFIG, GameState, resetGameState } from '../config.js';

// Scene configurations
export { SCENE_CONFIG } from './sceneConfig.js';

// UI configurations (fonts, buttons, colors)
export { UI_CONFIG } from './uiConfig.js';

// Layout configurations (positions, spacing, dimensions)
export { LAYOUT_CONFIG } from './layoutConfig.js';

// Economics configurations (costs, limits, budgets)
export { ECONOMICS_CONFIG } from './economicsConfig.js';
