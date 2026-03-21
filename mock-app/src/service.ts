import { IAxiosFactory } from '@rataqa/jalb';
import { type IBasicLogger } from '@rataqa/sijil';
import { IAppCtx } from './types';

export function makeServiceA(ax: IAxiosFactory) {

  function apiPerRequest(ctx: IAppCtx, rl: IBasicLogger) {

    const http = ax.makeAxiosPerRequest({ 'x-correlation-id': ctx.correlation_id }, rl);

    async function homePage(lat: number, lon: number) {
      rl.info('homePage()', { lat, lon });
      const result = await http.get('/');

      return result.data;
    }

    return {
      http,
      homePage,
    };
  }

  return {
    apiPerRequest,
  };
}
