import { Router } from "express";
import {
  shouldBeHost,
  shouldBeHostOrAdmin,
} from "../middleware/authMiddleware.js";
import {
  getMyVenues,
  getVenue,
  createVenue,
  updateVenue,
  deleteVenue,
} from "../controllers/venue.controller.js";

const router: Router = Router();

router.get("/host/my", shouldBeHost, getMyVenues);
router.post("/", shouldBeHost, createVenue);
router.get("/:id", getVenue);
router.put("/:id", shouldBeHostOrAdmin, updateVenue);
router.delete("/:id", shouldBeHostOrAdmin, deleteVenue);

export default router;
