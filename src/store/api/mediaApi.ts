import { apiSlice } from './apiSlice.ts';

export interface HeroImageResponse {
  success: boolean;
  hasCustomImage: boolean;
  url: string | null;
}

export interface UploadHeroImageResponse {
  success: boolean;
  url: string;
}

export const mediaApi = apiSlice.injectEndpoints({
  endpoints: (build) => ({
    getHeroImage: build.query<HeroImageResponse, void>({
      query: () => '/hero-image',
      providesTags: ['HeroImage']
    }),
    uploadHeroImage: build.mutation<UploadHeroImageResponse, { imageBase64: string }>({
      query: (body) => ({
        url: '/hero-image',
        method: 'POST',
        body
      }),
      invalidatesTags: ['HeroImage']
    })
  })
});

export const {
  useGetHeroImageQuery,
  useUploadHeroImageMutation
} = mediaApi;
