# Configuration Extraction Plan

## Current State Analysis

### ✅ Already Configured (in src/config.js)
- Game colors (bg, node, packets, links)
- Server node capacities and speeds (per level)
- Difficulty progression (traffic delays, packets per wave)
- Win conditions (target totals, error rates)
- Cache hit rates
- Write request percentages

### ❌ Still Hardcoded (Need to Extract)

#### 1. UI Configuration
**Location**: Scattered across scene files
**Examples**:
- Font sizes: `'48px'`, `'24px'`, `'16px'`, `'20px'`
- Button dimensions: `200, 40`, `230, 40`, `250, 40`
- Border widths: `2`, `3`
- Text styles: `'bold'`, colors like `'#aaa'`, `'#fff'`

#### 2. Layout Configuration
**Location**: Scene files (Level1-8)
**Examples**:
- Node positions: `w * 0.15`, `h/2 - 100`, `w * 0.5`
- Spacing values: `140`, `100`, `60`
- Button positions: `w * 0.5, h - 50`
- Packet sizes: `5`, `6`

#### 3. Economic Configuration
**Location**: Scene files (add server/database functions)
**Examples**:
- Database cost: `$300`
- App server cost: `$300`
- Load balancer cost: `$300`
- CDN cost: `$400`
- Read replica cost: `$350`
- Max servers: `5`, `3`

#### 4. Animation/Visual Configuration
**Location**: Scene files, BaseNode, etc.
**Examples**:
- Packet radius: `5`
- Diamond size: `6`
- Animation speeds
- Fade durations
- Toast display times

## Proposed Configuration Structure

### Option 1: Single Mega Config File
```javascript
// src/config.js (expanded)
export const CONFIG = {
    // Game mechanics (existing)
    colors: {...},
    level1: {...},
    
    // NEW: UI Configuration
    ui: {
        fonts: {
            title: '48px',
            subtitle: '24px',
            button: '16px',
            stat: '14px'
        },
        buttons: {
            width: 200,
            height: 40,
            borderWidth: 2,
            largeWidth: 250
        },
        colors: {
            text: '#fff',
            textMuted: '#aaa',
            buttonPrimary: 0x4a90e2,
            buttonSuccess: 0x4caf50
        }
    },
    
    // NEW: Layout Configuration
    layout: {
        nodeSpacing: 140,
        userSpacing: 100,
        buttonY: -50,  // Relative to bottom
        packetRadius: 5,
        packetDiamondSize: 6
    },
    
    // NEW: Economics Configuration  
    costs: {
        upgradeServer: 200,
        addDatabase: 300,
        addAppServer: 300,
        addLoadBalancer: 300,
        addCDN: 400,
        addReadReplica: 350
    },
    
    // NEW: Limits Configuration
    limits: {
        maxDatabases: 5,
        maxAppServers: 5,
        maxReadReplicas: 3
    }
};
```

### Option 2: Multiple Config Files (Better Organization)
```
src/config/
├── index.js (exports everything)
├── gameConfig.js (game mechanics - existing)
├── uiConfig.js (fonts, buttons, colors)
├── layoutConfig.js (positions, spacing)
├── economicsConfig.js (costs, limits)
└── sceneConfig.js (already exists)
```

## Recommendation

**Use Option 2** (Multiple Config Files) because:
1. ✅ Better separation of concerns
2. ✅ Easier to find and modify specific configs
3. ✅ Follows the pattern we already started with sceneConfig.js
4. ✅ Smaller, more focused files
5. ✅ Can import only what's needed

## Implementation Plan

### Phase 1: Create New Config Files
1. Create `src/config/uiConfig.js` - UI styles and dimensions
2. Create `src/config/layoutConfig.js` - Positions and spacing
3. Create `src/config/economicsConfig.js` - Costs and limits
4. Create `src/config/index.js` - Barrel export for all configs

### Phase 2: Extract Hardcoded Values
1. Identify all hardcoded values in scenes
2. Move to appropriate config files
3. Replace with config references
4. Test each scene after changes

### Phase 3: Refactor Scene Files
1. Import config modules at top of each scene
2. Replace magic numbers with config values
3. Add comments explaining what each config does

### Phase 4: Documentation
1. Document all configuration options
2. Create config reference guide
3. Add examples of customization

## Benefits

1. **Single Source of Truth**: All game constants in one place
2. **Easy Customization**: Change values without hunting through code
3. **Consistency**: Same values used everywhere
4. **Maintainability**: Clear what each number means
5. **Testability**: Easy to test with different configs

## Risks & Mitigation

### Risk 1: Over-configuration
**Problem**: Too many configs make code harder to read
**Mitigation**: Only extract values used in multiple places or that are likely to change

### Risk 2: Breaking Changes
**Problem**: Incorrect extraction could break game
**Mitigation**: Extract incrementally, test after each change

### Risk 3: Performance
**Problem**: Config lookups might be slower
**Mitigation**: Negligible impact for our use case, configs loaded once

## Timeline Estimate

- Phase 1 (Create Config Files): 30 minutes
- Phase 2 (Extract Values): 1 hour
- Phase 3 (Refactor Scenes): 1.5 hours
- Phase 4 (Documentation): 30 minutes
- **Total**: ~3.5 hours

## Success Criteria

- ✅ No magic numbers in scene files
- ✅ All configs centralized and documented
- ✅ Game functions identically to before
- ✅ Easy to customize game parameters
- ✅ Clear config structure with comments

---

**Status**: Planning Phase  
**Next Step**: Get approval to proceed with Option 2 (Multiple Config Files)
