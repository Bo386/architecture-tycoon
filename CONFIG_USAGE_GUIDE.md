# Configuration Framework Usage Guide

## Overview

This guide demonstrates how to use the new configuration framework in scene files. We've successfully refactored Level3Scene.js as an example.

## Before vs After Comparison

### Import Statement

**Before:**
```javascript
import { CONFIG, GameState } from '../config.js';
```

**After:**
```javascript
import { CONFIG, GameState, UI_CONFIG, LAYOUT_CONFIG, ECONOMICS_CONFIG } from '../config/index.js';
```

## Replaced Values - Complete List

### 1. Layout Positions

| Before | After | Description |
|--------|-------|-------------|
| `w * 0.15` | `w * LAYOUT_CONFIG.positions.leftMid` | User nodes X position |
| `w * 0.5` | `w * LAYOUT_CONFIG.positions.centerRight` | App server X position |
| `w * 0.8` | `w * LAYOUT_CONFIG.positions.farRight` | Database X position |
| `h/2 - 100` | `h/2 - LAYOUT_CONFIG.spacing.users` | User node vertical spacing |
| `h/2 + 100` | `h/2 + LAYOUT_CONFIG.spacing.users` | User node vertical spacing |
| `h - 50` | `h - LAYOUT_CONFIG.buttons.bottomOffset` | Button Y position |

### 2. UI Configuration

| Before | After | Description |
|--------|-------|-------------|
| `180` | `UI_CONFIG.buttons.small.width` | Button width |
| `40` | `UI_CONFIG.buttons.small.height` | Button height |
| `0x4a90e2` | `UI_CONFIG.buttonColors.primary` | Button color |
| `0x5aa0f2` | `UI_CONFIG.buttonColors.primaryHighlight` | Button hover color |
| `'14px'` | `UI_CONFIG.fonts.stat` | Font size |
| `'#ffffff'` | `UI_CONFIG.textColors.white` | Text color |

### 3. Economics Configuration

| Before | After | Description |
|--------|-------|-------------|
| `300` | `ECONOMICS_CONFIG.purchases.database` | Database purchase cost |
| `5` | `ECONOMICS_CONFIG.limits.databases` | Maximum database count |
| `'$300'` | `$${ECONOMICS_CONFIG.purchases.database}` | Dynamic cost display |

### 4. Spacing & Dimensions

| Before | After | Description |
|--------|-------|-------------|
| `140` | `LAYOUT_CONFIG.spacing.nodes` | Node spacing |
| `6` | `LAYOUT_CONFIG.packets.diamondSize` | Diamond packet size |
| `5` | `LAYOUT_CONFIG.packets.circleRadius` | Circle packet radius |

## Code Examples

### Example 1: Creating Positioned Nodes

**Before:**
```javascript
GameState.nodes['User1'] = new UserNode(
    this, w * 0.15, h/2 - 100, 'User A'
);
```

**After:**
```javascript
GameState.nodes['User1'] = new UserNode(
    this, 
    w * LAYOUT_CONFIG.positions.leftMid, 
    h/2 - LAYOUT_CONFIG.spacing.users, 
    'User A'
);
```

### Example 2: Creating Buttons

**Before:**
```javascript
this.addDbButton = this.add.rectangle(
    w * 0.8, h - 50,
    180, 40,
    0x4a90e2
).setInteractive({ useHandCursor: true });

this.addDbButtonText = this.add.text(
    w * 0.8, h - 50,
    '+ Add Database ($300)',
    {
        fontSize: '14px',
        color: '#ffffff',
        fontFamily: 'Arial'
    }
).setOrigin(0.5);
```

**After:**
```javascript
this.addDbButton = this.add.rectangle(
    w * LAYOUT_CONFIG.positions.farRight, 
    h - LAYOUT_CONFIG.buttons.bottomOffset,
    UI_CONFIG.buttons.small.width, 
    UI_CONFIG.buttons.small.height,
    UI_CONFIG.buttonColors.primary
).setInteractive({ useHandCursor: true });

this.addDbButtonText = this.add.text(
    w * LAYOUT_CONFIG.positions.farRight, 
    h - LAYOUT_CONFIG.buttons.bottomOffset,
    `+ Add Database ($${ECONOMICS_CONFIG.purchases.database})`,
    {
        fontSize: UI_CONFIG.fonts.stat,
        color: UI_CONFIG.textColors.white,
        fontFamily: 'Arial'
    }
).setOrigin(0.5);
```

### Example 3: Button Hover Effects

**Before:**
```javascript
this.addDbButton.on('pointerover', () => {
    this.addDbButton.setFillStyle(0x5aa0f2);
});

this.addDbButton.on('pointerout', () => {
    this.addDbButton.setFillStyle(0x4a90e2);
});
```

**After:**
```javascript
this.addDbButton.on('pointerover', () => {
    this.addDbButton.setFillStyle(UI_CONFIG.buttonColors.primaryHighlight);
});

this.addDbButton.on('pointerout', () => {
    this.addDbButton.setFillStyle(UI_CONFIG.buttonColors.primary);
});
```

### Example 4: Cost Checks and Limits

