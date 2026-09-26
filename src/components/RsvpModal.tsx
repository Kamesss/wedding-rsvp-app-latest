import React, { useState, useEffect } from 'react';
import { Party, Guest } from '../types.ts';
import { useSubmitRsvpMutation } from '../store/index.ts';

interface RsvpModalProps {
  isOpen: boolean;
  party: Party & { guests: Guest[] };
  currentGuest: Guest;
  onClose: () => void;
  onRsvpUpdated: (updatedParty: Party & { guests: Guest[] }) => void;
  onOpenRegistry: () => void;
}

export const RsvpModal: React.FC<RsvpModalProps> = ({
  isOpen,
  party,
  currentGuest,
  onClose,
  onRsvpUpdated,
  onOpenRegistry
}) => {
  // Local state for each member's decision: { [guestId]: 'accepted' | 'declined' }
  const [decisions, setDecisions] = useState<Record<string, 'accepted' | 'declined'>>({});
  const [notes, setNotes] = useState<string>('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [submitRsvp, { isLoading: isSubmitting }] = useSubmitRsvpMutation();

  // Initialize or re-sync decisions from the party guests
  useEffect(() => {
    if (party && party.guests) {
      const initialDecisions: Record<string, 'accepted' | 'declined'> = {};
      party.guests.forEach((g) => {
        initialDecisions[g.id] = g.rsvp_status === 'declined' ? 'declined' : 'accepted';
      });
      setDecisions(initialDecisions);
      setNotes(party.notes || '');

      // If already submitted in the database, show the confirmation screen first
      if (party.is_submitted) {
        setShowConfirmation(true);
      } else {
        setShowConfirmation(false);
      }
    }
  }, [party, isOpen]);

  if (!isOpen) return null;

  const handleDecisionChange = (guestId: string, status: 'accepted' | 'declined') => {
    setDecisions((prev) => ({
      ...prev,
      [guestId]: status
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

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
        setErrorMsg(data.message || 'Failed to submit RSVP.');
        return;
      }

      onRsvpUpdated(data.party);
      setShowConfirmation(true);
    } catch (err: any) {
      console.error('RSVP submit error:', err);
      const serverMsg = err?.data?.message || err?.message;
      setErrorMsg(serverMsg || 'Failed to connect to the database. Please try again.');
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const confirmedCount = party.guests.filter((g) => decisions[g.id] === 'accepted').length;
  const totalSeats = party.guests.length;

  return (
    <div className="fixed inset-0 z-50 items-center justify-center p-3 sm:p-4 modal-backdrop bg-black/60 transition-opacity flex">
      <div className="bg-white rounded-3xl max-w-xl w-full p-4 sm:p-7 shadow-2xl border border-stone-200 relative max-h-[94vh] flex flex-col overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close Modal"
          className="absolute top-3 right-3 sm:top-5 sm:right-5 z-20 w-8 h-8 rounded-full bg-stone-100/90 text-stone-400 hover:text-stone-700 hover:bg-stone-200 transition flex items-center justify-center cursor-pointer shadow-sm"
        >
          <span className="material-symbols-outlined text-xl">close</span>
        </button>

        {/* ---------------------------------------------------- */}
        {/* VIEW 1: RSVP FORM VIEW                               */}
        {/* ---------------------------------------------------- */}
        {!showConfirmation ? (
          <div className="flex flex-col flex-1 overflow-y-auto custom-scrollbar pr-1">
            {/* Modal Header with Personalized Greeting */}
            <div className="text-center pt-2 pb-3 sm:pb-4 border-b border-stone-100">
              <span className="font-script text-3xl sm:text-4xl text-red-primary block">
                Welcome, {currentGuest.first_name} {currentGuest.last_name}!
              </span>
              <h3 className="font-editorial text-lg sm:text-2xl uppercase tracking-wider text-stone-800 mt-0.5">
                Wedding RSVP
              </h3>
              <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-beige-paper border border-beige-secondary text-left sm:text-center">
                <span className="material-symbols-outlined text-xs sm:text-sm text-red-primary shrink-0">stars</span>
                <p className="text-[11px] sm:text-xs font-medium text-stone-700 font-label">
                  We have reserved <strong className="text-red-primary font-semibold">{party.max_reserved_seats} seats</strong>{' '}
                  in honor of {party.party_name}.
                </p>
              </div>
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div className="mt-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">error</span>
                <span>{errorMsg}</span>
              </div>
            )}

            {/* RSVP Form */}
            <form onSubmit={handleSubmit} className="space-y-4 pt-3 flex-1 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-stone-700 font-label">
                    Reserved Family Guests
                  </label>
                  <span className="text-[10px] sm:text-[11px] text-stone-500 font-label">
                    Indicate attendance for each guest
                  </span>
                </div>

                {/* Family Members Toggle List */}
                <div className="space-y-2">
                  {party.guests.map((guestItem) => {
                    const isAttending = (decisions[guestItem.id] || 'accepted') === 'accepted';
                    const isPrimary = Boolean(guestItem.is_primary_contact);

                    return (
                      <div
                        key={guestItem.id}
                        className="p-2.5 sm:p-3 rounded-xl bg-beige-paper border border-stone-200 flex items-center justify-between gap-2 hover:border-red-primary/30 transition"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full ${
                              isPrimary ? 'bg-red-primary' : 'bg-blue-primary'
                            } text-white flex items-center justify-center font-label text-[11px] font-bold shrink-0 shadow-sm`}
                          >
                            {getInitials(guestItem.first_name, guestItem.last_name)}
                          </div>
                          <div className="truncate">
                            <p className="font-medium text-stone-900 text-xs sm:text-sm font-editorial truncate">
                              {guestItem.first_name} {guestItem.last_name}
                            </p>
                            <span
                              className={`text-[9px] sm:text-[10px] font-semibold tracking-wider uppercase font-label ${
                                isPrimary ? 'text-red-primary' : 'text-stone-500'
                              }`}
                            >
                              {isPrimary ? 'Primary Guest' : 'Guest'}
                            </span>
                          </div>
                        </div>

                        {/* Accept / Decline Toggle Buttons */}
                        <div className="flex items-center gap-1 bg-stone-100 p-0.5 rounded-lg shrink-0">
                          <button
                            type="button"
                            onClick={() => handleDecisionChange(guestItem.id, 'accepted')}
                            className={`px-2.5 py-1 rounded-md text-[11px] font-label font-medium transition cursor-pointer ${
                              isAttending
                                ? 'bg-emerald-700 text-white shadow-sm'
                                : 'text-stone-600 hover:text-stone-900'
                            }`}
                          >
                            Accept
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDecisionChange(guestItem.id, 'declined')}
                            className={`px-2.5 py-1 rounded-md text-[11px] font-label font-medium transition cursor-pointer ${
                              !isAttending
                                ? 'bg-stone-500 text-white shadow-sm'
                                : 'text-stone-600 hover:text-stone-900'
                            }`}
                          >
                            Decline
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Optional Message / Wishes */}
                <div className="mt-3">
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-stone-600 font-label mb-1">
                    Special Notes or Dietary Wishes (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Allergies, song requests, or warm congratulations for the couple..."
                    className="w-full p-2.5 rounded-xl border border-stone-200 text-xs font-sans-ui text-stone-800 placeholder-stone-400 focus:outline-none focus:border-blue-secondary focus:ring-1 focus:ring-blue-secondary"
                  />
                </div>
              </div>

              {/* RSVP Deadline Note */}
              <div className="p-2.5 sm:p-3 rounded-xl bg-beige-paper border border-beige-secondary flex items-center gap-2.5 text-stone-700 mt-2">
                <div className="w-8 h-8 rounded-full bg-red-primary/10 text-red-primary flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-base">calendar_month</span>
                </div>
                <div className="text-[11px] sm:text-xs">
                  <p className="font-bold uppercase tracking-wider text-red-primary font-label">RSVP Deadline</p>
                  <p className="text-stone-600 font-sans-ui leading-tight mt-0.5">
                    Kindly submit on or before <strong className="text-stone-800 font-semibold">April 15, 2027</strong> to guarantee reservations.
                  </p>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2 sticky bottom-0 bg-white/95 pb-1 backdrop-blur-sm">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 sm:py-3.5 bg-red-primary hover:bg-red-secondary disabled:bg-stone-400 text-white font-label text-xs uppercase tracking-widest font-bold rounded-xl shadow-lg hover:shadow-xl transition transform hover:-translate-y-0.5 active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
                      <span>Saving to D1 Database...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-base">how_to_reg</span>
                      <span>Submit RSVP</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* ---------------------------------------------------- */
          /* VIEW 2: RSVP SUCCESS CONFIRMATION VIEW               */
          /* ---------------------------------------------------- */
          <div className="flex flex-col flex-1 overflow-y-auto custom-scrollbar pr-1 py-1 text-center">
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mb-1.5 shadow-sm border border-emerald-200">
                <span className="material-symbols-outlined text-xl sm:text-2xl">mark_email_read</span>
              </div>
              <span className="font-script text-2xl sm:text-3xl text-red-primary leading-tight">
                RSVP Received With Joy!
              </span>
              <h4 className="font-editorial text-xs sm:text-base uppercase tracking-wider text-stone-900 mt-0.5">
                {party.party_name} Celebration
              </h4>
              <div className="mt-1.5 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] sm:text-xs font-label font-bold uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                <span>RSVP Confirmed &amp; Logged</span>
              </div>
            </div>

            {/* Attendance Breakdown Card */}
            <div className="bg-beige-paper rounded-2xl p-2.5 sm:p-4 border border-stone-200 text-left my-3 space-y-2">
              <div className="flex items-center justify-between pb-1.5 border-b border-stone-200">
                <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-stone-700 font-label flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm sm:text-base text-red-primary">how_to_reg</span>
                  <span>Party Attendance Breakdown</span>
                </p>
                <span className="text-[10px] sm:text-xs font-bold text-red-primary font-label bg-white px-2 py-0.5 rounded-full border border-stone-200">
                  {confirmedCount} of {totalSeats} Seats Confirmed
                </span>
              </div>

              {/* Guest status items */}
              <div className="space-y-1.5">
                {party.guests.map((g) => {
                  const isAccepted = (decisions[g.id] || g.rsvp_status) === 'accepted';
                  const isPrimary = Boolean(g.is_primary_contact);

                  return (
                    <div
                      key={g.id}
                      className="flex items-center justify-between py-1 border-b border-stone-200/60 last:border-b-0 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full ${
                            isAccepted ? (isPrimary ? 'bg-red-primary' : 'bg-blue-primary') : 'bg-stone-400'
                          } text-white text-[9px] sm:text-[10px] font-bold flex items-center justify-center font-label shrink-0`}
                        >
                          {getInitials(g.first_name, g.last_name)}
                        </span>
                        <div>
                          <span className="font-medium text-stone-900 text-[11px] sm:text-xs font-editorial block leading-tight">
                            {g.first_name} {g.last_name}
                          </span>
                          <span
                            className={`text-[9px] sm:text-[10px] font-semibold font-label ${
                              isPrimary ? 'text-red-primary' : 'text-stone-500'
                            }`}
                          >
                            {isPrimary ? 'Primary Guest' : 'Guest'}
                          </span>
                        </div>
                      </div>
                      <div>
                        {isAccepted ? (
                          <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 font-label">
                            <span className="material-symbols-outlined text-xs">check</span>
                            <span>Confirmed</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold uppercase tracking-wider bg-stone-200 text-stone-600 font-label">
                            <span className="material-symbols-outlined text-xs">close</span>
                            <span>Regretfully Declined</span>
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Note about adjustments */}
            <div className="p-2 sm:p-3 rounded-xl bg-amber-50/80 border border-amber-200/70 text-left flex items-start gap-2 mb-3">
              <span className="material-symbols-outlined text-amber-800 text-sm sm:text-base mt-0.5 shrink-0">info</span>
              <p className="text-[10px] sm:text-xs text-stone-700 font-sans-ui leading-tight sm:leading-relaxed">
                <strong className="text-red-primary font-semibold font-label uppercase text-[10px] sm:text-[11px] block">
                  Need to make adjustments?
                </strong>
                You may freely revisit and update attendance decisions for your reserved party anytime on or before{' '}
                <span className="font-semibold text-stone-900">April 15, 2027</span>.
              </p>
            </div>

            {/* Action Buttons Row */}
            <div className="space-y-2 mt-auto pt-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={onOpenRegistry}
                  className="py-2 sm:py-2.5 px-3 rounded-xl bg-blue-light hover:bg-blue-border text-blue-primary font-label text-[10px] sm:text-xs uppercase font-bold tracking-wider transition inline-flex items-center justify-center gap-1.5 border border-blue-subtle cursor-pointer"
                >
                  <span className="material-symbols-outlined text-base">card_giftcard</span>
                  <span>Gift Registry</span>
                </button>

                <div className="relative group">
                  <button
                    type="button"
                    disabled
                    className="w-full py-2 sm:py-2.5 px-3 rounded-xl bg-stone-100 text-stone-400 font-label text-[10px] sm:text-xs uppercase font-bold tracking-wider cursor-not-allowed inline-flex items-center justify-center gap-1.5 border border-stone-200"
                  >
                    <span className="material-symbols-outlined text-base">chair</span>
                    <span>Seating Arrangement</span>
                  </button>
                  <span className="absolute -top-2 right-2 bg-red-primary text-white text-[8px] sm:text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded-full shadow-sm">
                    Available May 1, 2027
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowConfirmation(false)}
                  className="w-1/2 py-2 sm:py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-[11px] sm:text-xs uppercase tracking-wider rounded-xl font-label transition font-semibold cursor-pointer border border-stone-200"
                >
                  Edit Decisions
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-1/2 py-2 sm:py-2.5 bg-stone-800 hover:bg-stone-900 text-white text-[11px] sm:text-xs uppercase tracking-wider rounded-xl font-label transition font-semibold shadow cursor-pointer"
                >
                  Return to Details
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
