import { Request, Response, NextFunction } from "express";

export const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated()) {
    return next(); // Jeśli użytkownik jest zalogowany, przechodzimy dalej
  }
  res.status(401).json({ error: "Unauthorized. Please log in." });
};
