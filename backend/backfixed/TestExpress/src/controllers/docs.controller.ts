import { Request, Response } from 'express';
import swaggerSpec from '../../docs/swagger';

export const getOpenApiJson = (_req: Request, res: Response) => {
  res.json(swaggerSpec);
};

export const getDocsPage = (_req: Request, res: Response) => {
  res.send(`
    <html>
      <head><title>HomeBudget API Docs</title></head>
      <body style="font-family: Arial; padding: 20px;">
        <h1>HomeBudget API</h1>
        <p>OpenAPI JSON: <a href="/docs/openapi.json">/docs/openapi.json</a></p>
      </body>
    </html>
  `);
};