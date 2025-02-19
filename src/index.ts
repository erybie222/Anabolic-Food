import express, { Request, Response } from "express";
import path from "path";


const app = express();
const port = 3000;
app.use(express.static("public"));
app.set('view engine', 'ejs');

app.get("/", (req: Request, res: Response) => {
    res.sendFile(path.join(__dirname, "public", "index.ejs"));
})
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });