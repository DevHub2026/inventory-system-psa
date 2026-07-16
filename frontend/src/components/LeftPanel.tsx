import logo from "../assets/logo.png";
import building from "../assets/building.svg";
import overlay from "../assets/gradient-overlay.svg";

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
                <linearGradient id="ribbonBlue" x1="100%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#2B7FEE" />
                    <stop offset="32%" stopColor="#0057D9" />
                    <stop offset="100%" stopColor="#003DA5" />
                </linearGradient>
                <linearGradient id="ribbonYellow" x1="100%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#FFE566" />
                    <stop offset="48%" stopColor="#FFD400" />
                    <stop offset="100%" stopColor="#D4A800" />
                </linearGradient>
                <linearGradient id="ribbonRed" x1="100%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#FF5A5F" />
                    <stop offset="48%" stopColor="#E31C23" />
                    <stop offset="100%" stopColor="#A81016" />
                </linearGradient>
                <linearGradient id="ribbonShineBlue" x1="100%" y1="0%" x2="0%" y2="0%">
                    <stop offset="0%" stopColor="white" stopOpacity="0.42" />
                    <stop offset="28%" stopColor="white" stopOpacity="0.16" />
                    <stop offset="100%" stopColor="white" stopOpacity="0" />
                </linearGradient>
                <linearGradient id="ribbonShineYellow" x1="100%" y1="0%" x2="0%" y2="0%">
                    <stop offset="0%" stopColor="white" stopOpacity="0.34" />
                    <stop offset="28%" stopColor="white" stopOpacity="0.12" />
                    <stop offset="100%" stopColor="white" stopOpacity="0" />
                </linearGradient>
                <linearGradient id="ribbonShineRed" x1="100%" y1="0%" x2="0%" y2="0%">
                    <stop offset="0%" stopColor="white" stopOpacity="0.28" />
                    <stop offset="28%" stopColor="white" stopOpacity="0.1" />
                    <stop offset="100%" stopColor="white" stopOpacity="0" />
                </linearGradient>
                <filter id="ribbonDrop" x="-60%" y="-2%" width="220%" height="104%">
                    <feDropShadow dx="-10" dy="8" stdDeviation="16" floodColor="#000" floodOpacity="0.32" />
                </filter>
                <filter id="ribbonInner" x="-24%" y="-2%" width="148%" height="104%">
                    <feDropShadow dx="-5" dy="4" stdDeviation="7" floodColor="#000" floodOpacity="0.18" />
                </filter>
            </defs>

            {/* Blue — widest outer ribbon */}
            <path
                d="M 200 0 C 96 190, 20 260, 20 450 C 20 640, 96 710, 200 900 L 200 900 L 200 0 Z"
                fill="url(#ribbonBlue)"
                filter="url(#ribbonDrop)"
            />
            {/* Yellow — middle ribbon */}
            <path
                d="M 200 0 C 138 205, 76 275, 76 450 C 76 625, 138 695, 200 900 L 200 900 L 200 0 Z"
                fill="url(#ribbonYellow)"
                filter="url(#ribbonInner)"
            />
            {/* Red — narrowest inner ribbon */}
            <path
                d="M 200 0 C 170 220, 132 295, 132 450 C 132 605, 170 680, 200 900 L 200 900 L 200 0 Z"
                fill="url(#ribbonRed)"
                filter="url(#ribbonInner)"
            />

            {/* Soft highlight overlays */}
            <path
                d="M 200 0 C 96 190, 20 260, 20 450 C 20 640, 96 710, 200 900 L 200 900 L 200 0 Z"
                fill="url(#ribbonShineBlue)"
            />
            <path
                d="M 200 0 C 138 205, 76 275, 76 450 C 76 625, 138 695, 200 900 L 200 900 L 200 0 Z"
                fill="url(#ribbonShineYellow)"
            />
            <path
                d="M 200 0 C 170 220, 132 295, 132 450 C 132 605, 170 680, 200 900 L 200 900 L 200 0 Z"
                fill="url(#ribbonShineRed)"
            />
        </svg>
    );
}

function CircuitTraces() {
    return (
        <svg
            className="left-panel-circuit-traces"
            viewBox="0 0 380 108"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
        >
            <path
                d="M12 18 H88 M132 18 H208 M252 18 H328"
                stroke="rgba(255, 255, 255, 0.15)"
                strokeWidth="0.75"
                strokeLinecap="round"
            />
            <path
                d="M12 48 H72 M112 48 H192 M232 48 H312 M352 48 H368"
                stroke="rgba(169, 200, 255, 0.15)"
                strokeWidth="0.75"
                strokeLinecap="round"
            />
            <path
                d="M32 78 H120 M160 78 H248 M288 78 H368"
                stroke="rgba(255, 255, 255, 0.15)"
                strokeWidth="0.75"
                strokeLinecap="round"
            />
            <path
                d="M88 18 V48 M208 18 V48 M192 48 V78"
                stroke="rgba(216, 232, 255, 0.12)"
                strokeWidth="0.75"
                strokeLinecap="round"
            />
            <path
                d="M8 96 H28 M8 96 V76"
                stroke="rgba(169, 200, 255, 0.15)"
                strokeWidth="0.75"
                strokeLinecap="round"
            />
            <path
                d="M352 96 H372 M372 96 V76"
                stroke="rgba(169, 200, 255, 0.15)"
                strokeWidth="0.75"
                strokeLinecap="round"
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
            <CircuitTraces />
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
            {/* Building photograph */}
            <img
                src={building}
                alt=""
                className="left-panel-building absolute inset-0 h-full w-full object-cover"
            />

            {/* Gradient overlay asset */}
            <img
                src={overlay}
                alt=""
                className="left-panel-overlay absolute inset-0 h-full w-full object-cover"
            />

            {/* Blue depth gradient */}
            <div className="left-panel-gradient absolute inset-0" />

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
