import { NextFunction, Request, Response } from "express";

export class HttpError extends Error {
  status: number;
  details?: unknown;
  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export const asyncHandler =
  <T extends (req: Request, res: Response, next: NextFunction) => any>(fn: T) =>
  (req: Request, res: Response, next: NextFunction) =>
    Promise.resolve(fn(req, res, next)).catch(next);

export const ok = (res: Response, data: unknown) => res.status(200).json(data);
export const created = (res: Response, data: unknown) =>
  res.status(201).json(data);

export function notFound(_req: Request, res: Response) {
  res.status(404).json({ message: "Not Found" });
}

export function errorHandler(
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  if (err instanceof HttpError) {
    return res
      .status(err.status)
      .json({ message: err.message, details: err.details });
  }
  console.error("Unhandled error:", err);
  res.status(500).json({ message: "Internal Server Error" });
}

export function parseDate(value: unknown, field: string): Date | undefined {
  if (typeof value !== "string" || !value.trim()) return undefined;
  const d = new Date(value);
  if (isNaN(d.getTime())) throw new HttpError(400, `Fecha inválida en '${field}'`);
  return d;
}