**Before:**
```javascript
addDatabaseServer() {
    const cost = 300;
    
    if (GameState.money < cost) {
        this.showToast('Not enough money! Need $' + cost);
        return;
    }
    
    if (this.databaseCount >= 5) {
        this.showToast('Maximum database limit reached!');
        return;
    }
    
    GameState.money -= cost;
    // ...
}
```

**After:**
```javascript
addDatabaseServer() {
    const cost = ECONOMICS_CONFIG.purchases.database;
    
    if (GameState.money < cost) {
        this.showToast('Not enough money! Need $' + cost);
        return;
    }
    
    if (this.databaseCount >= ECONOMICS_CONFIG.limits.databases) {
        this.showToast('Maximum database limit reached!');
        return;
    }
    
    GameState.money -= cost;
    // ...
}
```

### Example 5: Packet Creation

**Before:**
```javascript
if (isWrite) {
    const size = 6;
    packet = this.add.graphics();
    // ...
} else {
    packet = this.add.circle(
        startNode.x, startNode.y, 5,
        CONFIG.colors.packetReq
    );
}
```

**After:**
```javascript
if (isWrite) {
    const size = LAYOUT_CONFIG.packets.diamondSize;
    packet = this.add.graphics();
    // ...
} else {
    packet = this.add.circle(
        startNode.x, startNode.y, 
        LAYOUT_CONFIG.packets.circleRadius,
        CONFIG.colors.packetReq
    );
}
```

## Benefits Demonstrated

### 1. **Consistency**
All scenes now use the same button sizes, colors, and spacing values.

### 2. **Easy Customization**
Want to change button size globally? Update `UI_CONFIG.buttons.small.width` once.

### 3. **Self-Documenting**
`LAYOUT_CONFIG.positions.farRight` is clearer than `0.8`.

### 4. **Dynamic Values**
`` `+ Add Database ($${ECONOMICS_CONFIG.purchases.database})` `` automatically updates if cost changes.

### 5. **Type Safety**
IDE autocomplete works with configuration objects.

## Quick Reference

### Common Position Values
```javascript
LAYOUT_CONFIG.positions.leftEdge    // 0.12
LAYOUT_CONFIG.positions.leftMid     // 0.15
LAYOUT_CONFIG.positions.quarterLeft // 0.27
LAYOUT_CONFIG.positions.centerLeft  // 0.30
LAYOUT_CONFIG.positions.center      // 0.42
LAYOUT_CONFIG.positions.centerRight // 0.50
LAYOUT_CONFIG.positions.threeQuarter// 0.58
LAYOUT_CONFIG.positions.farRight    // 0.80
```

### Common Spacing Values
```javascript
LAYOUT_CONFIG.spacing.nodes         // 140
LAYOUT_CONFIG.spacing.users         // 100
LAYOUT_CONFIG.spacing.small         // 60
```

### Common UI Values
```javascript
UI_CONFIG.fonts.title              // '48px'
UI_CONFIG.fonts.subtitle           // '24px'
UI_CONFIG.fonts.button             // '16px'
UI_CONFIG.fonts.stat               // '14px'

UI_CONFIG.buttons.standard.width   // 200
UI_CONFIG.buttons.large.width      // 250
UI_CONFIG.buttons.small.width      // 180
```

### Common Economics Values
```javascript
ECONOMICS_CONFIG.purchases.database      // 300
ECONOMICS_CONFIG.purchases.appServer     // 300
ECONOMICS_CONFIG.purchases.loadBalancer  // 300
ECONOMICS_CONFIG.purchases.cdn           // 400
ECONOMICS_CONFIG.purchases.readReplica   // 350

ECONOMICS_CONFIG.limits.databases        // 5
ECONOMICS_CONFIG.limits.appServers       // 5
ECONOMICS_CONFIG.limits.readReplicas     // 3
```

## Pattern to Follow

When refactoring a scene file:

1. **Add imports**:
   ```javascript
   import { CONFIG, GameState, UI_CONFIG, LAYOUT_CONFIG, ECONOMICS_CONFIG } from '../config/index.js';
   ```

2. **Replace positions**: Look for `w * 0.XX` and `h/2 ± YY`
3. **Replace dimensions**: Look for button widths/heights
4. **Replace colors**: Look for hex values like `0x4a90e2`
5. **Replace costs**: Look for dollar amounts like `300`, `400`
6. **Replace limits**: Look for max counts like `5`, `3`
7. **Replace sizes**: Look for packet sizes, font sizes

## Testing

After refactoring:
1. Run the game
2. Test the refactored level
3. Verify buttons work correctly
4. Check spacing looks the same
5. Confirm costs display correctly

## Next Steps

To refactor other scenes, follow the same pattern demonstrated in Level3Scene.js:
- Level4Scene.js - App server scaling
- Level5Scene.js - Cache layer
- Level6Scene.js - Load balancer
- Level7Scene.js - CDN layer
- Level8Scene.js - Read replicas

---

**Status**: Level3Scene.js refactored ✅  
**Files Updated**: 1/8 scenes  
**Next**: Apply to remaining scenes
