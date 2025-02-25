import * as express from "express";

declare global {
  namespace Express {
    interface User {
      user_id: number;
      email: string;
      username: string;
    }

    interface Request {
      user?: User; // ✅ Teraz TypeScript zna `req.user`
    }
  }
}

export {};
