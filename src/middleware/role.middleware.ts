// Minimal requireRole middleware used by tests.
// Adjust logic to match your app's auth scheme.

import { Request, Response, NextFunction } from 'express';

export function requireRole(role: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    // If you have an auth system, replace the check below.
    // For tests, we allow through unless explicitly denied.
    const user = (req as any).user;
    if (!user) {
      // If tests expect behavior for unauthenticated, adapt accordingly.
      return res.status(401).json({ message: 'Unauthorized' });
    }
    if (!role) {
      return next();
    }
    if (user.roles && user.roles.includes(role)) {
      return next();
    }
    return res.status(403).json({ message: 'Forbidden' });
  };
}
