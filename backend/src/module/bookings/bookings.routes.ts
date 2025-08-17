import { Router } from "express";
import { bookingsController } from "./bookings.controller";

const router = Router();

router.get("/", bookingsController.list);

// serie (rutas específicas primero)
router.post("/recurring", bookingsController.createRecurring);
router.post("/series/:seriesId/cancel", bookingsController.cancelSeries);
// cancelar UNA ocurrencia de una serie por fecha/hora
router.post("/series/:seriesId/cancel-one", bookingsController.cancelOneInSeries);


router.get("/:id", bookingsController.get);
router.post("/", bookingsController.create);
router.put("/:id", bookingsController.update);
router.post("/:id/cancel", bookingsController.cancel);
router.post("/:id/complete", bookingsController.complete);

export default router;
