import { useState } from "react";
import type { FormEvent } from "react";
import {
  User,
  Lock,
  Eye,
  EyeOff,
  Shield,
} from "lucide-react";

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
    <form
      onSubmit={handleSubmit}
      className="mt-[48px] space-y-[20px]"
    >
      <Input
        id="email"
        name="email"
        placeholder="Username or Email"
        icon={<User size={20} />}
        value={email}
        autoComplete="username"
        required
        onChange={(e) => setEmail(e.target.value)}
      />

      <Input
        id="password"
        name="password"
        type={showPassword ? "text" : "password"}
        placeholder="Password"
        icon={<Lock size={20} />}
        value={password}
        autoComplete="current-password"
        required
        onChange={(e) => setPassword(e.target.value)}
        rightIcon={
          showPassword ? (
            <EyeOff
              size={20}
              onClick={() => setShowPassword(false)}
            />
          ) : (
            <Eye
              size={20}
              onClick={() => setShowPassword(true)}
            />
          )
        }
      />

      <div className="flex items-center justify-between pt-[8px]">

        <label className="flex items-center gap-[12px] text-[15px] text-slate-600">

          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
            className="
              h-[18px]
              w-[18px]
              accent-[#003DA5]
            "
          />

          Remember me

        </label>

        <button
          type="button"
          className="
            text-[15px]
            font-medium
            text-[#003DA5]
            transition
            hover:underline
          "
        >
          Forgot Password?
        </button>

      </div>

      <button
        type="submit"
        disabled={loading}
        className="
          primary-button
          login-shadow
          h-[60px]
          w-full
          rounded-[18px]
          text-[17px]
          font-bold
          tracking-[0.32em]
          duration-300
          hover:scale-[1.01]
          disabled:cursor-not-allowed
          disabled:opacity-60
        "
      >
        {loading ? "SIGNING IN..." : "SIGN IN"}
      </button>

      <div className="card-divider py-[12px]">

        <span className="text-sm tracking-[0.22em] text-slate-400">
          OR
        </span>

      </div>

      <button
        type="button"
        className="
          secondary-button
          flex
          h-[60px]
          w-full
          items-center
          justify-center
          gap-3
          rounded-[18px]
          text-[16px]
          font-semibold
          duration-300
        "
      >
        <Shield size={22} />

        LOGIN WITH PSA ACCOUNT

      </button>
    </form>
  );
}