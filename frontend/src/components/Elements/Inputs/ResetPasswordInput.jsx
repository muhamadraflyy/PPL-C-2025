import { useState } from "react";

export default function ResetPasswordInput({ className = "", type = "text", ...props }) {
  const [showPassword, setShowPassword] = useState(false);
  const isPasswordField = type === "password";
  const inputType = isPasswordField && showPassword ? "text" : type;

  if (isPasswordField) {
    return (
      <div className={`relative ${className}`}>
        <input
          {...props}
          type={inputType}
          className="w-full rounded-md bg-white text-[#2E2A28] placeholder-[#9C8C84] px-4 py-3 pr-16 focus:outline-none focus:ring-2 focus:ring-[#696969] border border-[#B3B3B3]"
        />
        <button
          type="button"
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#696969] text-sm font-medium hover:text-[#2E2A28] transition-colors px-1 py-0.5"
          onClick={() => setShowPassword((s) => !s)}
        >
          {showPassword ? "Hide" : "Show"}
        </button>
      </div>
    );
  }

  return <input {...props} type={type} className={`w-full rounded-md bg-white text-[#2E2A28] placeholder-[#9C8C84] px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#696969] border border-[#B3B3B3] ${className}`} />;
}
