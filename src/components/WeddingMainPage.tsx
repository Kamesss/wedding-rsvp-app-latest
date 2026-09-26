import React, { useState, useEffect } from 'react';
import { Party, Guest } from '../types.ts';
import {
  useGetHeroImageQuery,
  useUploadHeroImageMutation,
  useSubmitRsvpMutation
} from '../store/index.ts';

const DEFAULT_HERO = "/assets/images/default.jpg";

interface WeddingMainPageProps {
  party: Party & { guests: Guest[] };
  currentGuest: Guest;
  onOpenRsvp: () => void;
  onOpenRegistry: () => void;
  onOpenD1Info?: () => void;
  onReopenEnvelope: () => void;
  onChangeGuest: () => void;
  onRsvpUpdated?: (updatedParty: Party & { guests: Guest[] }) => void;
}

export const WeddingMainPage: React.FC<WeddingMainPageProps> = ({
  party,
  currentGuest,
  onOpenRsvp,
  onOpenRegistry,
  onOpenD1Info,
  onReopenEnvelope,
  onChangeGuest,
  onRsvpUpdated
}) => {
  const { data: heroImageData } = useGetHeroImageQuery();
  const [uploadHeroImage] = useUploadHeroImageMutation();
  const [submitRsvp, { isLoading: isSubmitting }] = useSubmitRsvpMutation();

  // RSVP Form State
  const [decisions, setDecisions] = useState<Record<string, 'accepted' | 'declined'>>({});
  const [notes, setNotes] = useState<string>('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [rsvpErrorMsg, setRsvpErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (party && party.guests) {
      const initialDecisions: Record<string, 'accepted' | 'declined'> = {};
      party.guests.forEach((g) => {
        initialDecisions[g.id] = g.rsvp_status === 'declined' ? 'declined' : 'accepted';
      });
      setDecisions(initialDecisions);
      setNotes(party.notes || '');

      if (party.is_submitted) {
        setShowConfirmation(true);
      } else {
        setShowConfirmation(false);
      }
    }
  }, [party]);

  const handleDecisionChange = (guestId: string, status: 'accepted' | 'declined') => {
    setDecisions((prev) => ({
      ...prev,
      [guestId]: status
    }));
  };

  const handleSubmitRsvp = async (e: React.FormEvent) => {
    e.preventDefault();
    setRsvpErrorMsg(null);

    const guestResponses = party.guests.map((g) => ({
      guestId: g.id,
      rsvp_status: decisions[g.id] || 'accepted'
    }));

    try {
      const data = await submitRsvp({
        partyId: party.id,
        submittedByGuestId: currentGuest.id,
        guestResponses,
        notes: notes.trim()
      }).unwrap();

      if (!data.success) {
        setRsvpErrorMsg(data.message || 'Failed to submit RSVP.');
        return;
      }

      if (onRsvpUpdated) {
        onRsvpUpdated(data.party);
      }
      setShowConfirmation(true);
    } catch (err: any) {
      console.error('RSVP submit error:', err);
      const serverMsg = err?.data?.message || err?.message;
      setRsvpErrorMsg(serverMsg || 'Failed to connect to the database. Please try again.');
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const confirmedCount = party.guests.filter(
    (g) => (decisions[g.id] || g.rsvp_status) === 'accepted'
  ).length;
  const totalSeats = party.guests.length;

  const scrollToRsvp = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
    }
    const el = document.getElementById('rsvp-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      window.location.hash = 'rsvp-section';
    }
  };

  const [heroImage, setHeroImage] = useState<string>(() => {
    return localStorage.getItem('wedding_custom_hero_image') || '/default.png';
  });

  // Check backend for saved custom hero photo
  useEffect(() => {
    if (heroImageData?.hasCustomImage && heroImageData.url) {
      setHeroImage(heroImageData.url);
    }
  }, [heroImageData]);

  const handleHeroPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setHeroImage(dataUrl);
        try {
          localStorage.setItem('wedding_custom_hero_image', dataUrl);
        } catch {
          // localStorage might be full for very high-res photos
        }

        // Persist to server backend
        try {
          await uploadHeroImage({ imageBase64: dataUrl }).unwrap();
        } catch (err) {
          console.error('Failed to sync hero image to server:', err);
        }
      }
    };
    reader.readAsDataURL(file);
  };
  return (
    <div className="font-sans-ui bg-beige-bg text-stone-800 antialiased selection:bg-red-primary selection:text-white w-full overflow-x-hidden min-h-screen">
      {/* ======================================================== */}
      {/* STICKY TOP NAVIGATION BAR                                */}
      {/* ======================================================== */}
      <nav className="sticky top-0 z-40 bg-beige-bg/90 backdrop-blur-md border-b border-beige-secondary/70 px-4 sm:px-6 lg:px-8 py-3 transition duration-300">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Brand Monogram & Title */}
          <div className="flex items-center gap-4">
            <a href="#" className="flex items-center gap-2 group">
              <span className="font-editorial text-lg sm:text-xl font-medium tracking-wider text-red-primary group-hover:text-red-secondary transition">
                James <span className="font-serif italic text-base lowercase">&amp;</span> Amber
              </span>
            </a>
          </div>

          {/* Action Buttons Right */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* View Envelope Again */}
            <button
              onClick={onReopenEnvelope}
              title="View royal wax envelope invitation again"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-label text-blue-primary hover:text-blue-dark hover:bg-blue-light transition cursor-pointer border border-blue-border"
            >
              <span className="material-symbols-outlined text-sm">mail</span>
              <span className="hidden xs:inline sm:inline">Envelope</span>
            </button>

            {/* Change Guest / Logout */}
            <button
              onClick={onChangeGuest}
              className="text-xs font-label text-stone-500 hover:text-stone-800 px-2 py-1 rounded transition cursor-pointer"
              title="Switch user or enter a different guest name"
            >
              Sign Out
            </button>

            {/* RSVP Button */}
            <button
              onClick={scrollToRsvp}
              className="px-4 sm:px-5 py-2 rounded-full bg-red-primary hover:bg-red-secondary text-white text-xs font-label uppercase font-bold tracking-widest shadow-md hover:shadow-lg transition transform hover:-translate-y-0.5 active:scale-95 cursor-pointer flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-sm">favorite</span>
              <span>{party.is_submitted ? 'View RSVP' : 'RSVP Now'}</span>
            </button>
          </div>
        </div>
      </nav>

      {/* ======================================================== */}
      {/* HERO SECTION                                             */}
      {/* ======================================================== */}
      <section className="relative w-full h-[90vh] min-h-[640px] flex items-center justify-center overflow-hidden">
        {/* Hero Background Image with Overlay */}
        <img
          alt="James and Amber prenup photo"
          className="absolute inset-0 w-full h-full object-cover object-center scale-105 transform"
          src={heroImage}
          onError={() => {
            if (heroImage !== DEFAULT_HERO) {
              setHeroImage(DEFAULT_HERO);
            }
          }}
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-black/60 pointer-events-none"></div>

        {/* Centered Editorial Text */}
        <div className="relative z-10 text-center text-white px-4 max-w-4xl mx-auto flex flex-col items-center">
          <div className="flex items-center gap-3 mb-4">
            <span className="h-px w-8 bg-white/60"></span>
            <span className="text-xs uppercase tracking-[0.35em] font-label font-medium text-stone-200">
              Save Our Date
            </span>
            <span className="h-px w-8 bg-white/60"></span>
          </div>

          <h1 className="font-serif text-4xl sm:text-6xl lg:text-7xl font-light tracking-wide text-white uppercase mb-1">
            James <span className="font-serif italic font-normal text-white lowercase">&amp;</span> Amber
          </h1>

          <div className="flex items-center justify-center gap-3 my-2">
            <p className="font-editorial tracking-[0.25em] text-sm sm:text-lg uppercase text-white/90">
              Are Getting{' '}
              <span className="font-script lowercase text-3xl sm:text-5xl font-normal capitalize text-white">
                Married
              </span>
            </p>
          </div>

          {/* Date Badge */}
          <div className="mt-4 px-6 py-2 rounded-full border border-white/30 bg-black/30 backdrop-blur-sm text-xs font-semibold tracking-widest uppercase font-label">
            May 15, 2027
          </div>

          {/* Action Button */}
          <div className="mt-8 flex justify-center items-center">
            <button
              onClick={scrollToRsvp}
              className="px-8 sm:px-10 py-3.5 sm:py-4 bg-blue-secondary hover:bg-blue-hover text-stone-900 text-xs sm:text-sm tracking-widest uppercase font-bold rounded-full shadow-2xl transition duration-300 transform hover:-translate-y-0.5 inline-flex items-center justify-center gap-2.5 font-label cursor-pointer"
            >
              <span className="material-symbols-outlined text-base">mail</span>
              <span>Confirm Attendance</span>
            </button>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* POLAROID GALLERY TRIO SECTION                            */}
      {/* ======================================================== */}
      <section className="py-20 lg:py-28 relative overflow-hidden bg-blue-light" id="our-story">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Section Script Heading */}
          <div className="mb-2 text-red-primary">
            <span className="material-symbols-outlined text-3xl">local_florist</span>
          </div>
          <h2 className="font-script text-4xl sm:text-6xl text-stone-900 font-normal mb-12">
            Join us as we tie the knot!
          </h2>

          {/* Polaroid Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-10 items-end max-w-5xl mx-auto">
            {/* Polaroid Card 1 */}
            <div className="flex flex-col items-center transform md:-rotate-1 hover:rotate-0 transition duration-300">
              <div className="bg-white p-3.5 pb-6 rounded-3xl shadow-xl border border-stone-200/80 w-full max-w-[280px]">
                <div className="overflow-hidden rounded-2xl aspect-[4/5] bg-stone-100">
                  <img
                    alt="Candid Joy in Madrid"
                    className="w-full h-full object-cover hover:scale-105 transition duration-500"
                    src="/assets/images/story-proposal.jpg"
                  />
                </div>
                <p className="mt-4 text-center font-label text-xs uppercase font-medium tracking-wider text-stone-600">
                  High School • Best Friends
                </p>
              </div>
            </div>

            {/* Polaroid Card 2: Centerpiece Arched */}
            <div className="flex flex-col items-center md:-translate-y-4 relative z-10 transform hover:scale-102 transition duration-300">
              <div className="bg-white p-4 pb-7 arched-polaroid shadow-2xl border-2 border-red-primary/20 w-full max-w-[310px]">
                <div className="overflow-hidden arched-polaroid aspect-[4/6] bg-stone-100">
                  <img
                    alt="Whispers in Retiro"
                    className="w-full h-full object-cover hover:scale-105 transition duration-500"
                    src="/assets/images/story-coffee.jpg"
                  />
                </div>
                <p className="mt-4 text-center font-label text-xs uppercase font-bold tracking-widest text-red-primary">
                  Engaged • Finally Lovers
                </p>
              </div>
            </div>

            {/* Polaroid Card 3 */}
            <div className="flex flex-col items-center transform md:rotate-1 hover:rotate-0 transition duration-300">
              <div className="bg-white p-3.5 pb-6 rounded-3xl shadow-xl border border-stone-200/80 w-full max-w-[280px]">
                <div className="overflow-hidden rounded-2xl aspect-[4/5] bg-stone-100">
                  <img
                    alt="Hand in hand"
                    className="w-full h-full object-cover hover:scale-105 transition duration-500"
                    src="/assets/images/story-barcelona.jpg"
                  />
                </div>
                <p className="mt-4 text-center font-label text-xs uppercase font-medium tracking-wider text-stone-600">
                  College • It's Complicated
                </p>
              </div>
            </div>
          </div>

          {/* Script Tagline below photos */}
          <p className="mt-14 font-script text-3xl sm:text-5xl text-stone-900 font-normal">
            with the people who matter the most.
          </p>
        </div>
      </section>

      {/* ======================================================== */}
      {/* STORYBOOK & SCHEDULE SECTION                             */}
      {/* ======================================================== */}
      <section className="py-20 lg:py-28 relative bg-beige-primary text-stone-800" id="schedule-venues">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-14 items-center">
            {/* Left Column: Highlight Photo Card */}
            <div className="lg:col-span-6 flex justify-center">
              <div className="relative w-full max-w-md rounded-3xl overflow-hidden shadow-2xl border border-white/20 group">
                <img
                  alt="James & Amber"
                  className="w-full h-[460px] sm:h-[500px] object-cover group-hover:scale-105 transition duration-700"
                  src="/assets/images/denim-blue.jpg"
                />
              </div>
            </div>

            {/* Right Column: Vertical Timeline */}
            <div className="lg:col-span-6 space-y-8">
              <div>
                <span className="font-script text-3xl sm:text-4xl text-red-primary block mb-1">
                  The Day's Schedule
                </span>
                <h2 className="font-editorial text-2xl sm:text-4xl font-light uppercase tracking-wider text-stone-900">
                  Moments to Remember
                </h2>
                <div className="w-16 h-0.5 bg-red-primary mt-3"></div>
              </div>

              {/* Timeline Items */}
              <div className="space-y-4">
                {/* Moment 1 */}
                <div className="flex items-center justify-between p-4 sm:p-5 rounded-2xl bg-white shadow-md border border-stone-200 hover:border-red-primary/30 transition">
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-full bg-beige-paper flex items-center justify-center text-red-primary">
                      <span className="material-symbols-outlined text-xl">church</span>
                    </div>
                    <div>
                      <h3 className="font-editorial text-base sm:text-lg font-medium text-stone-900">Ceremony</h3>
                      <p className="text-xs text-stone-600 font-label">San Roque Parish Church</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-label font-semibold text-xs sm:text-sm text-red-primary bg-beige-paper px-3 py-1 rounded-full border border-stone-200">
                      3:00 PM
                    </span>
                  </div>
                </div>

                {/* Moment 2 */}
                <div className="flex items-center justify-between p-4 sm:p-5 rounded-2xl bg-white shadow-md border border-stone-200 hover:border-red-primary/30 transition">
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-full bg-beige-paper flex items-center justify-center text-red-primary">
                      <span className="material-symbols-outlined text-xl">local_bar</span>
                    </div>
                    <div>
                      <h3 className="font-editorial text-base sm:text-lg font-medium text-stone-900">Cocktail Hour</h3>
                      <p className="text-xs text-stone-600 font-label">Montebello Villa Hotel</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-label font-semibold text-xs sm:text-sm text-red-primary bg-beige-paper px-3 py-1 rounded-full border border-stone-200">
                      5:00 PM
                    </span>
                  </div>
                </div>

                {/* Moment 3 */}
                <div className="flex items-center justify-between p-4 sm:p-5 rounded-2xl bg-white shadow-md border border-stone-200 hover:border-red-primary/30 transition">
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-full bg-beige-paper flex items-center justify-center text-red-primary">
                      <span className="material-symbols-outlined text-xl">restaurant</span>
                    </div>
                    <div>
                      <h3 className="font-editorial text-base sm:text-lg font-medium text-stone-900">Reception</h3>
                      <p className="text-xs text-stone-600 font-label">Montebello Villa Hotel</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-label font-semibold text-xs sm:text-sm text-red-primary bg-beige-paper px-3 py-1 rounded-full border border-stone-200">
                      6:00 PM
                    </span>
                  </div>
                </div>
              </div>

              {/* Couple Initials Flourish */}
              <div className="pt-4 flex items-center gap-4">
                <span className="font-script text-4xl sm:text-5xl text-red-primary">J &amp; A</span>
                <div className="h-px flex-1 bg-red-primary/20"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* WEDDING PHOTO INTERLUDE SECTION                          */}
      {/* ======================================================== */}
      <section className="relative w-full h-[45vh] sm:h-[60vh] min-h-[360px] max-h-[640px] overflow-hidden bg-stone-950">
        <img
          alt="Wedding celebration"
          className="w-full h-full object-cover object-center filter brightness-[0.92] hover:scale-105 transition-transform duration-1000 ease-out"
          src="https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=2000&q=80"
          onError={(e) => {
            e.currentTarget.src = '/assets/images/couple-portrait.jpg';
          }}
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-transparent to-black/35 pointer-events-none" />
      </section>

      {/* ======================================================== */}
      {/* VENUES & LOCATIONS SECTION                               */}
      {/* ======================================================== */}
      <section className="py-20 lg:py-28 bg-red-deep" id="venues">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-16">
            <p className="font-script text-3xl sm:text-5xl text-rose-200">Where to find us</p>
            <h2 className="font-editorial text-2xl sm:text-4xl uppercase tracking-widest mt-1 text-white">
              Venues &amp; Locations
            </h2>
            <div className="w-12 h-0.5 bg-rose-200/40 mx-auto mt-3"></div>
          </div>

          {/* Venue Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-10 max-w-5xl mx-auto">
            {/* Venue 1: Ceremony */}
            <div className="bg-white rounded-3xl shadow-xl overflow-hidden flex flex-col border border-stone-200">
              <div className="relative h-60 w-full overflow-hidden">
                <img
                  alt="San Roque Parish Church"
                  className="w-full h-full object-cover hover:scale-105 transition duration-500"
                  src="/assets/images/schedule-ceremony.jpg"
                />
                <span className="absolute top-4 left-4 bg-stone-900/80 backdrop-blur-sm text-white font-label text-[11px] uppercase font-bold tracking-wider px-3 py-1 rounded-full">
                  Ceremony Venue
                </span>
                <div className="absolute bottom-4 right-4 w-9 h-9 rounded-full bg-red-primary text-white flex items-center justify-center shadow">
                  <span className="material-symbols-outlined text-lg">church</span>
                </div>
              </div>

              <div className="p-6 sm:p-7 flex-1 flex flex-col justify-between space-y-5">
                <div>
                  <h3 className="font-editorial text-xl sm:text-2xl font-normal text-stone-800">
                    San Roque Parish Church
                  </h3>
                  <div className="mt-2 space-y-1.5 text-xs text-stone-600 font-label">
                    <p className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm text-stone-400">schedule</span>
                      <span>3:00 PM</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm text-stone-400">location_on</span>
                      <span>Subangdaku, Mandaue City</span>
                    </p>
                  </div>
                </div>

                {/* Google Maps Button */}
                <a
                  className="w-full text-center py-2.5 px-4 rounded-xl bg-blue-light hover:bg-blue-border text-blue-primary font-label text-xs uppercase font-bold tracking-wider transition inline-flex items-center justify-center gap-1.5"
                  href="https://maps.google.com/?q=San+Roque+Parish+Church+Mandaue"
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  <span>Open in Google Maps</span>
                  <span className="material-symbols-outlined text-xs">open_in_new</span>
                </a>
              </div>
            </div>

            {/* Venue 2: Reception */}
            <div className="bg-white rounded-3xl shadow-xl overflow-hidden flex flex-col border border-stone-200">
              <div className="relative h-60 w-full overflow-hidden">
                <img
                  alt="Montebello Villa Hotel"
                  className="w-full h-full object-cover hover:scale-105 transition duration-500"
                  src="/assets/images/schedule-cocktail.jpg"
                />
                <span className="absolute top-4 left-4 bg-stone-900/80 backdrop-blur-sm text-white font-label text-[11px] uppercase font-bold tracking-wider px-3 py-1 rounded-full">
                  Reception &amp; Dinner
                </span>
                <div className="absolute bottom-4 right-4 w-9 h-9 rounded-full bg-blue-primary text-white flex items-center justify-center shadow">
                  <span className="material-symbols-outlined text-lg">celebration</span>
                </div>
              </div>

              <div className="p-6 sm:p-7 flex-1 flex flex-col justify-between space-y-5">
                <div>
                  <h3 className="font-editorial text-xl sm:text-2xl font-normal text-stone-800">
                    Montebello Villa Hotel
                  </h3>
                  <div className="mt-2 space-y-1.5 text-xs text-stone-600 font-label">
                    <p className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm text-stone-400">schedule</span>
                      <span>6:00 PM</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-stone-400 text-sm">location_on</span>
                      <span>Montebello Dr, Gov. M. Cuenco Ave, Apas, Cebu City</span>
                    </p>
                  </div>
                </div>

                {/* Google Maps Button */}
                <a
                  className="w-full text-center py-2.5 px-4 rounded-xl bg-blue-light hover:bg-blue-border text-blue-primary font-label text-xs uppercase font-bold tracking-wider transition inline-flex items-center justify-center gap-1.5"
                  href="https://maps.google.com/?q=Montebello+Villa+Hotel+Cebu"
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  <span>Open in Google Maps</span>
                  <span className="material-symbols-outlined text-xs">open_in_new</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* ATTIRE GUIDE SECTION                                     */}
      {/* ======================================================== */}
      <section className="py-20 lg:py-28 bg-blue-light" id="attire-guide">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center max-w-xl mx-auto mb-12">
            <p className="font-script text-4xl sm:text-5xl text-red-primary mb-1">The Details</p>
            <h2 className="font-editorial text-xs sm:text-sm uppercase tracking-[0.3em] font-semibold text-stone-600 mb-3">
              Attire Guide
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 italic font-serif leading-relaxed">
              We would love to see you in your formal attire. We encourage you to dress according to our wedding color palette.
            </p>
          </div>

          {/* Two Columns Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
            {/* Card 1: Principal Sponsors */}
            <div className="bg-white rounded-2xl p-6 shadow-md border border-stone-200 flex flex-col">
              <div className="rounded-xl overflow-hidden mb-6 bg-stone-100 border border-stone-100">
                <img
                  alt="Principal Sponsors illustration"
                  className="w-full h-40 object-contain mx-auto"
                  src="/assets/images/venue-exterior.jpg"
                />
              </div>
              <div className="text-center mb-5">
                <h3 className="font-script text-3xl text-red-primary">Principal Sponsors</h3>
                <p className="font-label text-[11px] uppercase tracking-wider text-stone-500 font-semibold">
                  Honored Guests of Family
                </p>
              </div>
              <div className="space-y-3 bg-beige-paper p-4 rounded-xl text-xs font-label text-stone-700 flex-1 flex flex-col justify-center">
                <p className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-primary"></span>
                  <span><strong>Ladies:</strong> Formal Dress</span>
                </p>
                <p className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-primary"></span>
                  <span><strong>Gentlemen:</strong> Barong and slacks</span>
                </p>
              </div>
              <p className="text-[10px] text-center uppercase tracking-widest text-stone-400 font-label mt-5">
                Corsages &amp; Boutonnières provided at chapel
              </p>
            </div>

            {/* Card 2: Wedding Guests */}
            <div className="bg-white rounded-2xl p-6 shadow-md border border-stone-200 flex flex-col">
              <div className="rounded-xl overflow-hidden mb-6 bg-stone-100 border border-stone-100">
                <img
                  alt="Wedding Guests illustration"
                  className="w-full h-40 object-contain mx-auto"
                  src="/assets/images/venue-interior.jpg"
                />
              </div>
              <div className="text-center mb-4">
                <h3 className="font-script text-3xl text-blue-primary">Wedding Guests</h3>
                <p className="font-label text-[11px] uppercase tracking-wider text-stone-500 font-semibold">
                  Formal Celebration
                </p>
              </div>

              {/* Color Palette Swatches */}
              <div className="flex items-center justify-center gap-2.5 mb-5">
                <span className="w-5 h-5 rounded-full bg-[#526E57] border border-stone-300 shadow-sm" title="Sage Green"></span>
                <span className="w-5 h-5 rounded-full bg-[#274029] border border-stone-300 shadow-sm" title="Forest Green"></span>
                <span className="w-5 h-5 rounded-full bg-[#758467] border border-stone-300 shadow-sm" title="Earthy Olive"></span>
                <span className="w-5 h-5 rounded-full bg-[#D4C3B3] border border-stone-300 shadow-sm" title="Warm Nude"></span>
              </div>

              <div className="space-y-3 bg-beige-paper p-4 rounded-xl text-xs font-label text-stone-700 flex-1 flex flex-col justify-center">
                <p className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-primary"></span>
                  <span><strong>Ladies:</strong> Formal Dresses</span>
                </p>
                <p className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-primary"></span>
                  <span><strong>Gentlemen:</strong> Formal Long-sleeves and slacks</span>
                </p>
              </div>
              <p className="text-[10px] text-center uppercase tracking-widest text-stone-400 font-label mt-5">
                Complementing palette of sage, forest &amp; warm neutrals
              </p>
            </div>
          </div>

          {/* Strict Attire Footnote */}
          <div className="mt-8 p-3.5 rounded-xl border border-rose-200 bg-rose-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
            <div className="flex items-center gap-2 text-red-primary font-label text-xs uppercase font-bold tracking-wide">
              <span className="material-symbols-outlined text-base">block</span>
              <span>Strictly NO JEANS, athletic sneakers, or casual t-shirts</span>
            </div>
            <span className="text-[11px] text-stone-500 font-serif italic">Thank you for honoring our aesthetic</span>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* FAQS SECTION                                             */}
      {/* ======================================================== */}
      <section className="py-20 lg:py-28 relative bg-red-deep" id="faqs">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="font-script text-3xl sm:text-5xl text-rose-200 mb-1">Questions &amp; Details</p>
            <h2 className="font-editorial text-xl sm:text-3xl uppercase tracking-widest text-white">
              Frequently Asked Questions
            </h2>
            <div className="w-12 h-0.5 bg-rose-200/50 mx-auto mt-3"></div>
          </div>

          <div className="space-y-4 max-w-2xl mx-auto">
            {/* FAQ Item 1 */}
            <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-xl border border-stone-200 flex flex-col justify-between hover:border-rose-200/60 transition">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <span className="w-9 h-9 rounded-full bg-red-primary text-white shadow-sm flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-lg">group_add</span>
                  </span>
                  <h3 className="text-stone-900 font-editorial text-base sm:text-lg font-medium leading-snug">
                    Can I bring a plus one?
                  </h3>
                </div>
                <p className="text-stone-600 text-xs sm:text-sm font-sans-ui leading-relaxed">
                  Due to venue capacity restrictions, we can only accommodate guests formally listed on your invitation envelope. If your invitation includes "and Guest," you are more than welcome to bring a plus one!
                </p>
              </div>
            </div>

            {/* FAQ Item 2 */}
            <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-xl border border-stone-200 flex flex-col justify-between hover:border-rose-200/60 transition">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <span className="w-9 h-9 rounded-full bg-red-primary text-white shadow-sm flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-lg">schedule</span>
                  </span>
                  <h3 className="text-stone-900 font-editorial text-base sm:text-lg font-medium leading-snug">
                    What time should I arrive?
                  </h3>
                </div>
                <p className="text-stone-600 text-xs sm:text-sm font-sans-ui leading-relaxed">
                  We recommend arriving at San Roque Parish Church by 2:15 PM—around 45 minutes prior to the processional. This allows ample time to find parking, take your seat, and soak in the pre-ceremony music.
                </p>
              </div>
            </div>

            {/* FAQ Item 3 */}
            <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-xl border border-stone-200 flex flex-col justify-between hover:border-rose-200/60 transition">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <span className="w-9 h-9 rounded-full bg-red-primary text-white shadow-sm flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-lg">child_care</span>
                  </span>
                  <h3 className="text-stone-900 font-editorial text-base sm:text-lg font-medium leading-snug">
                    Are little ones welcome?
                  </h3>
                </div>
                <p className="text-stone-600 text-xs sm:text-sm font-sans-ui leading-relaxed">
                  While we adore your little ones, our celebration will be an adult-only reception with the exception of immediate family members in the formal bridal party entourage. We appreciate your understanding!
                </p>
              </div>
            </div>

            {/* FAQ Item 4 */}
            <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-xl border border-stone-200 flex flex-col justify-between hover:border-rose-200/60 transition">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <span className="w-9 h-9 rounded-full bg-red-primary text-white shadow-sm flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-lg">redeem</span>
                  </span>
                  <h3 className="text-stone-900 font-editorial text-base sm:text-lg font-medium leading-snug">
                    Gift Registry
                  </h3>
                </div>
                <p className="text-stone-600 text-xs sm:text-sm font-sans-ui leading-relaxed mb-4">
                  Your presence on our special day is the greatest gift of all. However, should you wish to honor us with a gift, a wishing well box will be available at the reception to help us build our first home together.
                </p>
              </div>
              <button
                type="button"
                onClick={onOpenRegistry}
                className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-red-primary hover:text-red-secondary font-label underline cursor-pointer self-start"
              >
                <span className="material-symbols-outlined text-sm">card_giftcard</span>
                <span>View Online Registry &amp; Contributions</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* RSVP SECTION (REPLACES FOOTER & MODAL WITH IN-PAGE FORM) */}
      {/* ======================================================== */}
      <section id="rsvp-section" className="py-20 lg:py-28 relative bg-blue-light border-t border-blue-border">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-8">
            <div className="w-12 h-12 rounded-full bg-red-primary/10 text-red-primary flex items-center justify-center mx-auto mb-3 shadow-sm border border-red-primary/20">
              <span className="material-symbols-outlined text-2xl">favorite</span>
            </div>
            <p className="font-script text-3xl sm:text-5xl text-red-primary mb-1">
              Join Our Celebration
            </p>
            <h2 className="font-editorial text-2xl sm:text-3xl uppercase tracking-wider text-stone-900">
              Wedding RSVP
            </h2>
            <div className="w-16 h-0.5 bg-red-primary/30 mx-auto mt-3 mb-4"></div>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-blue-border text-stone-700 shadow-sm">
              <span className="material-symbols-outlined text-sm text-red-primary shrink-0">stars</span>
              <p className="text-xs sm:text-sm font-label">
                Reserved for <strong className="text-stone-900">{party.party_name}</strong> (
                <strong className="text-red-primary">{party.max_reserved_seats} seats</strong>)
              </p>
            </div>
          </div>

          {/* Form Card or Confirmation Card */}
          <div className="bg-white rounded-3xl p-6 sm:p-9 shadow-xl border border-stone-200">
            {!showConfirmation ? (
              /* ==================================================== */
              /* VIEW 1: RSVP EDIT / SUBMISSION FORM                  */
              /* ==================================================== */
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-stone-100 mb-5">
                  <div>
                    <h3 className="font-editorial text-base sm:text-lg font-medium text-stone-900">
                      Family &amp; Guest Attendance
                    </h3>
                    <p className="text-xs text-stone-500 font-label">
                      Please specify who will be celebrating with us
                    </p>
                  </div>
                  <span className="text-[11px] font-label font-bold uppercase tracking-wider text-red-primary bg-beige-paper px-3 py-1 rounded-full border border-stone-200">
                    {confirmedCount} of {totalSeats} Attending
                  </span>
                </div>

                {/* Error Banner */}
                {rsvpErrorMsg && (
                  <div className="mb-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm shrink-0">error</span>
                    <span>{rsvpErrorMsg}</span>
                  </div>
                )}

                <form onSubmit={handleSubmitRsvp} className="space-y-5">
                  {/* Guest List */}
                  <div className="space-y-3">
                    {party.guests.map((guestItem) => {
                      const isAttending = (decisions[guestItem.id] || 'accepted') === 'accepted';
                      const isPrimary = Boolean(guestItem.is_primary_contact);

                      return (
                        <div
                          key={guestItem.id}
                          className="p-3 sm:p-4 rounded-2xl bg-beige-paper/80 border border-stone-200 flex items-center justify-between gap-3 hover:border-red-primary/30 transition shadow-sm"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className={`w-9 h-9 rounded-full ${
                                isPrimary ? 'bg-red-primary' : 'bg-blue-primary'
                              } text-white flex items-center justify-center font-label text-xs font-bold shrink-0 shadow-sm`}
                            >
                              {getInitials(guestItem.first_name, guestItem.last_name)}
                            </div>
                            <div className="truncate">
                              <p className="font-editorial font-medium text-stone-900 text-sm sm:text-base truncate leading-snug">
                                {guestItem.first_name} {guestItem.last_name}
                              </p>
                              <span
                                className={`text-[10px] font-semibold tracking-wider uppercase font-label ${
                                  isPrimary ? 'text-red-primary' : 'text-stone-500'
                                }`}
                              >
                                {isPrimary ? 'Primary Guest' : 'Invited Guest'}
                              </span>
                            </div>
                          </div>

                          {/* Accept / Decline Toggle Buttons */}
                          <div className="flex items-center gap-1.5 bg-stone-100 p-1 rounded-xl shrink-0">
                            <button
                              type="button"
                              onClick={() => handleDecisionChange(guestItem.id, 'accepted')}
                              className={`px-3 py-1.5 rounded-lg text-xs font-label font-bold tracking-wide transition cursor-pointer flex items-center gap-1 ${
                                isAttending
                                  ? 'bg-emerald-700 text-white shadow-sm'
                                  : 'text-stone-600 hover:text-stone-900'
                              }`}
                            >
                              <span className="material-symbols-outlined text-xs">check</span>
                              <span>Accept</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDecisionChange(guestItem.id, 'declined')}
                              className={`px-3 py-1.5 rounded-lg text-xs font-label font-bold tracking-wide transition cursor-pointer flex items-center gap-1 ${
                                !isAttending
                                  ? 'bg-stone-500 text-white shadow-sm'
                                  : 'text-stone-600 hover:text-stone-900'
                              }`}
                            >
                              <span className="material-symbols-outlined text-xs">close</span>
                              <span>Decline</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Dietary & Message */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 font-label mb-1.5">
                      Special Notes, Dietary Wishes, or Congratulatory Message (Optional)
                    </label>
                    <textarea
                      rows={3}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Allergies, song requests, or warm congratulations for James & Amber..."
                      className="w-full p-3 rounded-2xl border border-stone-200 text-xs sm:text-sm font-sans-ui text-stone-800 placeholder-stone-400 focus:outline-none focus:border-red-primary focus:ring-1 focus:ring-red-primary transition"
                    />
                  </div>

                  {/* Deadline Notice */}
                  <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200/80 flex items-center gap-3 text-stone-700">
                    <div className="w-9 h-9 rounded-full bg-red-primary/10 text-red-primary flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-lg">calendar_month</span>
                    </div>
                    <div className="text-xs">
                      <p className="font-bold uppercase tracking-wider text-red-primary font-label">
                        RSVP Deadline: April 15, 2027
                      </p>
                      <p className="text-stone-600 font-sans-ui leading-relaxed mt-0.5">
                        Please confirm your party's attendance to finalize our caterer and seating arrangements.
                      </p>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-4 bg-red-primary hover:bg-red-secondary disabled:bg-stone-400 text-white font-label text-xs sm:text-sm uppercase tracking-widest font-bold rounded-2xl shadow-xl hover:shadow-2xl transition transform hover:-translate-y-0.5 active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {isSubmitting ? (
                        <>
                          <span className="material-symbols-outlined animate-spin text-base">progress_activity</span>
                          <span>Saving to RSVP Database...</span>
                        </>
                      ) : (
                        <>
                          <span className="material-symbols-outlined text-base">how_to_reg</span>
                          <span>{party.is_submitted ? 'Update RSVP Details' : 'Submit Wedding RSVP'}</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              /* ==================================================== */
              /* VIEW 2: RSVP CONFIRMATION / SUMMARY VIEW             */
              /* ==================================================== */
              <div className="text-center">
                <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-3 shadow-sm border border-emerald-200">
                  <span className="material-symbols-outlined text-3xl">mark_email_read</span>
                </div>
                <span className="font-script text-3xl sm:text-4xl text-red-primary leading-tight block">
                  RSVP Received With Joy!
                </span>
                <h3 className="font-editorial text-base sm:text-xl uppercase tracking-wider text-stone-900 mt-1">
                  {party.party_name} Celebration
                </h3>
                <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-label font-bold uppercase tracking-wider">
                  <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                  <span>RSVP Confirmed &amp; Logged</span>
                </div>

                {/* Attendance Breakdown Card */}
                <div className="bg-beige-paper rounded-2xl p-4 sm:p-5 border border-stone-200 text-left my-6 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-stone-200">
                    <p className="text-xs font-bold uppercase tracking-wider text-stone-700 font-label flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-base text-red-primary">how_to_reg</span>
                      <span>Party Attendance Breakdown</span>
                    </p>
                    <span className="text-xs font-bold text-red-primary font-label bg-white px-2.5 py-1 rounded-full border border-stone-200 shadow-sm">
                      {confirmedCount} of {totalSeats} Seats Confirmed
                    </span>
                  </div>

                  <div className="space-y-2">
                    {party.guests.map((g) => {
                      const isAccepted = (decisions[g.id] || g.rsvp_status) === 'accepted';
                      const isPrimary = Boolean(g.is_primary_contact);

                      return (
                        <div
                          key={g.id}
                          className="flex items-center justify-between py-2 border-b border-stone-200/60 last:border-b-0 text-xs sm:text-sm"
                        >
                          <div className="flex items-center gap-2.5">
                            <span
                              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full ${
                                isAccepted ? (isPrimary ? 'bg-red-primary' : 'bg-blue-primary') : 'bg-stone-400'
                              } text-white text-[10px] sm:text-xs font-bold flex items-center justify-center font-label shrink-0`}
                            >
                              {getInitials(g.first_name, g.last_name)}
                            </span>
                            <div>
                              <span className="font-medium text-stone-900 font-editorial block leading-tight">
                                {g.first_name} {g.last_name}
                              </span>
                              <span
                                className={`text-[10px] font-semibold font-label ${
                                  isPrimary ? 'text-red-primary' : 'text-stone-500'
                                }`}
                              >
                                {isPrimary ? 'Primary Guest' : 'Invited Guest'}
                              </span>
                            </div>
                          </div>
                          <div>
                            {isAccepted ? (
                              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 font-label">
                                <span className="material-symbols-outlined text-xs">check</span>
                                <span>Confirmed</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-stone-200 text-stone-600 font-label">
                                <span className="material-symbols-outlined text-xs">close</span>
                                <span>Regretfully Declined</span>
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {notes && (
                    <div className="pt-2 border-t border-stone-200 text-xs text-stone-600 font-sans-ui italic">
                      "{notes}"
                    </div>
                  )}
                </div>

                {/* Adjustment notice */}
                <div className="p-3 sm:p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200/70 text-left flex items-start gap-2.5 mb-6">
                  <span className="material-symbols-outlined text-amber-800 text-lg shrink-0 mt-0.5">info</span>
                  <div className="text-xs text-stone-700 font-sans-ui leading-relaxed">
                    <strong className="text-red-primary font-semibold font-label uppercase text-[11px] block mb-0.5">
                      Need to make adjustments?
                    </strong>
                    You may freely revisit and update attendance decisions for your reserved party anytime on or before{' '}
                    <span className="font-semibold text-stone-900">April 15, 2027</span>.
                  </div>
                </div>

                {/* Actions row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowConfirmation(false)}
                    className="py-3 px-4 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs uppercase tracking-wider rounded-xl font-label font-bold transition flex items-center justify-center gap-2 border border-stone-200 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-base">edit</span>
                    <span>Edit RSVP Decisions</span>
                  </button>
                  <button
                    type="button"
                    onClick={onOpenRegistry}
                    className="py-3 px-4 bg-blue-light hover:bg-blue-border text-blue-primary text-xs uppercase tracking-wider rounded-xl font-label font-bold transition flex items-center justify-center gap-2 border border-blue-subtle cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-base">card_giftcard</span>
                    <span>View Gift Registry</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Section End Monogram & Sign-off Signature */}
          <div className="text-center mt-14 space-y-3">
            <span className="font-script text-4xl text-red-primary block">James &amp; Amber</span>
            <p className="text-xs uppercase tracking-[0.25em] text-stone-500 font-label">
              May 15, 2027 • Cebu City, Philippines
            </p>
            <p className="text-xs text-stone-400 font-serif italic max-w-md mx-auto">
              A weekend of love, art, and timeless memories surrounded by our dearest family and friends.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
