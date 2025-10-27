import express from 'express';
const app = express();
app.get('/api/v1/health', (_req, res) => res.json({ status: 'ok' }));
app.listen(process.env.PORT || 4000);
