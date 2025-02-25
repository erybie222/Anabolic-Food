import { Router } from "express";
import {login, register} from "../controllers/authController"
import passport from "passport";


const router = Router();

// router.get("/login", getLogin );
router.post("/login", login);
// router.get("/register", getRegister );
router.post("/register", register);

router.get("/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) {
        return next(err);
      }
      req.session.destroy((err) => {
        if (err) {
          console.error("❌ Błąd podczas niszczenia sesji:", err);
        }
        res.clearCookie("connect.sid"); // Usunięcie cookie sesji
        res.redirect("/login"); // Przekierowanie na stronę logowania
      });
    });
  });
export default router;
