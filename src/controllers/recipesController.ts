import { client } from "../db";
import  { Request, Response,  } from "express";
import { getRatings } from "./ratingsController";



export const getRecipes = async () => {
  try {
      const recipes = await client.query(`
          SELECT RECIPES.recipe_id, RECIPES.description, RECIPES.instruction, RECIPES.average_rating,
                 RECIPES.meal,  RECIPES.making_time,  RECIPES.bulk_cut, PHOTOS.photo, USERS.username
          FROM RECIPES
          LEFT JOIN PHOTOS ON RECIPES.recipe_id = PHOTOS.recipe_id
          LEFT JOIN USERS on USERS.user_id = RECIPES.user_id
      `);
      //console.log("✅ Recipes fetched from DB:", recipes.rows); // Debug
      return recipes.rows;
  }
  catch (err) {
      console.error("❌ Error fetching recipes:", err);
      return [];
  }
};

export const getRecipeswithUserId = async (userId :number) => {
  try {
      const recipes = await client.query(`
          SELECT RECIPES.recipe_id, RECIPES.description, RECIPES.instruction, 
                 RECIPES.meal,  RECIPES.making_time,  RECIPES.bulk_cut, PHOTOS.photo, USERS.username
          FROM RECIPES
          LEFT JOIN PHOTOS ON RECIPES.recipe_id = PHOTOS.recipe_id
          LEFT JOIN USERS on USERS.user_id = RECIPES.user_id
          WHERE RECIPES.user_id = $1
      `, [userId]);
      //console.log("✅ Recipes fetched from DB:", recipes.rows); // Debug
      return recipes.rows;
  }
  catch (err) {
      console.error("❌ Error fetching recipes:", err);
      return [];
  }
};

