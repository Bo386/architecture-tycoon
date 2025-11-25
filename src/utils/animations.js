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
 * Draw Dual Directional Lines Between Two Nodes
 * 
 * Creates two parallel lines between nodes to represent bidirectional
 * communication (request going one way, response coming back).
 * 
 * The lines are offset from each other to clearly show both directions:
 * - One line for requests (darker cyan color)
 * - One line for responses (darker gold color)
 * 
 * Each line has a small circle arrow indicator at its midpoint
 * to show the direction of data flow.
 * 
 * @param {Phaser.GameObjects.Graphics} graphics - The graphics object to draw on
 * @param {ServerNode} nodeA - Starting node (typically user or app)
 * @param {ServerNode} nodeB - Ending node (typically app or database)
 */
export function drawDualLines(graphics, nodeA, nodeB) {
    /**
     * Calculate Direction Vector
     * Find the angle and distance between the two nodes
     */
    const dx = nodeB.x - nodeA.x;  // Horizontal distance
    const dy = nodeB.y - nodeA.y;  // Vertical distance
    const angle = Math.atan2(dy, dx);  // Angle in radians
    
    /**
     * Calculate Parallel Line Offset
     * Offset the lines perpendicular to the connection
     * to create two parallel lines (one for each direction)
     */
    const offset = 8;  // Distance between the two parallel lines
    const ox = offset * Math.cos(angle + Math.PI/2);  // X offset (perpendicular)
    const oy = offset * Math.sin(angle + Math.PI/2);  // Y offset (perpendicular)
    
    /**
     * Draw Request Line (Outbound: A → B)
     * This line represents requests flowing from nodeA to nodeB
     * Color: Dark cyan (CONFIG.colors.linkReq)
     */
    graphics.lineStyle(2, CONFIG.colors.linkReq);
    graphics.lineBetween(
        nodeA.x + ox, nodeA.y + oy,  // Start point (offset from nodeA)
        nodeB.x + ox, nodeB.y + oy   // End point (offset from nodeB)
    );
    // Add arrow indicator at midpoint showing direction
    drawArrow(graphics, nodeA.x + ox, nodeA.y + oy, nodeB.x + ox, nodeB.y + oy, CONFIG.colors.linkReq);

    /**
     * Draw Response Line (Inbound: B → A)
     * This line represents responses flowing back from nodeB to nodeA
     * Color: Dark gold (CONFIG.colors.linkRes)
     * Note: Offset is negative to place line on opposite side
     */
    graphics.lineStyle(2, CONFIG.colors.linkRes);
    graphics.lineBetween(
        nodeB.x - ox, nodeB.y - oy,  // Start point (offset from nodeB, opposite side)
        nodeA.x - ox, nodeA.y - oy   // End point (offset from nodeA, opposite side)
    );
    // Add arrow indicator at midpoint showing direction
    drawArrow(graphics, nodeB.x - ox, nodeB.y - oy, nodeA.x - ox, nodeA.y - oy, CONFIG.colors.linkRes);
}

/**
 * Draw Arrow Indicator on a Line
 * 
 * Draws a small filled circle at the midpoint of a line to indicate
 * the direction of data flow. This acts as a simple arrow marker.
 * 
 * @param {Phaser.GameObjects.Graphics} graphics - The graphics object to draw on
 * @param {number} x1 - X coordinate of line start
 * @param {number} y1 - Y coordinate of line start
 * @param {number} x2 - X coordinate of line end
 * @param {number} y2 - Y coordinate of line end
 * @param {number} color - Color of the arrow (hexadecimal)
 */
function drawArrow(graphics, x1, y1, x2, y2, color) {
    // Calculate the midpoint of the line
    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2;
    
    // Draw a small filled circle at the midpoint
    graphics.fillStyle(color, 1);  // Fully opaque
    graphics.fillCircle(midX, midY, 2.5);  // Radius of 2.5 pixels
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
     * Calculate Direction and Offset
     * Same calculation as in drawDualLines to ensure packet follows
     * the correct line path
     */
    const dx = target.x - sender.x;
    const dy = target.y - sender.y;
    const angle = Math.atan2(dy, dx);
    const offset = 8;  // Same offset as the connection lines
    const ox = offset * Math.cos(angle + Math.PI/2);
    const oy = offset * Math.sin(angle + Math.PI/2);

    /**
     * Calculate Start and End Positions
     * Packet travels along the offset line from sender to target
     */
    const startX = sender.x + ox;  // Start at sender's position (with offset)
    const startY = sender.y + oy;
    const endX = target.x + ox;    // End at target's position (with offset)
    const endY = target.y + oy;

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
