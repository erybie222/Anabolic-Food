import { client } from "../db";
import  { Request, Response,  } from "express";

export const rateRecipe = async (req: Request, res: Response): Promise<void> => {

  
    const userId = Number(req.user?.user_id);
    const rating = Number(req.body.rating);
    const comment = req.body.comment ? req.body.comment : null;
    const recipe_id = Number(req.params.id);
  
    if (!userId || !recipe_id || isNaN(rating) || rating < 1 || rating > 5) {
      res.status(400).json({ error: "Niepoprawne dane wejściowe" });
      return;
    }
    try{
      const result = await client.query(`INSERT INTO RATINGS (recipe_id, user_id, rating, comment) VALUES($1 ,$2, $3, $4)
        ON CONFLICT (recipe_id, user_id)
        DO UPDATE SET rating = EXCLUDED.rating, comment = EXCLUDED.comment`,
        [recipe_id, userId, rating, comment]
      
      );
      // res.redirect(`/recipes/${recipe_id}`);
      
      const responseData = { message: "Ocena dodana", reload: true };

      //console.log("✅ Odpowiedź do klienta:", responseData); // Debug
      res.status(201).json(responseData);

 
        }
    catch(err){
      console.log(err);
      res.status(500).json({ error: "Błąd serwera" });

    }
  
  
  }

  export const getRatings = async (recipe_id: number) => {
    const { rows } = await client.query(`SELECT RATINGS.rating, RATINGS.COMMENT, USERS.username
      FROM RATINGS
      JOIN USERS ON RATINGS.user_id = USERS.user_id
      WHERE RATINGS.recipe_id = $1`, [recipe_id]);

    return rows; 
};
