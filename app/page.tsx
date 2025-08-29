'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface Position {
  x: number;
  y: number;
}

interface ExplosionParticle {
  x: number;
  y: number;
  size: number;
  angle: number;
  speed: number;
  life: number;
}

export default function SquidGame() {
  const [position, setPosition] = useState<Position>({ x: 200, y: 480 });
  const [started, setStarted] = useState(false);
  // const [pressed, setPressed] = useState(false); // Removed unused variable
  const [paused, setPaused] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [gameWin, setGameWin] = useState(false);
  const [time, setTime] = useState(10000);
  const [gameTime, setGameTime] = useState(0);
  const [explosionParticles, setExplosionParticles] = useState<ExplosionParticle[]>([]);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | undefined>(undefined);
  const lastTimeRef = useRef<number>(0);
  
  const keysPressed = useRef<Set<string>>(new Set());
  const touchButtons = useRef<Set<string>>(new Set());

  const CANVAS_WIDTH = 400;
  const CANVAS_HEIGHT = 500;
  const PLAYER_SIZE = 40;
  const MOVEMENT_SPEED = 2;

  // Create explosion effect
  const createExplosion = useCallback(() => {
    const particles: ExplosionParticle[] = [];
    for (let i = 0; i < 50; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 3 + 2;
      const size = Math.random() * 8 + 4;
      
      particles.push({
        x: position.x,
        y: position.y,
        size,
        angle,
        speed,
        life: 1
      });
    }
    setExplosionParticles(particles);
  }, [position.x, position.y]);

  // Initialize game time
  useEffect(() => {
    if (started && !gameOver && !gameWin) {
      setGameTime(Math.random() * 1000 + 1000);
    }
  }, [started, gameOver, gameWin]);

  // Game loop
  const gameLoop = useCallback((currentTime: number) => {
    if (!started || gameOver || gameWin) {
      animationRef.current = requestAnimationFrame(gameLoop);
      return;
    }

    const deltaTime = currentTime - lastTimeRef.current;
    lastTimeRef.current = currentTime;

    // Update game time
    if (gameTime > 0) {
      setGameTime(prev => Math.max(0, prev - deltaTime));
    } else {
      setGameTime(Math.random() * 1000 + 1000);
      setPaused(prev => !prev);
    }

    // Update timer
    if (!paused && time > 0) {
      setTime(prev => Math.max(0, prev - deltaTime));
    }

    // Check for movement during red light
    const isMoving = keysPressed.current.size > 0 || touchButtons.current.size > 0;
    if (paused && isMoving) {
      setGameOver(true);
      createExplosion();
    }

    // Check win condition
    if (position.y <= 90) {
      setGameWin(true);
    }

    // Check lose condition
    if (time <= 0) {
      setGameOver(true);
      createExplosion();
    }

    animationRef.current = requestAnimationFrame(gameLoop);
  }, [started, gameOver, gameWin, gameTime, paused, time, position.y, createExplosion]);

  // Start game loop
  useEffect(() => {
    animationRef.current = requestAnimationFrame(gameLoop);
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [gameLoop]);

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!started || gameOver || gameWin) return;
      
      const key = e.key.toLowerCase();
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) {
        keysPressed.current.add(key);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      keysPressed.current.delete(key);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [started, gameOver, gameWin]);

  // Handle movement
  useEffect(() => {
    if (!started || gameOver || gameWin || paused) return;

    const movePlayer = () => {
      setPosition(prev => {
        let newX = prev.x;
        let newY = prev.y;

        if (keysPressed.current.has('arrowleft') || touchButtons.current.has('left')) {
          newX = Math.max(20, newX - MOVEMENT_SPEED);
        }
        if (keysPressed.current.has('arrowright') || touchButtons.current.has('right')) {
          newX = Math.min(CANVAS_WIDTH - 20, newX + MOVEMENT_SPEED);
        }
        if (keysPressed.current.has('arrowup') || touchButtons.current.has('up')) {
          newY = Math.max(90, newY - MOVEMENT_SPEED);
        }
        if (keysPressed.current.has('arrowdown') || touchButtons.current.has('down')) {
          newY = Math.min(CANVAS_HEIGHT - 20, newY + MOVEMENT_SPEED);
        }

        return { x: newX, y: newY };
      });
    };

    const interval = setInterval(movePlayer, 16); // ~60 FPS
    return () => clearInterval(interval);
  }, [started, gameOver, gameWin, paused]);

  // Handle touch buttons
  const handleTouchStart = (direction: string) => {
    if (!started || gameOver || gameWin) return;
    touchButtons.current.add(direction);
  };

  const handleTouchEnd = (direction: string) => {
    touchButtons.current.delete(direction);
  };



  // Update explosion particles
  useEffect(() => {
    if (explosionParticles.length === 0) return;

    const interval = setInterval(() => {
      setExplosionParticles(prev => 
        prev.map(particle => ({
          ...particle,
          x: particle.x + Math.cos(particle.angle) * particle.speed,
          y: particle.y + Math.sin(particle.angle) * particle.speed,
          size: particle.size - 0.5,
          life: particle.life - 0.02
        })).filter(particle => particle.life > 0 && particle.size > 0)
      );
    }, 16);

    return () => clearInterval(interval);
  }, [explosionParticles]);

  // Restart game
  const restartGame = () => {
    setPosition({ x: 200, y: 480 });
    setStarted(true);
    setPaused(false);
    setGameOver(false);
    setGameWin(false);
    setTime(10000);
    setGameTime(0);
    setExplosionParticles([]);
    keysPressed.current.clear();
    touchButtons.current.clear();
  };

  // Draw game
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = 'lightblue';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw lines
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, 70);
    ctx.lineTo(CANVAS_WIDTH, 70);
    ctx.moveTo(0, 460);
    ctx.lineTo(CANVAS_WIDTH, 460);
    ctx.stroke();

    // Draw control panel background
    ctx.fillStyle = 'skyblue';
    ctx.fillRect(8, 422, 140, 100);
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.strokeRect(8, 422, 140, 100);

    // Draw doll
    ctx.fillStyle = paused ? '#f13345' : '#4CAF50'; // Red when paused (red light), Green when not paused (green light)
    ctx.beginPath();
    ctx.ellipse(200, 35, 22.5, 30, 0, 0, Math.PI * 2);
    ctx.fill();

    // Draw doll face
    ctx.fillStyle = '#ccc';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3;
    
    // Eyes
    ctx.beginPath();
    ctx.ellipse(190, 28, 5, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    
    ctx.beginPath();
    ctx.ellipse(210, 28, 5, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Mouth
    ctx.beginPath();
    ctx.ellipse(200, 50, 7.5, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Nose
    ctx.fillStyle = '#000';
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 0;
    ctx.beginPath();
    ctx.moveTo(200, 30);
    ctx.lineTo(195, 41);
    ctx.lineTo(205, 41);
    ctx.closePath();
    ctx.fill();

    // Draw timer
    ctx.fillStyle = '#000';
    ctx.font = '20px Courier New';
    ctx.fillText(`${(time / 1000).toFixed(2)}s`, 20, 40);

    // Draw player
    if (!gameOver) {
      ctx.fillStyle = '#fe9a2e';
      ctx.beginPath();
      ctx.arc(position.x, position.y, PLAYER_SIZE / 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw explosion particles
    explosionParticles.forEach(particle => {
      ctx.fillStyle = `rgba(0, 0, 0, ${particle.life})`;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw game over text
    if (gameOver) {
      ctx.fillStyle = 'red';
      ctx.font = 'bold 18px Courier New';
      ctx.fillText('ELIMINATED', 150, 200);
    }

    // Draw win text
    if (gameWin) {
      ctx.fillStyle = 'green';
      ctx.font = 'bold 18px Courier New';
      ctx.fillText('YOU WIN', 160, 200);
    }

  }, [position, time, gameOver, gameWin, explosionParticles, paused]);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
        <h1 className="text-2xl font-bold text-center mb-4 text-gray-800">
          Squid Game - Red Light Green Light
        </h1>
        
        <div className="relative">
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            className="game-canvas w-full"
          />
          
          {/* Start/Restart Button */}
          <button
            onClick={restartGame}
            className="game-button absolute top-4 right-4 px-4 py-2 text-sm"
          >
            {started ? 'Restart Game' : 'Start Game'}
          </button>

          {/* Control Buttons */}
          <div className="absolute bottom-4 left-4 flex flex-col items-center gap-3">
            <button
              className="game-button w-12 h-12 text-lg"
              onTouchStart={() => handleTouchStart('up')}
              onTouchEnd={() => handleTouchEnd('up')}
              onMouseDown={() => handleTouchStart('up')}
              onMouseUp={() => handleTouchEnd('up')}
              onMouseLeave={() => handleTouchEnd('up')}
            >
              ▲
            </button>
            <div className="flex gap-3">
              <button
                className="game-button w-12 h-12 text-lg"
                onTouchStart={() => handleTouchStart('left')}
                onTouchEnd={() => handleTouchEnd('left')}
                onMouseDown={() => handleTouchStart('left')}
                onMouseUp={() => handleTouchEnd('left')}
                onMouseLeave={() => handleTouchEnd('left')}
              >
                ◄
              </button>
              <button
                className="game-button w-12 h-12 text-lg"
                onTouchStart={() => handleTouchStart('right')}
                onTouchEnd={() => handleTouchEnd('right')}
                onMouseDown={() => handleTouchStart('right')}
                onMouseUp={() => handleTouchEnd('right')}
                onMouseLeave={() => handleTouchEnd('right')}
              >
                ►
              </button>
            </div>
            {/* <button
              className="game-button w-12 h-12 text-lg"
              onTouchStart={() => handleTouchStart('down')}
              onTouchEnd={() => handleTouchEnd('down')}
              onMouseDown={() => handleTouchStart('down')}
              onMouseUp={() => handleTouchEnd('down')}
              onMouseLeave={() => handleTouchEnd('down')}
            >
              ▼
            </button> */}
          </div>
        </div>

        <div className="mt-4 text-center text-sm text-gray-600">
          <p>Use arrow keys or touch buttons to move</p>
          <p>Don&apos;t move when the doll is red!</p>
          <p>Reach the top to win</p>
        </div>
      </div>
    </div>
  );
}
