import { IBasicLogger } from '@rataqa/sijil';
import { Response } from 'express';

export interface IResponseLocals {
  id : string;
  t0 : Date;
  ip : string;
  ua : string;
  log: IBasicLogger;
}

export type IResponse<TBody = any> = Response<TBody, IResponseLocals>;
