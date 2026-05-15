type StoreListener<T> = (state: T) => void;

export class ObservableStore<T extends Record<string, any>> {
  private state: T;
  private listeners = new Set<StoreListener<T>>();

  constructor(initState: T) {
    this.state = initState;
  }

  getState = (): T => {
    return this.state;
  };

  updateState = (partialState: Partial<T>) => {
    this.state = {
      ...this.state,
      ...partialState,
    };
    this.emit();
  };

  subscribe = (listener: StoreListener<T>) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  private emit = () => {
    this.listeners.forEach((listener) => listener(this.state));
  };
}
