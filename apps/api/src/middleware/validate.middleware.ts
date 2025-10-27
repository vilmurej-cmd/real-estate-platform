import { NextFunction, Request, Response } from 'express';
import { ZodSchema, ZodTypeAny } from 'zod';

export const validateBody = (schema: ZodSchema<any>) => async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = await schema.parseAsync(req.body);
    req.body = parsed;
    return next();
  } catch (err: any) {
    return res.status(400).json({ error: 'Validation failed', details: err.errors || err.message });
  }
};

export const validateQuery = (schema: ZodSchema<any>) => async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = await schema.parseAsync(req.query);
    req.query = parsed as any;
    return next();
  } catch (err: any) {
    return res.status(400).json({ error: 'Query validation failed', details: err.errors || err.message });
  }
};
