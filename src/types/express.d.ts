import * as express from "express";
import "express-session";

declare module 'express-session' {
  interface Session {
    userData?: { [key: string]: any }; // Dostosuj typ zgodnie z potrzebami
  }
}
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
