import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import propertiesRouter from "./properties";
import agenciesRouter from "./agencies";
import usersRouter from "./users";
import leadsRouter from "./leads";
import appointmentsRouter from "./appointments";
import favoritesRouter from "./favorites";
import savedSearchesRouter from "./saved_searches";
import notificationsRouter from "./notifications";
import conversationsRouter from "./conversations";
import estimationsRouter from "./estimations";
import analyticsRouter from "./analytics";
import contactRouter from "./contact";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(propertiesRouter);
router.use(agenciesRouter);
router.use(usersRouter);
router.use(leadsRouter);
router.use(appointmentsRouter);
router.use(favoritesRouter);
router.use(savedSearchesRouter);
router.use(notificationsRouter);
router.use(conversationsRouter);
router.use(estimationsRouter);
router.use(analyticsRouter);
router.use(contactRouter);

export default router;
