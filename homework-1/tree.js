import { statSync, readdirSync } from 'node:fs';
import { join, parse, sep, isAbsolute } from 'node:path'
import { argv } from 'node:process';

const startPath = argv[2];

if (!isAbsolute(startPath)) {
  console.log('Bad path!');
  process.exit(1);
}

const deep = (argv[3] === '-d' || argv[3] === '--deep') && Number.isInteger(+argv[4]) ? +argv[4] : 1;

const errors = [];
let dirCount = 0;
let fileCount = 0;
const startDeep = startPath.split(sep).length;
const maxDeep = deep + startDeep;
const startDirName = startPath.split(sep)[startDeep - 1];

const printRow = (position, currentLevel, itemsCount, fileName, currentIndent) => {
  if (currentLevel === 0) {
    if (position === itemsCount - 1) {
      console.log('└──', fileName);
    } else {
      console.log('├──', fileName);
    }

  } else if (currentLevel < itemsCount - 1) {
    if (position === itemsCount - 1) {
      console.log('│' + currentIndent + '└── ' + fileName);
    } else {
      console.log('│' + currentIndent + '├── ' + fileName);
    }
  }
}


const getAllFiles = function(dirPath, arrayOfFiles) {
  const currentDeep = dirPath.split(sep).length;
  const level = currentDeep - startDeep;
  const files = readdirSync(dirPath);

  arrayOfFiles = arrayOfFiles || [];

  files.forEach((file, idx) => {
    let indent = '';
    for (let i = 0; i < level; i++) {
      indent += ' ';
    }

    if (statSync(dirPath + "/" + file).isDirectory() && currentDeep < maxDeep) {
      dirCount++;
      printRow(idx, level, files.length, file, indent);

      try {
        arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
      } catch (e) {
        errors.push(e);
      }


    } else {
      fileCount ++;
      printRow(idx, level, files.length, file, indent);
      arrayOfFiles.push(join(dirPath, "/", file));
    }
  })

  return arrayOfFiles;
}


console.log(startDirName);
getAllFiles(startPath);
console.log(`${dirCount} directories, ${fileCount} files`);

if (errors.length) {
  console.log('Errors:');
  errors.forEach(e => console.log(e.message));
}
