import React from 'react';
import { cn } from '../../lib/utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'surface' | 'interactive' | 'highlight';
}

export const Card: React.FC<CardProps> = ({
  className,
  variant = 'default',
  children,
  ...props
}) => {
  const variants = {
    default: 'bg-[#131B2F] border border-slate-800/80 shadow-lg shadow-black/20',
    surface: 'bg-[#0E1526] border border-slate-850',
    interactive:
      'bg-[#131B2F] border border-slate-800/80 hover:border-slate-700 hover:bg-[#162038] transition-all duration-200 cursor-pointer shadow-lg shadow-black/20',
    highlight:
      'bg-[#131B2F] border border-[#C8FF55]/30 shadow-[0_0_25px_rgba(200,255,85,0.06)]',
  };

  return (
    <div
      className={cn('rounded-2xl p-5 md:p-6 transition-colors', variants[variant], className)}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  children,
  ...props
}) => (
  <div className={cn('flex flex-col space-y-1.5 mb-4', className)} {...props}>
    {children}
  </div>
);

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({
  className,
  children,
  ...props
}) => (
  <h3 className={cn('text-lg font-semibold text-white tracking-tight', className)} {...props}>
    {children}
  </h3>
);

export const CardDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({
  className,
  children,
  ...props
}) => (
  <p className={cn('text-xs text-slate-400 font-normal leading-relaxed', className)} {...props}>
    {children}
  </p>
);
