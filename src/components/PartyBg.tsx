"use client";

// Animated party-night background — 6 large blurred bokeh circles drifting at
// different speeds, plus a subtle sparkle layer that pulses. Pure CSS, no
// network/image dependencies, mobile-friendly.
export function PartyBg() {
  return (
    <div aria-hidden className="party-bg">
      <div className="bokeh bokeh-1" />
      <div className="bokeh bokeh-2" />
      <div className="bokeh bokeh-3" />
      <div className="bokeh bokeh-4" />
      <div className="bokeh bokeh-5" />
      <div className="bokeh bokeh-6" />
      <div className="sparkles" />
    </div>
  );
}
