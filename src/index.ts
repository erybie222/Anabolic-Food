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
async function getRecipes(){
    const recipes = await client.query("SELECT * FROM RECIPES");
    return recipes.rows;
}

async function getRandomPhotos(numberOfPhotos: number) {
  const randomPhotos = await client.query(
    "SELECT photo FROM  PHOTOS ORDER BY random() LIMIT $1",
    [numberOfPhotos]
  );
  return randomPhotos.rows;
}

async function getDiets(){
    const diet_names = await client.query("SELECT diet_name FROM DIETS");
    return diet_names.rows;
}


app.get("/", async(req: Request, res: Response) => {
    const carouselRandomPhotos = await getRandomPhotos(3);
    const componentRandomPhotos = await getRandomPhotos(6);
   // console.log("🚀 componentPhotosUrl:", componentRandomPhotos);
    res.render("index", {carouselPhotosUrl: carouselRandomPhotos, componentPhotosUrl: componentRandomPhotos});
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

    const ingredientNames = req.body.ingredient_name || [];
    const quantities = req.body.quantity || [];
    const units = req.body.unit || [];

    if (ingredientNames.length > 0) {
      try {
        for (let i = 0; i < ingredientNames.length; i++) {
          const ingredient = ingredientNames[i] || "";
          const quantity = quantities[i] || "0"; 
          const unit = units[i] || ""; 
          const result = await client.query(`
            INSERT INTO INGREDIENTS (ingredient_name) 
            VALUES ($1) 
            ON CONFLICT (ingredient_name) DO NOTHING 
            RETURNING ingredient_id`,
            [ingredient]
          );
          let ingredientId = result.rows[0]?.ingredient_id || null;

          if(ingredientId==null){
            const existingResult = await client.query(
              "SELECT ingredient_id FROM INGREDIENTS WHERE ingredient_name = $1",
              [ingredient]
            );
            ingredientId = existingResult.rows[0]?.ingredient_id || null;
            if(ingredientId == null) {
              console.error(`❌ Błąd: Nie znaleziono ID składnika dla: ${ingredient}`);
              throw new Error(`❌ Brak składnika w bazie: ${ingredient}`);
            }
          }

          await client.query(
            "INSERT INTO RECIPES_INGREDIENTS (recipe_id, ingredient_id, quantity, unit) VALUES ($1, $2, $3, $4)",
            [recipeId, ingredientId, quantity, unit],
          );
        }
      } catch (error) {
        console.error("❌ Błąd główny podczas dodawania składników:", error);
        res.status(500).json({ error: "Błąd serwera" });
      }
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
