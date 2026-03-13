declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        login: string;
        email: string;
      };
      requestId?: string;
    }
  }
}

export {};