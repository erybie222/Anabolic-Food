import * as express from "express";

declare global {
  namespace Express {
    interface User {
      user_id: number;
      email: string;
      username: string;
    }

    interface SessionData {
      userData?: {
        gender: string;
        weight: number;
        age: number;
        height: number;
        activity?: string;
        goal?: string;
    };
    }

    interface Request {
      user?: User; // ✅ Teraz TypeScript zna `req.user`
    }
  }
}

export {};
