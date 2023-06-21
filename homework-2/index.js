import * as path from 'node:path'
import { argv } from 'node:process';
import { pipeline, Transform } from 'node:stream';
import { Buffer } from 'node:buffer';
import * as fs from 'node:fs';
import { log } from 'node:console';

const startPath = argv[2];

try {
  const readStream = fs.createReadStream(path.resolve('homework-2', startPath), { encoding: 'utf8' });
  const writeStream = fs.createWriteStream(path.resolve('data', 'output.txt'), { encoding: 'utf8' });

  const removeSymbols = new Transform({
    transform(chunk, encoding, callback) {
      const currentBytes = [...chunk];
      const excludedSymbols = [44, 46, 34];
      const newBytes = [];

      for (let i = 0; i < currentBytes.length; i++) {
        if (currentBytes[i] === 10) {
          newBytes.push(32);
        } else if (!excludedSymbols.includes(currentBytes[i])) {
          newBytes.push(currentBytes[i]);
        }
      };

      const buffer = Buffer.from(newBytes);

      callback(null, buffer);
    },
  });

  const sortWords = new Transform({
    transform(chunk, encoding, callback) {
      const words = chunk.toString().trim();
      const arr = words.split(' ').sort().join(' ');
      const buffer = Buffer.from(arr);

      callback(null, buffer);
    }
  });

  const convertToVector = new Transform({
    transform(chunk, encoding, callback) {
      const obj = {};
      const words = chunk.toString();
      const arr = words.split(' ')
      arr.forEach((el) => {
        if (obj[el]) {
          obj[el] = obj[el] + 1;
        } else {
          obj[el] = 1;
        }
      });

      const buffer = Buffer.from(Object.values(obj).join(' '));

      callback(null, buffer);
    }
  });



  readStream
    .pipe(removeSymbols)
    .pipe(sortWords)
    .pipe(convertToVector)
    .pipe(writeStream);

} catch (e) {
  console.log(e);
}
