export function catchErrMsg(func: Function): string {
  try {
    func();
  } catch (err) {
    if (err instanceof Error) {
      return err.message;
    } else {
      throw new Error('Caught error is not an instance of Error');
    }
  }
  throw new Error('Expected error was not thrown');
}
