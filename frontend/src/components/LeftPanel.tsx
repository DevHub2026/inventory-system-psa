import logo from "../assets/logo.png";
import building from "../assets/building.svg";
import overlay from "../assets/gradient-overlay.svg";
import ribbons from "../assets/ribbons.svg";

export default function LeftPanel() {
  return (
    <div className="relative hidden overflow-hidden lg:flex">

      <img
        src={building}
        alt="Building"
        className="
          absolute
          inset-0
          h-full
          w-full
          object-cover
          scale-[1.08]
          brightness-100
          contrast-105
        "
      />

      <img
        src={overlay}
        alt=""
        className="
          absolute
          inset-0
          h-full
          w-full
          object-cover
          opacity-[0.88]
        "
      />

      <img
        src={ribbons}
        alt=""
        className="
          absolute
          top-0
          right-[-68px]
          h-full
          w-[558px]
          object-fill
          pointer-events-none
          select-none
          z-20
          ribbon-shadow
        "
      />

      <div
        className="
          absolute
          top-[48px]
          left-[48px]
          z-30
          grid
          grid-cols-6
          gap-[12px]
          opacity-[0.60]
        "
      >
        {Array.from({ length: 18 }).map((_, index) => (
          <span
            key={index}
            className="w-[8px] h-[8px] rounded-full bg-white"
          />
        ))}
      </div>

      <div
        className="
          absolute
          left-0
          top-[168px]
          z-30
          flex
          items-center
        "
      >
        <div className="h-[2px] w-[280px] bg-white/30"></div>

        <div className="ml-[4px] h-[12px] w-[12px] rounded-full bg-white"></div>
      </div>

      <div
        className="
          relative
          z-40
          flex
          w-full
          flex-col
          items-center
          justify-center
          px-[80px]
          text-center
        "
      >

        <img
          src={logo}
          alt="PSA Logo"
          className="
            w-[180px]
            drop-shadow-[0_18px_45px_rgba(0,0,0,.28)]
            float
          "
        />

        <h1
          className="
            mt-[48px]
            max-w-[620px]
            text-[43px]
            font-bold
            leading-[55px]
            text-white
          "
        >
          PHILIPPINE STATISTICS
          <br />
          AUTHORITY
        </h1>

        <div className="mt-[36px] flex gap-[12px]">

          <div className="h-[4px] w-[80px] rounded-full bg-[#0057D9]"></div>

          <div className="h-[4px] w-[80px] rounded-full bg-[#FFD400]"></div>

          <div className="h-[4px] w-[80px] rounded-full bg-[#E31C23]"></div>

        </div>

        <p
          className="
            mt-[32px]
            text-[18px]
            font-light
            tracking-[0.28em]
            text-white/90
          "
        >
          Solid • Responsive • World-Class
        </p>

      </div>

      <div
        className="
          absolute
          bottom-[40px]
          left-[48px]
          z-40
          flex
          gap-[20px]
        "
      >

        <span className="h-[12px] w-[12px] rounded-full border border-white bg-[#0057D9]"></span>

        <span className="h-[12px] w-[12px] rounded-full border border-white bg-transparent"></span>

        <span className="h-[12px] w-[12px] rounded-full border border-white bg-transparent"></span>

      </div>

    </div>
  );
}