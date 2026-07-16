import logo from "../assets/logo.png";

function Ribbons() {
    return (
        <svg
            className="ribbon-shadow left-panel-ribbon pointer-events-none absolute top-0 z-30 h-full select-none"
            viewBox="0 0 200 900"
            preserveAspectRatio="none"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
        >
            <defs>
                {/* Enhanced PSA Blue gradient with silk-like depth */}
                <linearGradient id="ribbonBlue" x1="100%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#a8d4ff" />
                    <stop offset="15%" stopColor="#5b9fff" />
                    <stop offset="35%" stopColor="#287fed" />
                    <stop offset="55%" stopColor="#0a5fc9" />
                    <stop offset="75%" stopColor="#0544a8" />
                    <stop offset="100%" stopColor="#002b75" />
                </linearGradient>
                
                {/* Philippine Flag Yellow with golden warmth */}
                <linearGradient id="ribbonYellow" x1="100%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#fff4ad" />
                    <stop offset="20%" stopColor="#ffe36a" />
                    <stop offset="40%" stopColor="#ffd42a" />
                    <stop offset="60%" stopColor="#eaa900" />
                    <stop offset="80%" stopColor="#c99000" />
                    <stop offset="100%" stopColor="#ad7100" />
                </linearGradient>
                
                {/* Philippine Flag Red with depth */}
                <linearGradient id="ribbonRed" x1="100%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#ffb8ba" />
                    <stop offset="20%" stopColor="#ff6b6f" />
                    <stop offset="40%" stopColor="#ec2d36" />
                    <stop offset="60%" stopColor="#c9111b" />
                    <stop offset="80%" stopColor="#9c0d15" />
                    <stop offset="100%" stopColor="#750613" />
                </linearGradient>
                
                {/* Premium silk shine overlays */}
                <linearGradient id="ribbonShineBlue" x1="100%" y1="0%" x2="0%" y2="0%">
                    <stop offset="0%" stopColor="white" stopOpacity="0.52" />
                    <stop offset="25%" stopColor="white" stopOpacity="0.28" />
                    <stop offset="55%" stopColor="white" stopOpacity="0.12" />
                    <stop offset="100%" stopColor="white" stopOpacity="0" />
                </linearGradient>
                <linearGradient id="ribbonShineYellow" x1="100%" y1="0%" x2="0%" y2="0%">
                    <stop offset="0%" stopColor="white" stopOpacity="0.44" />
                    <stop offset="25%" stopColor="white" stopOpacity="0.22" />
                    <stop offset="55%" stopColor="white" stopOpacity="0.10" />
                    <stop offset="100%" stopColor="white" stopOpacity="0" />
                </linearGradient>
                <linearGradient id="ribbonShineRed" x1="100%" y1="0%" x2="0%" y2="0%">
                    <stop offset="0%" stopColor="white" stopOpacity="0.36" />
                    <stop offset="25%" stopColor="white" stopOpacity="0.18" />
                    <stop offset="55%" stopColor="white" stopOpacity="0.08" />
                    <stop offset="100%" stopColor="white" stopOpacity="0" />
                </linearGradient>
                
                {/* Ambient reflection for 3D silk effect */}
                <linearGradient id="ribbonAmbient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="white" stopOpacity="0.08" />
                    <stop offset="50%" stopColor="white" stopOpacity="0.02" />
                    <stop offset="100%" stopColor="white" stopOpacity="0.05" />
                </linearGradient>
                
                {/* Enhanced drop shadow for depth */}
                <filter id="ribbonDrop" x="-70%" y="-5%" width="240%" height="110%">
                    <feDropShadow dx="-16" dy="12" stdDeviation="18" floodColor="#001b51" floodOpacity="0.42" />
                    <feDropShadow dx="-4" dy="2" stdDeviation="4" floodColor="#c9e3ff" floodOpacity="0.52" />
                    <feDropShadow dx="0" dy="0" stdDeviation="2" floodColor="#000" floodOpacity="0.12" />
                </filter>
                
                {/* Inner shadow for ribbon layering */}
                <filter id="ribbonInner" x="-30%" y="-5%" width="160%" height="110%">
                    <feDropShadow dx="-8" dy="6" stdDeviation="10" floodColor="#000" floodOpacity="0.22" />
                    <feDropShadow dx="0" dy="0" stdDeviation="1" floodColor="#000" floodOpacity="0.08" />
                </filter>
            </defs>

            {/* Blue ribbon — widest outer with elegant S-curve */}
            <path
                d="M 200 0 
                   C 140 45, 85 95, 55 165 
                   C 25 235, 15 320, 25 405 
                   C 35 490, 75 575, 110 660 
                   C 145 745, 175 820, 200 900 
                   L 200 900 L 200 0 Z"
                fill="url(#ribbonBlue)"
                filter="url(#ribbonDrop)"
            />
            
            {/* Yellow ribbon — middle with flowing wave */}
            <path
                d="M 200 0 
                   C 165 55, 125 115, 105 185 
                   C 85 255, 80 340, 88 425 
                   C 96 510, 125 595, 150 680 
                   C 175 765, 190 835, 200 900 
                   L 200 900 L 200 0 Z"
                fill="url(#ribbonYellow)"
                filter="url(#ribbonInner)"
            />
            
            {/* Red ribbon — narrowest inner with smooth curve */}
            <path
                d="M 200 0 
                   C 180 65, 155 130, 145 200 
                   C 135 270, 135 355, 142 440 
                   C 149 525, 165 610, 180 695 
                   C 195 780, 198 845, 200 900 
                   L 200 900 L 200 0 Z"
                fill="url(#ribbonRed)"
                filter="url(#ribbonInner)"
            />

            {/* Premium silk shine overlays */}
            <path
                d="M 200 0 
                   C 140 45, 85 95, 55 165 
                   C 25 235, 15 320, 25 405 
                   C 35 490, 75 575, 110 660 
                   C 145 745, 175 820, 200 900 
                   L 200 900 L 200 0 Z"
                fill="url(#ribbonShineBlue)"
            />
            <path
                d="M 200 0 
                   C 165 55, 125 115, 105 185 
                   C 85 255, 80 340, 88 425 
                   C 96 510, 125 595, 150 680 
                   C 175 765, 190 835, 200 900 
                   L 200 900 L 200 0 Z"
                fill="url(#ribbonShineYellow)"
            />
            <path
                d="M 200 0 
                   C 180 65, 155 130, 145 200 
                   C 135 270, 135 355, 142 440 
                   C 149 525, 165 610, 180 695 
                   C 195 780, 198 845, 200 900 
                   L 200 900 L 200 0 Z"
                fill="url(#ribbonShineRed)"
            />
            
            {/* Ambient reflection for 3D depth */}
            <path
                d="M 200 0 
                   C 140 45, 85 95, 55 165 
                   C 25 235, 15 320, 25 405 
                   C 35 490, 75 575, 110 660 
                   C 145 745, 175 820, 200 900 
                   L 200 900 L 200 0 Z"
                fill="url(#ribbonAmbient)"
            />
        </svg>
    );
}

