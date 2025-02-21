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
app.get("/contact", (req: Request, res: Response) => {
    res.render("pages/contact");
})
app.get("/about", (req: Request, res: Response) => {
    res.render("pages/about");
})
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });

