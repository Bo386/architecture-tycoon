/**
 * Animation Utilities
 * Handles visual effects and animations
 */

import { CONFIG } from '../config.js';

/**
 * Draw dual directional lines between two nodes
 */
export function drawDualLines(graphics, nodeA, nodeB) {
    const dx = nodeB.x - nodeA.x;
    const dy = nodeB.y - nodeA.y;
    const angle = Math.atan2(dy, dx);
    const offset = 8; 
    const ox = offset * Math.cos(angle + Math.PI/2);
    const oy = offset * Math.sin(angle + Math.PI/2);
    
    // Request line (outbound)
    graphics.lineStyle(2, CONFIG.colors.linkReq);
    graphics.lineBetween(nodeA.x + ox, nodeA.y + oy, nodeB.x + ox, nodeB.y + oy);
    drawArrow(graphics, nodeA.x + ox, nodeA.y + oy, nodeB.x + ox, nodeB.y + oy, CONFIG.colors.linkReq);

    // Response line (inbound)
    graphics.lineStyle(2, CONFIG.colors.linkRes);
    graphics.lineBetween(nodeB.x - ox, nodeB.y - oy, nodeA.x - ox, nodeA.y - oy);
    drawArrow(graphics, nodeB.x - ox, nodeB.y - oy, nodeA.x - ox, nodeA.y - oy, CONFIG.colors.linkRes);
}

/**
 * Draw arrow indicator on a line
 */
function drawArrow(graphics, x1, y1, x2, y2, color) {
    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2;
    graphics.fillStyle(color, 1);
    graphics.fillCircle(midX, midY, 2.5);
}

/**
 * Animate packet movement between nodes
 */
export function sendPacketAnim(scene, packet, target, sender) {
    const dx = target.x - sender.x;
    const dy = target.y - sender.y;
    const angle = Math.atan2(dy, dx);
    const offset = 8; 
    const ox = offset * Math.cos(angle + Math.PI/2);
    const oy = offset * Math.sin(angle + Math.PI/2);

    const startX = sender.x + ox;
    const startY = sender.y + oy;
    const endX = target.x + ox;
    const endY = target.y + oy;

    packet.x = startX;
    packet.y = startY;

    scene.tweens.add({
        targets: packet,
        x: endX,
        y: endY,
        duration: 500,
        ease: 'Linear',
        onComplete: () => {
            if (target.active) {
                target.receivePacket(packet);
            } else {
                packet.destroy();
            }
        }
    });
}
