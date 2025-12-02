/**
 * UI Configuration
 * 
 * Centralized configuration for all UI-related constants including:
 * - Font sizes and styles
 * - Button dimensions and colors
 * - Text colors
 * - Border widths
 */

export const UI_CONFIG = {
    /**
     * Font sizes for different UI elements
     */
    fonts: {
        title: '48px',           // Main title font size (Welcome screen, modal titles)
        subtitle: '24px',        // Subtitle font size (level names, button text)
        normal: '20px',          // Normal text (descriptions)
        button: '16px',          // Button text
        stat: '14px',            // Statistics text
        small: '12px'            // Small helper text
    },

    /**
     * Font styles
     */
    fontStyles: {
        bold: 'bold',
        normal: 'normal'
    },

    /**
     * Button dimensions
     */
    buttons: {
        standard: {
            width: 200,
            height: 40
        },
        large: {
            width: 250,
            height: 40
        },
        small: {
            width: 180,
            height: 40
        },
        medium: {
            width: 230,
            height: 40
        },
        borderWidth: 2
    },

    /**
     * Text colors (CSS format for HTML elements)
     */
    textColors: {
        white: '#fff',           // Primary text color
        light: '#fff',           // Light text color (for dark backgrounds)
        muted: '#aaa',           // Secondary/muted text
        success: '#00ff00',      // Success messages
        error: '#ff4444',        // Error messages
        warning: '#ffd700',      // Warning messages
        info: '#00ffff'          // Info messages
    },

    /**
     * Button colors (Phaser hex format)
     */
    buttonColors: {
        primary: 0x4a90e2,       // Standard blue button
        success: 0x4caf50,       // Green button (success actions)
        warning: 0xff9800,       // Orange button (warning actions)
        danger: 0xf44336,        // Red button (dangerous actions)
        purple: 0x9c27b0,        // Purple button (special actions)
        
        // Button highlights (lighter versions)
        primaryHighlight: 0x5aa3ff,
        successHighlight: 0x66bb6a,
        warningHighlight: 0xffa726,
        dangerHighlight: 0xff5252,
        purpleHighlight: 0xbd5dd1
    },

    /**
     * Modal configuration
     */
    modal: {
        overlayAlpha: 0.8,       // Background overlay opacity
        padding: 20,             // Internal padding
        borderRadius: 10         // Rounded corners
    },

    /**
     * Toast notification configuration
     */
    toast: {
        displayDuration: 3000,   // How long to show toast (ms)
        fadeInDuration: 300,     // Fade in animation duration (ms)
        fadeOutDuration: 300,    // Fade out animation duration (ms)
        yOffset: 100             // Distance from top of screen
    }
};
