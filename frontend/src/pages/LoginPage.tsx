import BackgroundDecoration from "../components/BackgroundDecoration";
import LeftPanel from "../components/LeftPanel";
import LoginCard from "../components/LoginCard";

export default function LoginPage() {
    return (
        <main className="login-page relative bg-[#F7F9FC]">
            <section className="login-page-grid relative z-[20] grid h-full grid-cols-1 overflow-hidden lg:grid-cols-2">
                <LeftPanel />

                <div className="login-right-panel relative flex h-full flex-col px-6 md:px-10 lg:px-12 xl:px-16">
                    <BackgroundDecoration />

                    <div className="login-card-wrapper fade-up relative z-10 flex w-full justify-center">
                        <LoginCard />
                    </div>

                    <footer className="login-page-footer absolute bottom-6 left-0 right-0 z-30 text-center text-[12px] tracking-[0.06em] text-[#94A3B8]">
                        © 2028 Philippine Statistics Authority. All rights reserved.
                    </footer>
                </div>
            </section>
        </main>
    );
}
