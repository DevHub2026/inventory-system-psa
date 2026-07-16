import { useState } from "react";
import type { FormEvent } from "react";
import { User, Lock, Eye, EyeOff, Shield } from "lucide-react";

import Input from "./Input";

export default function LoginForm() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [remember, setRemember] = useState(false);
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();

        setLoading(true);

        try {
            console.log({
                email,
                password,
                remember,
            });

            // TODO:
            // await axios.post(...)
            // await fetch(...)
            // Laravel Sanctum / API login
        } finally {
            setLoading(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="login-card-form-fields">
            <Input
                id="email"
                name="email"
                placeholder="Username or Email"
                icon={<User size={20} strokeWidth={2} />}
                value={email}
                autoComplete="username"
                required
                onChange={(e) => setEmail(e.target.value)}
            />

            <div className="login-card-field-gap">
                <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    icon={<Lock size={20} strokeWidth={2} />}
                    value={password}
                    autoComplete="current-password"
                    required
                    onChange={(e) => setPassword(e.target.value)}
                    rightIcon={
                        showPassword ? (
                            <EyeOff size={20} strokeWidth={2} />
                        ) : (
                            <Eye size={20} strokeWidth={2} />
                        )
                    }
                    onRightIconClick={() => setShowPassword((prev) => !prev)}
                />
            </div>

            <div className="remember-row">
                <label className="flex cursor-pointer items-center gap-[10px] text-[15px] leading-none text-slate-600">
                    <input
                        type="checkbox"
                        checked={remember}
                        onChange={(e) => setRemember(e.target.checked)}
                        className="m-0 h-[18px] w-[18px] cursor-pointer accent-[#003DA5]"
                    />
                    Remember me
                </label>

                <button
                    type="button"
                    className="text-[15px] font-medium leading-none text-[#003DA5] transition-colors duration-300 hover:text-[#0057D9] hover:underline"
                >
                    Forgot Password?
                </button>
            </div>

            <button
                type="submit"
                disabled={loading}
                className="primary-button login-shadow sign-in-button h-[64px] w-full rounded-[18px] text-[16px] font-bold tracking-[5px] duration-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
                {loading ? "SIGNING IN..." : "SIGN IN"}
            </button>

            <div className="card-divider">
                <span className="text-[13px] font-medium tracking-[0.22em] text-slate-400">
                    OR
                </span>
            </div>

            <button
                type="button"
                className="secondary-button flex h-[64px] w-full items-center justify-center gap-[12px] rounded-[18px] text-[14px] font-semibold tracking-[0.06em] duration-300"
            >
                <Shield size={20} strokeWidth={2} className="shrink-0 text-[#003DA5]" />
                LOGIN WITH PSA ACCOUNT
            </button>
        </form>
    );
}
