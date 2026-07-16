import circuits from "../assets/circuits.svg";
import topRight from "../assets/corner-top-right.svg";
import bottomLeft from "../assets/corner-bottom-left.svg";

function DotGrid({ className }: { className?: string }) {
    return (
        <div className={`psa-dot-grid bg-dot-grid ${className ?? ""}`} aria-hidden="true">
            {Array.from({ length: 18 }).map((_, i) => (
                <span key={i} />
            ))}
        </div>
    );
}

export default function BackgroundDecoration() {
    return (
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="bg-decoration-gradient absolute inset-0" />

            <img
                src={circuits}
                alt=""
                className="absolute inset-0 h-full w-full select-none object-cover opacity-[0.04]"
            />

            <img
                src={topRight}
                alt=""
                className="absolute right-0 top-0 w-[440px] select-none opacity-[0.18]"
            />

            <img
                src={bottomLeft}
                alt=""
                className="absolute bottom-0 left-0 w-[360px] select-none opacity-[0.2]"
            />

            <div className="bg-decoration-glow bg-decoration-glow--primary" />
            <div className="bg-decoration-glow bg-decoration-glow--secondary" />
            <div className="bg-decoration-glow bg-decoration-glow--accent" />

            <DotGrid className="absolute right-16 top-14" />
            <DotGrid className="absolute bottom-32 right-20" />
        </div>
    );
}
