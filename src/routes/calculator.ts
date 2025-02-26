import { Router } from "express";
import {getCalculatorStepOnePage , getCalculatorStepTwoPage, getCalculatorResultPage, submitStepOne, submitStepTwo } from "../controllers/calculatorController";


const router = Router();

router.get("/step-one", getCalculatorStepOnePage);
router.post("/step-one", submitStepOne);

router.get("/step-two", getCalculatorStepTwoPage);
router.post("/step-two", submitStepTwo);

router.get("/result", getCalculatorResultPage);

export default router;
