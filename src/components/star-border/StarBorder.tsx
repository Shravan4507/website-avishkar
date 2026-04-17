import React from 'react';
import './StarBorder.css';

export const NeonColors = {
    Cyan: '#00ffff',
    Magenta: '#ff00ff',
    Lime: '#00ff00',
    Yellow: '#ffff00',
    Orange: '#ff8c00',
    Purple: '#bc13fe',
    Blue: '#00bfff',
    Electric: ['#00ffff', '#ff00ff', '#00ff00'],
    Sunrise: ['#ff8c00', '#ff00ff', '#ffff00'],
    Ocean: ['#000000', '#1630f9']
};

type StarBorderProps<T extends React.ElementType> = {
    as?: T;
    className?: string;
    children?: React.ReactNode;
    color?: string | string[];
    speed?: React.CSSProperties['animationDuration'];
    thickness?: number;
    borderRadius?: number | string;
} & Omit<React.ComponentPropsWithoutRef<T>, 'color'>;

const StarBorder = <T extends React.ElementType = 'button'>({
    as,
    className = '',
    color = 'white',
    speed = '6s',
    thickness = 1,
    borderRadius = 20,
    children,
    ...rest
}: StarBorderProps<T>) => {
    const Component = as || ('button' as React.ElementType);

    return (
        <Component
            className={`star-border-container ${className}`}
            {...(rest as any)}
            style={{
                padding: `${thickness}px`,
                borderRadius: borderRadius,
                '--star-color': Array.isArray(color) ? color[0] : color,
                '--star-speed': speed,
                ...(rest as any).style
            } as React.CSSProperties}
        >
            <div className="star-border-glow"></div>
            <div className="inner-content">{children}</div>
        </Component>
    );
};

export default StarBorder;
