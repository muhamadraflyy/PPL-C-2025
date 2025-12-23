import { useMemo } from "react";

export default function PasswordStrengthIndicator({ password }) {
  const strength = useMemo(() => {
    if (!password) return { score: 0, text: "", color: "", barColor: "", barWidth: "" };

    let score = 0;
    const checks = {
      length: password.length >= 8,
      hasLetter: /[a-zA-Z]/.test(password),
      hasNumber: /\d/.test(password),
      hasSymbol: /[!@#$%^&*(),.?":{}|<>]/.test(password),
      isLong: password.length >= 12,
    };

    if (checks.length) score++;
    if (checks.hasLetter) score++;
    if (checks.hasNumber) score++;
    if (checks.hasSymbol) score++;
    if (checks.isLong) score++;

    const strengthLevels = {
      0: { text: "", color: "", barColor: "", barWidth: "w-0" },
      1: { text: "Sangat Lemah", color: "text-red-600", barColor: "bg-red-600", barWidth: "w-1/5" },
      2: { text: "Lemah", color: "text-orange-600", barColor: "bg-orange-600", barWidth: "w-2/5" },
      3: { text: "Sedang", color: "text-yellow-600", barColor: "bg-yellow-600", barWidth: "w-3/5" },
      4: { text: "Kuat", color: "text-green-600", barColor: "bg-green-600", barWidth: "w-4/5" },
      5: { text: "Sangat Kuat", color: "text-green-700", barColor: "bg-green-700", barWidth: "w-full" },
    };

    return { score, ...strengthLevels[score] };
  }, [password]);

  if (!password) return null;

  return (
    <div className="mt-2 mb-4">
      {/* Progress Bar */}
      <div className="flex items-center gap-2 mb-1">
        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${strength.barColor} ${strength.barWidth}`}
          />
        </div>
        <span className={`text-xs font-medium ${strength.color}`}>
          {strength.text}
        </span>
      </div>

      {/* Requirements Checklist */}
      <div className="text-xs text-gray-600 mt-2">
        <p className="mb-1">Password harus memiliki:</p>
        <ul className="space-y-0.5 ml-4">
          <li className={password.length >= 8 ? "text-green-600" : "text-gray-500"}>
            {password.length >= 8 ? "✓" : "○"} Minimal 8 karakter
          </li>
          <li className={/[a-zA-Z]/.test(password) ? "text-green-600" : "text-gray-500"}>
            {/[a-zA-Z]/.test(password) ? "✓" : "○"} Huruf (a-z, A-Z)
          </li>
          <li className={/\d/.test(password) ? "text-green-600" : "text-gray-500"}>
            {/\d/.test(password) ? "✓" : "○"} Angka (0-9)
          </li>
          <li className={/[!@#$%^&*(),.?":{}|<>]/.test(password) ? "text-green-600" : "text-gray-500"}>
            {/[!@#$%^&*(),.?":{}|<>]/.test(password) ? "✓" : "○"} Simbol (!@#$%^&*)
          </li>
        </ul>
      </div>
    </div>
  );
}
