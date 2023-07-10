// Forked from https://deno.land/x/eventemitter@1.2.4/mod.ts, the source has
// disappeared.
// TODO: add type-safe unit tests

// deno-lint-ignore no-explicit-any
type Any = any;

/** The callback type. */
type Callback = (...args: Any[]) => Any | Promise<Any>;

/** A listener type. */
type Listener = Callback & { __once__?: true };

/** The name of an event. */
type EventName = string | number;

type EventsType =
  & { [key: string]: Callback }
  & { [key: number]: Callback };

/**
 * The event emitter.
 */
// deno-lint-ignore ban-types
export class EventEmitter<E extends EventsType = {}> {
  /**
   * This is where the events and listeners are stored.
   */
  private _events_: Map<keyof E, Set<Listener>> = new Map();

  /**
   * Listen for a typed event.
   * @param event The typed event name to listen for.
   * @param listener The typed listener function.
   */
  public on<K extends keyof E>(event: K, listener: E[K]): this;

  /**
   * Listen for an event.
   * @param event The event name to listen for.
   * @param listener The listener function.
   */
  public on(event: EventName, listener: Callback): this {
    if (!this._events_.has(event)) this._events_.set(event, new Set());
    this._events_.get(event)!.add(listener);
    return this;
  }

  /**
   * Listen for a typed event once.
   * @param event The typed event name to listen for.
   * @param listener The typed listener function.
   */
  public once<K extends keyof E>(event: K, listener: E[K]): this;

  /**
   * Listen for an event once.
   * @param event The event name to listen for.
   * @param listener The listener function.
   */
  public once(event: EventName, listener: Callback): this {
    const l: Listener = listener;
    l.__once__ = true;
    return this.on(event, l as Any);
  }

  /**
   * Remove a specific listener in the event emitter on a specific
   * typed event.
   * @param event The typed event name.
   * @param listener The typed event listener function.
   */
  public off<K extends keyof E>(event: K, listener: E[K]): this;

  /**
   * Remove all listeners on a specific typed event.
   * @param event The typed event name.
   */
  public off<K extends keyof E>(event: K): this;

  /**
   * Remove all events from the event listener.
   */
  public off(): this;

  /**
   * Remove a specific listener on a specific event if both `event`
   * and `listener` is defined, or remove all listeners on a
   * specific event if only `event` is defined, or lastly remove
   * all listeners on every event if `event` is not defined.
   * @param event The event name.
   * @param listener The event listener function.
   */
  public off(event?: EventName, listener?: Callback): this {
    if ((event === undefined || event === null) && listener) {
      throw new Error("Why is there a listener defined here?");
    } else if ((event === undefined || event === null) && !listener) {
      this._events_.clear();
    } else if (event && !listener) {
      this._events_.delete(event);
    } else if (event && listener && this._events_.has(event)) {
      const _ = this._events_.get(event)!;
      _.delete(listener);
      if (_.size === 0) this._events_.delete(event);
    } else;
    return this;
  }

  /**
   * Emit a typed event without waiting for each listener to
   * return.
   * @param event The typed event name to emit.
   * @param args The arguments to pass to the typed listeners.
   */
  public emitSync<K extends keyof E>(event: K, ...args: Parameters<E[K]>): this;

  /**
   * Emit an event without waiting for each listener to return.
   * @param event The event name to emit.
   * @param args The arguments to pass to the listeners.
   */
  public emitSync(event: EventName, ...args: Parameters<Callback>): this {
    if (!this._events_.has(event)) return this;
    const _ = this._events_.get(event)!;
    for (const [, listener] of _.entries()) {
      const r = listener(...args);
      if (r instanceof Promise) r.catch(console.error);
      if (listener.__once__) {
        delete listener.__once__;
        _.delete(listener);
      }
    }
    if (_.size === 0) this._events_.delete(event);
    return this;
  }

  /**
   * Emit a typed event and wait for each typed listener to return.
   * @param event The typed event name to emit.
   * @param args The arguments to pass to the typed listeners.
   */
  public async emit<K extends keyof E>(
    event: K,
    ...args: Parameters<E[K]>
  ): Promise<this>;

  /**
   * Emit an event and wait for each listener to return.
   * @param event The event name to emit.
   * @param args The arguments to pass to the listeners.
   */
  public async emit(
    event: EventName,
    ...args: Parameters<Callback>
  ): Promise<this> {
    if (!this._events_.has(event)) return this;
    const _ = this._events_.get(event)!;
    for (const [, listener] of _.entries()) {
      try {
        await listener(...args);
        if (listener.__once__) {
          delete listener.__once__;
          _.delete(listener);
        }
      } catch (error) {
        console.error(error);
      }
    }
    if (_.size === 0) this._events_.delete(event);
    return this;
  }

  /**
   * The same as emitSync, but wait for each typed listener to
   * return before calling the next typed listener.
   * @param event The typed event name.
   * @param args The arguments to pass to the typed listeners.
   */
  public queue<K extends keyof E>(event: K, ...args: Parameters<E[K]>): this;

  /**
   * The same as emitSync, but wait for each listener to return
   * before calling the next listener.
   * @param event The event name.
   * @param args The arguments to pass to the listeners.
   */
  public queue(event: EventName, ...args: Parameters<Callback>): this {
    (async () => await this.emit(event, ...args as Any))().catch(console.error);
    return this;
  }

  /**
   * Clone *this* event emitter.
   * @param cloneListeners Also copy listeners to the new emitter. (defaults to true)
   */
  public clone(cloneListeners = true): EventEmitter<E> {
    const emitter = new EventEmitter<Any>();
    if (cloneListeners) {
      for (const [key, set] of this._events_) {
        emitter._events_.set(key, new Set([...set]));
      }
    }
    return emitter;
  }
}

export default EventEmitter;
