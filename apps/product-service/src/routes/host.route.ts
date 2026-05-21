import { Router } from "express";
import { getHosts, getHost } from "../controllers/host.controller.js";

const router: Router = Router();

router.get("/", getHosts);
router.get("/:id", getHost);

export default router;
