/**
 * Layout Configuration
 * 
 * Centralized configuration for all layout-related constants including:
 * - Node positions and spacing
 * - Packet dimensions
 * - Screen regions
 * - Visual element sizes
 */

export const LAYOUT_CONFIG = {
    /**
     * Node spacing configurations
     */
    spacing: {
        // Legacy flat structure (kept for compatibility)
        nodes: 140,              // Vertical spacing between multiple nodes of same type
        users: 100,              // Vertical spacing between user nodes
        small: 60,               // Small spacing (e.g., between app servers)
        large: 180,              // Large spacing for separated components
        
        // Organized by direction
        vertical: {
            small: 60,           // Small vertical spacing
            medium: 100,         // Medium vertical spacing
            large: 140,          // Large vertical spacing
            extraLarge: 180      // Extra large vertical spacing
        },
        horizontal: {
            small: 80,           // Small horizontal spacing
            medium: 120,         // Medium horizontal spacing
            large: 160           // Large horizontal spacing
        }
    },

    /**
     * Button positioning
     */
    buttons: {
        bottomOffset: 50,        // Distance from bottom of screen
        horizontalOffset: 20     // Horizontal padding from edges
    },

    /**
     * Packet visual configuration
     */
    packets: {
        circleRadius: 5,         // Radius for circular packets (read requests)
        diamondSize: 6,          // Size for diamond packets (write requests)
        responseRadius: 4        // Radius for response packets
    },

    /**
     * Node visual configuration
     */
    nodes: {
        radius: 40,              // Base radius for server nodes
        borderWidth: 3,          // Border width for nodes
        textOffsetY: 55,         // Y offset for node label text
        capacityOffsetY: -45,    // Y offset for capacity text
        statsOffsetX: 60,        // X offset for stats display
        statsOffsetY: -20        // Y offset for stats display
    },

    /**
     * Connection line configuration
     */
    connections: {
        lineWidth: 2,            // Width of connection lines
        arrowSize: 8,            // Size of directional arrows
        dashLength: 5,           // Length of dashes for dashed lines
        dashGap: 3               // Gap between dashes
    },

    /**
     * Position multipliers (relative to screen dimensions)
     * These are decimal values meant to be multiplied by width/height
     */
    positions: {
        // Component-specific positions (for easy reference)
        user: { x: 0.15 },           // User nodes X position
        appServer: { x: 0.50 },      // App server X position
        database: { x: 0.80 },       // Database X position
        
        // Horizontal positions (as fraction of width)
        leftEdge: 0.12,          // Far left (users, CDN)
        leftMid: 0.15,           // Left-middle
        quarterLeft: 0.27,       // Quarter from left (load balancer)
        centerLeft: 0.30,        // Center-left
        midLeft: 0.40,           // Mid-left (app servers in some levels)
        center: 0.42,            // Center (app servers)
        midRight: 0.45,          // Mid-right
        centerRight: 0.50,       // Center-right
        threeQuarter: 0.58,      // Three-quarters (cache, databases)
        quarterRight: 0.60,      // Quarter from right
        rightMid: 0.65,          // Right-middle
        rightEdge: 0.70,         // Far right (databases)
        farRight: 0.80,          // Very far right

        // Vertical positions (as fraction of height)
        top: 0.20,               // Top region
        upperMid: 0.33,          // Upper middle (h/3)
        center: 0.50,            // Center (h/2)
        lowerMid: 0.67,          // Lower middle
        bottom: 0.80,            // Bottom region

        // Specific offsets
        aboveCenter: -220,       // Above center (CDN in Level 8)
        highAbove: -180,         // High above center (cache)
        above: -100,             // Above center
        slightlyAbove: -60,      // Slightly above
        slightlyBelow: 60,       // Slightly below
        below: 100,              // Below center
        farBelow: 200            // Far below center
    },

    /**
     * Welcome screen layout
     */
    welcome: {
        titleY: 0.33,            // Title Y position (as fraction of height)
        subtitleOffset: 60,      // Offset from title for subtitle
        buttonOffset: 60         // Offset from subtitle for button
    },

    /**
     * Z-index layers for rendering order
     */
    zIndex: {
        background: 0,
        connections: 10,
        nodes: 20,
        packets: 30,
        ui: 40,
        modal: 50,
        toast: 60
    }
};
