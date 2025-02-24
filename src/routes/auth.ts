import { Router } from "express";
import {login, register} from "../controllers/authController"

const router = Router();

// router.get("/login", getLogin );
router.post("/login", login);
// router.get("/register", getRegister );
router.post("/register", register);

export default router;
