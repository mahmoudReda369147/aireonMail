import React, { useEffect, useState } from 'react';

interface Snowflake {
  id: number;
  left: number;
  animationDuration: number;
  animationDelay: number;
  fontSize: number;
  opacity: number;
}

export const SnowEffect: React.FC = () => {
  const [snowflakes, setSnowflakes] = useState<Snowflake[]>([]);

  useEffect(() => {
    // Create 50 snowflakes with random properties
    const flakes: Snowflake[] = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      left: Math.random() * 100, // Random horizontal position (0-100%)
      animationDuration: 10 + Math.random() * 20, // Fall duration (10-30s)
      animationDelay: Math.random() * 5, // Stagger start times (0-5s)
      fontSize: 10 + Math.random() * 20, // Size variation (10-30px)
      opacity: 0.3 + Math.random() * 0.7, // Opacity variation (0.3-1)
    }));

    setSnowflakes(flakes);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
      {snowflakes.map((flake) => (
        <div
          key={flake.id}
          className="absolute text-white select-none snowflake"
          style={{
            left: `${flake.left}%`,
            top: '-10%',
            fontSize: `${flake.fontSize}px`,
            opacity: flake.opacity,
            animation: `snowfall ${flake.animationDuration}s linear ${flake.animationDelay}s infinite`,
            textShadow: '0 0 5px rgba(255, 255, 255, 0.5)',
          }}
        >
          ❄
        </div>
      ))}

      <style>{`
        @keyframes snowfall {
          0% {
            transform: translateY(0) translateX(0) rotate(0deg);
          }
          25% {
            transform: translateY(25vh) translateX(10px) rotate(90deg);
          }
          50% {
            transform: translateY(50vh) translateX(-10px) rotate(180deg);
          }
          75% {
            transform: translateY(75vh) translateX(10px) rotate(270deg);
          }
          100% {
            transform: translateY(110vh) translateX(0) rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
};
