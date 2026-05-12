import { Router } from "express";
import {
  shouldBeAdmin,
} from "../middleware/authMiddleware.js";
import { getRates, updateRates } from "../controllers/currency.controller.js";

const router: Router = Router();

router.get("/rates", getRates);
router.put("/rates", shouldBeAdmin, updateRates);

export default router;
