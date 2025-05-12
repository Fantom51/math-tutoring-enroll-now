
"use client";

import React, { useEffect, useState } from "react";
import ReactConfetti from "react-confetti";

interface ConfettiProps {
  isActive: boolean;
}

const Confetti = ({ isActive }: ConfettiProps) => {
  const [windowDimensions, setWindowDimensions] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (isActive) {
      setShowConfetti(true);
      const timer = setTimeout(() => {
        setShowConfetti(false);
      }, 5000); // Show confetti for 5 seconds
      return () => clearTimeout(timer);
    }
  }, [isActive]);

  useEffect(() => {
    const handleResize = () => {
      setWindowDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (!showConfetti) return null;

  return (
    <ReactConfetti
      width={windowDimensions.width}
      height={windowDimensions.height}
      recycle={false}
      numberOfPieces={500}
      gravity={0.2}
      colors={[
        "#FFC700", // Gold
        "#FF4D6D", // Pink
        "#7209B7", // Purple
        "#4CC9F0", // Blue
        "#F72585", // Magenta
        "#3B82F6", // Math secondary color
        "#1E3A8A", // Math primary color
      ]}
    />
  );
};

export default Confetti;
