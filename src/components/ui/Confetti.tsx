const COLORS = ["#ff8fb1", "#ffd43b", "#7ee0b5", "#6741d9", "#8ecdf7"];
const PIECES = Array.from({ length: 28 }, (_, i) => ({
  left: (i * 37) % 100,
  delay: ((i * 53) % 30) / 10,
  duration: 2.8 + ((i * 17) % 20) / 10,
  drift: ((i * 29) % 60) - 30,
  color: COLORS[i % COLORS.length],
  round: i % 3 === 0,
}));

/** Purely decorative falling confetti; hidden entirely for reduced motion. */
export function Confetti() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 overflow-hidden motion-reduce:hidden">
      {PIECES.map((piece, i) => (
        <span
          key={i}
          className="absolute top-0 block h-3 w-2 animate-confetti opacity-0"
          style={{
            left: `${piece.left}%`,
            backgroundColor: piece.color,
            borderRadius: piece.round ? "9999px" : "2px",
            animationDelay: `${piece.delay}s`,
            animationDuration: `${piece.duration}s`,
            ["--drift" as string]: `${piece.drift}px`,
          }}
        />
      ))}
    </div>
  );
}
