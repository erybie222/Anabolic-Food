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
async function getCarouselPhotos(){
    const carouselPhotosUrl = await client.query("SELECT photo FROM PHOTOS LIMIT 3")
    return carouselPhotosUrl.rows;
}


app.get("/", async(req: Request, res: Response) => {
    const carouselPhotosUrl = await getCarouselPhotos();
    res.render("index", {carouselPhotosUrl: carouselPhotosUrl});
})
app.get("/recipes", async (req: Request, res: Response) => {
    const recipes = await getRecipes();
    res.render("pages/recipes", {recipes: recipes});

})

// app.post("/recipes",async (req: Request, res: Response) => {
    
// });

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

