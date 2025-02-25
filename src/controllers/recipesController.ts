import { client } from "../db";
import  { Request, Response,  } from "express";

export const getRecipes = async () =>{
    try {
        const recipes = await client.query("SELECT * FROM RECIPES");
    return recipes.rows;
    }
    catch(err){
        console.log(err);
        return;
    }
}

export const getRandomPhotos = async ( numberOfPhotos: number) => {
  try{
         const randomPhotos = await client.query(
        "SELECT photo, recipe_id FROM  PHOTOS ORDER BY random() LIMIT $1",
        [numberOfPhotos]
      );
      return randomPhotos.rows;
   }
    catch(err)
     {
        console.log(err);
         return;
     }

 }

 export const getDiets = async () => {
     try {
         const diet_names = await client.query("SELECT diet_name FROM DIETS");
     return diet_names.rows;
     }
     catch(err)
     {
         console.log(err);
     }
}

 export const getTitles = async ( recipeIds : number[]) => {

     if (recipeIds.length === 0) return [];
     try{
         const titlesResult = await client.query("SELECT recipe_id , description from RECIPES WHERE recipe_id = ANY($1)", [recipeIds]);
   return titlesResult.rows;
     }
     catch(err)
     {
         console.log(err);
     }
 }

export const addRecipe = async (req: Request, res: Response) : Promise<void> => {
    // const client = await connectDB();
    try {
      await client.query("BEGIN");
  
      const newRecipe = {
        description: req.body.description,
        instruction: req.body.instruction,
        meal: req.body.meal,
        bulk_cut: req.body.bulk_cut,
      };
      
      const userId = req.user?.user_id;
      if (!userId) {
        res.status(401).json({ error: "Unauthorized. Please log in." });
        return;
      }
  
      const recipeResult = await client.query(
        "INSERT INTO RECIPES (description, instruction, meal, bulk_cut) VALUES ($1 , $2 , $3 , $4) RETURNING recipe_id",
        Object.values(newRecipe),
      );
      const recipeId = recipeResult.rows[0].recipe_id;
  
      const calories = [
        recipeId,
        req.body.calories,
        req.body.proteins,
        req.body.fats,
        req.body.carbs,
      ];
  
      await client.query(
        "INSERT INTO CALORIES (recipe_id, calories, proteins, fats, carbs) VALUES ($1 , $2 , $3 , $4, $5)",
        calories,
      );
  
      const photo = req.body.image;
      let photoId: number | null = null;
      if (photo) {
        const photoResult = await client.query(
          "INSERT INTO PHOTOS (recipe_id, photo) VALUES ($1 , $2) RETURNING photo_id",
          [recipeId, photo],
        );
        photoId = photoResult.rows[0]?.photo_id || null;
      }
  
      const ingredientNames = req.body.ingredient_name || [];
      const quantities = req.body.quantity || [];
      const units = req.body.unit || [];
  
      if (ingredientNames.length > 0) {
        try {
          for (let i = 0; i < ingredientNames.length; i++) {
            const ingredient = ingredientNames[i] || "";
            const quantity = quantities[i] || "0"; 
            const unit = units[i] || ""; 
            const result = await client.query(`
              INSERT INTO INGREDIENTS (ingredient_name) 
              VALUES ($1) 
              ON CONFLICT (ingredient_name) DO NOTHING 
              RETURNING ingredient_id`,
              [ingredient]
            );
            let ingredientId = result.rows[0]?.ingredient_id || null;
  
            if(ingredientId==null){
              const existingResult = await client.query(
                "SELECT ingredient_id FROM INGREDIENTS WHERE ingredient_name = $1",
                [ingredient]
              );
              ingredientId = existingResult.rows[0]?.ingredient_id || null;
              if(ingredientId == null) {
                console.error(`❌ Błąd: Nie znaleziono ID składnika dla: ${ingredient}`);
                throw new Error(`❌ Brak składnika w bazie: ${ingredient}`);
              }
            }
  
            await client.query(
              "INSERT INTO RECIPES_INGREDIENTS (recipe_id, ingredient_id, quantity, unit) VALUES ($1, $2, $3, $4)",
              [recipeId, ingredientId, quantity, unit],
            );
          }
        } catch (error) {
          console.error("❌ Błąd główny podczas dodawania składników:", error);
          res.status(500).json({ error: "Błąd serwera" });
        }
      }
      const diet = req.body.diet;
      if (diet.length > 0){
        try {
          const result = await client.query(`
            INSERT INTO DIETS (diet_name)
            VALUES ($1)
            ON CONFLICT (diet_name) DO NOTHING
            RETURNING diet_id`,
            [diet]
          );         
          let dietId = result.rows[0]?.diet_id || null;
      
          if(dietId == null){
            const existingResult = await client.query(
              "SELECT diet_id FROM DIETS WHERE diet_name = $1",
              [diet]
            );
            dietId=existingResult.rows[0]?.diet_id || null;
            if(dietId == null){
              console.error(`❌ Błąd: Nie znaleziono ID diety dla: ${diet}`);
              throw new Error(`❌ Brak diety w bazie: ${diet}`);
            }
          }
          await client.query(
            "INSERT INTO DIET_RECIPES (recipe_id, diet_id) VALUES ($1, $2)",
            [recipeId,dietId],
          );

        } catch (error) {
          console.error("❌ Błąd główny podczas dodawania diet:", error);
          res.status(500).json({ error: "Błąd serwera" });
        }
      }
      await client.query("COMMIT");
      
      //przekierowanie po skonczeniu na recipes w przyszlosci na ten przepis
      res.redirect("/recipes");
      // res.status(201).json({
      //   message: "Recipe, calories, ingredients, and image added successfully",
      //   recipe_id: recipeId,
      //   photo_id: photoId,
      // });
    } catch (err) {
      await client.query("ROLLBACK");
      console.error("❌ Error adding recipe:", err);
      res.status(500).json({ message: "Error adding recipe" });
    }
  }

export const getRecipesPage= async (req: Request, res: Response) => {
        const recipes = await getRecipes();
        // recipes, bedzie zabierac duzo pamieci(wszystkie kolumny) ^^
        const diets = await getDiets();
        res.render("pages/recipes", {recipes: recipes, diets:diets});
    }