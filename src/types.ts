import { IBasicLogger } from '@rataqa/sijil';
import { Response } from 'express';

export interface IResponseLocals {
  id : string;
  t0 : Date;
  ip : string;
  ua : string;
  log: IBasicLogger;
  locale: string;
}

export type IResponse<TBody = any> = Response<TBody, IResponseLocals>;

export interface IOptionsForMwAtStart {
  /**
   * default is true
   */
  acceptJson?: boolean;

  /**
   * default is false
   */
  acceptForms?: boolean;

  /**
   * default is false
   */
  enableFileUploads?: boolean;

  /**
   * default is 10
   */
  fileSizeInMb?: number;

  /**
   * default is 10
   */
  reqBodyLimitInMb?: number;

  /**
   * default is true
   */
  requireCorrelationId?: boolean;

  /**
   * List of common headers required for all requests
   */
  requireCommonHeaders?: string[];

  /**
   * List of valid locale codes. The first one is default, if not detected.
   */
  validLocales?: string[];
}
