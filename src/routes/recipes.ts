import { Router } from "express";
import { addRecipe, getRecipesPage } from "../controllers/recipesController";
import { isAuthenticated } from "../middleware/authMiddleware";

const router = Router();

router.get("/", getRecipesPage);
router.post("/add_recipe", isAuthenticated, addRecipe);

export default router;
