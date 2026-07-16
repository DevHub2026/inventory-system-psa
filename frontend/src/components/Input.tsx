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
    onRightIconClick?: () => void;
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
    onRightIconClick,
}: InputProps) {
    return (
        <div className="psa-input-wrapper relative">
            {icon && (
                <div className="psa-input-icon-left pointer-events-none absolute left-[18px] top-1/2 z-10 -translate-y-1/2 text-[#003DA5]">
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
                className="psa-input-field w-full border border-[#D8E1F4] bg-white text-[16px] font-medium leading-none text-slate-700 outline-none transition-all duration-300 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
            />

            {rightIcon && (
                <button
                    type="button"
                    tabIndex={-1}
                    onClick={onRightIconClick}
                    className="psa-input-icon-right absolute right-[18px] top-1/2 z-10 -translate-y-1/2 cursor-pointer text-[#94A3B8] transition-colors duration-300 hover:text-[#003DA5]"
                >
                    {rightIcon}
                </button>
            )}
        </div>
    );
}
