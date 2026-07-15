import BackgroundDecoration from "../components/BackgroundDecoration";
import LeftPanel from "../components/LeftPanel";
import LoginCard from "../components/LoginCard";

export default function LoginPage() {
    return (
        <main className="relative min-h-screen overflow-hidden bg-[#F7F9FC]">

            <BackgroundDecoration />

            <section
                className="
                    relative
                    z-[20]
                    grid
                    min-h-screen
                    lg:grid-cols-[1.2fr_.8fr]
                "
            >

                <LeftPanel />

                <div
                    className="
                        relative
                        flex
                        items-center
                        justify-center
                        px-6
                        py-12
                        xl:px-20
                    "
                >

                    <LoginCard />

                </div>

            </section>

            <footer
                className="
                    absolute
                    bottom-[16px]
                    left-0
                    right-0
                    text-xs
                    tracking-[0.12em]
                    text-slate-400
                    z-30
                    text-center
                "
            >
                © 2026 Philippine Statistics Authority.
                All Rights Reserved.
            </footer>

        </main>
    );
}