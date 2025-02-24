import { Router } from "express";
import { addRecipe, getRecipesPage } from "../controllers/recipesController";

const router = Router();

router.get("/", getRecipesPage);
router.post("/add_recipe", addRecipe);

export default router;
