/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Party, Guest } from './types.ts';
import {
  useLazyGetPartyByTokenQuery,
  useValidateGuestMutation,
  useLazyGetPartyByIdQuery
} from './store/index.ts';
import { LoginPage } from './components/LoginPage.tsx';
import { WaxEnvelopeOverlay } from './components/WaxEnvelopeOverlay.tsx';
import { WeddingMainPage } from './components/WeddingMainPage.tsx';
import { RsvpModal } from './components/RsvpModal.tsx';
import { RegistryModal } from './components/RegistryModal.tsx';
import { D1InfoModal } from './components/D1InfoModal.tsx';

export default function App() {
  const [currentGuest, setCurrentGuest] = useState<Guest | null>(null);
  const [currentParty, setCurrentParty] = useState<(Party & { guests: Guest[] }) | null>(null);
  const [showEnvelope, setShowEnvelope] = useState<boolean>(false);
  const [isRsvpOpen, setIsRsvpOpen] = useState<boolean>(false);
  const [isRegistryOpen, setIsRegistryOpen] = useState<boolean>(false);
  const [isD1InfoOpen, setIsD1InfoOpen] = useState<boolean>(false);

  const [fetchPartyByToken] = useLazyGetPartyByTokenQuery();
  const [validateGuest] = useValidateGuestMutation();
  const [fetchPartyById] = useLazyGetPartyByIdQuery();

  // Check URL search parameters or session storage on initial load
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const guestParam = urlParams.get('guest');
    const tokenParam = urlParams.get('token');

    if (tokenParam) {
      fetchPartyByToken(tokenParam)
        .unwrap()
        .then((data) => {
          if (data.success && data.party) {
            const primary =
              data.party.guests.find((g: Guest) => g.is_primary_contact) ||
              data.party.guests[0];
            setCurrentGuest(primary);
            setCurrentParty(data.party);
            setShowEnvelope(true);
          }
        })
        .catch(console.error);
    } else if (guestParam) {
      validateGuest({ fullName: guestParam })
        .unwrap()
        .then((data) => {
          if (data.success && data.matchedGuest && data.party) {
            setCurrentGuest(data.matchedGuest);
            setCurrentParty(data.party);
            setShowEnvelope(true);
          }
        })
        .catch(console.error);
    } else {
      // Check sessionStorage
      try {
        const savedSession = sessionStorage.getItem('wedding_guest_session');
        if (savedSession) {
          const parsed = JSON.parse(savedSession);
          if (parsed.guest && parsed.party) {
            setCurrentGuest(parsed.guest);
            setCurrentParty(parsed.party);
            // Re-fetch latest party data from database
            fetchPartyById(parsed.party.id)
              .unwrap()
              .then((fresh) => {
                if (fresh.success && fresh.party) {
                  setCurrentParty(fresh.party);
                }
              })
              .catch(() => {});
          }
        }
      } catch (e) {
        console.error('Session load error:', e);
      }
    }
  }, [fetchPartyByToken, validateGuest, fetchPartyById]);

  const handleGuestVerified = (guest: Guest, party: Party & { guests: Guest[] }) => {
    setCurrentGuest(guest);
    setCurrentParty(party);
    setShowEnvelope(true);
    try {
      sessionStorage.setItem('wedding_guest_session', JSON.stringify({ guest, party }));
    } catch (e) {
      console.error(e);
    }
  };

  const handleRsvpUpdated = (updatedParty: Party & { guests: Guest[] }) => {
    setCurrentParty(updatedParty);
    try {
      if (currentGuest) {
        sessionStorage.setItem(
          'wedding_guest_session',
          JSON.stringify({ guest: currentGuest, party: updatedParty })
        );
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSignOut = () => {
    setCurrentGuest(null);
    setCurrentParty(null);
    setShowEnvelope(false);
    setIsRsvpOpen(false);
    setIsRegistryOpen(false);
    try {
      sessionStorage.removeItem('wedding_guest_session');
    } catch (e) {
      console.error(e);
    }
  };

  // If not logged in, render Login Page
  if (!currentGuest || !currentParty) {
    return (
      <>
        <LoginPage
          onGuestVerified={handleGuestVerified}
          onOpenD1Info={() => setIsD1InfoOpen(true)}
        />
        <D1InfoModal
          isOpen={isD1InfoOpen}
          onClose={() => setIsD1InfoOpen(false)}
          onSelectPartyGuest={async (guestName) => {
            try {
              const data = await validateGuest({ fullName: guestName }).unwrap();
              if (data.success && data.matchedGuest && data.party) {
                handleGuestVerified(data.matchedGuest, data.party);
              }
            } catch (err) {
              console.error('Guest selection login error:', err);
            }
          }}
        />
      </>
    );
  }

  // Once logged in:
  return (
    <>
      {/* Sealed Wax Envelope Modal Unveiling */}
      {showEnvelope && (
        <WaxEnvelopeOverlay
          party={currentParty}
          guest={currentGuest}
          onOpenComplete={() => setShowEnvelope(false)}
        />
      )}

      {/* Main Wedding Celebration Portal */}
      <WeddingMainPage
        party={currentParty}
        currentGuest={currentGuest}
        onOpenRsvp={() => {
          const el = document.getElementById('rsvp-section');
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          } else {
            window.location.hash = 'rsvp-section';
          }
        }}
        onOpenRegistry={() => setIsRegistryOpen(true)}
        onOpenD1Info={() => setIsD1InfoOpen(true)}
        onReopenEnvelope={() => setShowEnvelope(true)}
        onChangeGuest={handleSignOut}
        onRsvpUpdated={handleRsvpUpdated}
      />

      {/* Interactive RSVP Modal with Family Members Toggle & Breakdown */}
      <RsvpModal
        isOpen={isRsvpOpen}
        party={currentParty}
        currentGuest={currentGuest}
        onClose={() => setIsRsvpOpen(false)}
        onRsvpUpdated={handleRsvpUpdated}
        onOpenRegistry={() => {
          setIsRsvpOpen(false);
          setIsRegistryOpen(true);
        }}
      />

      {/* Gift Registry & Wishing Well Modal */}
      <RegistryModal
        isOpen={isRegistryOpen}
        onClose={() => setIsRegistryOpen(false)}
      />

      {/* Cloudflare D1 Database Inspection Modal */}
      <D1InfoModal
        isOpen={isD1InfoOpen}
        onClose={() => setIsD1InfoOpen(false)}
      />
    </>
  );
}
