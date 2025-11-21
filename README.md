# Architecture Tycoon

An educational game that teaches system architecture scaling concepts through interactive simulation.

## Project Overview

This is a Phaser-based game that demonstrates **Vertical Scaling** (Level 1) with plans for **Horizontal Scaling** (Level 2). Players manage server resources to handle increasing traffic loads while maintaining low error rates.

## Project Structure

```
architecture-master/
├── index.html              # Main HTML entry point
├── css/
│   └── styles.css         # All CSS styles
├── src/
│   ├── main.js            # Main entry point, game initialization
│   ├── config.js          # Game configuration and state management
│   ├── objects/
│   │   └── ServerNode.js  # Server node game object
│   ├── scenes/
│   │   ├── WelcomeScene.js   # Welcome/intro scene
│   │   ├── Level1Scene.js    # Level 1 gameplay
│   │   └── Level2Scene.js    # Level 2 placeholder
│   └── utils/
│       ├── animations.js     # Animation utilities
│       └── uiManager.js      # UI update functions
└── README.md
```

## Architecture

### Design Patterns Used

1. **Module Pattern**: ES6 modules for code organization
2. **Separation of Concerns**: 
   - Scenes handle game flow
   - Objects encapsulate game entities
   - Utils provide shared functionality
   - Config centralizes constants
3. **Observer Pattern**: Event-driven UI updates
4. **Factory Pattern**: Node creation and management

### Key Components

#### Scenes (`src/scenes/`)
- **WelcomeScene**: Entry point with game introduction
- **Level1Scene**: Main gameplay for vertical scaling simulation
- **Level2Scene**: Placeholder for horizontal scaling level

#### Objects (`src/objects/`)
- **ServerNode**: Represents both user clients and application servers
  - Handles packet processing
  - Manages capacity and load
  - Provides visual feedback

#### Utilities (`src/utils/`)
- **animations.js**: Packet movement and connection rendering
- **uiManager.js**: DOM manipulation and game state display

#### Configuration (`src/config.js`)
- Centralized game constants
- Global game state management
- State reset functionality

## Game Mechanics

### Level 1: Vertical Scaling

**Objective**: Handle 1000 requests with <1% error rate

**Mechanics**:
- Start with $500 budget
- Upgrade server for $200 (increases capacity and speed)
- Traffic difficulty increases over time
- Monitor success/error rates in real-time

**Educational Concepts**:
- **Vertical Scaling**: Adding more resources to a single server
- **Advantages**: Simple, fast implementation
- **Disadvantages**: Hardware limits, cost scaling, single point of failure

## Running the Project

### Local Development

Since this uses ES6 modules, you need to run it through a local server:

**Option 1: Using Python**
```bash
# Python 3
python -m http.server 8000

# Then open: http://localhost:8000
```

**Option 2: Using Node.js**
```bash
npx http-server -p 8000

# Then open: http://localhost:8000
```

**Option 3: Using VS Code**
Install the "Live Server" extension and right-click on `index.html` → "Open with Live Server"

### Browser Compatibility

- Modern browsers with ES6 module support
- Chrome 61+
- Firefox 60+
- Safari 11+
- Edge 16+

## Technologies Used

- **Phaser 3.60.0**: Game framework
- **ES6 Modules**: Code organization
- **HTML5 Canvas**: Rendering
- **CSS3**: Styling

## Future Enhancements

### Level 2: Horizontal Scaling
- Multiple server instances
- Load balancer implementation
- Auto-scaling simulation
- Cost-benefit analysis

### Additional Features
- More levels with different scaling patterns
- Microservices architecture simulation
- Database scaling challenges
- Caching strategies
- CDN simulation

## Learning Outcomes

Players will understand:
1. When to use vertical vs horizontal scaling
2. Trade-offs between different scaling approaches
3. Resource management under load
4. Performance bottleneck identification
5. Cost considerations in architecture decisions

## License

Educational project - free to use and modify

## Contributing

This is an educational project. Contributions welcome for:
- Additional levels
- New architecture patterns
- Improved visualizations
- Documentation improvements
