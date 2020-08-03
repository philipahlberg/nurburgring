import { assertEqual } from '@windtunnel/assert';
import { add } from '../dist/index.mjs';

export function testAdd() {
  assertEqual(add(1, 2), 3, '1 + 2 = 3');
}
