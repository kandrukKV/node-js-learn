const fs = require('node:fs');
const path = require('node:path');
const chalk = require('chalk');

const errors = [];
let dirCount = 0;
let fileCount = 0;
let inputDeep, startDeep, maxDeep;

const setInputDeep = (key, value) => {
  if (key === undefined || value === undefined) {
    return 0;
  }
  return (key === '-d' || key === '--deep') && Number.isInteger(+value) ? +value : 0
};

const printRow = (position, currentLevel, itemsCount, fileName, currentIndent) => {
  if (currentLevel === 0) {
    if (position === itemsCount - 1) {
      console.log('└── ' + fileName);
    } else {
      console.log('├── ' + fileName);
    }

  } else if (currentLevel < itemsCount - 1) {
    if (position === itemsCount - 1) {
      console.log('│' + currentIndent + '└── ' + fileName);
    } else {
      console.log('│' + currentIndent + '├── ' + fileName);
    }
  }
}

const calcCurrentDeepByPath = (absolutePath) => {
  return absolutePath.split(path.sep).filter((el) => el).length;
};

const getIndent = (level) => {
  let indent = '';
  for (let i = 0; i < level; i++) {
    indent += ' ';
  }
  return indent;
};

const getFilesInDirectory = async (dirPath) => {
  try {
    return await fs.promises.readdir(dirPath);
  } catch(e) {
    errors.push(e);
    return [];
  }
}

const calcLevel = (currentDeep, startDeep) => {
  const res = currentDeep - startDeep;
  return res < 0 ? 0 : res;
};

const getFileInfo = async (dirPath, fileName) => {
  try {
    return await fs.promises.stat(path.resolve(dirPath, fileName));
  } catch (e) {
    return undefined;
  }
}

const printErrors = (errorList) => {
  if (Array.isArray(errorList) && errorList.length) {
    console.log('Errors:');
    errorList.forEach(e => console.log(e.message));
  }
}


const getAllFiles = async function (dirPath, arrayOfFiles) {
  const currentDeep = calcCurrentDeepByPath(dirPath);
  const level = calcLevel(currentDeep, startDeep);
  const files = await getFilesInDirectory(dirPath);

  let idx = 0;
  arrayOfFiles = arrayOfFiles ?? [];

  for await (const file of files) {
    let indent = getIndent(level);
    const fileInfo = await getFileInfo(dirPath, file);

    if (fileInfo) {
      if (fileInfo.isDirectory()) {
        dirCount++;
        printRow(idx, level, files.length, file, indent);

        if (currentDeep < maxDeep) {
          arrayOfFiles = await getAllFiles(dirPath + "/" + file, arrayOfFiles);
        }

      } else {
        fileCount++;
        printRow(idx, level, files.length, file, indent);
        arrayOfFiles.push(path.join(dirPath, "/", file));
      }
    }
    idx++;
  }

  return arrayOfFiles;
};

const checkStartDir = (startPath) => {
  if (!path.isAbsolute(startPath)) {
    console.log('Bad path!');
    process.exit(1);
  }
};

const tree = async (startPath = process.argv[2], key = process.argv[3], value = process.argv[4]) => {
  checkStartDir(startPath);

  inputDeep = setInputDeep(key,value);
  startDeep = calcCurrentDeepByPath(startPath);
  maxDeep = inputDeep + startDeep;

  console.log(startPath);
  await getAllFiles(startPath);
  console.log(`${chalk.blue(dirCount)} directories, ${chalk.red(fileCount)} files`);

  printErrors(errors);
};

module.exports = {
  tree,
  getAllFiles,
  calcCurrentDeepByPath,
  printRow,
  setInputDeep,
  checkStartDir,
  getIndent,
  calcLevel,
  getFilesInDirectory,
  getFileInfo,
  printErrors
}
