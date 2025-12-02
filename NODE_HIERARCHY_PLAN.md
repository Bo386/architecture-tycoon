# Node Type Hierarchy Refactoring Plan

## Current Problem
The `ServerNode.js` class is ~1,400 lines with type-specific logic scattered throughout:
- Multiple `if (this.type === 'user')` conditionals
- Complex `routePacket()` method with nested conditions
- Type-specific visual creation (cylinder, diamond, hexagon, star, circle, rectangle)
- Different packet processing behaviors per type

## Identified Node Types

### 1. **User Node**
- **Shape**: Circle
- **Behavior**: 
  - Generates requests
  - Receives responses
  - Tracks success/error statistics
  - No capacity management
- **Routing**: Sends to CDN → LoadBalancer → App

### 2. **App Server Node**
- **Shape**: Rectangle
- **Behavior**:
  - Processes business logic
  - Has capacity and speed
  - Can be upgraded
  - Routes to cache or database
- **Routing**: Forwards to Cache/Database, returns responses to users

### 3. **Database Node**
- **Shape**: Cylinder
- **Behavior**:
  - Stores data (write operations increase storage)
  - Degrades performance as storage grows
  - Handles read/write operations
  - Visual storage fill indicator
- **Routing**: Returns responses to app servers

### 4. **Cache Node**
- **Shape**: Diamond
- **Behavior**:
  - Hit/miss logic (configurable hit rate ~70%)
  - Fast responses on cache hits
  - Forwards misses to database
- **Routing**: HIT → return to app, MISS → forward to database

### 5. **CDN Node**
- **Shape**: Star
- **Behavior**:
  - Hit/miss logic for static content (~80% hit rate)
  - Serves content from edge locations
  - Bypasses CDN for write requests
- **Routing**: HIT → return to user, MISS → forward to backend

### 6. **LoadBalancer Node**
- **Shape**: Hexagon
- **Behavior**:
  - Intelligent routing based on server load
  - Monitors all app servers
  - Selects least loaded server
- **Routing**: Distributes to app servers, forwards responses back

## Proposed Hierarchy

```
BaseNode (abstract)
├── Visual management (shapes, colors, text)
├── Dragging functionality
├── Basic packet processing (capacity, queue)
├── Upgrade system
├── Visual effects (flash, float text, animations)
└── Abstract methods: routePacket(), createShape()

UserNode extends BaseNode
├── Statistics tracking (success/errors)
├── No capacity management
└── Routes to: CDN/LoadBalancer/App

ProcessingNode extends BaseNode (abstract)
├── Capacity management
├── Load bar visualization
├── Processing speed
└── Upgrade functionality

AppServerNode extends ProcessingNode
└── Routes to: Cache/Database

DatabaseNode extends ProcessingNode
├── Storage tracking
├── Storage visualization
├── Performance degradation
└── Routes to: App

CacheNode extends ProcessingNode
├── Hit/miss logic
├── Configurable hit rate
└── Routes to: App (hit) or Database (miss via App)

CDNNode extends ProcessingNode
├── Hit/miss logic
├── Configurable hit rate
└── Routes to: User (hit) or LoadBalancer (miss)

LoadBalancerNode extends ProcessingNode
├── Load monitoring
├── Intelligent routing
└── Routes to: AppServers (least loaded)
```

## Benefits of This Hierarchy

### 1. **Separation of Concerns**
- Each node type has its own class
- Type-specific logic isolated
- No more conditional type checks

### 2. **Code Reduction**
- Base class handles ~60% of common functionality
- Each specialized class ~100-200 lines
- Total reduction: ~40-50%

### 3. **Extensibility**
- Adding new node types is trivial
- Just extend BaseNode or ProcessingNode
- No need to modify existing classes

### 4. **Maintainability**
- Bug fixes in base class apply to all
- Type-specific bugs isolated to specific classes
- Easier to test individual node types

### 5. **Readability**
- Each class clearly shows what makes that node unique
- No need to wade through 1,400 lines
- Clear inheritance hierarchy

## Implementation Steps

1. **Create BaseNode class** (~400 lines)
   - Common visual elements
   - Dragging system
   - Basic packet processing
   - Upgrade system
   - Visual effects

2. **Create ProcessingNode class** (~100 lines)
   - Extends BaseNode
   - Adds capacity management
   - Load bar visualization
   - Processing indicator

3. **Create UserNode class** (~80 lines)
   - Extends BaseNode
   - Statistics tracking
   - Request generation routing

4. **Create AppServerNode class** (~120 lines)
   - Extends ProcessingNode
   - Routes to cache/database
   - Response handling

5. **Create DatabaseNode class** (~150 lines)
   - Extends ProcessingNode
   - Storage management
   - Performance degradation
   - Storage visualization

6. **Create CacheNode class** (~100 lines)
   - Extends ProcessingNode
   - Hit/miss logic
   - Route decisions

7. **Create CDNNode class** (~100 lines)
   - Extends ProcessingNode
   - Hit/miss logic
   - Static content serving

8. **Create LoadBalancerNode class** (~120 lines)
   - Extends ProcessingNode
   - Load monitoring
   - Intelligent routing

9. **Update all scenes**
   - Replace `new ServerNode()` with specific types
   - Example: `new DatabaseNode()`, `new AppServerNode()`

10. **Test thoroughly**
    - Verify each level works correctly
    - Check packet routing
    - Validate upgrades

## Estimated Impact

| Metric | Before | After | Change |
|--------|--------|-------|--------|
| ServerNode.js | 1,400 lines | Removed | -1,400 |
| BaseNode.js | 0 | 400 lines | +400 |
| ProcessingNode.js | 0 | 100 lines | +100 |
| UserNode.js | 0 | 80 lines | +80 |
| AppServerNode.js | 0 | 120 lines | +120 |
| DatabaseNode.js | 0 | 150 lines | +150 |
| CacheNode.js | 0 | 100 lines | +100 |
| CDNNode.js | 0 | 100 lines | +100 |
| LoadBalancerNode.js | 0 | 120 lines | +120 |
| **Total** | **1,400 lines** | **1,270 lines** | **-130 lines (9%)** |

*Note: Line count reduction is modest, but the real benefit is in code organization, maintainability, and extensibility.*

## Migration Strategy

1. Keep ServerNode.js temporarily for backward compatibility
2. Create new node classes incrementally
3. Test each new class thoroughly
4. Update scenes one by one
5. Remove ServerNode.js once all scenes migrated
6. Update documentation

This hierarchy mirrors real-world architectural patterns and makes the codebase much more maintainable!
