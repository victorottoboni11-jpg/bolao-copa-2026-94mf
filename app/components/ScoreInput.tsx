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
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-[#00ffb2]/20 bg-[#04070f] px-2 py-2 text-white sm:px-3 sm:py-3">
      <button
        type="button"
        onClick={handleDecrease}
        disabled={disabled || value <= min}
        aria-label={label ? `Diminuir ${label}` : "Diminuir placar"}
        className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0c1521] text-2xl font-bold transition hover:bg-[#0b1b2f] disabled:cursor-not-allowed disabled:opacity-50 sm:h-14 sm:w-14"
      >
        –
      </button>

      <span className="min-w-[2.5rem] text-center text-xl font-semibold sm:text-2xl">{value}</span>

      <button
        type="button"
        onClick={handleIncrease}
        disabled={disabled || value >= max}
        aria-label={label ? `Aumentar ${label}` : "Aumentar placar"}
        className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0c1521] text-2xl font-bold transition hover:bg-[#0b1b2f] disabled:cursor-not-allowed disabled:opacity-50 sm:h-14 sm:w-14"
      >
        +
      </button>
    </div>
  );
}
