import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import type { Booking, CreateBookingInline, CreateRecurring } from "../types";

export function useBookings(params?: { from?: string; to?: string }) {
  return useQuery({
    queryKey: ["bookings", params],
    queryFn: async (): Promise<Booking[]> =>
      (await api.get("/bookings", { params })).data,
  });
}

export function useCreateBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateBookingInline): Promise<Booking> =>
      (await api.post("/bookings", data)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bookings"] });
      qc.invalidateQueries({ queryKey: ["clients"] });
    },
  });
}

export function useCompleteBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string): Promise<Booking> =>
      (await api.post(`/bookings/${id}/complete`)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["bookings"] }),
  });
}

export function useCancelBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string): Promise<Booking> =>
      (await api.post(`/bookings/${id}/cancel`)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["bookings"] }),
  });
}

export function useCreateRecurring() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateRecurring) =>
      (await api.post("/bookings/recurring", data)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["bookings"] }),
  });
}
