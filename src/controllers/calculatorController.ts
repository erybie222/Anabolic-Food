import  { Request, Response,  } from "express";

export const getCalculatorStepOnePage = async (req: Request, res: Response): Promise<void> => {
    res.render("pages/calculator/calculator-step-one");
}

export const getCalculatorStepTwoPage = async (req: Request, res: Response): Promise<void> => {
    if(!req.session.userData)
    {
        res.redirect("/calculator/step-one");
        return;
    }
    res.render("pages/calculator/calculator-step-two");
}
export const getCalculatorResultPage = async (req: Request, res: Response): Promise<void> => {
    if (!req.session.userData) {
        res.redirect("/calculator/step-one");
        return;
    }

    const { gender, weight, height, age, activity, goal } = req.session.userData;
    const calories = calculateCalories(gender, weight, height, age, activity, goal);

    res.render("pages/calculator/calculator-result", { userData: req.session.userData, calories });
}

export const submitStepOne= async (req: Request, res: Response): Promise<void> => {
    const { gender, weight, age, height} = req.body;
   if(!gender || !weight || !age || !height)
   {
    res.status(400).send("⚠️ Wypełnij wszystkie pola!");
    return;
   }
    
    console.log(gender, weight, age, height);
    req.session.userData = { gender, weight: Number(weight), age:  Number(age), height:Number(height) };
    res.redirect("/calculator/step-two");
}

export const submitStepTwo= async (req: Request, res: Response): Promise<void> => {
    const { activity, goal } = req.body;

    if (!activity || !goal) {
        res.status(400).send("⚠️ Wybierz aktywność i cel diety!");
        return;
    }
    req.session.userData = { ...(req.session.userData || {}), activity, goal };

    console.log("📊 Otrzymane dane (krok 2):", req.session.userData);

    res.redirect("/calculator/result");
}

const calculateCalories = (gender: string, weight: number, height: number, age: number, activity: string, goal: string): number => {
    let bmr = gender === "male"
        ? 10 * weight + 6.25 * height - 5 * age + 5
        : 10 * weight + 6.25 * height - 5 * age - 161;

    const activityFactors: Record<string, number> = {
        sedentary: 1.2,
        moderate: 1.55,
        high: 1.9
    };

    let maintenanceCalories = bmr * (activityFactors[activity] || 1.2);
    if (goal === "cut") maintenanceCalories -= 500;
    if (goal === "bulk") maintenanceCalories += 500;

    return Math.round(maintenanceCalories);
};
