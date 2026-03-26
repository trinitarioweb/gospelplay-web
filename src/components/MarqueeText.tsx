'use client';

import { useRef, useEffect, useState } from 'react';

interface MarqueeTextProps {
  text: string;
  className?: string;
}

export default function MarqueeText({ text, className = '' }: MarqueeTextProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);

  useEffect(() => {
    const check = () => {
      if (containerRef.current && textRef.current) {
        setIsOverflowing(textRef.current.scrollWidth > containerRef.current.clientWidth);
      }
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, [text]);

  if (!isOverflowing) {
    return (
      <div ref={containerRef} className={`overflow-hidden ${className}`}>
        <span ref={textRef} className="whitespace-nowrap">{text}</span>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`marquee-container ${className}`}
      style={{ '--marquee-width': `${containerRef.current?.clientWidth || 200}px` } as React.CSSProperties}
    >
      <span ref={textRef} className="marquee-scroll">{text}</span>
    </div>
  );
}
