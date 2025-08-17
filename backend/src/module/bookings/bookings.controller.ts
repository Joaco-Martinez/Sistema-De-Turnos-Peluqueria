import { Request, Response } from "express";
import { bookingsService } from "./bookings.service";
import { asyncHandler, HttpError, ok, created, parseDate } from "../../shared/http";

export const bookingsController = {
  // Listar (opcionalmente por rango ?from=YYYY-MM-DD&to=YYYY-MM-DD)
  list: asyncHandler(async (req: Request, res: Response) => {
    const from = parseDate(req.query.from, "from");
    const to = parseDate(req.query.to, "to");
    const data = await bookingsService.list(from, to);
    ok(res, data);
  }),

  // Obtener por id
  get: asyncHandler(async (req: Request, res: Response) => {
    const b = await bookingsService.getById(req.params.id);
    if (!b) throw new HttpError(404, "Turno no encontrado");
    ok(res, b);
  }),

  // Crear turno (en 1 paso: con clientId o con { client: { name, phone } })
  create: asyncHandler(async (req: Request, res: Response) => {
    const { startsAt, durationMinutes } = req.body ?? {};
    if (typeof startsAt !== "string") throw new HttpError(400, "startsAt requerido (ISO)");
    if (typeof durationMinutes !== "number") throw new HttpError(400, "durationMinutes requerido");

    const createdBooking = await bookingsService.create(req.body);
    created(res, createdBooking);
  }),

  // Crear serie recurrente (weekly | biweekly | monthly) con días hábiles
  createRecurring: asyncHandler(async (req: Request, res: Response) => {
    const result = await bookingsService.createRecurring(req.body);
    created(res, result);
  }),

  // Actualizar turno (fecha/hora/duración/cliente/servicio/estado)
  update: asyncHandler(async (req: Request, res: Response) => {
    const data = await bookingsService.update(req.params.id, req.body ?? {});
    ok(res, data);
  }),

  // Cancelar un turno
  cancel: asyncHandler(async (req: Request, res: Response) => {
    const data = await bookingsService.cancel(req.params.id);
    ok(res, data);
  }),

  cancelSeries: asyncHandler(async (req, res) => {
    const { seriesId } = req.params;
    if (!seriesId) throw new HttpError(400, "seriesId requerido");
    // ?onlyFuture=false para cancelar también pasados
    const onlyFuture = req.query.onlyFuture !== "false";
    const data = await bookingsService.cancelSeries(seriesId, { onlyFuture });
    ok(res, data);
  }),


  cancelOneInSeries: asyncHandler(async (req, res) => {
    const { seriesId } = req.params;
    const { date, time } = req.body ?? {}; // date: YYYY-MM-DD, time: HH:mm
    if (!seriesId) throw new HttpError(400, "seriesId requerido");
    if (typeof date !== "string" || typeof time !== "string") {
      throw new HttpError(400, "date (YYYY-MM-DD) y time (HH:mm) requeridos");
    }
    const data = await bookingsService.cancelOneInSeries(seriesId, date, time);
    ok(res, data);
  }),


  // Completar un turno
  complete: asyncHandler(async (req: Request, res: Response) => {
    const data = await bookingsService.complete(req.params.id);
    ok(res, data);
  }),
};
