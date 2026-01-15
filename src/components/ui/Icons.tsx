// src/components/ui/Icons.tsx
import React from 'react';

interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
  strokeWidth?: number;
  filled?: boolean;
}

const BaseIcon: React.FC<IconProps> = ({ 
  size = 20, 
  strokeWidth = 1.5, 
  filled = false,
  children, 
  ...props 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill={filled ? "currentColor" : "none"} 
    stroke={filled ? "none" : "currentColor"} 
    strokeWidth={strokeWidth} 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    {...props}
  >
    {children}
  </svg>
);

// --- MEDIA ICONS ---
export const PlayIcon = (props: IconProps) => (
  <BaseIcon {...props} filled={true} viewBox="0 0 24 24">
    <polygon points="5 3 19 12 5 21 5 3"></polygon>
  </BaseIcon>
);

export const PauseIcon = (props: IconProps) => (
  <BaseIcon {...props} filled={true} viewBox="0 0 24 24">
    <rect x="6" y="4" width="4" height="16"></rect>
    <rect x="14" y="4" width="4" height="16"></rect>
  </BaseIcon>
);

// --- ACTION ICONS ---
export const BookmarkIcon = ({ filled, ...props }: IconProps) => (
  <BaseIcon {...props} filled={filled}>
    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
  </BaseIcon>
);

export const ShareIcon = (props: IconProps) => (
  <BaseIcon {...props}>
    <circle cx="18" cy="5" r="3"></circle>
    <circle cx="6" cy="12" r="3"></circle>
    <circle cx="18" cy="19" r="3"></circle>
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
  </BaseIcon>
);

export const CompareIcon = (props: IconProps) => (
  <BaseIcon {...props}>
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
    <polyline points="15 3 21 3 21 9"></polyline>
    <line x1="10" y1="14" x2="21" y2="3"></line>
  </BaseIcon>
);

export const ExternalLinkIcon = (props: IconProps) => (
  <BaseIcon {...props}>
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
    <polyline points="15 3 21 3 21 9"></polyline>
    <line x1="10" y1="14" x2="21" y2="3"></line>
  </BaseIcon>
);

export const SearchIcon = (props: IconProps) => (
  <BaseIcon {...props}>
    <circle cx="11" cy="11" r="8"></circle>
    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
  </BaseIcon>
);

export const MenuIcon = (props: IconProps) => (
  <BaseIcon {...props}>
    <line x1="3" y1="12" x2="21" y2="12"></line>
    <line x1="3" y1="6" x2="21" y2="6"></line>
    <line x1="3" y1="18" x2="21" y2="18"></line>
  </BaseIcon>
);

export const ChevronDownIcon = (props: IconProps) => (
  <BaseIcon {...props}>
    <polyline points="6 9 12 15 18 9"></polyline>
  </BaseIcon>
);

export const RefreshIcon = (props: IconProps) => (
    <BaseIcon {...props}>
        <path d="M23 4v6h-6"></path>
        <path d="M1 20v-6h6"></path>
        <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
    </BaseIcon>
);

// --- STATUS ICONS ---
export const LockIcon = (props: IconProps) => (
  <BaseIcon {...props}>
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
  </BaseIcon>
);
