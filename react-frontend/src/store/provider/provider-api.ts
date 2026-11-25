import { createApi } from "@reduxjs/toolkit/query/react";
import type { BaseQueryFn } from "@reduxjs/toolkit/query";
import { AuthActions } from "../auth/auth-slice";
import {
  acceptBooking,
  getBookingsByProvider,
  getMyPendingOffers,
  getProviderSchedule,
  rejectBooking,
  requestBookingCompletion,
  startBooking,
} from "@/services/bookings.service";
import {
  getProviderByUser,
  updateProvider,
} from "@/services/providers.service";
import {
  createUnavailability,
  getUnavailabilityByProvider,
  updateUnavailability,
} from "@/services/unavailability.service";
import { getUserById, updateUser } from "@/services/users.service";
import type {
  BookingDocument,
  CreateUnavailabilityDto,
  ProviderDocument,
  UnavailabilityDocument,
  UpdateProviderDto,
  UpdateUnavailabilityDto,
  UpdateUserDto,
  UserDocument,
} from "@/models/api.models";

type ApiError = {
  status?: number;
  data?: unknown;
  message: string;
};

function toApiError(error: unknown): ApiError {
  if (typeof error === "object" && error !== null) {
    const axiosError = error as {
      message?: string;
      response?: { status?: number; data?: unknown };
    };
    return {
      status: axiosError.response?.status,
      data: axiosError.response?.data,
      message: axiosError.message ?? "Request failed",
    };
  }
  return { message: "Request failed" };
}

async function queryFrom<T>(
  request: () => Promise<T>,
): Promise<{ data: T } | { error: ApiError }> {
  try {
    return { data: await request() };
  } catch (error) {
    return { error: toApiError(error) };
  }
}

const providerBaseQuery: BaseQueryFn<void, unknown, ApiError> = async () => ({
  error: { message: "Provider API endpoints use queryFn." },
});

export const providerApi = createApi({
  reducerPath: "providerApi",
  baseQuery: providerBaseQuery,
  tagTypes: ["Provider", "User", "Booking", "Offer", "Schedule", "Unavailability"],
  endpoints: (build) => ({
    getProviderByUser: build.query<ProviderDocument, string>({
      queryFn: (userId) => queryFrom(() => getProviderByUser(userId)),
      providesTags: (_result, _error, userId) => [{ type: "Provider", id: userId }],
    }),
    updateProvider: build.mutation<ProviderDocument, { id: string; changes: UpdateProviderDto }>({
      queryFn: ({ id, changes }) => queryFrom(() => updateProvider(id, changes)),
      invalidatesTags: ["Provider"],
    }),
    getUser: build.query<UserDocument, string>({
      queryFn: (id) => queryFrom(() => getUserById(id)),
      providesTags: (_result, _error, id) => [{ type: "User", id }],
    }),
    updateUser: build.mutation<UserDocument, { id: string; changes: UpdateUserDto }>({
      queryFn: ({ id, changes }) => queryFrom(() => updateUser(id, changes)),
      invalidatesTags: (_result, _error, { id }) => [{ type: "User", id }],
      async onQueryStarted({ id }, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(AuthActions.profileUpdated({
            id,
            name: data.name,
            email: data.email,
            phone: data.phone,
          }));
        } catch {
          // The mutation hook exposes the request error to its caller.
        }
      },
    }),
    getProviderBookings: build.query<BookingDocument[], string>({
      queryFn: (providerId) => queryFrom(() => getBookingsByProvider(providerId)),
      providesTags: (_result, _error, providerId) => [{ type: "Booking", id: providerId }],
    }),
    getIncomingOffers: build.query<BookingDocument[], void>({
      queryFn: () => queryFrom(getMyPendingOffers),
      providesTags: ["Offer"],
    }),
    getProviderSchedule: build.query<BookingDocument[], string>({
      queryFn: (providerId) => queryFrom(() => getProviderSchedule(providerId)),
      providesTags: (_result, _error, providerId) => [{ type: "Schedule", id: providerId }],
    }),
    getUnavailability: build.query<UnavailabilityDocument[], string>({
      queryFn: (providerId) => queryFrom(() => getUnavailabilityByProvider(providerId)),
      providesTags: (_result, _error, providerId) => [{ type: "Unavailability", id: providerId }],
    }),
    createUnavailability: build.mutation<UnavailabilityDocument, CreateUnavailabilityDto>({
      queryFn: (changes) => queryFrom(() => createUnavailability(changes)),
      invalidatesTags: (_result, _error, { provider }) => [{ type: "Unavailability", id: provider }],
    }),
    updateUnavailability: build.mutation<UnavailabilityDocument, { id: string; providerId: string; changes: UpdateUnavailabilityDto }>({
      queryFn: ({ id, changes }) => queryFrom(() => updateUnavailability(id, changes)),
      invalidatesTags: (_result, _error, { providerId }) => [{ type: "Unavailability", id: providerId }],
    }),
    acceptBooking: build.mutation<BookingDocument, { id: string; providerId?: string }>({
      queryFn: ({ id, providerId }) => queryFrom(() => acceptBooking(id, providerId)),
      invalidatesTags: ["Offer", "Booking", "Schedule"],
    }),
    rejectBooking: build.mutation<BookingDocument, { id: string; providerId?: string }>({
      queryFn: ({ id, providerId }) => queryFrom(() => rejectBooking(id, providerId)),
      invalidatesTags: ["Offer"],
    }),
    startBooking: build.mutation<BookingDocument, string>({
      queryFn: (id) => queryFrom(() => startBooking(id)),
      invalidatesTags: ["Booking", "Schedule"],
    }),
    requestBookingCompletion: build.mutation<BookingDocument, string>({
      queryFn: (id) => queryFrom(() => requestBookingCompletion(id)),
      invalidatesTags: ["Booking", "Schedule"],
    }),
  }),
});

export const {
  useGetProviderByUserQuery,
  useUpdateProviderMutation,
  useGetUserQuery,
  useUpdateUserMutation,
  useGetProviderBookingsQuery,
  useGetIncomingOffersQuery,
  useGetProviderScheduleQuery,
  useGetUnavailabilityQuery,
  useCreateUnavailabilityMutation,
  useUpdateUnavailabilityMutation,
  useAcceptBookingMutation,
  useRejectBookingMutation,
  useStartBookingMutation,
  useRequestBookingCompletionMutation,
} = providerApi;