function NodeMatrix() {
    return (
        <div className="left-panel-node-matrix" aria-hidden="true">
            {Array.from({ length: 18 }).map((_, index) => (
                <span
                    key={index}
                    className="left-panel-node"
                    style={{
                        animationDelay: `${(index % 6) * 0.4 + Math.floor(index / 6) * 0.55}s`,
                    }}
                />
            ))}
        </div>
    );
}

function DataTransmissionLine() {
    return (
        <div className="left-panel-transmission" aria-hidden="true">
            <div className="left-panel-transmission-track">
                <div className="left-panel-transmission-line">
                    <span className="left-panel-transmission-pulse" />
                </div>
                <span className="left-panel-transmission-node">
                    <span className="left-panel-transmission-node-core" />
                </span>
            </div>
        </div>
    );
}

function BrandingDecorations() {
    return (
        <div className="left-panel-deco-zone">
            <NodeMatrix />
            <DataTransmissionLine />
        </div>
    );
}

function ColorBars() {
    return (
        <div className="left-panel-color-bars" aria-hidden="true">
            <span className="left-panel-color-bar left-panel-color-bar--blue" />
            <span className="left-panel-color-bar left-panel-color-bar--yellow" />
            <span className="left-panel-color-bar left-panel-color-bar--red" />
        </div>
    );
}

function FooterIndicators() {
    return (
        <div className="left-panel-footer" aria-hidden="true">
            <span className="left-panel-footer-dot left-panel-footer-dot--active" />
            <span className="left-panel-footer-dot" />
            <span className="left-panel-footer-dot" />
        </div>
    );
}

export default function LeftPanel() {
    return (
        <div className="left-panel relative hidden h-full w-full overflow-hidden lg:flex">
            {/* Blue depth gradient */}
            <div className="left-panel-gradient absolute inset-0" />

            {/* Premium background decorations */}
            <div className="left-panel-ambient-glow" />
            <div className="left-panel-glow-line" />
            <div className="left-panel-floating-dots">
                {Array.from({ length: 8 }).map((_, index) => (
                    <span key={index} className="left-panel-floating-dot" />
                ))}
            </div>

            {/* PSA brand ribbons */}
            <Ribbons />

            {/* Centered branding stack */}
            <div className="left-panel-content relative z-50 flex w-full flex-col items-center justify-center px-8 text-center xl:px-12">
                <BrandingDecorations />

                <img
                    src={logo}
                    alt="PSA Logo"
                    className="left-panel-logo float"
                />

                <h1 className="left-panel-title text-white">
                    <span>PHILIPPINE STATISTICS</span>
                    <span>AUTHORITY</span>
                </h1>

                <ColorBars />

                <p className="left-panel-subtitle">
                    Solid • Responsive • World-class
                </p>
            </div>

            <FooterIndicators />
        </div>
    );
}