export const getRandomPhotosRecipeIdTitle = async ( numberOfPhotos: number) => {
  try{
         const randomPhotos = await client.query(`
        SELECT p.photo, p.recipe_id, r.description
        FROM PHOTOS p
        JOIN RECIPES r ON p.recipe_id = r.recipe_id
        ORDER BY random()
        LIMIT $1;
        `,[numberOfPhotos]
      );
      return randomPhotos.rows;
   }
    catch(err)
     {
        console.log(err);
         return;
     }

 }

 export const getPhotoWithId = async ( recipeId: number) => {
  try{
        const photo = await client.query(
        "SELECT photo FROM PHOTOS WHERE recipe_id =$1",
        [recipeId]
      );
      return photo.rows.length > 0 ? photo.rows[0] : null;
   }
  catch (err) {
    console.error("❌ Błąd podczas pobierania zdjęcia:", err);
    return null;
  }
 }

 export const getRecipeById = async (recipeId: number) => {
  try {
    // Pobranie podstawowych informacji o przepisie
    const recipeResult = await client.query(`
      SELECT 
        recipe_id, 
        description, 
        instruction, 
        meal,  
        making_time,  
        bulk_cut, 
        user_id
      FROM RECIPES
      WHERE recipe_id = $1
    `, [recipeId]);

    if (recipeResult.rows.length === 0) {
      console.warn(`⚠️ Przepis o ID ${recipeId} nie został znaleziony.`);
      return null;
    }
    const recipe = recipeResult.rows[0];

    // Pobranie zdjęcia przepisu
    const photoResult = await client.query(`
      SELECT photo FROM PHOTOS WHERE recipe_id = $1
    `, [recipeId]);
    const photo = photoResult.rows.length > 0 ? photoResult.rows[0].photo : null;

    // Pobranie składników dla danego przepisu
    const ingredientsResult = await client.query(`
      SELECT 
        INGREDIENTS.ingredient_name, 
        RECIPES_INGREDIENTS.quantity, 
        RECIPES_INGREDIENTS.unit
      FROM RECIPES_INGREDIENTS
      JOIN INGREDIENTS ON RECIPES_INGREDIENTS.ingredient_id = INGREDIENTS.ingredient_id
      WHERE RECIPES_INGREDIENTS.recipe_id = $1
    `, [recipeId]);
    const ingredients = ingredientsResult.rows;

    // Pobranie diety przypisanej do przepisu
    const dietResult = await client.query(`
      SELECT DIETS.diet_name 
      FROM DIET_RECIPES
      JOIN DIETS ON DIET_RECIPES.diet_id = DIETS.diet_id
      WHERE DIET_RECIPES.recipe_id = $1
    `, [recipeId]);
    const diet = dietResult.rows.length > 0 ? dietResult.rows[0].diet_name : null;

    // Pobranie wartości kalorycznych
    const caloriesResult = await client.query(`
      SELECT calories, proteins, fats, carbs 
      FROM CALORIES
      WHERE recipe_id = $1
    `, [recipeId]);
    const calories = caloriesResult.rows.length > 0 ? caloriesResult.rows[0] : null;

    return {
      recipe,
      photo,
      ingredients,
      diet,
      calories
    };

  } catch (err) {
    console.error("❌ Błąd podczas pobierania przepisu:", err);
    return null;
  }
};


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
    try {
      await client.query("BEGIN");

      const userId = req.user?.user_id;
      if (!userId) {
        res.status(401).json({ error: "Unauthorized. Please log in." });
        return;
      }

      const newRecipe = {
        description: req.body.description,
        instruction: req.body.instruction,
        meal: req.body.meal,
        bulk_cut: req.body.bulk_cut,
        making_time: req.body.making_time,
        user_id: userId
      };

      const recipeResult = await client.query(
        "INSERT INTO RECIPES (description, instruction, meal, bulk_cut, making_time,user_id) VALUES ($1 , $2 , $3 , $4, $5, $6) RETURNING recipe_id",
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

export const getRecipesPage = async (req: Request, res: Response) => {
  const query = req.query.q as string;
  
  let recipes;
  if (query)
  {
    recipes = await searchRecipes(query);
  }
  else {
    recipes = await getRecipes();
  }
        
        // recipes, bedzie zabierac duzo pamieci(wszystkie kolumny) ^^
        const diets = await getDiets();
        const ingredients = await getIngredients();
        const meals = await getMeals();
        // console.log(recipes);
        //console.log(meals);
        res.render("pages/recipes", {recipes: recipes, diets:diets, query:query, ingredients:ingredients, meals:meals});
    }

export const showRecipePage = async (req: Request, res: Response): Promise<void> => {
  const recipeId=Number(req.params.id);
  if (isNaN(recipeId) || !Number.isInteger(recipeId)) {
   // console.error("❌ Błąd: Nieprawidłowy `recipeId`:", req.params.id); --- nie da sie uruchomić zdjęcia
    res.status(400).send("❌ Błąd: ID przepisu musi być liczbą całkowitą.");
    return;
  }

  const recipeData = await getRecipeById(recipeId);

  if (!recipeData) {
    res.status(404).send("❌ Błąd: Przepis nie został znaleziony.");
    return;
  }
  const ratings = await getRatings(recipeId);

  res.render("pages/single_recipe", { 
    recipe: recipeData.recipe,
    photo: recipeData.photo,
    ingredients: recipeData.ingredients,
    diet: recipeData.diet,
    calories: recipeData.calories,
    ratings: ratings
  });
}

export const searchRecipes = async (query:string) => {
  try{
    const results = await client.query(
      `SELECT RECIPES.recipe_id, RECIPES.description, RECIPES.instruction, 
                 RECIPES.meal,  RECIPES.making_time,  RECIPES.bulk_cut, PHOTOS.photo, USERS.username
          FROM RECIPES
          LEFT JOIN PHOTOS ON RECIPES.recipe_id = PHOTOS.recipe_id
          LEFT JOIN USERS on USERS.user_id = RECIPES.user_id
          WHERE LOWER(RECIPES.description) LIKE LOWER($1)`,
          [`%${query}%`] 
      );
      return results.rows;
  } catch(err) {
    console.log(err);
    return [];
  }
}

export const showMyRecipes = async (req: Request, res: Response): Promise<void> => {
    const userId = Number(req.user?.user_id);

    let recipes = await getRecipeswithUserId(userId);

    res.render("pages/my_recipes", {recipes});
}
export const editRecipePage = async (req: Request, res: Response): Promise<void> => {
  const diets = await getDiets();
  const recipes = await getRecipes();
  const userId = req.user?.user_id;
  const recipeId=Number(req.params.id);
  const recipeData = await getRecipeById(recipeId);
  let checkUser = await client.query("SELECT user_id FROM RECIPES WHERE recipe_id = $1", [recipeId]);
  checkUser = checkUser.rows[0].user_id;
  if(!recipeData)
  {
    res.status(404).send("❌ Błąd: Przepis nie został znaleziony.");
    return;
  }
  if (!userId) {
    res.status(401).json({ error: "Unauthorized. Please log in." });
    return;
  }
  try{
   
  if(Number(userId) !== Number(checkUser))
  {
    res.status(401).json({ error: "Unauthorized. Please log in." });
    return;
  }
  const ingredientsResult = await client.query(`
    SELECT 
      INGREDIENTS.ingredient_name, 
      RECIPES_INGREDIENTS.quantity, 
      RECIPES_INGREDIENTS.unit
    FROM RECIPES_INGREDIENTS
    JOIN INGREDIENTS ON RECIPES_INGREDIENTS.ingredient_id = INGREDIENTS.ingredient_id
    WHERE RECIPES_INGREDIENTS.recipe_id = $1
  `, [recipeId]);
  
  const ingredients = ingredientsResult.rows || []; // 🔥 Zawsze zwracaj tablicę
 // console.log("🛠️ Debug recipeData:", recipeData);
  //console.log("✅ Składniki w editRecipePage:", recipeData.ingredients);


    res.render("pages/edit_recipe", { 
      recipe: recipeData.recipe || {},
      photo: recipeData.photo || null,
      ingredients: recipeData.ingredients || [],
      diet: recipeData.diet || null,
      calories: recipeData.calories || null,
      diets:diets,
      recipes:recipes
    });
  } catch(err){
    console.log(err);
  }
  
  
}

export const updateRecipe = async (req: Request, res: Response): Promise<void> => {

  const id = Number(req.params.id);
  const { description, instruction, meal, making_time, calories, proteins, fats, carbs, bulk_cut, diet, photo} = req.body;
  const making_time_int = Number(making_time);
  const calories_int = Number(calories);
  const proteins_int = Number(proteins);
  const fats_int = Number(fats);
  const carbs_int = Number(carbs);
  const bulk_cut_boolean = bulk_cut === "true" || bulk_cut === true; 


  try {
    await client.query("BEGIN");
    const recipesResult = await client.query(`UPDATE RECIPES SET
      description = $1, instruction = $2, meal = $3, making_time = $4,
      bulk_cut = $5
      WHERE recipe_id = $6
      RETURNING *`, [description, instruction, meal,  making_time_int,bulk_cut_boolean, id]);
    
      if(recipesResult.rows.length === 0)
      {
        await client.query("ROLLBACK");
        res.status(404).send("❌ Przepis nie został znaleziony");
        return;
      }
     
      const caloriesResult = await client.query(`UPDATE CALORIES SET calories = $1 ,
         proteins = $2 , fats = $3 , carbs = $4
          WHERE recipe_id = $5
          RETURNING *
         `, [calories_int, proteins_int, fats_int ,carbs_int, id]);
         console.log(caloriesResult.rows[0]);

         if (caloriesResult.rowCount === 0) {
          await client.query("ROLLBACK");
          res.status(404).send("❌ Nie znaleziono danych kalorycznych.");
          return;
      }
      //console.log("✅ Zaktualizowano kalorie:", caloriesResult.rows[0]);

      if(photo)
      {
         const photosResult = await client.query(`UPDATE PHOTOS SET photo = $1 WHERE recipe_id = $2
        RETURNING *`, [photo , id]);
        //console.log("✅ Zaktualizowano zdjęcie:", photosResult.rows[0]);
      }
      if (photo) {
        const photosResult = await client.query(
            `UPDATE PHOTOS SET photo = $1 WHERE recipe_id = $2 RETURNING *`,
            [photo, id]
        );
        
        if (photosResult.rowCount === 0) {
            console.warn("⚠️ Brak zdjęcia do aktualizacji w tabeli PHOTOS dla recipe_id =", id);
        } else {
            //console.log("✅ Zaktualizowano zdjęcie:", photosResult.rows[0]);
        }
    }
    

    
      const ingredientResult = await updateRecipeIngredients(id, req);

        if(diet)
        {
          const dietResult = await updateRecipeDiet(id, diet);
        }
        await client.query("COMMIT"); 
      res.redirect("/");
  }
  catch(error){
    res.status(500).json({ message: "Nie udało się zaktualizować przepisu", error });
  }

}

export const updateRecipeIngredients = async (recipeId: number, req: Request) => {
  try {

      await client.query("DELETE FROM RECIPES_INGREDIENTS WHERE recipe_id = $1", [recipeId]);


      const ingredientNames = req.body.ingredient_name || [];
      const quantities = req.body.quantity || [];
      const units = req.body.unit || [];

      if (ingredientNames.length === 0) {
          console.warn(`⚠️ Brak składników do aktualizacji dla przepisu ${recipeId}`);
          return;
      }

      for (let i = 0; i < ingredientNames.length; i++) {
          const ingredient = ingredientNames[i] || "";
          const quantity = quantities[i] || "0"; 
          const unit = units[i] || ""; 


          let ingredientResult = await client.query(`
              INSERT INTO INGREDIENTS (ingredient_name) 
              VALUES ($1) 
              ON CONFLICT (ingredient_name) DO NOTHING 
              RETURNING ingredient_id`,
              [ingredient]
          );

          let ingredientId = ingredientResult.rows[0]?.ingredient_id || null;


          if (!ingredientId) {
              const existingIngredient = await client.query(
                  "SELECT ingredient_id FROM INGREDIENTS WHERE ingredient_name = $1",
                  [ingredient]
              );
              ingredientId = existingIngredient.rows[0]?.ingredient_id || null;
          }


          if (!ingredientId) {
              throw new Error(`❌ Błąd: Nie znaleziono składnika '${ingredient}' w bazie.`);
          }

          await client.query(
              "INSERT INTO RECIPES_INGREDIENTS (recipe_id, ingredient_id, quantity, unit) VALUES ($1, $2, $3, $4)",
              [recipeId, ingredientId, quantity, unit]
          );
      }

      //console.log(`✅ Składniki dla przepisu ${recipeId} zostały zaktualizowane.`);
  } catch (error) {
      console.error("❌ Błąd podczas aktualizacji składników:", error);
      throw error;
  }
};


export const updateRecipeDiet = async (recipeId: number, diet: string) => {
  try {

      await client.query("DELETE FROM DIET_RECIPES WHERE recipe_id = $1", [recipeId]);


      let result = await client.query(
          `INSERT INTO DIETS (diet_name) 
           VALUES ($1) 
           ON CONFLICT (diet_name) DO NOTHING 
           RETURNING diet_id`,
          [diet]
      );

      let dietId = result.rows[0]?.diet_id || null;

      if (!dietId) {
          const existingDiet = await client.query(
              "SELECT diet_id FROM DIETS WHERE diet_name = $1",
              [diet]
          );
          dietId = existingDiet.rows[0]?.diet_id || null;
      }

      
      if (!dietId) {
          throw new Error(`❌ Błąd: Nie znaleziono diety '${diet}' w bazie.`);
      }

      await client.query(
          "INSERT INTO DIET_RECIPES (recipe_id, diet_id) VALUES ($1, $2)",
          [recipeId, dietId]
      );

      //console.log(`✅ Dieta '${diet}' została zaktualizowana dla przepisu ${recipeId}.`);
  } catch (error) {
      console.error("❌ Błąd podczas aktualizacji diety:", error);
      throw error;
  }
};

export const deleteRecipe = async (req: Request, res: Response): Promise<void> => {
  const id = Number(req.params.id);

  try {
    await client.query("BEGIN")

    await client.query("DELETE FROM RECIPES_INGREDIENTS WHERE recipe_id = $1", [id]);
    await client.query("DELETE FROM DIET_RECIPES WHERE recipe_id = $1", [id]);
    await client.query("DELETE FROM PHOTOS WHERE recipe_id = $1", [id]);
    await client.query("DELETE FROM CALORIES WHERE recipe_id = $1", [id]);

   
    const result = await client.query("DELETE FROM RECIPES WHERE recipe_id = $1 RETURNING *", [id]);

    if (result.rowCount === 0) {
      await client.query("ROLLBACK");
      res.status(404).json({ message: "❌ Przepis nie został znaleziony." });
      return;
  }
  await client.query("COMMIT");
  res.status(200).json({ message: "✅ Przepis został usunięty.", deletedRecipe: result.rows[0] });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("❌ Błąd podczas usuwania przepisu:", error);
    res.status(500).json({ message: "❌ Wystąpił błąd serwera." });
}

};

export const getIngredients = async ()=> {
try{
  const ingredientsResult = await client.query('SELECT ingredient_id, ingredient_name FROM INGREDIENTS');
  const ingredients = ingredientsResult.rows; 
  return ingredients;
}
catch(err){
  console.log(err);
}
};

export const getMeals = async () => {
  try {
    const mealsResult = await client.query('SELECT DISTINCT meal FROM recipes');
    return mealsResult.rows.map(row => row.meal); 
  } catch (err) {
    console.error("Błąd podczas pobierania posiłków:", err);
    return [];
  }
};

export const filterRecipes = async (req: Request, res: Response) => {
  try {
    console.log("✅ Dane odebrane na backendzie:", req.body);
    const { bulk_cut, calories_min, calories_max, ingredients, meals } = req.body;

    let query = `
      SELECT DISTINCT recipes.* FROM recipes
      JOIN CALORIES ON recipes.recipe_id = CALORIES.recipe_id
      LEFT JOIN RECIPES_INGREDIENTS ri ON recipes.recipe_id = ri.recipe_id
      LEFT JOIN INGREDIENTS i ON ri.ingredient_id = i.ingredient_id
      WHERE 1=1
    `;

    const params: any[] = [];
    let paramCounter = 1;

    if (bulk_cut !== undefined) {
      query += ` AND recipes.bulk_cut = $${paramCounter++}`;
      params.push(bulk_cut);
    }

    if (calories_min && calories_max) {
      query += ` AND CALORIES.calories BETWEEN $${paramCounter++} AND $${paramCounter++}`;
      params.push(calories_min, calories_max);
    }

    if (ingredients && ingredients.length > 0) {
      query += `
        AND recipes.recipe_id IN (
          SELECT ri.recipe_id FROM RECIPES_INGREDIENTS ri
          JOIN INGREDIENTS i ON ri.ingredient_id = i.ingredient_id
          WHERE i.ingredient_name = ANY($${paramCounter++})
          GROUP BY ri.recipe_id
          HAVING COUNT(DISTINCT i.ingredient_name) = $${paramCounter++}
        )`;
      params.push(ingredients, ingredients.length);
    }

    if (meals && meals.length > 0) {
      query += ` AND recipes.meal = ANY($${paramCounter++})`;
      params.push(meals);
    }

    const recipes = await client.query(query, params);
    res.json(recipes.rows);
  } catch (error) {
    console.error("❌ Błąd filtrowania przepisów:", error);
    res.status(500).json({ message: "Błąd serwera" });
  }
};