import express, { Request, Response } from "express";
import path from "path";


const app = express();
const port = 3000;
app.use(express.static("public"));
app.set('view engine', 'ejs');
app.set("views", path.join(__dirname, "..", "views"));




app.get("/", (req: Request, res: Response) => {
    res.render("index");
})
app.get("/recipes", (req: Request, res: Response) => {
    res.render("pages/recipes");
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