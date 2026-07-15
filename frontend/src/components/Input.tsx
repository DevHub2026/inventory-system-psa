import type { ChangeEvent, ReactNode } from "react";

interface InputProps {
  id?: string;
  name?: string;
  type?: string;
  placeholder: string;
  icon?: ReactNode;
  rightIcon?: ReactNode;
  value?: string;
  autoComplete?: string;
  disabled?: boolean;
  required?: boolean;
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
}

export default function Input({
  id,
  name,
  type = "text",
  placeholder,
  icon,
  rightIcon,
  value,
  autoComplete,
  disabled = false,
  required = false,
  onChange,
}: InputProps) {
  return (
    <div className="relative">

      {icon && (
        <div
          className="
            absolute
            left-[18px]
            top-1/2
            -translate-y-1/2
            flex
            items-center
            justify-center
            w-[24px]
            h-[24px]
            text-[#003DA5]
            pointer-events-none
            z-10
          "
        >
          {icon}
        </div>
      )}

      <input
        id={id}
        name={name}
        type={type}
        value={value}
        placeholder={placeholder}
        autoComplete={autoComplete}
        disabled={disabled}
        required={required}
        onChange={onChange}
        className="
          w-full
          h-[60px]
          rounded-[18px]
          border
          border-slate-300
          bg-white
          pl-[68px]
          pr-[64px]
          text-[16px]
          font-medium
          text-slate-700
          placeholder:text-slate-400
          shadow-sm
          outline-none
          transition-all
          duration-300
          focus:border-[#003DA5]
          focus:ring-4
          focus:ring-blue-100
          disabled:cursor-not-allowed
          disabled:bg-slate-100
          disabled:text-slate-400
        "
        style={{ paddingLeft: '68px', paddingRight: '64px', height: '60px', borderRadius: '18px' }}
      />

      {rightIcon && (
        <button
          type="button"
          tabIndex={-1}
          className="
            absolute
            right-[22px]
            top-1/2
            -translate-y-1/2
            flex
            items-center
            justify-center
            w-[24px]
            h-[24px]
            text-slate-400
            transition
            hover:text-[#003DA5]
            z-10
          "
        >
          {rightIcon}
        </button>
      )}

    </div>
  );
}