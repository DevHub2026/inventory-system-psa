import logo from "../assets/logo.png";
import LoginForm from "./LoginForm";

export default function LoginCard() {
  return (
    <div
      className="
        glass-card
        login-shadow
        relative
        w-full
        max-w-[560px]
        rounded-[34px]
        px-20
        pt-12
        pb-16
      "
    >
      <div className="flex items-center justify-center">

        <div className="h-px flex-1 bg-gray-200"></div>

        <img
          src={logo}
          alt="PSA Logo"
          className="
            mx-[32px]
            w-[88px]
            drop-shadow-xl
          "
        />

        <div className="h-px flex-1 bg-gray-200"></div>

      </div>

      <h2
        className="
          mt-[32px]
          text-center
          text-[43px]
          font-extrabold
          text-[#003DA5]
          leading-[55px]
        "
      >
        PHILIPPINE STATISTICS
        <br />
        AUTHORITY
      </h2>

      <p
        className="
          mt-[16px]
          text-center
          text-[16px]
          tracking-[0.38em]
          text-[#003DA5]
        "
      >
        INVENTORY MANAGEMENT SYSTEM
      </p>

      <LoginForm />
    </div>
  );
}