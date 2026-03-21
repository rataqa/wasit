import dotenv from 'dotenv';
import express, { Request, Response } from 'express';
import { randomInt } from 'node:crypto';

import { makeAxiosFactory } from '@rataqa/jalb';
import { makeLogger } from '@rataqa/sijil';
import { mwFactory } from '@rataqa/wasit';

import { makeServiceA } from './service';
import { IRequest, IResponse, MyEnvSettings } from './types';

export function factory() {

  dotenv.config();

  const app = express();

  const env = new MyEnvSettings(process.env);
  const config = env.config();

  const appInfo = { appName: 'mock-app', appVersion: '1.2.3' };

  const logger = makeLogger('pino', appInfo, { level: config.logger.level });

  const httpClientA = makeAxiosFactory(config.serviceA.baseURL, { headers: config.serviceA.headers }, logger.defaultLogger);

  const serviceA = makeServiceA(httpClientA);

  const mw = mwFactory(logger);

  mw.useAtStart(app);

  const ts = new Date().getTime();
  app.get('/1', (_req, res) => res.json({ ts, path: 1 }));
  app.post('/2', (req, res) => res.json({ ts, path: 2, input: req.body }));

  app.get('/', (_req: Request, res: Response) => {
    res.json({ data: appInfo, ts: new Date() });
  });

  app.post('/', async (req: IRequest, res: IResponse) => {
    const { id, log } = res.locals;
    const { lat = randomInt(100), lon = randomInt(100) } = req.body;
    log.info('Handling request for root path');

    const api = serviceA.apiPerRequest(id, log);
    const result = await api.homePage(lat, lon);

    res.send(result);
  });

  mw.useAtFinish(app);

  return {
    app,
    config,
    env,
    httpClientA,
    logger,
    mw,
    serviceA,
  };
}
