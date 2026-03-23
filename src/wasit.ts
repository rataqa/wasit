import { ILogger } from '@rataqa/sijil';
import compression from 'compression';
import timeout from 'connect-timeout';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { Application, NextFunction, Request, Response } from 'express';
import helmet from 'helmet';
import multer from 'multer';
import requestIp from 'request-ip';
import responseTime from 'response-time';

import { HttpError, HttpServerIssue, HttpUserIssue } from './errors';
import { HEADERS } from './constants';
import { IOptionsForMwAtStart, IRequestHeadersMasker, IRequestQueryMasker, IResponse } from './types';
import { ignoreErrorOnFunc, uuid } from './utils';

export function mwFactory(logger: ILogger) {

  const dl = logger.defaultLogger;
  const log = (res: IResponse) => res.locals.log || dl;

  async function bootMw(req: Request, res: IResponse, next: NextFunction) {
    const t0 = new Date();
    res.locals['t0'] = t0;

    const ip = requestIp.getClientIp(req) || 'unknown ip';
    res.locals['ip'] = ip;

    const ua = req.get('user-agent') || 'unknown user agent';
    res.locals['ua'] = ua;

    const { method, url } = req;

    const originalSend = res.send; // backup

    // override send() method
    res.send = function newSend(body: any) {
      const t1 = new Date();

      const { id = '' } = res.locals;
      if (!res.headersSent) {
        res.setHeader(HEADERS.CORRELATION_ID, id);
      }

      const deltaMs = t1.getTime() - t0.getTime();
      ignoreErrorOnFunc(() => log(res).info('RESPONSE', { method, url, id, t0, t1, deltaMs }));

      // Restore original send and execute
      res.send = originalSend;
      return res.send(body);
    };

    next();
  }

  const makeCorsMw = (origin = '*') => cors({ origin, allowedHeaders: [HEADERS.CORRELATION_ID] });

  const securityMw = helmet();

  function makeCompressionMw(thresholdInKb = 50) {
    return compression({ threshold: `${thresholdInKb}KB` });
  }

  const makeTimeoutMw = (seconds = 30) => timeout(`${seconds}s`);

  const makeCookieParserMw = (secret: string) => cookieParser(secret);

  /**
   * Check and validate headers, throw error
   */
  function makeHeaderEnforcerMw(
    requiredKeys: string[],
    onError = (key: string) => {
      throw new HttpUserIssue().setDetails({ description: 'Missing header', key });
    }
  ) {
    function mw(req: Request, _res: Response, next: NextFunction) {
      requiredKeys.forEach(key => {
        const val = (req.get(key) || '').trim();
        if (!val) onError(key);
      });
      next();
    }

    return mw;
  }

  function makeCorrelationIdMw(isRequired = true) {

    function mw(req: Request, res: Response, next: NextFunction) {
      let id = (req.get(HEADERS.CORRELATION_ID) || '').trim();

      if (isRequired) {
        if (id === '' || !uuid.v4.isValid(id)) {
          throw new HttpUserIssue()
            .setDetails({ description: 'Missing/invalid header', key: HEADERS.CORRELATION_ID });
        }
      } else if (id === '') {
        id = uuid.v4.generate();
      }

      res.locals['id'] = id;
      next();
    }

    return mw;
  }  

  function makeAccessLogMw(
    maskQuery: IRequestQueryMasker = (input: Request['query']) => input,
    maskHeaders: IRequestHeadersMasker = (input: Request['headers']) => input,
  ) {

    function mw(req: Request, res: IResponse, next: NextFunction) {
      const { id, t0, ip, ua } = res.locals;

      const log = logger.makeLoggerPerRequest({ correlation_id: id });
      res.locals['log'] = log;

      const { method, url, query, headers } = req;

      const queryMasked = ignoreErrorOnFunc<Request['query']>(() => maskQuery(query));

      const headersMasked = ignoreErrorOnFunc<Request['headers']>(() => maskHeaders(headers));

      const objToLog: any = { method, url, t0, ip, ua };
      if (queryMasked) objToLog['query'] = queryMasked;
      if (headersMasked) objToLog['headers'] = headersMasked;

      ignoreErrorOnFunc(() => log.info('REQUEST', objToLog));
      next();
    }

    return mw;
  }

  function makeLocaleMw(validLocales: string[], defaultLocale = validLocales[0]) {

    function mw(req: Request, res: IResponse, next: NextFunction) {
      res.locals['locale'] = req.acceptsLanguages(validLocales) || defaultLocale || 'en';
      next();
    }

    return mw;
  }

  function makeJsonMw(reqBodyLimitInMb = 10) {
    return express.json({ limit: `${reqBodyLimitInMb}MB` });
  }

  function makeFormMw(reqBodyLimitInMb = 10) {
    return express.urlencoded({ extended: true, limit: `${reqBodyLimitInMb}MB` });
  }

  const storage = multer.memoryStorage();
  
  function makeSingleFileUploadMw(fileSizeInMb = 10, fieldName = 'file') {
    const uploadOne = multer({ storage, limits: { files: 1, fileSize: fileSizeInMb * 1024 * 1024 }});
    return uploadOne.single(fieldName);
  }
  
  function makeMultiFileUploadMw(fileSizeInMb = 10, fieldName = 'files', max = 10) {
    const uploadMulti = multer({ storage, limits: { files: max, fileSize: fileSizeInMb * 1024 * 1024 }});
    return uploadMulti.array(fieldName, max);
  }

  function notFoundHandler(_req: Request, _res: IResponse, next: Function) {
    next(new HttpUserIssue('Not found.').setStatus(404).setStatusCode('E404'));
  }

  function finalErrorHandler(err: any, _req: Request, res: IResponse, _next: NextFunction) {
    const l = log(res);

    const error = err instanceof HttpError ? err : new HttpServerIssue().setDetails(err);

    ignoreErrorOnFunc(() => {
      if (error.status >= 500) {
        l.error('ERROR', { error: err.message });
        l.debug('ERROR', { error: err.stack });
      } else {
        l.warn('WARN', { warning: err.message });
      }
    });

    res.status(error.status)
      .setHeader(HEADERS.ERROR_CODE, error.statusCode)
      .json({
        statusCode: error.statusCode,
        message: error.message,
      });
  }

  return {
    responseTimeMw: responseTime(),
    bootMw,
    makeTimeoutMw,
    makeCorsMw,
    securityMw,
    makeAccessLogMw,
    makeHeaderEnforcerMw,
    makeLocaleMw,
    makeCorrelationIdMw,
    makeCookieParserMw,
    makeCompressionMw,
    makeFormMw,
    makeJsonMw,
    makeSingleFileUploadMw,
    makeMultiFileUploadMw,

    // step 1 - inject starter middleware
    useAtStart: (app: Application, options: IOptionsForMwAtStart = {}) => {
      const {
        acceptJson           = true,
        acceptForms          = false,
        reqBodyLimitInMb     = 10,
        enableFileUploads    = false,
        fileSizeInMb         = 10,
        requireCorrelationId = false,
        requireCommonHeaders = [],
        maskQuery,
        maskHeaders,
      } = options;

      app.use(responseTime());
      app.use(bootMw);
      app.use(makeCorsMw());
      app.use(securityMw);
      app.use(makeCorrelationIdMw(requireCorrelationId));
      app.use(makeAccessLogMw(maskQuery, maskHeaders));

      if (requireCommonHeaders.length) app.use(makeHeaderEnforcerMw(requireCommonHeaders));

      if (acceptJson) app.use(makeJsonMw(reqBodyLimitInMb));

      if (acceptForms) app.use(makeFormMw(reqBodyLimitInMb));

      if (enableFileUploads) {
        app.use(makeSingleFileUploadMw(fileSizeInMb));
        app.use(makeMultiFileUploadMw(fileSizeInMb));
      }
    },

    // step 2: define your routes

    // step 3: inject error handlers
    useAtFinish: (app: Application) => {
      app.use(notFoundHandler);
      app.use(finalErrorHandler);
    }
  };
}
