function DotCluster({ className, count = 15 }: { className: string; count?: number }) {
    return (
        <div className={`login-dot-cluster ${className}`} aria-hidden="true">
            {Array.from({ length: count }).map((_, index) => <span key={index} />)}
        </div>
    );
}

export default function BackgroundDecoration() {
    return (
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
            <div className="bg-decoration-gradient absolute inset-0" />
            <div className="login-light-panel login-light-panel--top" />
            <div className="login-light-panel login-light-panel--middle" />
            <div className="login-light-panel login-light-panel--bottom" />
            <div className="bg-decoration-glow bg-decoration-glow--primary" />
            <div className="bg-decoration-glow bg-decoration-glow--secondary" />
            <div className="bg-decoration-glow bg-decoration-glow--accent" />
            <div className="bg-decoration-glass bg-decoration-glass--top" />
            <div className="bg-decoration-glass bg-decoration-glass--bottom" />
            <div className="login-reflection login-reflection--one" />
            <div className="login-reflection login-reflection--two" />
            <DotCluster className="login-dot-cluster--top" />
            <DotCluster className="login-dot-cluster--bottom" count={12} />
        </div>
    );
}
