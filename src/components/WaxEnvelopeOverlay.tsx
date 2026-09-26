import React, { useState, useEffect } from 'react';
import { Party, Guest } from '../types.ts';
import { colors } from '../theme/colors.ts';

interface WaxEnvelopeOverlayProps {
  party: Party;
  guest: Guest;
  onOpenComplete: () => void;
}

type AnimationStep =
  | 'sealed'        // Envelope closed, wax seal on
  | 'breaking'      // Wax seal cracks and pops
  | 'opening_flap'  // Flap folds backward 180deg
  | 'sliding_out'   // Letter pulls upward out of pocket (behind front pocket)
  | 'centering'     // Letter lifts forward into center stage, envelope recedes
  | 'ready';        // Interactive button & auto-progress timer

export const WaxEnvelopeOverlay: React.FC<WaxEnvelopeOverlayProps> = ({
  party,
  guest,
  onOpenComplete
}) => {
  const [step, setStep] = useState<AnimationStep>('sealed');
  const [isFadingOut, setIsFadingOut] = useState(false);

  const isSealed = step === 'sealed';
  const isSealBroken = step !== 'sealed';
  const isFlapOpen = step !== 'sealed' && step !== 'breaking';
  const isSlidingOut = step === 'sliding_out';
  const isCentered = step === 'centering' || step === 'ready';

  const handleOpen = () => {
    if (step !== 'sealed') return;

    // Stage 1: Break seal immediately
    setStep('breaking');

    // Stage 2: Flap rotates backwards (350ms)
    setTimeout(() => {
      setStep('opening_flap');
    }, 350);

    // Stage 3: Letter slides UPWARD out of the envelope pocket (1100ms)
    setTimeout(() => {
      setStep('sliding_out');
    }, 1100);

    // Stage 4: Letter elevates in front and smoothly settles into center frame (2050ms)
    setTimeout(() => {
      setStep('centering');
    }, 2050);

    // Stage 5: Ready state with action button (2900ms)
    setTimeout(() => {
      setStep('ready');
    }, 2900);
  };

  // Lock page scrolling while envelope animation is active and ensure it stays at top
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });

    const originalBodyOverflow = document.body.style.overflow;
    const originalHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalBodyOverflow;
      document.documentElement.style.overflow = originalHtmlOverflow;
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    };
  }, []);

  // Timer for auto-proceeding after reading (shortened to 3 seconds)
  useEffect(() => {
    if (step === 'ready') {
      const timer = setTimeout(() => {
        setIsFadingOut(true);
        setTimeout(onOpenComplete, 600);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [step, onOpenComplete]);

  const handleProceedImmediately = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFadingOut(true);
    setTimeout(() => {
      onOpenComplete();
    }, 400);
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-hidden overscroll-none touch-none transition-all duration-1000 ${
        isFadingOut ? 'opacity-0 pointer-events-none scale-105' : 'opacity-100'
      }`}
      style={{
        background: `radial-gradient(circle at center, rgba(67, 11, 18, 0.94) 0%, rgba(35, 4, 9, 0.97) 65%, ${colors.red.night} 100%)`,
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)'
      }}
    >
      {/* Ambient background glows */}
      <div className="absolute w-[500px] h-[500px] rounded-full bg-rose-500/10 blur-3xl pointer-events-none -top-20 -left-20"></div>
      <div className="absolute w-[500px] h-[500px] rounded-full bg-blue-secondary/15 blur-3xl pointer-events-none -bottom-20 -right-20"></div>

      <div className="relative flex flex-col items-center max-w-lg w-full text-center select-none pt-2 sm:pt-4">
        {/* Header - smoothly recedes when letter takes center stage */}
        <div
          className={`transition-all duration-700 transform ${
            isCentered
              ? '-translate-y-4 opacity-0 pointer-events-none h-0 mb-0 overflow-hidden'
              : 'translate-y-0 opacity-100 mb-5 sm:mb-8'
          }`}
        >
          <div className="flex items-center justify-center gap-3 mb-2">
            <span className="h-px w-8 bg-rose-200/40"></span>
            <span className="text-[11px] font-label font-bold uppercase tracking-[0.35em] text-rose-200/90">
              A Cordial Wedding Invitation
            </span>
            <span className="h-px w-8 bg-rose-200/40"></span>
          </div>

          <h2 className="font-editorial text-3xl sm:text-4xl text-white font-light tracking-wide uppercase">
            James <span className="font-serif italic font-normal text-rose-200 lowercase">&amp;</span> Amber
          </h2>

          <p className="font-label text-xs tracking-widest uppercase text-white/80 mt-1.5 font-medium">
            Reserved for <span className="text-rose-200 font-semibold">{party.party_name}</span>
          </p>
        </div>

        {/* 3D Envelope Container */}
        <div
          className={`relative w-full max-w-[430px] aspect-[1.4/1] sm:aspect-[1.46/1] mx-auto transition-all duration-1000 transform ${
            isCentered
              ? 'translate-y-16 sm:translate-y-20 scale-90 opacity-60'
              : 'translate-y-0 scale-100 opacity-100'
          }`}
          style={{ perspective: '1400px' }}
        >
          {/* Base Envelope Box */}
          <div
            className="relative w-full h-full rounded-2xl overflow-visible shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7),0_0_50px_rgba(123,178,217,0.2)]"
          >
            {/* 1. Interior Pocket Back Wall & Lining (z-0) */}
            <div
              className="absolute inset-0 rounded-2xl overflow-hidden z-0"
              style={{
                background: `linear-gradient(145deg, ${colors.beige.linen} 0%, ${colors.beige.sand} 60%, ${colors.beige.taupe} 100%)`,
                border: `1.5px solid ${colors.beige.border}`
              }}
            >
              <div className="absolute inset-2.5 sm:inset-3 rounded-xl border border-dashed border-beige-border/50 pointer-events-none"></div>
              {/* Subtle metallic watermark */}
              <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
                <span className="font-editorial text-6xl sm:text-7xl font-bold text-red-primary">J&amp;A</span>
              </div>
            </div>

            {/* 2. Top Flap with 3D Folding */}
            {/* Flap stays at z-[30] while closed. When opened, folds backwards 180° into z-[5] behind the letter */}
            <div
              onClick={isSealed ? handleOpen : undefined}
              className={`absolute inset-x-0 top-0 h-[56%] transition-all duration-700 ease-in-out ${
                isSealed ? 'cursor-pointer z-[30]' : isFlapOpen ? 'z-[5]' : 'z-[30]'
              }`}
              style={{
                transformOrigin: 'top center',
                transformStyle: 'preserve-3d',
                transform: isFlapOpen ? 'rotateX(180deg)' : 'rotateX(0deg)',
                filter: isFlapOpen
                  ? 'drop-shadow(0 -4px 10px rgba(0, 0, 0, 0.25))'
                  : 'drop-shadow(0 6px 12px rgba(43, 97, 135, 0.28))'
              }}
            >
              {/* Front of Top Flap */}
              <div className="w-full h-full relative" style={{ backfaceVisibility: 'hidden' }}>
                <svg
                  viewBox="0 0 420 155"
                  preserveAspectRatio="none"
                  className="w-full h-full block overflow-visible"
                >
                  <defs>
                    <linearGradient id="topFlapFrontGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor={colors.blue.pale} />
                      <stop offset="60%" stopColor={colors.blue.mist} />
                      <stop offset="100%" stopColor={colors.blue.soft} />
                    </linearGradient>
                    <filter id="topFlapShadow" x="-10%" y="-10%" width="120%" height="130%">
                      <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor={colors.blue.dark} floodOpacity="0.25" />
                    </filter>
                  </defs>
                  <path
                    d="M 0,0 L 420,0 L 210,152 Z"
                    fill="url(#topFlapFrontGrad)"
                    stroke={colors.blue.sky}
                    strokeWidth="1"
                    filter="url(#topFlapShadow)"
                  />
                  <path
                    d="M 12,4 L 408,4 L 210,144 Z"
                    fill="none"
                    stroke="rgba(255, 255, 255, 0.65)"
                    strokeWidth="1.2"
                  />
                </svg>
              </div>

              {/* Back / Underside of Top Flap (visible once folded 180deg) */}
              <div
                className="w-full h-full absolute inset-0"
                style={{
                  backfaceVisibility: 'hidden',
                  transform: 'rotateX(180deg)'
                }}
              >
                <svg
                  viewBox="0 0 420 155"
                  preserveAspectRatio="none"
                  className="w-full h-full block overflow-visible"
                >
                  <defs>
                    <linearGradient id="topFlapBackGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor={colors.beige.cream} />
                      <stop offset="100%" stopColor={colors.beige.oat} />
                    </linearGradient>
                  </defs>
                  <path
                    d="M 0,0 L 420,0 L 210,152 Z"
                    fill="url(#topFlapBackGrad)"
                    stroke={colors.beige.border}
                    strokeWidth="1"
                  />
                  <path
                    d="M 14,4 L 406,4 L 210,144 Z"
                    fill="none"
                    stroke="rgba(216, 188, 171, 0.5)"
                    strokeDasharray="4 3"
                    strokeWidth="1"
                  />
                </svg>
              </div>
            </div>

            {/* 3. Physical Sliding Invitation Letter Card */}
            {/*
                Realistic multi-stage physics:
                - Sealed: Sits inside pocket at z-[15] (behind front pocket z-[20]).
                - Sliding Out: Translates straight upward (-86%) while remaining at z-[15].
                  User visibly watches the letter emerge from inside the envelope pocket slit!
                - Centering: Once cleared of the pocket, promotes to z-[50], floats into center frame,
                  scales smoothly, and drops a rich ambient card shadow.
            */}
            <div
              className={`absolute left-2.5 right-2.5 top-2.5 bottom-2.5 sm:left-3.5 sm:right-3.5 sm:top-3 sm:bottom-3 rounded-xl sm:rounded-2xl p-3 sm:p-5 md:p-6 flex flex-col items-center justify-between text-center overflow-hidden ${
                isCentered
                  ? 'z-[50] pointer-events-auto opacity-100'
                  : 'z-[15] pointer-events-none opacity-100'
              }`}
              style={{
                background: `linear-gradient(175deg, ${colors.beige.ivory} 0%, ${colors.beige.pearl} 100%)`,
                border: `1.5px solid ${colors.beige.secondary}`,
                boxShadow: isCentered
                  ? '0 30px 80px -15px rgba(0, 0, 0, 0.8), 0 0 40px rgba(255, 255, 255, 0.9), 0 0 0 1px rgba(216, 188, 171, 0.6)'
                  : isSlidingOut
                  ? '0 15px 35px rgba(0, 0, 0, 0.35)'
                  : '0 2px 8px rgba(67, 11, 18, 0.08)',
                transform: isCentered
                  ? 'translateY(-28%) scale(1.08)'
                  : isSlidingOut
                  ? 'translateY(-86%) scale(0.98)'
                  : 'translateY(0) scale(1)',
                transition: isCentered
                  ? 'transform 950ms cubic-bezier(0.16, 1, 0.3, 1), box-shadow 950ms ease'
                  : isSlidingOut
                  ? 'transform 900ms cubic-bezier(0.2, 0.8, 0.25, 1), box-shadow 900ms ease'
                  : 'transform 500ms ease-out'
              }}
            >
              {/* Top Accent Badge */}
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="h-px w-5 sm:w-8 bg-red-primary/40"></span>
                <span className="font-label text-[8.5px] sm:text-[10px] uppercase tracking-[0.2em] sm:tracking-[0.28em] text-red-primary font-bold">
                  Official Wedding Invitation
                </span>
                <span className="h-px w-5 sm:w-8 bg-red-primary/40"></span>
              </div>

              {/* Central Letter Content */}
              <div className="py-0.5 sm:py-1.5 flex flex-col items-center w-full">
                <p className="font-script text-2xl sm:text-3xl md:text-4xl text-red-primary leading-none mb-0.5 sm:mb-1">
                  Together with our families
                </p>
                <h3 className="font-editorial text-lg sm:text-2xl md:text-3xl font-normal tracking-wide text-stone-900 uppercase">
                  James <span className="font-serif italic font-light lowercase text-red-primary">&amp;</span> Amber
                </h3>
                <p className="text-[10.5px] sm:text-xs text-stone-600 font-sans-ui mt-0.5 sm:mt-1 leading-snug sm:leading-relaxed max-w-[260px] sm:max-w-xs">
                  request the pleasure of your company to celebrate their marriage
                </p>
                <div className="w-10 sm:w-14 h-px bg-red-primary/30 my-1 sm:my-2"></div>
                <p className="font-editorial text-xs sm:text-base font-medium text-stone-800 tracking-wide">
                  Saturday, May 15, 2027
                </p>
                <p className="font-label text-[9px] sm:text-[11px] uppercase tracking-wider sm:tracking-widest text-blue-primary font-semibold mt-0.5">
                  The Glasshouse Estate • Cebu City
                </p>
              </div>

              {/* Bottom Card Footer with Party & Guest Info */}
              <div className="w-full pt-1.5 sm:pt-2 border-t border-beige-secondary/90 flex items-center justify-between text-[10px] sm:text-xs font-label">
                <span className="text-stone-600 truncate max-w-[55%] text-left">
                  Guest: <strong className="text-stone-900">{guest.first_name} {guest.last_name}</strong>
                </span>
                <span className="text-stone-600 shrink-0 text-right">
                  Reserved seats: <strong className="text-red-primary">{party.max_reserved_seats}</strong>
                </span>
              </div>
            </div>

            {/* 4. Unified Front Pocket (Left, Right, Bottom flaps) (z-[20]) */}
            {/* Stays in front of the letter while closed and during extraction */}
            <div className={`absolute inset-0 rounded-2xl pointer-events-none z-[20] overflow-hidden transition-opacity duration-700 ${
              isCentered ? 'opacity-70' : 'opacity-100'
            }`}>
              <svg
                viewBox="0 0 420 280"
                preserveAspectRatio="none"
                className="w-full h-full block"
              >
                <defs>
                  <linearGradient id="sideFlapLeft" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor={colors.blue.ice} />
                    <stop offset="100%" stopColor={colors.blue.powder} />
                  </linearGradient>
                  <linearGradient id="sideFlapRight" x1="100%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor={colors.blue.ice} />
                    <stop offset="100%" stopColor={colors.blue.powder} />
                  </linearGradient>
                  <linearGradient id="bottomFlapGrad" x1="50%" y1="100%" x2="50%" y2="0%">
                    <stop offset="0%" stopColor={colors.blue.glacier} />
                    <stop offset="70%" stopColor={colors.blue.frost} />
                    <stop offset="100%" stopColor={colors.blue.tint} />
                  </linearGradient>
                  <filter id="pocketSeamShadow" x="-5%" y="-5%" width="110%" height="115%">
                    <feDropShadow dx="0" dy="-2" stdDeviation="3" floodColor={colors.blue.dark} floodOpacity="0.18" />
                  </filter>
                </defs>

                {/* Left triangular side flap */}
                <path
                  d="M 0,0 L 210,140 L 0,280 Z"
                  fill="url(#sideFlapLeft)"
                  stroke={colors.blue.sky}
                  strokeWidth="0.8"
                />

                {/* Right triangular side flap */}
                <path
                  d="M 420,0 L 210,140 L 420,280 Z"
                  fill="url(#sideFlapRight)"
                  stroke={colors.blue.sky}
                  strokeWidth="0.8"
                />

                {/* Bottom triangular flap overlapping left and right */}
                <path
                  d="M 0,280 L 210,132 L 420,280 Z"
                  fill="url(#bottomFlapGrad)"
                  stroke={colors.blue.sky}
                  strokeWidth="1"
                  filter="url(#pocketSeamShadow)"
                />

                {/* Delicate inner accent line on bottom flap */}
                <path
                  d="M 12,276 L 210,138 L 408,276"
                  fill="none"
                  stroke="rgba(255, 255, 255, 0.55)"
                  strokeWidth="1"
                />
              </svg>
            </div>

            {/* 5. Burgundy Royal Wax Seal Stamp (z-[40]) */}
            <div
              onClick={handleOpen}
              title="Click royal wax seal to unveil invitation"
              className={`absolute top-[52%] left-1/2 -translate-x-1/2 -translate-y-1/2 z-[40] cursor-pointer group transition-all duration-500 ${
                isSealBroken ? 'scale-125 opacity-0 pointer-events-none' : 'hover:scale-105 active:scale-95'
              }`}
            >
              {/* Pulsing ambient glow */}
              <div className="absolute -inset-2.5 rounded-full bg-rose-600/40 blur-md animate-pulse group-hover:bg-rose-500/60 transition duration-300"></div>

              {/* Realistic wax seal body */}
              <div
                className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center shadow-2xl transition duration-300"
                style={{
                  background:
                    `radial-gradient(circle at 35% 30%, ${colors.red.vibrant} 0%, ${colors.red.primary} 45%, ${colors.red.secondary} 85%, ${colors.red.darkest} 100%)`,
                  border: `3px solid ${colors.red.accent}`,
                  boxShadow:
                    'inset 0 2px 4px rgba(255, 255, 255, 0.35), inset 0 -3px 6px rgba(0, 0, 0, 0.6), 0 12px 28px rgba(52, 8, 13, 0.75)'
                }}
              >
                <div className="absolute inset-1 rounded-full border border-rose-500/30 pointer-events-none"></div>

                <div className="relative flex flex-col items-center justify-center select-none">
                  <span className="font-script text-2xl sm:text-3xl text-beige-paper font-semibold leading-none drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                    J&amp;A
                  </span>
                  <span className="font-label text-[8px] sm:text-[9px] uppercase tracking-[0.25em] text-rose-200/90 font-bold mt-0.5">
                    Open
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Prompt once card is centered & readable */}
        {isCentered && (
          <div className="mt-20 sm:mt-28 z-[60] flex flex-col items-center gap-2 animate-fadeIn">
            <button
              onClick={handleProceedImmediately}
              className="px-6 sm:px-7 py-2.5 sm:py-3 rounded-full bg-red-primary hover:bg-red-secondary text-white font-label text-[11px] sm:text-xs uppercase tracking-widest font-bold shadow-2xl hover:shadow-rose-950/50 transition-all duration-300 flex items-center gap-2 cursor-pointer group hover:scale-105 active:scale-95"
            >
              <span>View Wedding Schedule &amp; RSVP</span>
              <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">
                arrow_forward
              </span>
            </button>
            <p className="font-label text-[9px] sm:text-[10px] uppercase tracking-widest text-rose-200/60 font-light">
              Continuing automatically in a few moments...
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
