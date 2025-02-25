import express, { Request, Response, Application, Router } from "express";
import path from "path";
import bodyParser, { text } from "body-parser";
import dotenv from "dotenv";
import { connectDB, client } from "./db";
import recipesRoutes from "./routes/recipes";
import  authRoutes  from "./routes/auth";
import homeRoutes from "./routes/home";
import session from "express-session";
import passport from "./controllers/passport";
import cookieParser from "cookie-parser";
import MemoryStore from "memorystore";




dotenv.config();
const app: Application = express();
const port = 3000;
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(session({
  secret: "SECRETWORD",
  resave: false,
  saveUninitialized: false,
  store: new (MemoryStore(session))({ checkPeriod: 86400000 }), // 🔥 Zapisywanie sesji
  cookie: { secure: false, httpOnly: true }
}));
app.use((req, res, next) => {
  // console.log("User:", req.user);
  next();
});


app.use(passport.initialize());
app.use(passport.session());

app.use(express.static("public"));
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "..", "views"));
const router = express.Router();
app.use((req, res, next) => {
  res.locals.user = req.user || null; // Przekazuje użytkownika do EJS
  next();
});
app.use("/", homeRoutes);
app.use("/recipes", recipesRoutes);
app.use("/auth", authRoutes);

app.use((req, res, next) => {
  // console.log("🔎 Cookies:", req.cookies);
  // console.log("🔎 Session ID:", req.sessionID);
  // console.log("🔎 Session object:", req.session);
  next();
});

app.use((req, res, next) => {
  // console.log("🔎 Middleware check: req.user =", req.user);
  next();
});



connectDB();


app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});


