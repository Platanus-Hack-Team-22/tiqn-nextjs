"use client";

import { useEffect, useRef } from "react";

interface AudioVisualizerProps {
  isActive: boolean;
}

export function AudioVisualizer({ isActive }: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | undefined>(undefined);
  const barsRef = useRef<number[]>([]);

  // Initialize bars with random values - more bars for better detail
  useEffect(() => {
    if (isActive) {
      barsRef.current = Array(64)
        .fill(0)
        .map(() => Math.random() * 0.3 + 0.1);
    }
  }, [isActive]);

  useEffect(() => {
    if (!isActive || !canvasRef.current) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d", { 
      alpha: true,
      desynchronized: false,
      willReadFrequently: false
    });
    if (!ctx) return;

    // Set canvas size with high DPI for better quality
    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      
      // Set actual canvas size in memory (scaled by device pixel ratio)
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      
      // Reset transform and scale context to match device pixel ratio
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
      
      // Enable better rendering quality
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    let time = 0;

    const animate = () => {
      if (!ctx) return;

      // Get display dimensions in CSS pixels (context is already scaled)
      const displayWidth = canvas.offsetWidth;
      const displayHeight = canvas.offsetHeight;

      // Clear canvas with slight transparency for trail effect
      ctx.fillStyle = "rgba(255, 250, 241, 0.08)";
      ctx.fillRect(0, 0, displayWidth, displayHeight);

      const barCount = 64; // More bars for better detail
      const barWidth = displayWidth / barCount;
      const centerY = displayHeight / 2;

      // Update bar values with smooth, organic movement
      barsRef.current = barsRef.current.map((bar, i) => {
        // Create wave-like motion with multiple frequencies
        const wave1 = Math.sin(time * 0.5 + i * 0.15) * 0.15;
        const wave2 = Math.sin(time * 0.8 + i * 0.25) * 0.1;
        const wave3 = Math.sin(time * 1.2 + i * 0.1) * 0.08;
        
        // Add some randomness for organic feel
        const noise = (Math.random() - 0.5) * 0.03;
        
        // Smooth transition towards target value
        const target = 0.2 + wave1 + wave2 + wave3 + noise;
        return bar * 0.88 + target * 0.12;
      });

      // Draw bars with better quality
      barsRef.current.forEach((bar, i) => {
        const x = i * barWidth;
        const barHeight = bar * displayHeight * 0.65; // Max 65% of height
        const barSpacing = barWidth * 0.15; // Less spacing for more detail
        
        // Create smoother gradient for each bar
        const gradient = ctx.createLinearGradient(x, centerY - barHeight, x, centerY + barHeight);
        gradient.addColorStop(0, `rgba(26, 26, 26, ${0.25 + bar * 0.5})`);
        gradient.addColorStop(0.3, `rgba(26, 26, 26, ${0.4 + bar * 0.4})`);
        gradient.addColorStop(0.7, `rgba(26, 26, 26, ${0.4 + bar * 0.4})`);
        gradient.addColorStop(1, `rgba(26, 26, 26, ${0.15 + bar * 0.3})`);

        // Draw with rounded corners effect using better rendering
        ctx.fillStyle = gradient;
        
        // Top bar
        ctx.fillRect(x + barSpacing, centerY - barHeight, barWidth - barSpacing * 2, barHeight);
        
        // Bottom bar (mirrored)
        ctx.fillRect(x + barSpacing, centerY, barWidth - barSpacing * 2, barHeight);
      });

      // Draw center line (subtle)
      ctx.strokeStyle = "rgba(26, 26, 26, 0.08)";
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(0, centerY);
      ctx.lineTo(displayWidth, centerY);
      ctx.stroke();

      time += 0.02;
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isActive]);

  if (!isActive) return null;

  return (
    <div className="absolute top-0 left-0 right-0 z-20 h-24 border-b border-[#E6DAC7]/40 bg-gradient-to-b from-[#FFFAF1]/90 via-[#FFFAF1]/50 to-transparent px-6">
      <canvas
        ref={canvasRef}
        className="h-full w-full"
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
}

