import logo from "../assets/logo.png";

import LoginForm from "./LoginForm";



export default function LoginCard() {

    return (

        <div className="glass-card login-shadow fade-up login-card relative w-full rounded-[34px]">

            <div className="flex justify-center">

                <img

                    src={logo}

                    alt="PSA Logo"

                    className="login-card-logo drop-shadow-[0_8px_20px_rgba(0,61,165,0.18)]"

                />

            </div>



            <h2 className="login-card-title text-center text-[#003DA5]">

                <span className="block">PHILIPPINE STATISTICS</span>

                <span className="block">AUTHORITY</span>

            </h2>



            <div className="login-card-subtitle-row flex items-center gap-[16px]">

                <div className="h-px flex-1 bg-[#D8E1F4]" />

                <p className="login-card-subtitle shrink-0 uppercase text-[#94A3B8]">

                    INVENTORY MANAGEMENT SYSTEM

                </p>

                <div className="h-px flex-1 bg-[#D8E1F4]" />

            </div>



            <div className="login-card-form">

                <LoginForm />

            </div>

        </div>

    );

}

