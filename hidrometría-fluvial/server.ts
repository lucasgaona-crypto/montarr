import 'dotenv/config';
import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import {
  createPunto,
  deletePunto,
  listPuntos,
  updatePunto,
} from './src/server/supabaseStore.ts';
import type { Tramo } from './src/types/punto.ts';
import { isValidTramo, validatePuntoInput } from './src/utils/validation.ts';

const PORT = 3000;
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '100kb' }));

  // Servicio web REST conectado a Supabase
  app.get('/api/puntos', async (req, res) => {
    try {
      const rawTramo = typeof req.query.tramo === 'string' ? req.query.tramo.trim() : '';
      let tramoFilter: Tramo | undefined;
      if (rawTramo && rawTramo !== 'todos') {
        if (!isValidTramo(rawTramo)) {
          return res.status(400).json({
            error: "El parámetro tramo debe ser 'aguas arriba' o 'aguas abajo'.",
          });
        }
        tramoFilter = rawTramo;
      }

      const q = typeof req.query.q === 'string' ? req.query.q.slice(0, 100) : undefined;
      const result = await listPuntos({ tramo: tramoFilter, q });
      return res.json({ puntos: result.data, origen: result.backend });
    } catch (error) {
      console.error('GET /api/puntos error:', error);
      return res.status(500).json({
        error: 'No se pudieron obtener los puntos de muestreo.',
      });
    }
  });

  app.post('/api/puntos', async (req, res) => {
    try {
      const validation = validatePuntoInput(req.body ?? {});
      if (!validation.valid) {
        return res.status(400).json({
          error: 'Datos inválidos en el formulario.',
          errors: validation.errors,
        });
      }

      const created = await createPunto(validation.data);
      return res.status(201).json({ punto: created });
    } catch (error) {
      console.error('POST /api/puntos error:', error);
      return res.status(500).json({
        error: 'No se pudo registrar el punto de muestreo.',
      });
    }
  });

  app.put('/api/puntos/:id', async (req, res) => {
    try {
      const id = req.params.id?.trim() ?? '';
      if (!UUID_REGEX.test(id)) {
        return res.status(400).json({ error: 'Identificador de punto inválido.' });
      }

      const validation = validatePuntoInput(req.body ?? {});
      if (!validation.valid) {
        return res.status(400).json({
          error: 'Datos inválidos al actualizar el punto.',
          errors: validation.errors,
        });
      }

      const updated = await updatePunto(id, validation.data);
      if (!updated) {
        return res.status(404).json({ error: 'Punto de muestreo no encontrado.' });
      }

      return res.json({ punto: updated });
    } catch (error) {
      console.error('PUT /api/puntos/:id error:', error);
      return res.status(500).json({
        error: 'No se pudo actualizar el punto de muestreo.',
      });
    }
  });

  app.delete('/api/puntos/:id', async (req, res) => {
    try {
      const id = req.params.id?.trim() ?? '';
      if (!UUID_REGEX.test(id)) {
        return res.status(400).json({ error: 'Identificador de punto inválido.' });
      }

      const deleted = await deletePunto(id);
      if (!deleted) {
        return res.status(404).json({ error: 'Punto de muestreo no encontrado.' });
      }

      return res.json({ deleted: true, id });
    } catch (error) {
      console.error('DELETE /api/puntos/:id error:', error);
      return res.status(500).json({
        error: 'No se pudo eliminar el punto de muestreo.',
      });
    }
  });

  // Vite middleware en desarrollo / archivos estáticos en producción
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      const indexFile = path.join(distDir, 'index.html');
      if (fs.existsSync(indexFile)) {
        return res.sendFile(indexFile);
      }
      return res.status(404).send('Build not found');
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://localhost:${PORT}`);
  });
}

startServer();
