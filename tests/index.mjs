import { assertEqual } from '@windtunnel/assert';
import { createRaceIterable } from '../dist/index.mjs';

const timeout = (ms) => new Promise((resolve) => {
  setTimeout(resolve, ms);
});

const collect = async (iterable) => {
  const values = [];
  for await (const value of iterable) {
    values.push(value);
  }
  return values;
};

export async function testRaceIterable() {
  const d = timeout(400).then(() => 'd');
  const c = timeout(300).then(() => 'c');
  const b = timeout(200).then(() => 'b');
  const a = timeout(100).then(() => 'a');

  const iterable = createRaceIterable([
    c,
    a,
    d,
    b,
  ]);

  const values = await collect(iterable);

  assertEqual(values, ['a', 'b', 'c', 'd'], 'should resolve in order from fastest to slowest');
}
