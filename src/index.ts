import express, { Request, Response } from "express";
import path from "path";
import bodyParser, { text } from "body-parser";
import pg from "pg";
import dotenv from "dotenv";
import { connectDB, client } from "./db";

dotenv.config();
const app = express();
const port = 3000;
app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static("public"));
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "..", "views"));
app.use(express.json());

connectDB();
async function getRecipes() {
  const recipes = await client.query("SELECT * FROM RECIPES");
  return recipes.rows;
async function getRecipes(){
    const recipes = await client.query("SELECT * FROM RECIPES");
    return recipes.rows;
}

async function getRandomPhotos(numberOfPhotos: number) {
  const randomPhotos = await client.query(
    "SELECT photo FROM  PHOTOS ORDER BY random() LIMIT $1",
    [numberOfPhotos],
  );
  return randomPhotos.rows;
}

async function getDiets(){
    const diet_names = await client.query("SELECT diet_name FROM DIETS");
    return diet_names.rows;
}


app.get("/", async(req: Request, res: Response) => {
    const randomPhotos = await getRandomPhotos(3);
    res.render("index", {carouselPhotosUrl: randomPhotos});
})

app.get("/recipes", async (req: Request, res: Response) => {
    const recipes = await getRecipes();
    // recipes, bedzie zabierac duzo pamieci(wszystkie kolumny) ^^
    const diets = await getDiets();
    res.render("pages/recipes", {recipes: recipes, diets:diets});
})

app.post("/add_recipe", async (req: Request, res: Response) => {
  // const client = await connectDB();
  try {
    await client.query("BEGIN");

    const newRecipe = {
      description: req.body.description,
      instruction: req.body.instruction,
      meal: req.body.meal,
      bulk_cut: req.body.bulk_cut,
    };

    const recipeResult = await client.query(
      "INSERT INTO RECIPES (description, instruction, meal, bulk_cut) VALUES ($1 , $2 , $3 , $4) RETURNING recipe_id",
      Object.values(newRecipe),
    );
    const recipeId = recipeResult.rows[0].recipe_id;

    const calories = [
      recipeId,
      req.body.calories,
      req.body.proteins,
      req.body.fats,
      req.body.carbs,
    ];

    await client.query(
      "INSERT INTO CALORIES (recipe_id, calories, proteins, fats, carbs) VALUES ($1 , $2 , $3 , $4, $5)",
      calories,
    );

    const photo = req.body.image;
    let photoId: number | null = null;
    if (photo) {
      const photoResult = await client.query(
        "INSERT INTO PHOTOS (recipe_id, photo) VALUES ($1 , $2) RETURNING photo_id",
        [recipeId, photo],
      );
      photoId = photoResult.rows[0]?.photo_id || null;
    }

    const ingredients = req.body.ingredients || [];

    if (ingredients.length > 0) {
      const ingredientQueries = ingredients.map(async (ingredient: any) => {
        const { ingredient_name, quantity, unit } = ingredient;

        const ingredientResult = await client.query(
          `INSERT INTO INGREDIENTS (ingredient_name) 
                     VALUES ($1) 
                     ON CONFLICT (ingredient_name) DO NOTHING 
                     RETURNING ingredient_id`,
          [ingredient_name],
        );
        let ingredientId: number | null =
          ingredientResult.rows[0]?.ingredient_id || null;

        if (!ingredientId) {
          const existingIngredient = await client.query(
            "SELECT ingredient_id FROM INGREDIENTS WHERE ingredient_name = $1",
            [ingredient_name],
          );

          ingredientId = existingIngredient.rows[0]?.ingredient_id || null;
          if (!ingredientId) {
            console.error(
              `❌ Nie znaleziono ID składnika dla: ${ingredient_name}`,
            );
            return;
          }
        }

        await client.query(
          "INSERT INTO RECIPES_INGREDIENTS (recipe_id, ingredient_id, quantity, unit) VALUES ($1, $2, $3, $4)",
          [recipeId, ingredientId, quantity, unit],
        );
      });

      await Promise.all(ingredientQueries);
    }

    await client.query("COMMIT");

    res.status(201).json({
      message: "Recipe, calories, ingredients, and image added successfully",
      recipe_id: recipeId,
      photo_id: photoId,
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("❌ Error adding recipe:", err);
    res.status(500).json({ message: "Error adding recipe" });
  }
});

app.get("/contact", (req: Request, res: Response) => {
  res.render("pages/contact");
});
app.get("/about", (req: Request, res: Response) => {
  res.render("pages/about");
});

app.get("/login", (req: Request, res: Response) => {
  res.render("pages/login");
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
