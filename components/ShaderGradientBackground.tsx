export function ShaderGradientBackground() {
  return (
    <div aria-hidden="true" className="absolute inset-0 z-0 overflow-hidden bg-black">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(176,190,210,0.18),transparent_26%),radial-gradient(circle_at_82%_18%,rgba(198,212,226,0.2),transparent_28%),radial-gradient(circle_at_76%_72%,rgba(154,170,188,0.16),transparent_24%),radial-gradient(circle_at_20%_80%,rgba(126,138,156,0.12),transparent_20%)]" />
      <div className="landing-bubble landing-bubble-a" />
      <div className="landing-bubble landing-bubble-b" />
      <div className="landing-bubble landing-bubble-c" />
      <div className="landing-bubble landing-bubble-d" />
      <div className="absolute inset-0 bg-black/44" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,transparent,rgba(0,0,0,0.34)_72%,rgba(0,0,0,0.6)_100%)]" />
    </div>
  );
}
