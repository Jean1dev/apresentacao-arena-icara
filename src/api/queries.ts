import { QueryClient, queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiError } from "./client";
import { createBooking, getAvailableSlots, getBusinessHours, getCourtSlots, getCourts } from "./endpoints";
import type { Booking, CreateBookingRequest } from "./types";

export const queryKeys = {
  courts: ["courts"] as const,
  courtSlots: (courtId: string) => ["court-slots", courtId] as const,
  availableSlots: ["available-slots"] as const,
  businessHours: ["business-hours"] as const,
};

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // A agenda muda com reservas de outras pessoas: dado curto e refetch ao voltar pra aba.
        staleTime: 30_000,
        refetchOnWindowFocus: true,
        // 4xx não melhora repetindo; rede e 5xx tentam mais duas vezes.
        retry: (count, error) => !(error instanceof ApiError && error.isClientError) && count < 2,
      },
    },
  });
}

export const courtsQuery = () =>
  queryOptions({
    queryKey: queryKeys.courts,
    queryFn: ({ signal }) => getCourts(signal),
    staleTime: 5 * 60_000,
  });

export const courtSlotsQuery = (courtId: string, from: string, to: string) =>
  queryOptions({
    queryKey: [...queryKeys.courtSlots(courtId), from, to],
    queryFn: ({ signal }) => getCourtSlots(courtId, from, to, signal),
  });

export const availableSlotsQuery = (date: string) =>
  queryOptions({
    queryKey: [...queryKeys.availableSlots, date],
    queryFn: ({ signal }) => getAvailableSlots(date, signal),
  });

export const businessHoursQuery = () =>
  queryOptions({
    queryKey: queryKeys.businessHours,
    queryFn: ({ signal }) => getBusinessHours(signal),
    staleTime: 10 * 60_000,
  });

export const useCourts = () => useQuery(courtsQuery());

export const useCourtSlots = (courtId: string | undefined, from: string, to: string) =>
  useQuery({ ...courtSlotsQuery(courtId ?? "", from, to), enabled: !!courtId });

export const useAvailableSlots = (date: string, enabled = true) => useQuery({ ...availableSlotsQuery(date), enabled });

export const useBusinessHours = () => useQuery(businessHoursQuery());

/**
 * Cria a reserva. Dando certo ou não, a agenda daquela quadra fica desatualizada.
 * A invalidação não é aguardada: a resposta chega à tela sem esperar o refetch.
 */
export function useCreateBooking() {
  const queryClient = useQueryClient();
  return useMutation<Booking, ApiError, CreateBookingRequest>({
    mutationFn: createBooking,
    onSettled: (_data, _error, req) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.courtSlots(req.courtId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.availableSlots });
    },
  });
}
