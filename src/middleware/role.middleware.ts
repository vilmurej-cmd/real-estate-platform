import { Request, Response, NextFunction } from 'express';

/**
 * Minimal requireRole middleware used for tests.
 * Keeps behavior simple: if req.user is missing, respond 401;
 * if a role is required and req.user.roles includes it, call next();
 * otherwise respond 403.
 *
 * Adjust to match your app's real auth/role system if needed.
 */
export function requireRole(role: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    if (!user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    if (!role) {
      return next();
    }
    if (Array.isArray(user.roles) && user.roles.includes(role)) {
      return next();
    }
    return res.status(403).json({ message: 'Forbidden' });
  };
}