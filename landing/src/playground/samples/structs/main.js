import {
    initNative, Direction, Point, nameOf, step, turnRight,
} from './native/native.h';

await initNative();

let here = new Point();
here.x = 1;
here.y = 1;

let facing = Direction.North;
for (let turn = 0; turn < 4; turn++) {
    here = step(here, facing, 2);
    console.log(`${nameOf(facing)} to (${here.x}, ${here.y})`);
    facing = turnRight(facing);
}
console.log('north again:', facing === Direction.North);
