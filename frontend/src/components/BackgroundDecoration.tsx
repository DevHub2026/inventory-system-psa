import circuits from "../assets/circuits.svg";
import topRight from "../assets/corner-top-right.svg";
import bottomLeft from "../assets/corner-bottom-left.svg";

export default function BackgroundDecoration() {
    return (
        <>

            <div className="absolute inset-0 overflow-hidden pointer-events-none">

                <img
                    src={circuits}
                    alt=""
                    className="
                        absolute
                        inset-0
                        w-full
                        h-full
                        object-cover
                        opacity-[0.04]
                        select-none
                    "
                />

                <img
                        src={topRight}
                        alt=""
                        className="
                        absolute
                        top-0
                        right-0
                        w-[500px]
                        opacity-35
                        select-none
    "
/>

                <img
                        src={bottomLeft}
                        alt=""
                        className="
                            absolute
                            bottom-0
                            left-0
                            w-[420px]
                            opacity-45
                            select-none
                        "
                    />

                <div
                    className="
                        absolute
                        -top-[144px]
                        -right-[112px]
                        w-[520px]
                        h-[520px]
                        rounded-full
                        bg-blue-300/18
                        blur-[180px]
                    "
                />

                <div
                    className="
                        absolute
                        -bottom-[144px]
                        -left-[112px]
                        w-[420px]
                        h-[420px]
                        rounded-full
                        bg-blue-100/35
                        blur-[170px]
                    "
                />

                <div
                    className="
                        absolute
                        top-[48px]
                        left-[48px]
                        grid
                        grid-cols-6
                        gap-[12px]
                        opacity-[0.35]
                    "
                >

                    {Array.from({ length: 18 }).map((_, i) => (

                        <span
                            key={i}
                            className="
                                w-[8px]
                                h-[8px]
                                rounded-full
                                bg-[#5B8CFF]
                            "
                        />

                    ))}

                </div>

                <div
                    className="
                        absolute
                        bottom-[80px]
                        right-[80px]
                        grid
                        grid-cols-6
                        gap-[12px]
                        opacity-[0.25]
                    "
                >

                    {Array.from({ length: 18 }).map((_, i) => (

                        <span
                            key={i}
                            className="
                                w-[8px]
                                h-[8px]
                                rounded-full
                                bg-[#5B8CFF]
                            "
                        />

                    ))}

                </div>

                <div
                    className="
                        absolute
                        inset-0
                        bg-gradient-to-br
                        from-white/20
                        via-transparent
                        to-blue-50/30
                    "
                />

            </div>

        </>
    );
}