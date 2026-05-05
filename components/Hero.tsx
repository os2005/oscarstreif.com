import { Instrument_Serif } from "next/font/google";

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

export function Hero() {
  return (
    <section className="relative z-10 flex h-full min-h-dvh items-center justify-center px-6 text-center">
      <div className="max-w-4xl">
        <h1
          className={`${instrumentSerif.className} text-balance text-[clamp(3.75rem,5.85vw,6rem)] font-normal leading-none tracking-normal text-white drop-shadow-[0_1px_12px_rgba(255,255,255,0.12)]`}
        >
          The only limits are those you create in your mind.
        </h1>
      </div>
    </section>
  );
}
