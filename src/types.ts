import { IBasicLogger } from '@rataqa/sijil';
import { Request, Response } from 'express';

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

  /**
   * Mask query values before logging. Return null to exclude from logs.
   */
  maskQuery?: IRequestQueryMasker;

  /**
   * Mask header values before logging. Return null to exclude from logs.
   */
  maskHeaders?: IRequestHeadersMasker;
}

export interface IRequestQueryMasker {
  (query: Request['query']): Request['query'] | null;
}

export interface IRequestHeadersMasker {
  (query: Request['headers']): Request['headers'] | null;
}
