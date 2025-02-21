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



app.get("/", (req: Request, res: Response) => {
    res.render("index");
})
app.get("/recipes", async (req: Request, res: Response) => {
    const recipes = await getRecipes();
    res.render("pages/recipes", {recipes: recipes});

})

 app.post("/add_recipe", async (req: Request, res: Response) => {
    const newRecipe = {
        description: req.body.description,
        instruction: req.body.instruction,
        meal: req.body.meal,
        bulk_cut: req.body.bulk_cut,
    };
    const [calories, proteins, fats, carbs]  = [req.body.calories , req.body.proteins, req.body.fats , req.body.carbs];
    try {
        
    const result = await client.query(
        "INSERT INTO RECIPES (description, instruction, meal, bulk_cut) VALUES ($1 , $2 , $3 , $4) RETURNING recipe_id", 
        Object.values(newRecipe)
    );
        const recipeId = result.rows[0].recipe_id;
        res.status(201).json({ message: "Recipe added", recipe_id: recipeId });
    }
    catch(err){
        console.log(err);
        res.status(500).json({ message: "Error adding recipe" });
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

