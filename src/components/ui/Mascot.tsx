import { cn } from "./cn";

export type MascotMood = "happy" | "wink" | "cheer" | "thinking" | "sad" | "sleepy" | "wow";

interface MascotProps {
  mood?: MascotMood;
  /** Rendered size in px (the art is square). */
  size?: number;
  /** Gentle floating loop; disabled automatically for reduced motion. */
  float?: boolean;
  className?: string;
}

const INK = "#3a2647";
const STROKE = { stroke: INK, strokeWidth: 3, strokeLinecap: "round", strokeLinejoin: "round" } as const;
const THIN = { ...STROKE, strokeWidth: 2.5 } as const;

function Eye({ x, y, look = 0 }: { x: number; y: number; look?: number }) {
  return (
    <g>
      <ellipse cx={x} cy={y} rx={5.2} ry={6.6} fill={INK} />
      <circle cx={x + 1.8 + look} cy={y - 2.4} r={1.9} fill="#fff" />
    </g>
  );
}

function HappyEye({ x, y }: { x: number; y: number }) {
  return <path d={`M${x - 6} ${y + 2} Q${x} ${y - 8} ${x + 6} ${y + 2}`} fill="none" {...STROKE} />;
}

function SleepyEye({ x, y }: { x: number; y: number }) {
  return <path d={`M${x - 6} ${y - 1} Q${x} ${y + 6} ${x + 6} ${y - 1}`} fill="none" {...STROKE} />;
}

function Eyes({ mood }: { mood: MascotMood }) {
  switch (mood) {
    case "wink":
      return (
        <>
          <Eye x={45} y={62} />
          <HappyEye x={75} y={62} />
        </>
      );
    case "cheer":
      return (
        <>
          <HappyEye x={45} y={62} />
          <HappyEye x={75} y={62} />
        </>
      );
    case "sleepy":
      return (
        <>
          <SleepyEye x={45} y={63} />
          <SleepyEye x={75} y={63} />
        </>
      );
    case "thinking":
      return (
        <>
          <Eye x={45} y={62} look={2} />
          <Eye x={75} y={62} look={2} />
          <path d="M38 50 Q45 46 52 49" fill="none" {...THIN} />
          <path d="M68 47 Q76 43 82 48" fill="none" {...THIN} />
        </>
      );
    case "sad":
      return (
        <>
          <Eye x={45} y={64} />
          <Eye x={75} y={64} />
          <path d="M37 52 L52 48" fill="none" {...THIN} />
          <path d="M83 52 L68 48" fill="none" {...THIN} />
          <path d="M40 74 Q37 82 40 84 Q44 82 40 74Z" fill="#8ecdf7" stroke={INK} strokeWidth={1.8} />
        </>
      );
    case "wow":
      return (
        <>
          <ellipse cx={45} cy={61} rx={6.4} ry={8} fill={INK} />
          <ellipse cx={75} cy={61} rx={6.4} ry={8} fill={INK} />
          <circle cx={47.4} cy={57.6} r={2.4} fill="#fff" />
          <circle cx={77.4} cy={57.6} r={2.4} fill="#fff" />
        </>
      );
    default:
      return (
        <>
          <Eye x={45} y={62} />
          <Eye x={75} y={62} />
        </>
      );
  }
}

function Mouth({ mood }: { mood: MascotMood }) {
  switch (mood) {
    case "cheer":
      return (
        <>
          <path d="M49 72 Q60 96 71 72 Z" fill="#b3134f" {...STROKE} />
          <path d="M54 83 Q60 78 66 83 Q60 90 54 83Z" fill="#ff8fb1" />
        </>
      );
    case "thinking":
      return <path d="M54 79 Q58 75 62 79 T68 78" fill="none" {...STROKE} />;
    case "sad":
      return <path d="M52 82 Q60 74 68 82" fill="none" {...STROKE} />;
    case "sleepy":
      return <ellipse cx={60} cy={79} rx={3.5} ry={4.5} fill="#b3134f" {...STROKE} strokeWidth={2.4} />;
    case "wow":
      return <ellipse cx={60} cy={80} rx={5} ry={6.5} fill="#b3134f" {...STROKE} strokeWidth={2.4} />;
    default:
      return <path d="M51 74 Q60 86 69 74" fill="none" {...STROKE} />;
  }
}

function Props({ mood }: { mood: MascotMood }) {
  if (mood === "thinking") {
    return (
      <g stroke={INK} strokeWidth={2} fill="#fff">
        <circle cx={98} cy={34} r={2.6} />
        <circle cx={104} cy={24} r={4} />
        <rect x={92} y={2} width={26} height={16} rx={8} fill="#ffe3ec" />
        <circle cx={100} cy={10} r={1.5} fill={INK} stroke="none" />
        <circle cx={105} cy={10} r={1.5} fill={INK} stroke="none" />
        <circle cx={110} cy={10} r={1.5} fill={INK} stroke="none" />
      </g>
    );
  }
  if (mood === "sleepy") {
    return (
      <g fill="none" stroke={INK} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round">
        <path d="M92 26 h9 l-9 10 h9" />
        <path d="M105 12 h6 l-6 7 h6" />
      </g>
    );
  }
  if (mood === "cheer" || mood === "wow") {
    return (
      <g stroke={INK} strokeWidth={1.8} strokeLinejoin="round">
        <path
          d="M18 24 l2.4 5.6 5.6 2.4 -5.6 2.4 -2.4 5.6 -2.4 -5.6 -5.6 -2.4 5.6 -2.4Z"
          fill="#ff8fb1"
          className="animate-twinkle origin-center [transform-box:fill-box]"
        />
        <path
          d="M106 38 l1.8 4.2 4.2 1.8 -4.2 1.8 -1.8 4.2 -1.8 -4.2 -4.2 -1.8 4.2 -1.8Z"
          fill="#7ee0b5"
          className="animate-twinkle origin-center [transform-box:fill-box] [animation-delay:0.8s]"
        />
      </g>
    );
  }
  return null;
}

const BODY_PATH =
  "M60 24 C90 24 106 44 106 70 C106 95 88 108 60 108 C32 108 14 95 14 70 C14 44 30 24 60 24Z";

function Mitt({ x, y, r = 7.5 }: { x: number; y: number; r?: number }) {
  return <circle cx={x} cy={y} r={r} fill="#ffd43b" {...THIN} />;
}

function Arms({ up }: { up: boolean }) {
  if (up) {
    return (
      <>
        <path d="M20 74 Q4 66 8 46" fill="none" stroke={INK} strokeWidth={11} strokeLinecap="round" />
        <path d="M20 74 Q4 66 8 46" fill="none" stroke="#ffd43b" strokeWidth={5.5} strokeLinecap="round" />
        <path d="M100 74 Q116 66 112 46" fill="none" stroke={INK} strokeWidth={11} strokeLinecap="round" />
        <path d="M100 74 Q116 66 112 46" fill="none" stroke="#ffd43b" strokeWidth={5.5} strokeLinecap="round" />
        <Mitt x={8} y={42} r={8} />
        <Mitt x={112} y={42} r={8} />
      </>
    );
  }
  return (
    <>
      <path d="M18 70 Q6 76 12 90" fill="none" stroke={INK} strokeWidth={11} strokeLinecap="round" />
      <path d="M18 70 Q6 76 12 90" fill="none" stroke="#ffd43b" strokeWidth={5.5} strokeLinecap="round" />
      <Mitt x={12} y={92} />
    </>
  );
}

/** Signature prop: a tiny survey clipboard tucked at the lower right. */
function Clipboard({ up }: { up: boolean }) {
  return (
    <g transform="rotate(10 96 96)">
      <rect x={82} y={78} width={26} height={30} rx={4} fill="#fff" stroke={INK} strokeWidth={2.6} />
      <rect x={90} y={74} width={10} height={8} rx={3} fill="#ff8fb1" stroke={INK} strokeWidth={2.2} />
      <path d="M87 90 l3 3 l5 -5" fill="none" stroke="#0a6b4a" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M87 99 h16" stroke={INK} strokeWidth={2} strokeLinecap="round" />
      {up ? null : <Mitt x={84} y={86} r={6.5} />}
    </g>
  );
}

/** Original SurveyAI mascot "Bong": a squishy butter-yellow dumpling with a sprout. Decorative. */
export function Mascot({ mood = "happy", size = 120, float = true, className }: MascotProps) {
  return (
    <svg
      viewBox="0 0 120 120"
      width={size}
      height={size}
      aria-hidden="true"
      focusable="false"
      className={cn("shrink-0 overflow-visible", float && "animate-float", className)}
    >
      <ellipse cx={60} cy={116} rx={32} ry={4} fill={INK} opacity={0.12} />
      <ellipse cx={42} cy={109} rx={12} ry={7} fill="#ff9f43" {...THIN} />
      <ellipse cx={78} cy={109} rx={12} ry={7} fill="#ff9f43" {...THIN} />
      <Arms up={mood === "cheer" || mood === "wow"} />
      <path d="M60 26 Q59 16 62 9" fill="none" {...STROKE} />
      <path d="M62 11 Q74 0 86 8 Q78 20 62 11Z" fill="#7ee0b5" {...THIN} />
      <path d="M60 17 Q48 6 36 13 Q44 25 60 17Z" fill="#a8edcc" {...THIN} />
      <path d={BODY_PATH} fill="#ffd43b" {...STROKE} />
      <path d="M30 46 Q36 36 48 33" fill="none" stroke="#fff" strokeWidth={4.5} strokeLinecap="round" opacity={0.75} />
      <ellipse cx={32} cy={76} rx={7.5} ry={5} fill="#ff8fb1" opacity={0.85} />
      <ellipse cx={88} cy={76} rx={7.5} ry={5} fill="#ff8fb1" opacity={0.85} />
      <g className="animate-blink origin-center [transform-box:fill-box]">
        <Eyes mood={mood} />
      </g>
      <Mouth mood={mood} />
      <Clipboard up={mood === "cheer" || mood === "wow"} />
      <Props mood={mood} />
    </svg>
  );
}
