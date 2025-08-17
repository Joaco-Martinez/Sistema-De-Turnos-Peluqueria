import { Router } from "express";
import { clientsController } from "./clients.controller";

const router = Router();

router.get("/", clientsController.list);
router.get("/:id", clientsController.get);
router.post("/", clientsController.create);
router.put("/:id", clientsController.update);
router.delete("/:id", clientsController.remove);

export default router;
