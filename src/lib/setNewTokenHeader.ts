import { Request, Response, NextFunction } from 'express';

export const setNewTokenHeader = (req: Request, res: Response, next: NextFunction) => {
  const originalJson = res.json;

  res.json = function (body: any) {
    const newToken = (req as any).newToken;
    if (newToken) {
      res.setHeader('x-refreshed-token', newToken);
    }
    return originalJson.call(this, body);
  };

  next();
};