# Level 9 Implementation Summary

## Overview
Level 9 introduces **Pubsub Queue** (Message Queue) architecture pattern, teaching players about asynchronous write processing and decoupling.

## Key Concepts Taught
1. **Asynchronous Processing**: Write requests no longer block - they're queued and processed later
2. **Write Buffering**: Queue acts as a buffer between app servers and database
3. **Improved Throughput**: App servers can respond immediately without waiting for DB writes
4. **Scalability**: Multiple queues can be added to handle high write loads

## Architecture Components

### Node Structure
- **3 User Nodes**: Generate read and write requests
- **1 CDN**: Handles static content
- **1 Load Balancer**: Distributes traffic to app servers
- **2 App Servers**: Process requests and route to appropriate services
- **1 Cache Server**: Handles read requests
- **1+ Pubsub Queues**: Buffer write requests (players can add up to 3)
- **1 Primary Database**: Processes writes from queue, handles reads directly

### Layout
Same layout as Level 8 (read replica layout), with queues positioned between app servers and database.

## New Components Created

### 1. PubsubQueueNode Class (`src/objects/PubsubQueueNode.js`)
- Extends `ProcessingNode` base class
- **Hexagon shape** for visual distinction
- Key features:
  - Message queue (FIFO buffer)
  - Configurable capacity (default: 20 messages)
  - Configurable processing speed (default: 200ms)
  - Load indicator showing queue utilization
  - Visual queue status with color coding:
    - Green: < 50% full
    - Yellow: 50-80% full
    - Red: > 80% full
- Asynchronous message processing with timer
- Routes processed messages to database

### 2. Level9Scene Class (`src/scenes/Level9Scene.js`)
- Extends `BaseLevelScene`
- Configuration:
  - Target: 2000 requests
  - Initial traffic: 1000ms delay, 2 packets/wave
  - 6 difficulty stages with increasing load
  - Max error rate: 1%
- Special feature: **Add Queue Button**
  - Cost: $300 per queue
  - Maximum: 3 queues total
  - Dynamically positioned based on queue count

## Request Flow Changes

### Write Requests (Diamond shapes)
1. User → CDN/Load Balancer → App Server
2. App Server checks for available queues
3. If queue exists:
   - Route to **least loaded queue** (load balancing)
   - App server gets **immediate acknowledgment**
   - Write queued for later processing
4. Queue processes message at its own pace
5. Queue → Database → processes write
6. Database → sends response back through queue → app server → user

### Read Requests (Circle shapes)
- Unchanged from Level 8
- User → CDN/Load Balancer → App Server → Cache
- Cache miss → Database (direct, bypassing queue)
- Response flows back to user

## Code Changes

### 1. AppServerNode Updates (`src/objects/AppServerNode.js`)
Added queue routing logic:
- `getAvailableQueues()`: Finds all active queue nodes
- `selectLeastLoadedQueue()`: Implements load balancing across queues
- `routeWriteToDatabase()`: Modified to check for queues first
  - If queues available → route write to least loaded queue
  - If no queue → fall back to traditional direct DB writes

### 2. Configuration Updates
- **sceneConfig.js**: Added Level 9 configuration, updated Level 8 title
- **main.js**: Registered Level9Scene, updated level selector range to 1-9
- **index.html**: Added Level 9 option to dropdown menu
- **nodes.js**: Exported PubsubQueueNode

## Key Features

### Queue Load Balancing
App servers intelligently distribute writes across available queues by selecting the queue with the smallest backlog.

### Dynamic Queue Addition
Players can add queues during gameplay to handle increased write load:
- Button appears at bottom of screen
- Each queue costs $300
- Maximum 3 queues allowed
- Button disabled when max reached

### Visual Feedback
- Queue load indicators show utilization percentage
- Color-coded status (green/yellow/red)
- Hexagon shape clearly distinguishes queues from other nodes
- Connection lines show message flow

## Difficulty Progression
6 stages with increasing traffic:
1. Stage 1: 800ms, 2 packets
2. Stage 2: 600ms, 3 packets
3. Stage 3: 400ms, 4 packets (⚠ High traffic)
4. Stage 4: 280ms, 5 packets (⚠ Heavy write load)
5. Stage 5: 200ms, 6 packets (⛔ Add Queue capacity!)
6. Stage 6: 130ms, 7 packets (⛔ Maximum throughput!)

## Learning Objectives

Players learn that:
1. **Asynchronous processing** improves system responsiveness
2. **Message queues** decouple components and provide buffering
3. **Multiple queues** can handle higher throughput
4. **Load balancing** across queues prevents bottlenecks
5. **Trade-offs**: Queues add complexity but improve scalability

## Success Criteria
- Process 2000 total requests
- Maintain error rate below 1%
- Manage budget wisely (queues cost money)

## Technical Implementation Notes

### Queue Processing
- Uses Phaser timer events for asynchronous processing
- Messages processed one at a time (FIFO)
- Processing speed configurable (200ms default)
- Queue capacity limits prevent overflow

### Backward Compatibility
- If no queues present, system falls back to Level 8 behavior
- Writes go directly to database (read replica or master)
- Maintains compatibility with earlier levels

## Files Modified/Created

### Created:
- `src/objects/PubsubQueueNode.js` - Queue node implementation
- `src/scenes/Level9Scene.js` - Level 9 scene
- `LEVEL9_IMPLEMENTATION.md` - This documentation

### Modified:
- `src/objects/AppServerNode.js` - Added queue routing logic
- `src/objects/nodes.js` - Exported PubsubQueueNode
- `src/config/sceneConfig.js` - Added Level 9 config
- `src/main.js` - Registered Level9Scene
- `index.html` - Added Level 9 to dropdown

## Testing Checklist
- [ ] Level 9 loads correctly from welcome screen
- [ ] Level 9 accessible from level selector dropdown
- [ ] Initial queue (Queue 1) appears and functions
- [ ] Write requests (diamonds) route to queue
- [ ] Read requests (circles) bypass queue, go to cache/DB
- [ ] Queue processes messages and forwards to database
- [ ] Queue load indicator shows accurate percentage
- [ ] "Add Queue" button works correctly
- [ ] Multiple queues distribute load evenly
- [ ] Button disables at max 3 queues
- [ ] Level completes successfully at 2000 requests
- [ ] Difficulty increases appropriately
- [ ] All visual elements render correctly

## Future Enhancements
Potential improvements for future versions:
1. Queue priority levels (high/normal/low)
2. Dead letter queue for failed messages
3. Queue retry mechanisms
4. Message persistence indicators
5. Queue monitoring dashboard
6. Auto-scaling queues based on load

---

**Implementation Date**: December 2, 2025
**Status**: ✅ Complete
**Next Level**: TBD (Level 10 could introduce microservices, API gateway, etc.)
