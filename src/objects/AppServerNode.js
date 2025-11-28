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
                        // Find available databases
                        const databases = this.getAvailableDatabases();
                        
                        if (databases.length > 0) {
                            // Level 2+: Route to database
                            const randomIndex = Math.floor(Math.random() * databases.length);
                            const selectedDatabase = databases[randomIndex];
                            packet.appNode = this;
                            sendPacketAnim(this.scene, packet, selectedDatabase, this);
                        } else {
                            // Level 1: Monolithic - respond directly
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
                        }
                    }
                }
            }
        }
    }

    /**
     * Route Write to Database
     * Writes always go to master database (Database1) if read-write splitting is enabled
     */
    routeWriteToDatabase(packet) {
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
}
