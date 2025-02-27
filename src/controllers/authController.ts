
import { client } from "../db";
import  { Request, Response,  } from "express";
import bcrypt from "bcrypt";
const saltRounds = 10;



export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    
    const {email , password} = req.body;
    
    const result = await client.query("SELECT * FROM USERS WHERE email = $1", [email]);
    if(result.rows.length === 0 )
    {
     res.status(404).json({error: "Podany zły email"});
     return;
    }
    const user = result.rows[0];
    const storedPassword = user.password;
    
   const isMatch = await bcrypt.compare(password, storedPassword);
   if (!isMatch) {
     res.status(401).json({ error: "Nieprawidłowe hasło" });
    return;
  }
  req.logIn(user, (err) => {
    if (err) {
      console.error("❌ Login error:", err);
      return res.status(500).json({ error: "Login failed" });
    }
  
    req.session.save((err) => {
      if (err) {
        console.error("❌ Session save error:", err);
        return res.status(500).json({ error: "Session save failed" });
      }
      // console.log("✅ Session saved successfully:", req.session);
      res.redirect("/");
    });
  });
} catch (err) {
  console.error("❌ Error in login:", err);
  res.status(500).json({ error: "Internal Server Error" });
}
};





export const register =  async (req: Request, res: Response): Promise<void> => {
  let transactionStarted = false;
  try {
  
    const { email, username, password, confirm_password } = req.body;
   // console.log(newUser);
   if (!email || !username || !password || !confirm_password) {
    res.status(400).json({ error: "All fields are required" });
    return;
  }
   if(password !== confirm_password){
    res.status(400).json({ error: "Passwords do not match" });
    return;
  }
    
 
    const checkEmail = await client.query("SELECT EXISTS(SELECT 1 FROM USERS WHERE email = $1)", [email]);
   // console.log(newUser);
    if(checkEmail.rows[0].exists)
    {
      
      res.status(400).json({ error: "Email already exists. Try logging in." });
      return;
    }
    await client.query("BEGIN");
    transactionStarted = true;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const userResult = await client.query(
      "INSERT INTO USERS (email, username, password) VALUES ($1 , $2 , $3 ) RETURNING user_id",
      [email, username, hashedPassword],
    );
    await client.query("COMMIT");

    const user = userResult.rows[0]; // Pobierz nowo utworzonego użytkownika

    // Automatyczne logowanie użytkownika
    req.logIn(user, (err) => {
      if (err) {
        console.error("❌ Login error:", err);
        return res.status(500).json({ error: "Login failed after registration" });
      }

      req.session.save((err) => {
        if (err) {
          console.error("❌ Session save error:", err);
          return res.status(500).json({ error: "Session save failed after registration" });
        }
        res.redirect("/"); // Użytkownik jest już zalogowany i przekierowany na stronę główną
      });
    });

    } catch(err) {
    if(transactionStarted)
    {
      await client.query("ROLLBACK")
    }
    
    console.error("Error in /register:", err);
    res.status(500).json({ error: "Internal Server Error" });
    return;
  }
}

