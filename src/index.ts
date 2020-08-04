/**
 * Create an AsyncIterable that yields the values
 * of the given Promises in the order they resolve.
 * 
 * @param promises An iterable of Promises.
 */
export const createRaceIterable = <T>(promises: Iterable<Promise<T>>): AsyncIterable<T> => {
  return new RaceIterable(promises);
};

/**
 * A simple wrapper to go from AsyncIterable to AsyncIterator.
 */
class RaceIterable<T> implements AsyncIterable<T> {
  private iterable: Iterable<Promise<T>>;

  constructor(iterable: Iterable<Promise<T>>) {
    this.iterable = iterable;
  }

  [Symbol.asyncIterator](): AsyncIterator<T> {
    return new RaceIterator(this.iterable);
  }
}

class RaceIterator<T> implements AsyncIterator<T> {
  private promises: Map<number, Promise<[number, T]>>;

  constructor(iterable: Iterable<Promise<T>>) {
    // Create a Map from key to Promise
    const map = new Map<number, Promise<[number, T]>>();
    // Assign a unique `key` to every Promise
    for (const [key, promise] of enumerate(iterable)) {
      // Create a wrapped Promise that resolves to [key, value]
      const keyedPromise = createKeyedPromise(key, promise);
      // Insert the wrapped Promise by its key
      map.set(key, keyedPromise);
    }
    this.promises = map;
  }

  async next(): Promise<IteratorResult<T>> {
    // If the pool is empty, so is the iterator.
    if (this.promises.size === 0) {
      return {
        done: true,
        value: undefined,
      };
    }

    // Wait for the first Promise to resolve.
    // Note: `Promise.race` creates a *new* Promise; it is not
    // actually the Promise that resolved first.
    const [key, value] = await Promise.race(this.promises.values());
    // Remove the resolved Promise from the pool.
    this.promises.delete(key);
    // Resolve with the resolved value of the original Promise.
    return {
      done: false,
      value,
    };
  }
}

function* enumerate<T>(iterable: Iterable<T>): Iterable<[number, T]> {
  let i = 0;
  for (const value of iterable) {
    yield [i, value];
    i = i + 1;
  }
}

const createKeyedPromise = async <T>(key: number, promise: Promise<T>): Promise<[number, T]> => {
  const value = await promise;
  return [key, value];
};
