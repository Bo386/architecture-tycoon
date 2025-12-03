/**
 * AppServerNode Class
 * 
 * Represents an application server that processes business logic.
 * - Rectangle shape
 * - Has capacity and processing speed
 * - Can be upgraded
 * - Routes to: Cache/Database (requests) or User (responses)
 */

import { CONFIG, GameState } from '../config.js';
import { sendPacketAnim } from '../utils/animations.js';
import { ProcessingNode } from './ProcessingNode.js';

export class AppServerNode extends ProcessingNode {
    constructor(scene, x, y, name, capacity, speed) {
        super(scene, x, y, name, 'app', capacity, speed);
    }

    /**
     * Create Rectangle Shape
     */
    createShape(w, h) {
        this.bg = this.scene.add.rectangle(0, 0, w, h, CONFIG.colors.node);
        this.bg.setStrokeStyle(2, CONFIG.colors.nodeBorder);
        this.bg.width = w;
        this.bg.height = h;
    }

    /**
     * Route Packet
     * Handles both requests (to cache/database) and responses (to user)
     */
    routePacket(packet) {
        // App receives response from database/cache - forward to original user
        if (packet.isResponse) {
            if (packet.sourceNode && packet.sourceNode.active) {
                sendPacketAnim(this.scene, packet, packet.sourceNode, this);
            } else {
                packet.destroy();
            }
        }
        // App receives request from user - route based on architecture
        else {
            // Check if database exists in this level
            const databases = this.getAvailableDatabases();
            const hasDatabase = databases.length > 0;
            
            // Level 1 (Monolithic): No database, handle everything internally
            if (!hasDatabase) {
                // Process the request and respond immediately
                packet.isResponse = true;
                
                if (packet.setFillStyle) {
                    packet.setFillStyle(CONFIG.colors.packetRes);
                } else if (packet.setTint) {
                    packet.setTint(CONFIG.colors.packetRes);
                }
                
                if (packet.sourceNode && packet.sourceNode.active) {
                    sendPacketAnim(this.scene, packet, packet.sourceNode, this);
                } else {
                    packet.destroy();
                }
                return;
            }
            
            // Level 2+: Route to appropriate backend based on request type
            // Check if this is a cache miss returning to app
            if (packet.cacheMissed) {
                packet.cacheMissed = false;
                
                // Check for read-write splitting (Level 8)
                const readReplica = GameState.nodes['ReadReplica1'];
                
                if (readReplica && readReplica.active) {
                    // Cache miss reads go to read replica
                    packet.appNode = this;
                    sendPacketAnim(this.scene, packet, readReplica, this);
                } else {
                    // Use any available database
                    this.routeToDatabase(packet);
                }
            } else {
                // New request from user
                const cache = GameState.nodes['Cache1'];
                
                // Write requests always go directly to master database (skip cache)
                if (packet.isWrite) {
                    this.routeWriteToDatabase(packet);
                }
                // Read requests go through cache if available (Level 5+)
                else if (cache && cache.active) {
                    packet.appNode = this;
                    sendPacketAnim(this.scene, packet, cache, this);
                } else {
                    // Check for read-write splitting (Level 8)
                    const readReplica = GameState.nodes['ReadReplica1'];
                    
                    if (readReplica && readReplica.active) {
                        // Reads go to read replica
                        packet.appNode = this;
                        sendPacketAnim(this.scene, packet, readReplica, this);
                    } else {
                        // Route to database
                        const randomIndex = Math.floor(Math.random() * databases.length);
                        const selectedDatabase = databases[randomIndex];
                        packet.appNode = this;
                        sendPacketAnim(this.scene, packet, selectedDatabase, this);
                    }
                }
            }
        }
    }

    /**
     * Route Write to Database
     * Writes go to Pubsub Queue if available (Level 9), otherwise to master database
     */
    routeWriteToDatabase(packet) {
        // Check for Pubsub Queue first (Level 9)
        const queues = this.getAvailableQueues();
        
        if (queues.length > 0) {
            // Route to least loaded queue
            const selectedQueue = this.selectLeastLoadedQueue(queues);
            packet.appNode = this;
            sendPacketAnim(this.scene, packet, selectedQueue, this);
            return;
        }
        
        // No queue available, use traditional routing
        const readReplica = GameState.nodes['ReadReplica1'];
        
        if (readReplica && readReplica.active) {
            // Read-write splitting enabled: writes ONLY to master (Database1)
            const masterDb = GameState.nodes['Database1'];
            if (masterDb && masterDb.active) {
                packet.appNode = this;
                sendPacketAnim(this.scene, packet, masterDb, this);
            } else {
                packet.destroy();
            }
        } else {
            // No read-write splitting: use all databases
            this.routeToDatabase(packet);
        }
    }

    /**
     * Route to Any Available Database
     */
    routeToDatabase(packet) {
        const databases = this.getAvailableDatabases();
        
        if (databases.length > 0) {
            const randomIndex = Math.floor(Math.random() * databases.length);
            const selectedDatabase = databases[randomIndex];
            packet.appNode = this;
            sendPacketAnim(this.scene, packet, selectedDatabase, this);
        } else {
            packet.destroy();
        }
    }

    /**
     * Get Available Databases
     */
    getAvailableDatabases() {
        return Object.keys(GameState.nodes)
            .filter(key => key.startsWith('Database'))
            .map(key => GameState.nodes[key])
            .filter(db => db && db.active);
    }

    /**
     * Get Available Queues
     */
    getAvailableQueues() {
        return Object.keys(GameState.nodes)
            .filter(key => key.startsWith('Queue'))
            .map(key => GameState.nodes[key])
            .filter(queue => queue && queue.active);
    }

    /**
     * Select Least Loaded Queue
     * Returns the queue with the most available capacity
     */
    selectLeastLoadedQueue(queues) {
        if (queues.length === 1) return queues[0];
        
        // Find queue with smallest message queue
        let minLoad = Infinity;
        let selectedQueue = queues[0];
        
        for (const queue of queues) {
            const load = queue.messageQueue ? queue.messageQueue.length : 0;
            if (load < minLoad) {
                minLoad = load;
                selectedQueue = queue;
            }
        }
        
        return selectedQueue;
    }
}
