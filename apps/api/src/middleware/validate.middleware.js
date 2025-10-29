"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateQuery = exports.validateBody = void 0;
const validateBody = (schema) => async (req, res, next) => {
    try {
        const parsed = await schema.parseAsync(req.body);
        req.body = parsed;
        return next();
    }
    catch (err) {
        return res.status(400).json({ error: 'Validation failed', details: err.errors || err.message });
    }
};
exports.validateBody = validateBody;
const validateQuery = (schema) => async (req, res, next) => {
    try {
        const parsed = await schema.parseAsync(req.query);
        req.query = parsed;
        return next();
    }
    catch (err) {
        return res.status(400).json({ error: 'Query validation failed', details: err.errors || err.message });
    }
};
exports.validateQuery = validateQuery;
