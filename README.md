# BARCODE: System Override

## Game Overview
A cinematic action-adventure game blending rhythm-based combat, dialogue choices, and puzzle hacking sequences in a retro-futuristic, VHS-era dystopia. Players control 6 Bit, a masked hacker-rapper navigating the corrupted BARCODE Network to restore lost data while battling the AI uprising led by 9 Bit.

## Architecture Summary
Clean modular game engine with separate systems for player control, enemy AI, rhythm combat, hacking puzzles, and CRT visual effects. Uses global namespace pattern for production builds with FILE_MANIFEST dependency tracking. All legacy code has been removed and consolidated into a focused modular structure.

## File Index
### Core Systems
- `index.html` - Entry point with CRT effects, UI elements, and clean script loading
- `src/utils/math.js` - Vector2D math utilities and collision detection
- `src/core/input.js` - Keyboard input handling and fullscreen support
- `src/core/loop.js` - 60fps game loop with delta-time physics
- `src/core/fullscreen.js` - Fullscreen management with preference tracking
- `src/core/boot.js` - Boot system for coordinated initialization

### Engine Systems
- `src/engine/renderer.js` - Canvas rendering with post-processing effects
- `src/engine/audio.js` - Web Audio API with synthetic beats and rhythm synchronization
- `src/engine/particles.js` - Particle effects system
- `src/engine/parallax.js` - Dual-layer parallax background system
- `src/engine/spaceships.js` - Space ship management system
- `src/engine/lore.js` - Lore system for story fragments
- `src/engine/jammer-indicator.js` - Visual jammer tracking system
- `src/engine/cutscene.js` - Intro cutscene management
- `src/engine/boot-loader.js` - Terminal boot sequence with audio feedback
- `src/engine/title-screen.js` - Title screen music and UI management
- `src/engine/ui-manager.js` - Core UI drawing functions
- `src/engine/game-logic.js` - Game state management utilities

### Game Systems
- `src/game/player.js` - 6 Bit character controller with movement and abilities
- `src/game/enemies.js` - Digital entities, corrupted AI enemies with enhanced firewall behaviors, and JammerEnemy class for stationary rhythm-damage-only broadcast jammers
- `src/game/hacking.js` - Terminal hacking puzzle sequences
- `src/game/rhythm.js` - Rhythm-based combat system and beat detection
- `src/game/tutorial.js` - Story tutorial and objective tracking system
- `src/game/post-tutorial-objectives.js` - Post-tutorial objective management
- `src/game/lost-data.js` - Collectible lore fragment system
- `src/game/sector1-progression.js` - Sector 1 progression and boss spawning
- `src/game/objectives.js` - Mission objectives tracking with enhanced jammer spawning logic
- `src/game/jammer-spawn-logic.js` - Dedicated jammer spawn methods for EnemyManager
- `jammer-fix-patch.js` - Hotfix patch for jammer sprite initialization and rendering issues
- `src/game/collision-fix.js` - Jammer collision patch allowing player walk-through behavior

### Game Modules (Clean Modular Structure)
- `src/game/game-state.js` - Centralized game state management and game conditions
- `src/game/update-coordinator.js` - Update logic coordination with system separation
- `src/game/render-coordinator.js` - Render coordination and drawing management
- `src/game/ui-manager.js` - UI drawing and interface management
- `src/game/game-initializer.js` - Audio, sprite, and system initialization
- `src/game/dependency-validator.js` - Dependency validation and error checking
- `src/game/debug-commands.js` - Comprehensive debug commands and essential helper functions
- `src/game/main-new.js` - Clean modular main game controller (ACTIVE)

### Legacy Files (Deprecated - Not Loaded)
- `src/game/main.js` - Legacy main file fully deprecated
- `src/game/main-legacy-backup.js` - Legacy backup documentation
- `src/game/main-legacy-removed.js` - Legacy removal documentation

### Deprecated Jammer Files (Removed)
- `src/game/jammer-arrow.js` - Use jammer-indicator.js instead
- `src/game/jammer-arrows.js` - Use jammer-indicator.js instead
- `src/game/jammer.js` - Use broadcast-jammer.js and jammer-indicator.js
- `src/game/jammer-simple.js` - Use broadcast-jammer.js and jammer-indicator.js

### Core Systems
- `src/core/game-manager.js` - Core game management utilities
- `src/core/game/game-manager.js` - Enhanced game management with initialization

### Assets
- `style.css` - Enhanced visual effects and responsive design
- `sprites-manifest.json` - Character and animation definitions

