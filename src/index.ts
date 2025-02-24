import express, { Request, Response, Application, Router } from "express";
import path from "path";
import bodyParser, { text } from "body-parser";
import dotenv from "dotenv";
import { connectDB, client } from "./db";
import recipesRoutes from "./routes/recipes";
import  authRoutes  from "./routes/auth";
import homeRoutes from "./routes/home";

dotenv.config();
const app: Application = express();
const port = 3000;
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static("public"));
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "..", "views"));
const router = express.Router();

app.use("/", homeRoutes);
app.use("/recipes", recipesRoutes);
app.use("/auth", authRoutes);

connectDB();


app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
