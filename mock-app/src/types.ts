import { IProcessEnv, MuhitService } from '@rataqa/muhit';
import { type IBasicLogger } from '@rataqa/sijil';
import { Request, Response } from 'express';

export interface IInputToGet {
  lat: number;
  lon: number;
}

export type IRequest = Request<any, any, IInputToGet>;

export type IResponse<TBody = any> = Response<TBody, IResLocals>;

export interface IResLocals {
  ctx: IAppCtx;
  log: IBasicLogger;
}

export interface IAppCtx {
  t0: Date;
  correlation_id: string;
}

export interface IEnvSettings extends IProcessEnv {
  HTTP_PORT?: string;
  LOG_LEVEL?: string;
  SERVICE_URL?: string;
  SERVICE_API_KEY_HEADER?: string;
  SERVICE_API_KEY?: string;
}

export class MyEnvSettings extends MuhitService<IEnvSettings> {
  config() {
    return {
      http: {
        port: this.portRequired('HTTP_PORT'),
      },
      logger: {
        level: this.str('LOG_LEVEL', 'info'),
      },
      serviceA: {
        baseURL: this.urlRequired('SERVICE_URL').toString(),
        headers: {
          [this.str('SERVICE_API_KEY_HEADER', 'x-api-key')]: this.strRequired('SERVICE_API_KEY'),
        },
      },
    };
  }
}
