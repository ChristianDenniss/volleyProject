declare module 'simplebar-react' {
    import { ComponentType, ReactNode } from 'react';
    
    interface SimpleBarProps {
        children?: ReactNode;
        className?: string;
        style?: React.CSSProperties;
    }
    
    const SimpleBar: ComponentType<SimpleBarProps>;
    export default SimpleBar;
} 