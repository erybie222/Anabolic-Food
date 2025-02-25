import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import bcrypt from "bcrypt";
import { client } from "../db";

passport.use(
    new LocalStrategy(
      { usernameField: "email", passwordField: "password" },
      async (email, password , done) => {
 try {
    
    
     const result = await client.query("SELECT * FROM USERS WHERE email = $1", [email]);
    if(result.rows.length === 0 )
    {
      return done(null, false, { message: "User not found" });
     
    }
    const user = result.rows[0];
    const storedPassword = user.password;
    
    const isMatch = await bcrypt.compare(password, storedPassword);
    if(isMatch) {
      return done(null, user);
    }
    else {
      return done(null, false, {message: "Incorrect password"});
    }
    }

  
  catch(err) {
    return done(err);
  }

    })
  );
 

  passport.serializeUser((user: any, done) => {
    console.log("🔹 Serializing user ID:", user.user_id);
    done(null, user.user_id); // ✅ Zapisujemy TYLKO user_id
  });
  
  passport.deserializeUser(async (user_id: number, done) => {
    console.log("🔸 Deserializing user:", user_id);
    try {
      if (!user_id) {
        console.log("⚠️ User ID is missing in session");
        return done(null, false);
      }
  
      const result = await client.query("SELECT user_id, email, username FROM USERS WHERE user_id = $1", [user_id]);
  
      if (result.rows.length === 0) {
        console.log("⚠️ User not found in DB");
        return done(null, false);
      }
  
      console.log("✅ User found in DB:", result.rows[0]);
      done(null, result.rows[0]); // ✅ Teraz `req.user` będzie poprawnie ustawione
    } catch (err) {
      console.error("❌ Error in deserializeUser:", err);
      done(err);
    }
  });
  
  
  
  
  

export default passport;
