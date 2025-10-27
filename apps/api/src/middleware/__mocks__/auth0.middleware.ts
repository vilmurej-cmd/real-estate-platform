import { Request, Response, NextFunction } from 'express';

export const authenticateAuth0 = (req: Request, res: Response, next: NextFunction) => {
  // Mock authentication - inject a fake user for testing
  req.user = { sub: 'test-user' };
  next();
};
