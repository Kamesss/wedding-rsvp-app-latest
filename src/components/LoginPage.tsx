import React, { useState } from 'react';
import { Party, Guest } from '../types.ts';
import { useValidateGuestMutation } from '../store/index.ts';

interface LoginPageProps {
  onGuestVerified: (guest: Guest, party: Party & { guests: Guest[] }) => void;
  onOpenD1Info?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onGuestVerified }) => {
  const [fullName, setFullName] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [validateGuest, { isLoading }] = useValidateGuestMutation();

  const handleLogin = async (nameToValidate: string) => {
    const trimmed = nameToValidate.trim();
    if (!trimmed) {
      setErrorMessage('Please enter your full name as written on your invitation.');
      return;
    }

    setErrorMessage(null);

    try {
      const data = await validateGuest({ fullName: trimmed }).unwrap();

      if (!data.success || !data.matchedGuest || !data.party) {
        setErrorMessage(data.message || 'Invitation not found. Please verify spelling.');
        return;
      }

      onGuestVerified(data.matchedGuest, data.party);
    } catch (err: any) {
      console.error('Validation error:', err);
      const serverMsg = err?.data?.message || err?.message;
      setErrorMessage(serverMsg || 'Unable to connect to the RSVP database. Please try again in a moment.');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleLogin(fullName);
  };

  return (
    <div className="min-h-screen bg-beige-primary text-beige-text flex flex-col justify-between selection:bg-blue-light selection:text-blue-primary relative overflow-x-hidden">
      {/* Ambient Decorative Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-blue-light/60 blur-3xl"></div>
        <div className="absolute top-1/3 -right-24 w-80 h-80 rounded-full bg-beige-secondary/50 blur-3xl"></div>
        <div className="absolute -bottom-24 left-1/4 w-96 h-96 rounded-full bg-red-primary/5 blur-3xl"></div>
      </div>

      {/* Top minimal header */}
      <header className="relative z-10 w-full px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-editorial text-lg tracking-wider font-semibold text-red-primary">J & A</span>
          <span className="text-xs uppercase tracking-widest text-stone-500 font-label hidden sm:inline">• May 15, 2027</span>
        </div>
      </header>

      {/* Main Login Card Section (Matching Image 4 & Image 10) */}
      <main className="relative z-10 flex-1 flex items-center justify-center py-6 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-12 bg-white rounded-[2.5rem] overflow-hidden paper-shadow border border-beige-secondary">
          {/* Left Column: Deep Wine-Burgundy Card */}
          <div className="lg:col-span-5 relative bg-red-secondary text-white p-8 sm:p-10 flex flex-col justify-between overflow-hidden min-h-[360px] lg:min-h-[560px]">
            {/* Background couple portrait texture */}
            <div
              className="absolute inset-0 bg-cover bg-center mix-blend-luminosity opacity-25 scale-105 transition-transform duration-1000"
              style={{
                backgroundImage: 'url("/assets/images/story-coffee.jpg")'
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-red-secondary via-red-secondary/90 to-transparent pointer-events-none"></div>

            {/* Top brand stamp */}
            <div className="relative z-10 flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-beige-paper shadow-sm">
                <svg className="w-6 h-6 text-blue-light" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="9" cy="13" r="5" />
                  <circle cx="15" cy="11" r="5" />
                  <path d="M13.8 6.8 L15 5.2 L16.2 6.8" strokeWidth="1.4" />
                  <circle cx="15" cy="4.5" r="0.8" fill="currentColor" />
                </svg>
              </div>
              <div className="flex flex-col">
                <span className="font-editorial text-sm tracking-wider font-semibold text-beige-paper">James & Amber</span>
                <span className="font-label text-[10px] tracking-widest uppercase text-blue-secondary">Wedding Celebration</span>
              </div>
            </div>

            {/* Middle Welcome Narrative */}
            <div className="relative z-10 my-auto py-8">
              <p className="font-script text-blue-secondary text-4xl sm:text-5xl leading-tight mb-2">Welcome, dearest family & friends</p>
              <h2 className="font-editorial text-2xl sm:text-3xl text-beige-paper font-light leading-snug">
                Enter your name to view private itineraries, personalized table arrangements, and RSVP details.
              </h2>
              <div className="w-12 h-0.5 bg-blue-secondary/60 mt-5 rounded-full"></div>
            </div>

            {/* Bottom Date Footer */}
            <div className="relative z-10 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-beige-paper/80 font-label tracking-wider uppercase">
              <span>Wedding Date</span>
              <span className="text-blue-secondary font-semibold">May 15, 2027</span>
            </div>
          </div>

          {/* Right Column: Portal Sign In Form */}
          <div className="lg:col-span-7 p-8 sm:p-12 lg:p-14 flex flex-col justify-center bg-beige-paper/40">
            <div className="max-w-md w-full mx-auto">
              <div className="text-center sm:text-left mb-6">
                <span className="font-script text-red-primary text-4xl sm:text-5xl leading-none block">Find Your Invitation</span>
                <h1 className="font-editorial text-2xl sm:text-3xl text-beige-text font-normal mt-2 tracking-tight">Guest Portal Sign In</h1>
                <p className="text-xs sm:text-sm text-beige-muted mt-2 font-sans-ui leading-relaxed">
                  Please enter your full name as written on your official invitation envelope to access your wedding itinerary and RSVP.
                </p>
              </div>

              {/* Login Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="guestName" className="block font-label text-xs uppercase tracking-wider text-beige-muted font-bold mb-2 flex items-center justify-between">
                    <span>
                      Guest Full Name <span className="text-red-primary">*</span>
                    </span>
                    <span className="text-[10px] text-beige-muted/70 lowercase font-normal italic">e.g. John Sekiro</span>
                  </label>
                  <div className="relative rounded-2xl shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-stone-400">
                      <span className="material-symbols-outlined text-lg text-red-primary/70">person</span>
                    </div>
                    <input
                      id="guestName"
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Enter your full name"
                      required
                      className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-white border border-beige-secondary text-sm text-beige-text placeholder-stone-400 focus:bg-white focus:border-blue-secondary focus:ring-2 focus:ring-blue-secondary/30 outline-none transition-all duration-200"
                    />
                  </div>
                </div>

                {/* Error Banner */}
                {errorMessage && (
                  <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-sans-ui flex items-start gap-2 animate-fadeIn">
                    <span className="material-symbols-outlined text-base shrink-0 mt-0.5 text-rose-700">error</span>
                    <div className="leading-relaxed">
                      <p className="font-semibold font-label">Invitation Search</p>
                      <p>{errorMessage}</p>
                    </div>
                  </div>
                )}

                {/* Submit Action */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-4 px-6 rounded-full bg-red-primary hover:bg-red-secondary disabled:bg-stone-400 text-white font-label text-xs font-bold uppercase tracking-widest shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2 group hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
                  >
                    {isLoading ? (
                      <>
                        <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
                        <span>Verifying guest registry...</span>
                      </>
                    ) : (
                      <>
                        <span>Access Invitation & RSVP</span>
                        <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">arrow_forward</span>
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Concierge Help */}
              <div className="mt-8 pt-6 border-t border-beige-secondary/70 text-center">
                <p className="text-xs text-beige-muted font-sans-ui">
                  Having trouble finding your name or need assistance?
                  <br />
                  <a
                    href="mailto:rsvp@jamesandamber.com"
                    className="text-red-primary font-semibold hover:underline inline-flex items-center gap-1 mt-1.5 font-label text-xs"
                  >
                    <span>Contact Wedding Concierge</span>
                    <span className="material-symbols-outlined text-[13px]">mail</span>
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
