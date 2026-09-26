import { apiSlice } from './apiSlice.ts';
import { ValidateGuestResponse } from '../../types.ts';

export const authApi = apiSlice.injectEndpoints({
  endpoints: (build) => ({
    validateGuest: build.mutation<ValidateGuestResponse, { fullName: string }>({
      query: (body) => ({
        url: '/auth/validate-guest',
        method: 'POST',
        body
      })
    })
  })
});

export const { useValidateGuestMutation } = authApi;
