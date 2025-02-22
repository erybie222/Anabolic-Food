import express, { Request, Response } from "express";
import path from "path";
import bodyParser from "body-parser";
import pg from "pg";
import dotenv from 'dotenv';
import { connectDB , client } from "./db";

dotenv.config();
const app = express();
const port = 3000;
app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.set("views", path.join(__dirname, "..", "views"));
app.use(express.json());


connectDB();
async function getRecipes(){
    const recipes = await client.query("SELECT * FROM RECIPES");
    return recipes.rows;
}

async function getRandomPhotos(numberOfPhotos:number){

    const randomPhotos = await client.query("SELECT photo FROM  PHOTOS ORDER BY random() LIMIT $1", [numberOfPhotos]);
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
        Object.values(newRecipe)
    );
    const recipeId = recipeResult.rows[0].recipe_id;
 

    const calories  = [recipeId ,req.body.calories , req.body.proteins, req.body.fats , req.body.carbs];

    
    const caloriesResult = await client.query(
        "INSERT INTO CALORIES (recipe_id , calories, proteins, fats, carbs ) VALUES ($1 , $2 , $3 , $4, $5) RETURNING recipe_id", 
        Object.values(calories)
    );
          
    
    const photo = req.body.image;


    const photoResult = await client.query(
        "INSERT INTO PHOTOS (recipe_id , photo) VALUES ($1 , $2 ) RETURNING photo_id", 
        [recipeId, photo]
    );
    await client.query("COMMIT");

    res.status(201).json({
        message: "Recipe, calories and image added successfully",
        recipe_id: recipeId,
        photo_id: photoResult.rows[0].photo_id
        });
    }
    catch(err){
        await client.query("ROLLBACK");
        console.log(err);
        res.status(500).json({ message: "Error adding reci[e" });
        return;
    }
    
});

app.get("/contact", (req: Request, res: Response) => {
    res.render("pages/contact");
})
app.get("/about", (req: Request, res: Response) => {
    res.render("pages/about");
})

app.get("/login", (req: Request, res: Response) => {
    res.render("pages/login");
})

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });

