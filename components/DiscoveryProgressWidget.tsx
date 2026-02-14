import React, { useState, useEffect, useRef } from 'react';

interface DiscoveryProgressWidgetProps {
    percentage: number;
    completedCount: number;
    totalCount: number;
}

/**
 * Smoothly interpolate hue from Red (0) → Yellow (60) → Green (120)
 * based on a 0-100 percentage.
 */
function getProgressColor(pct: number): string {
    const hue = Math.round(pct * 1.2); // 0→0 (red), 50→60 (yellow), 100→120 (green)
    return `hsl(${hue}, 85%, 55%)`;
}

const DiscoveryProgressWidget: React.FC<DiscoveryProgressWidgetProps> = ({
    percentage,
    completedCount,
    totalCount,
}) => {
    const [animatedPct, setAnimatedPct] = useState(0);
    const [isHovered, setIsHovered] = useState(false);
    const hasAnimated = useRef(false);

    const size = 80;
    const strokeWidth = 6;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;

    // Animate on first hover
    useEffect(() => {
        if (isHovered && !hasAnimated.current) {
            hasAnimated.current = true;
            // Start from 0 and animate to actual percentage
            setAnimatedPct(0);
            requestAnimationFrame(() => {
                setTimeout(() => setAnimatedPct(percentage), 50);
            });
        }
    }, [isHovered, percentage]);

    // Update animated state when percentage changes (after initial animation)
    useEffect(() => {
        if (hasAnimated.current) {
            setAnimatedPct(percentage);
        }
    }, [percentage]);

    // On mount, show the actual value (no animation until hover)
    const displayPct = hasAnimated.current ? animatedPct : percentage;
    const offset = circumference - (displayPct / 100) * circumference;
    const color = getProgressColor(displayPct);

    return (
        <div
            className="relative flex items-center justify-center cursor-pointer group"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <svg
                width={size}
                height={size}
                className="transform -rotate-90 transition-transform duration-300 group-hover:scale-110"
            >
                {/* Background track */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke="rgba(255,255,255,0.08)"
                    strokeWidth={strokeWidth}
                />
                {/* Progress arc */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke={color}
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    style={{
                        transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1), stroke 0.8s ease',
                        filter: `drop-shadow(0 0 6px ${color})`,
                    }}
                />
            </svg>

            {/* Center text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span
                    className="text-lg font-bold transition-colors duration-500"
                    style={{ color }}
                >
                    {Math.round(displayPct)}%
                </span>
            </div>

            {/* Hover tooltip */}
            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
                <span className="text-[10px] text-slate-400 bg-surface-dark/90 px-2 py-1 rounded-md border border-white/10">
                    {completedCount}/{totalCount} tasks
                </span>
            </div>
        </div>
    );
};

export default DiscoveryProgressWidget;
