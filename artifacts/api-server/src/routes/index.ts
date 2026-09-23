import { Router, type IRouter } from "express";
import healthRouter from "./health";
import urlsRouter from "./urls";

const router: IRouter = Router();

router.use(healthRouter);
router.use(urlsRouter);

export default router;
