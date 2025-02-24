import bodyParser, { text } from "body-parser";
import { client } from "../db";
import  { Request, Response,  } from "express";
import bcrypt from "bcrypt";
const saltRounds = 10;




export const login = async (req: Request, res: Response) => {
  try {
    
    const {email , password} = req.body;
     console.log(email, password);
     if(!email || !password)
     {
      res.status(400).json({ error: "All fields are required" });
       return;
    }
     const result = await client.query("SELECT * FROM USERS WHERE email = $1", [email]);
    if(result.rows.length === 0 )
    {
      res.send("User not found");
      return;
    }
    const user = result.rows[0];
    const storedPassword = user.password;
    
    bcrypt.compare(password, storedPassword, (err, isMatch)=>{
      if (err) {
        console.log(err);
      }
      if (isMatch) {
        res.send("Logged in successfully")
      } else {
        res.send("Incorrect Password");
      }
    })
    }

  
  catch(err) {
    console.log(err);
  }
}


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
    res.status(201).json({
      message: "New user added successfully",
      userId: userResult.rows[0].user_id,
    });
    return;
    
  
   
    }
  
  catch(err) {
    if(transactionStarted)
    {
      await client.query("ROLLBACK")
    }
    
    console.error("Error in /register:", err);
    res.status(500).json({ error: "Internal Server Error" });
    return;
  }
}