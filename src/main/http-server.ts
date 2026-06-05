import http from 'http';

export type AiEventCallback = (thinking: boolean, done: boolean) => void;

export class NekoDriftHttpServer {
  private server: http.Server | null = null;
  private port = 27182;

  start(onAiEvent: AiEventCallback): void {
    this.server = http.createServer((req, res) => {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

      if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
      }

      if (req.method !== 'POST') {
        res.writeHead(405);
        res.end();
        return;
      }

      switch (req.url) {
        case '/api/ai-thinking':
          onAiEvent(true, false);
          res.writeHead(200);
          res.end('ok');
          break;
        case '/api/ai-done':
          onAiEvent(false, true);
          res.writeHead(200);
          res.end('ok');
          break;
        case '/api/ai-reset':
          onAiEvent(false, false);
          res.writeHead(200);
          res.end('ok');
          break;
        default:
          res.writeHead(404);
          res.end();
      }
    });

    this.server.listen(this.port, '127.0.0.1', () => {
      console.log(`[NekoDrift] HTTP server listening on 127.0.0.1:${this.port}`);
    });

    this.server.on('error', (err: NodeJS.ErrnoException) => {
      // Port already in use is fine (another instance handles it)
      if (err.code !== 'EADDRINUSE') {
        console.error('[NekoDrift] HTTP server error:', err);
      }
    });
  }

  stop(): void {
    this.server?.close();
    this.server = null;
  }
}
