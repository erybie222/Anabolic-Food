import express, { Request, Response, Application } from "express";
import path from "path";
import bodyParser, { text } from "body-parser";
import pg from "pg";
import dotenv from "dotenv";
import { connectDB, client } from "./db";
import bcrypt from "bcrypt";

const saltRounds = 10;

dotenv.config();
const app: Application = express();
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
    "SELECT photo, recipe_id FROM  PHOTOS ORDER BY random() LIMIT $1",
    [numberOfPhotos]
  );
  return randomPhotos.rows;
}

async function getDiets(){
    const diet_names = await client.query("SELECT diet_name FROM DIETS");
    return diet_names.rows;
}

async function getTitles(recipeIds : number[]) {

  if (recipeIds.length === 0) return [];

  const titlesResult = await client.query("SELECT recipe_id , description from RECIPES WHERE recipe_id = ANY($1)", [recipeIds]);
  return titlesResult.rows;
}


app.get("/", async(req: Request, res: Response) => {
    const carouselRandomPhotos = await getRandomPhotos(3);
    const componentRandomPhotos = await getRandomPhotos(6);
    const recipeIds = componentRandomPhotos.map(photo => photo.recipe_id);
    const componentTitles = await getTitles(recipeIds);
    const titlesMap = new Map(componentTitles.map(title => [title.recipe_id, title.description]));
    const photosWithTitles = componentRandomPhotos.map(photo => ({
      photo: photo.photo,
      recipe_id: photo.recipe_id,
      title: titlesMap.get(photo.recipe_id) || "Brak tytułu"
    }));
   // console.log("🚀 componentPhotosUrl:", componentRandomPhotos);
   //console.log("🚀 carouselPhotosUrl:", carouselRandomPhotos);


    res.render("index", {carouselPhotosUrl: carouselRandomPhotos, photosWithTitles: photosWithTitles});
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

app.post("/login", async (req: Request, res: Response) => {
  try {
    const checkUser = req.body;
    }
  
  catch(err) {
    console.log(err);
  }
});


app.post("/register",  async (req: Request, res: Response): Promise<void> => {
  let transactionStarted = false;
  try {
  
    const { email, username, password, confirm_password } = req.body;
   // console.log(newUser);
   if (!email || !username || !password || !confirm_password) {
    res.status(400).json({ error: "All fields are required" });
    return;
  }
   if(password !== confirm_password){
    res.status(400).json({ error: "Passwords do not match" });
    return;
  }
    
 
    const checkEmail = await client.query("SELECT EXISTS(SELECT 1 FROM USERS WHERE email = $1)", [email]);
   // console.log(newUser);
    if(checkEmail.rows[0].exists)
    {
      
      res.status(400).json({ error: "Email already exists. Try logging in." });
      return;
    }
    await client.query("BEGIN");
    transactionStarted = true;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const userResult = await client.query(
      "INSERT INTO USERS (email, username, password) VALUES ($1 , $2 , $3 ) RETURNING user_id",
      [email, username, hashedPassword],
    );
    await client.query("COMMIT");
    res.status(201).json({
      message: "New user added successfully",
      userId: userResult.rows[0].user_id,
    });
    return;
    
  
   
    }
  
  catch(err) {
    if(transactionStarted)
    {
      await client.query("ROLLBACK")
    }
    
    console.error("Error in /register:", err);
    res.status(500).json({ error: "Internal Server Error" });
    return;
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

app.get("/register", (req: Request, res: Response) => {
  res.render("pages/register");
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
