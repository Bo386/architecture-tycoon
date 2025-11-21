/**
 * Game Configuration
 * Central configuration file for all game constants
 */

export const CONFIG = {
    colors: {
        bg: 0x1e1e1e,
        node: 0x252526,
        nodeBorder: 0x4fc1ff,
        packetReq: 0x00ffff,
        packetRes: 0xffd700,
        linkReq: 0x005555,
        linkRes: 0x554400
    },
    upgradeCost: 200,
    targetTotal: 1000,
    maxErrorRate: 1.0 // 1%
};

export const GameState = {
    money: 500,
    success: 0,
    errors: 0,
    total: 0,
    nodes: {},
    isRunning: false,
    isGameOver: false,
    difficultyLevel: 0
};

export const resetGameState = () => {
    GameState.money = 500;
    GameState.success = 0;
    GameState.errors = 0;
    GameState.total = 0;
    GameState.nodes = {};
    GameState.isRunning = false;
    GameState.isGameOver = false;
    GameState.difficultyLevel = 0;
};
