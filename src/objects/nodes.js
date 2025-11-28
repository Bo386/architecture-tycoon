/**
 * Node Classes Index
 * 
 * Exports all node classes for easy importing in scenes.
 * 
 * Usage:
 *   import { UserNode, AppServerNode, DatabaseNode } from '../objects/nodes.js';
 */

export { BaseNode } from './BaseNode.js';
export { ProcessingNode } from './ProcessingNode.js';
export { UserNode } from './UserNode.js';
export { AppServerNode } from './AppServerNode.js';
export { DatabaseNode } from './DatabaseNode.js';
export { CacheNode } from './CacheNode.js';
export { CDNNode } from './CDNNode.js';
export { LoadBalancerNode } from './LoadBalancerNode.js';

// Backward compatibility - still export ServerNode if needed
export { ServerNode } from './ServerNode.js';
