import { apiSlice } from './apiSlice.ts';
import { D1StatsResponse } from '../../types.ts';

export const adminApi = apiSlice.injectEndpoints({
  endpoints: (build) => ({
    getAdminParties: build.query<{ success: boolean } & D1StatsResponse, void>({
      query: () => '/admin/parties',
      providesTags: ['AdminParties']
    }),
    resetDatabase: build.mutation<{ success: boolean; message: string } & D1StatsResponse, void>({
      query: () => ({
        url: '/admin/reset',
        method: 'POST'
      }),
      invalidatesTags: ['AdminParties', 'Party']
    }),
    getD1SqlExport: build.query<string, void>({
      query: () => ({
        url: '/d1/export-sql',
        responseHandler: (response) => response.text()
      })
    })
  })
});

export const {
  useGetAdminPartiesQuery,
  useLazyGetAdminPartiesQuery,
  useResetDatabaseMutation,
  useGetD1SqlExportQuery,
  useLazyGetD1SqlExportQuery
} = adminApi;
