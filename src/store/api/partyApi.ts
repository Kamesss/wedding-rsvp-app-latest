import { apiSlice } from './apiSlice.ts';
import { Party, Guest, SubmitRsvpRequest, SubmitRsvpResponse } from '../../types.ts';

export const partyApi = apiSlice.injectEndpoints({
  endpoints: (build) => ({
    getPartyById: build.query<{ success: boolean; party: Party & { guests: Guest[] } }, string>({
      query: (partyId) => `/party/${encodeURIComponent(partyId)}`,
      providesTags: (_result, _error, partyId) => [{ type: 'Party', id: partyId }]
    }),
    getPartyByToken: build.query<{ success: boolean; party: Party & { guests: Guest[] } }, string>({
      query: (token) => `/party/token/${encodeURIComponent(token)}`,
      providesTags: (result) => (result?.party ? [{ type: 'Party', id: result.party.id }] : [])
    }),
    submitRsvp: build.mutation<SubmitRsvpResponse, SubmitRsvpRequest>({
      query: (body) => ({
        url: '/rsvp/submit',
        method: 'POST',
        body
      }),
      invalidatesTags: (_result, _error, { partyId }) => [
        { type: 'Party', id: partyId },
        { type: 'AdminParties' }
      ]
    })
  })
});

export const {
  useGetPartyByIdQuery,
  useLazyGetPartyByIdQuery,
  useGetPartyByTokenQuery,
  useLazyGetPartyByTokenQuery,
  useSubmitRsvpMutation
} = partyApi;
