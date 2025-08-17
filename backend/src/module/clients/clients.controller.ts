import { Request, Response } from "express";
import { clientsService } from "./clients.service";
import { asyncHandler, created, ok, HttpError } from "../../shared/http";
import { isE164, normalizePhoneE164 } from "../../shared/phone";

export const clientsController = {
  list: asyncHandler(async (_req: Request, res: Response) => {
    ok(res, await clientsService.list());
  }),

  get: asyncHandler(async (req: Request, res: Response) => {
    const client = await clientsService.getById(req.params.id);
    if (!client) throw new HttpError(404, "Cliente no encontrado");
    ok(res, client);
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const { name, phone, notes } = req.body ?? {};
    if (!name || typeof name !== "string") throw new HttpError(400, "name requerido");
    if (!phone || typeof phone !== "string") throw new HttpError(400, "phone requerido");

    const e164 = normalizePhoneE164(phone);
    if (!isE164(e164)) throw new HttpError(400, "phone inválido (E.164)");

    const createdClient = await clientsService.create({ name: name.trim(), phone: e164, notes });
    created(res, createdClient);
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const data = { ...req.body };
    if (typeof data.phone === "string") {
      data.phone = normalizePhoneE164(data.phone);
      if (!isE164(data.phone)) throw new HttpError(400, "phone inválido (E.164)");
    }
    ok(res, await clientsService.update(req.params.id, data));
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    await clientsService.remove(req.params.id);
    res.status(204).send();
  }),
};
