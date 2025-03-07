import { Router } from "express";
import { addRecipe, getRecipesPage,  showRecipePage, editRecipePage, updateRecipe , showMyRecipes ,deleteRecipe, filterRecipes} from "../controllers/recipesController";
import { isAuthenticated } from "../middleware/authMiddleware";


const router = Router();

router.get("/", getRecipesPage);
router.post("/add_recipe", isAuthenticated, addRecipe);
router.get("/show_recipe/:id", showRecipePage);
router.get("/my_recipes", showMyRecipes);

router.get("/edit_recipe/:id", editRecipePage);
router.post("/edit_recipe/:id", updateRecipe);

router.delete("/:id", deleteRecipe);

router.post("/filter", filterRecipes);

export default router;
