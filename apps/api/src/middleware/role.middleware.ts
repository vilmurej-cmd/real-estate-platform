import { Request, Response, NextFunction } from 'express';

/**
 * Minimal requireRole middleware used for tests.
 * Accepts a role string or an array of role strings.
 * If req.user is missing -> 401
 * If any required role is present in user.roles -> next()
 * Otherwise -> 403
 */
export function requireRole(role: string | string[]) {
  const requiredRoles = Array.isArray(role) ? role : role ? [role] : [];
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    if (!user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    if (requiredRoles.length === 0) {
      return next();
    }
    const userRoles = Array.isArray(user.roles) ? user.roles : [];
    const hasRole = requiredRoles.some(r => userRoles.includes(r));
    if (hasRole) {
      return next();
    }
    return res.status(403).json({ message: 'Forbidden' });
  };
}
