class ReadyPromise {
  private _allCheck: boolean[] = [];
  private _tasks: {
    resolve(value: unknown): void;
    fn(): Promise<unknown>;
  }[] = [];

  constructor(count: number) {
    this._allCheck = [...Array(count)];
  }

  check = (index: number) => {
    this._allCheck[index - 1] = true;
    this._proceed();
  };

  uncheck = (index: number) => {
    this._allCheck[index - 1] = false;
  };

  private _proceed = () => {
    if (this._allCheck.some((_) => !_)) {
      return;
    }

    while (this._tasks.length) {
      const { resolve, fn } = this._tasks.shift()!;
      resolve(fn());
    }
  };

  call = <T>(fn: () => Promise<T>) => {
    return new Promise<T>((resolve) => {
      this._tasks.push({
        fn,
        resolve: resolve as (value: unknown) => void,
      });

      this._proceed();
    });
  };
}

export default ReadyPromise;
