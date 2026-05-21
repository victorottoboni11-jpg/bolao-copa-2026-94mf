"use client";

interface ScoreInputProps {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  min?: number;
  max?: number;
  label?: string;
}

export function ScoreInput({
  value,
  onChange,
  disabled = false,
  min = 0,
  max = 9,
  label,
}: ScoreInputProps) {
  const handleDecrease = () => {
    if (disabled) return;
    const nextValue = Math.max(min, value - 1);
    onChange(nextValue);
  };

  const handleIncrease = () => {
    if (disabled) return;
    const nextValue = Math.min(max, value + 1);
    onChange(nextValue);
  };

  return (
    <div className="flex items-center justify-between gap-1.5 sm:gap-2 rounded-lg border border-[#00ffb2]/20 bg-[#04070f] px-1 sm:px-2 py-1.5 sm:py-2 text-white">
      <button
        type="button"
        onClick={handleDecrease}
        disabled={disabled || value <= min}
        aria-label={label ? `Diminuir ${label}` : "Diminuir placar"}
        className="inline-flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-[#0c1521] text-lg sm:text-xl font-bold transition hover:bg-[#0b1b2f] disabled:cursor-not-allowed disabled:opacity-50"
      >
        –
      </button>

      <span className="min-w-[2rem] text-center text-lg sm:text-xl font-semibold">{value}</span>

      <button
        type="button"
        onClick={handleIncrease}
        disabled={disabled || value >= max}
        aria-label={label ? `Aumentar ${label}` : "Aumentar placar"}
        className="inline-flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-[#0c1521] text-lg sm:text-xl font-bold transition hover:bg-[#0b1b2f] disabled:cursor-not-allowed disabled:opacity-50"
      >
        +
      </button>
    </div>
  );
}
