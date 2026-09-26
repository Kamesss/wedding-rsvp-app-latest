export type RsvpStatus = 'pending' | 'accepted' | 'declined';

export interface Guest {
  id: string;
  party_id: string;
  first_name: string;
  last_name: string;
  is_primary_contact: boolean | number;
  rsvp_status: RsvpStatus;
  created_at?: string;
}

export interface Party {
  id: string;
  party_name: string;
  access_token: string;
  max_reserved_seats: number;
  is_submitted: boolean | number;
  submitted_at?: string | null;
  notes?: string | null;
  created_at?: string;
  guests?: Guest[];
}

export interface ValidateGuestResponse {
  success: boolean;
  message?: string;
  matchedGuest?: Guest;
  party?: Party & { guests: Guest[] };
}

export interface GuestResponsePayload {
  guestId: string;
  rsvp_status: 'accepted' | 'declined';
}

export interface SubmitRsvpRequest {
  partyId: string;
  submittedByGuestId?: string;
  guestResponses: GuestResponsePayload[];
  notes?: string;
}

export interface SubmitRsvpResponse {
  success: boolean;
  message: string;
  party: Party & { guests: Guest[] };
}

export interface D1StatsResponse {
  totalParties: number;
  totalGuests: number;
  confirmedGuests: number;
  declinedGuests: number;
  pendingGuests: number;
  submittedParties: number;
  parties: (Party & { guests: Guest[] })[];
}
