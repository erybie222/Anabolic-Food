import { Router } from "express";
import { addRecipe, getRecipesPage, showRecipePage } from "../controllers/recipesController";
import { isAuthenticated } from "../middleware/authMiddleware";

const router = Router();

router.get("/", getRecipesPage);
router.post("/add_recipe", isAuthenticated, addRecipe);
router.get("/show_recipe/:id", showRecipePage);

export default router;
