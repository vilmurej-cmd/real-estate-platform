"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateAuth0 = void 0;
const authenticateAuth0 = (req, res, next) => {
    // Mock authentication - inject a fake user for testing
    req.user = { sub: 'test-user' };
    next();
};
exports.authenticateAuth0 = authenticateAuth0;
