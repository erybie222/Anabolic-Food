import { Router } from "express";
// import { isAuthenticated } from "../middleware/authMiddleware";
import { rateRecipe } from "../controllers/ratingsController";

const router = Router();


router.post("/:id", rateRecipe);
export default router;