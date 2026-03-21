import { makeLogger } from '@rataqa/sijil';
import express from 'express';
import { describe, it, after, afterEach } from 'node:test';

import { mwFactory } from '../factory';
import { CONTENT_TYPES, HEADERS } from '../constants';
import { delay, uuid } from '../utils';
import { strictEqual } from 'node:assert';

describe('mw factory', async () => {

  const app = express();
  const logger = makeLogger('pino', { appName: 'test', appVersion: '1.0.0'});
  
  const apiKey = uuid.v4.generate();

  const mw = mwFactory(logger);

  mw.useAtStart(app);

  const ts = new Date().getTime();
  app.get('/1', (_req, res) => res.json({ ts, path: 1 }));
  app.post('/2', (req, res) => res.json({ ts, path: 2, input: req.body }));
  app.get('/err', (_req, _res) => { throw new Error('catch this') });

  mw.useAtFinish(app);

  const server = await app.listen(8080);
  await delay(1000);

  afterEach(async () => {
    await delay(1000);
  });

  it('should handle GET /1', async() => {

    const id = uuid.v4.generate();
    const res = await fetch('http://localhost:8080/1', {
      headers: {
        [HEADERS.CORRELATION_ID]: id,
        [HEADERS.AZURE_API_KEY]: apiKey,
        [HEADERS.DD_TRACE_ID]: uuid.v4.generate(),
        [HEADERS.DD_PARENT_ID]: uuid.v4.generate(),
      },
    });
    
    const data = await res.json();
    strictEqual(res.status, 200);
    strictEqual(res.headers.get(HEADERS.CORRELATION_ID), id);
    strictEqual(data.ts, ts);
  });

  it('should handle POST /2', async() => {
    const id = uuid.v4.generate();
    const res = await fetch('http://localhost:8080/2', {
      method: 'post',
      headers: {
        [HEADERS.CORRELATION_ID]: id,
        [HEADERS.AZURE_API_KEY]: apiKey,
        [HEADERS.DD_TRACE_ID]: uuid.v4.generate(),
        [HEADERS.DD_PARENT_ID]: uuid.v4.generate(),
        [HEADERS.CONTENT_TYPE]: CONTENT_TYPES.JSON,
      },
      body: JSON.stringify({ test: id })
    });

    const data = await res.json();
    strictEqual(res.status, 200);
    strictEqual(res.headers.get(HEADERS.CORRELATION_ID), id);
    strictEqual(data.ts, ts);
  });

  it('should not handle GET /3', async() => {
    const id = uuid.v4.generate();
    const res = await fetch('http://localhost:8080/3', {
      headers: {
        [HEADERS.CORRELATION_ID]: id,
        [HEADERS.AZURE_API_KEY]: apiKey,
        [HEADERS.DD_TRACE_ID]: uuid.v4.generate(),
        [HEADERS.DD_PARENT_ID]: uuid.v4.generate(),
      },
    });

    const data = await res.json();
    strictEqual(res.status, 404);
    strictEqual(res.headers.get(HEADERS.CORRELATION_ID), id);
    strictEqual(data.message, 'Not found.');
  });

  it('should not handle GET /1 with missing header', async() => {
    const id = uuid.v4.generate();
    const res = await fetch('http://localhost:8080/1', {
      headers: {
        [HEADERS.CORRELATION_ID]: id,
      },
    });

    const data = await res.json();
    strictEqual(res.status, 400);
    strictEqual(res.headers.get(HEADERS.CORRELATION_ID), id);
    strictEqual(data.message, 'Invalid request.');
  });

  after(async () => {
    await server.close();
  });

});