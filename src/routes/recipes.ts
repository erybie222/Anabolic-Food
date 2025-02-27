import { Router } from "express";
import { addRecipe, getRecipesPage,  showRecipePage, editRecipePage } from "../controllers/recipesController";
import { isAuthenticated } from "../middleware/authMiddleware";

const router = Router();

router.get("/", getRecipesPage);
router.post("/add_recipe", isAuthenticated, addRecipe);
router.get("/show_recipe/:id", showRecipePage);
router.get("/edit_recipe/:id", editRecipePage);
export default router;