## Features

### Core Gameplay
- ✅ Clean Modular Architecture - All legacy code removed, consolidated into focused modules under 500 lines each
- ✅ Dependency Management - FILE_MANIFEST system with accurate dependency tracking and validation
- ✅ Error-Free Loading - All deprecated files removed from script loading, no console warnings
- ✅ Sector 1 Progression System - Complete free-roam map with logical progression triggers
- ✅ Dynamic Boss Spawning - CITY SCRAMBLER emerges after progression conditions met
- ✅ Enemy-Based Jammer System - JammerEnemy class with stationary behavior, 8 health, and rhythm-only damage mechanics integrated into regular enemy system
- ✅ Rhythm Combat System - Beat-synchronized attacks with precise Web Audio API timing
- ✅ Hacking Puzzles - Terminal sequences with 4 puzzle types
- ✅ Enemy AI System - Digital entities with unique behaviors and patterns
- ✅ Lore Collection - 100+ unique story fragments with collection system

### Visual Effects
- ✅ CRT Visual Effects - Scanlines, glitch overlays, and neon glow effects
- ✅ Particle Systems - Visual feedback for jumps, attacks, damage, and impacts
- ✅ Enhanced Parallax Background - Dual-layer system for depth perception
- ✅ Dynamic Camera Zoom - Selective zoom system for gameplay area
- ✅ Player Entrance Animation - Cinematic entrance with particle effects
- ✅ Enemy Visual Systems - Sprite-based enemies with proper animations

### Audio Systems
- ✅ Web Audio API Integration - Synthetic beats and rhythm synchronization
- ✅ Dynamic Music System - Context-aware background music with crossfading
- ✅ Enhanced Sound Effects - Enemy proximity sounds, whoosh effects, and combat audio
- ✅ Enemy Defeat Sounds - defeat1.mp3 for virus, defeat2.mp3 for corrupted, defeat3.mp3 for firewall enemies
- ✅ Boot Sequence Audio - Rich audio feedback during terminal boot
- ✅ Precise Timing - Web Audio API-based scheduling for exact synchronization

### Technical Features
- ✅ Fullscreen Management - Dedicated fullscreen manager with preference tracking
- ✅ Delta Time Physics - Frame-rate independent movement and animations
- ✅ Collision Detection - Tight hitbox system with accurate collision detection
- ✅ Performance Optimization - Enemy caps, render optimization, and memory management
- ✅ Error Handling - Comprehensive error recovery and fallback mechanisms
- ✅ Debug Commands - Extensive debug system for development and testing
- ✅ Progress Reset System - Death before 20 enemies defeated resets all progress; 20+ enemies saves progress

### Quality of Life
- ✅ Always-On Objectives Display - Constant mission tracking with persistent completion on game over
- ✅ Enhanced Enemy Counter - Prominent defeat counter with progress indicators
- ✅ Tutorial System - Complete narrative introduction with guided objectives
- ✅ Controller Support - Keyboard input with fullscreen support (Shift+F)
- ✅ Smooth Animations - MakkoEngine integration with professional sprite animation
- ✅ Virus Spawn Overlap Prevention - Randomized spawn velocities prevent enemy stacking
- ✅ Reduced Jammer Size - Broadcast jammers now 80px smaller and 100px lower for better visibility
- ✅ Single Firewall Limit - Only 1 firewall enemy can spawn at a time (previously 2)
- ✅ Jammer Walk-through System - Player can walk through broadcast jammers with no collision
- ✅ Enemy Layer Rendering - Corrupted and firewall enemies render behind jammers for proper visual depth

## Key Patterns
- Clean Modular Architecture - Focused modules with proper separation of concerns
- Global Namespace Pattern - All code attached to window.* for production builds
- Component-Based Systems - Modular game logic separated by functionality
- Dependency Tracking - FILE_MANIFEST system for accurate load ordering
- Error Recovery - Robust error handling throughout all systems
- Performance Optimization - Efficient rendering and memory management
- Audio-Visual Synchronization - Perfect timing between audio and visual elements

## Development Notes
- All legacy code has been removed and consolidated into the modular structure
- Console warnings about deprecated files have been eliminated
- Script loading in index.html only includes active, necessary files
- Documentation updated to reflect clean modular architecture
- Dependency validation ensures all systems load correctly
- Debug commands available for development and testing
- Enhanced broadcast jammer system completely removed - all jammer functionality now uses enemy-based JammerEnemy class integrated into regular enemy system