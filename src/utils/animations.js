/**
 * Animation Utilities Module
 * 
 * Provides visual effects and animation functions for the game.
 * This module handles:
 * - Drawing connection lines between server nodes
 * - Animating packet movement along those connections
 * - Adding visual indicators (arrows) to show data flow direction
 * 
 * The animations help visualize the flow of requests and responses
 * through the architecture, making it easier to understand how
 * the system is processing traffic.
 */

import { CONFIG } from '../config.js';

/**
 * Draw Single Bidirectional Line Between Two Nodes
 * 
 * Creates one line between nodes to represent bidirectional
 * communication (both requests and responses use the same line).
 * 
 * @param {Phaser.GameObjects.Graphics} graphics - The graphics object to draw on
 * @param {ServerNode} nodeA - Starting node (typically user or app)
 * @param {ServerNode} nodeB - Ending node (typically app or database)
 */
export function drawDualLines(graphics, nodeA, nodeB) {
    /**
     * Draw Single Bidirectional Line
     * Both requests and responses travel on this single line
     * Color: Cyan (CONFIG.colors.linkReq)
     */
    graphics.lineStyle(2, CONFIG.colors.linkReq);
    graphics.lineBetween(nodeA.x, nodeA.y, nodeB.x, nodeB.y);
}

/**
 * Animate Packet Movement Between Nodes
 * 
 * Creates a smooth animation of a packet (request or response) traveling
 * from one node to another along the connection line.
 * 
 * The packet follows the offset path (same as the connection lines) and
 * triggers the target node's receivePacket method when it arrives.
 * 
 * Animation details:
 * - Duration: 500ms (half a second)
 * - Easing: Linear (constant speed)
 * - Path: Follows the offset connection line
 * 
 * @param {Phaser.Scene} scene - The scene managing the animation
 * @param {Phaser.GameObjects.Arc} packet - The packet object to animate (a colored circle)
 * @param {ServerNode} target - The destination node where packet is going
 * @param {ServerNode} sender - The source node where packet is coming from
 */
export function sendPacketAnim(scene, packet, target, sender) {
    /**
     * Calculate Start and End Positions
     * Packet travels along the center line from sender to target
     */
    const startX = sender.x;  // Start at sender's position
    const startY = sender.y;
    const endX = target.x;    // End at target's position
    const endY = target.y;

    /**
     * Set Initial Position
     * Place packet at the starting position before animation begins
     */
    packet.x = startX;
    packet.y = startY;

    /**
     * Create Movement Animation
     * Smoothly move the packet from sender to target
     */
    scene.tweens.add({
        targets: packet,        // Animate the packet object
        x: endX,               // Move to end X position
        y: endY,               // Move to end Y position
        duration: 500,         // Animation takes 500 milliseconds
        ease: 'Linear',        // Constant speed (no acceleration/deceleration)
        
        /**
         * On Complete Callback
         * Called when the packet reaches its destination
         */
        onComplete: () => {
            // Check if target node still exists (might have been destroyed)
            if (target.active) {
                // Deliver the packet to the target node for processing
                target.receivePacket(packet);
            } else {
                // Target no longer exists, destroy the packet
                packet.destroy();
            }
        }
    });
}
