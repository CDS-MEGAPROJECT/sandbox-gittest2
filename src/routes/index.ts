import { Router, Request, Response } from 'express';

const router = Router();

const SANDBOX_NAME = process.env.SANDBOX_NAME || 'Forge Sandbox';

router.get('/', (_req: Request, res: Response) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>${SANDBOX_NAME}</title>
      <style>
        body {
          font-family: system-ui, -apple-system, sans-serif;
          background: #0a0a0a;
          color: #e5e5e5;
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          margin: 0;
        }
        .container {
          text-align: center;
          max-width: 600px;
          padding: 2rem;
        }
        h1 { color: #f59e0b; font-size: 2rem; }
        p { color: #a3a3a3; line-height: 1.6; }
        code {
          background: #1a1a1a;
          padding: 0.2em 0.5em;
          border-radius: 4px;
          font-size: 0.9em;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>${SANDBOX_NAME}</h1>
        <p>Your CDS Forge sandbox is running.</p>
        <p>Health check: <code>GET /api/health</code></p>
        <p>Example route: <code>GET /api/example</code></p>
      </div>
    </body>
    </html>
  `);
});

export default router;
