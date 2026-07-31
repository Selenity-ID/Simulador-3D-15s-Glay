import { defineConfig } from 'vite';
import fs from 'fs';
import path from 'path';

export default defineConfig({
  plugins: [
    {
      name: 'photo-api',
      configureServer(server) {
        server.middlewares.use('/api/photos', (req, res) => {
          const fotosDir = path.resolve(__dirname, 'Fotos');
          try {
            if (fs.existsSync(fotosDir)) {
              const files = fs.readdirSync(fotosDir);
              const images = files.filter(file => /\.(png|jpe?g|gif|webp)$/i.test(file));
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(images));
            } else {
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify([]));
            }
          } catch (err) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: err.message }));
          }
        });
      }
    }
  ]
});
