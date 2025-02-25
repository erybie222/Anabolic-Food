import { Router } from "express";
import { renderHomePage, renderStaticPage } from "../controllers/homeController";

const router = Router();

router.get("/", renderHomePage);
router.get("/contact", renderStaticPage("contact"));
router.get("/about", (req, res) => {
    if(req.isAuthenticated()){
        renderStaticPage("secret");
    }
    else{
  renderStaticPage("about" )
    }
   });
router.get("/login", renderStaticPage("login"));
router.get("/register", renderStaticPage("register"));

export default router;
