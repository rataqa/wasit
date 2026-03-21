import { factory } from './factory';

main();

async function main() {
  const { app, config, logger } = factory();
  app.listen(config.http.port, (err) => {
    if (err) {
      logger.defaultLogger.error('Failed to start server', { err });
    } else {
      logger.defaultLogger.info('Server is running on port ' + config.http.port);
    }
  });
}
