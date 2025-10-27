import 'express';

declare module 'express' {
  interface Request {
    body: any;
    query: any;
  }
}
