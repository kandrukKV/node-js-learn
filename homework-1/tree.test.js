const fs = require('fs/promises');
const mock = require('mock-fs');

const {
  checkStartDir,
  setInputDeep,
  calcCurrentDeepByPath,
  printRow,
  getIndent,
  calcLevel,
  getFilesInDirectory,
  getFileInfo,
  getAllFiles,
  printErrors,
  tree
} = require('./tree.js');
const { exec } = require('child_process');

describe('Check startDir', () => {
  // beforeAll(() => {
  //   process.argv.push('/Users/Constantine');
  //   process.argv.push('-d');
  //   process.argv.push('2');
  // });

  test('Test checkStartDir call with bad parameter', async () => {
    const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {});
    const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation(() => {});
    checkStartDir('badPath');
    expect(mockExit).toHaveBeenCalledWith(1);
    expect(mockConsoleLog).toHaveBeenCalledWith('Bad path!');
    mockExit.mockRestore();
    mockConsoleLog.mockRestore();
  });

  test('tests checkStartDir call with right parameter', async () => {
    const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {});
    const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation(() => {});
    checkStartDir('/');
    expect(mockExit).not.toHaveBeenCalledWith(1);
    expect(mockConsoleLog).not.toHaveBeenCalledWith('Bad path!');
    mockExit.mockRestore();
    mockConsoleLog.mockRestore();
  });

  // afterAll(() => {
  //   process.argv = process.argv.slice(0, 2);
  // })
});

describe('Check setInputDeep', () => {
  test('inputDeep must be 0 if function got bad params', () => {
    expect(setInputDeep()).toBe(0);
    expect(setInputDeep('bad', 1)).toBe(0);
    expect(setInputDeep('bad', 'bad')).toBe(0);
    expect(setInputDeep(1, 'bad')).toBe(0);
  });

  test('inputDeep must be right if function got right params', () => {
    expect(setInputDeep('--deep', 1)).toBe(1);
    expect(setInputDeep('-d', 2)).toBe(2);
  });
});

describe('Check calcCurrentDeepByPath', () => {
  test('currentDeep must be 0', () => {
    expect(calcCurrentDeepByPath('/')).toBe(0);
  });
  test('currentDeep must be 1', () => {
    expect(calcCurrentDeepByPath('/path1')).toBe(1);
  });
  test('currentDeep must be 2', () => {
    expect(calcCurrentDeepByPath('/path1/path2')).toBe(2);
  });
});

describe('Check print one row', () => {
  test('Test print one row as └── file1.txt', () => {
    const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation(() => {});
    printRow(4, 0, 5, 'file1.txt', '');
    expect(mockConsoleLog).toHaveBeenCalledWith('└── file1.txt');
    mockConsoleLog.mockRestore();
  });

  test('Test print one row as ├── file2.txt', () => {
    const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation(() => {});
    printRow(3, 0, 5, 'file2.txt', '  ');
    expect(mockConsoleLog).toHaveBeenCalledWith('├── file2.txt');
    mockConsoleLog.mockRestore();
  });

  test('Test print one row as │  ├── file3.txt', () => {
    const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation(() => {});
    printRow(3, 1, 4, 'file3.txt', '  ');
    expect(mockConsoleLog).toHaveBeenCalledWith('│  └── file3.txt');
    mockConsoleLog.mockRestore();
  });

  test('Test print one row as │  ├── file4.txt', () => {
    const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation(() => {});
    printRow(0, 1, 3, 'file4.txt', '  ');
    expect(mockConsoleLog).toHaveBeenCalledWith('│  ├── file4.txt');
    mockConsoleLog.mockRestore();
  });
});

describe('Check getIndent', () => {
  test('Indent = "" if level <= 0', () => {
    expect(getIndent(-1)).toBe("");
    expect(getIndent(0)).toBe("");
  });
  test('Indent = " " if level = 1', () => {
    expect(getIndent(1)).toBe(" ");
  });
  test('Indent = "  " if level = 2', () => {
    expect(getIndent(2)).toBe("  ");
  })
});

describe('Check calcLevel', () => {
  test('Test calcLevel', () => {
    expect(calcLevel(1, 2)).toBe(0);
    expect(calcLevel(2, 2)).toBe(0);
    expect(calcLevel(3, 2)).toBe(1);
  });
});

describe('Check getFilesInDirectory', () => {
  test('Get files was call with path /', async () => {
    const mockReaddir = jest.spyOn(fs, 'readdir').mockImplementation(() => ['test.txt']);
    const files = await getFilesInDirectory('/');
    expect(mockReaddir).toHaveBeenCalledWith('/');
    expect(files.length).toBe(1);
    mockReaddir.mockRestore();
  });
})

describe('Check getFilesInDirectory', () => {
  test('Get files was call with Error', async () => {
    const mockReaddir = jest.spyOn(fs, 'readdir').mockImplementation(() => { throw new Error('Error') });
    const files = await getFilesInDirectory('/');
    expect(files.length).toBe(0);
    mockReaddir.mockRestore();
  });
})

describe('Check getFileInfo', () => {
  beforeAll(() => {
    mock({
        'testFolder': {
            'index.md': '# Hello world!',
        },
    });
  });

  test('Call file info with error', async () => {
    const fileInfo = await getFileInfo('errorFolder', 'index.md');
    expect(fileInfo).toBe(undefined);
  })

  test('Entity is Directory', async () => {
    const fileInfo = await getFileInfo('', 'testFolder');
    expect(fileInfo.isDirectory()).toBe(true);
  })

  test('Entity is File', async () => {
    const fileInfo = await getFileInfo('testFolder', 'index.md');
    expect(fileInfo.isDirectory()).toBe(false);
  })

  afterAll(() => {
    mock.restore();
  });
});

describe('Check printErrors', () => {
  test('Function will print 2 rows', () => {
    const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation(() => {});
    printErrors(['error1']);
    expect(mockConsoleLog.mock.calls).toHaveLength(2);
    mockConsoleLog.mockRestore();
  });

  test('Function will print 0 rows', () => {
    const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation(() => {});
    printErrors([]);
    expect(mockConsoleLog.mock.calls).toHaveLength(0);

    printErrors();
    expect(mockConsoleLog.mock.calls).toHaveLength(0);

    mockConsoleLog.mockRestore();
  })

});

describe('Check getAllFiles', () => {
  beforeAll(() => {
    mock({
        'testFolder': {
            'index.md': '# Hello world!',
            'intoTestFolder': {}
        },
    });
  });

  test('getAllFiles return Array.length = 1', async () => {
    const files = await getAllFiles('testFolder');
    expect(files.length).toBe(1);
  });

  afterAll(() => {
    mock.restore();
  });
});

describe('Check tree', () => {
  test('Test tree call with bad parameter', async () => {
    const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {});
    const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation(() => {});
    await tree('badPath');
    expect(mockExit).toHaveBeenCalledWith(1);
    expect(mockConsoleLog).toHaveBeenCalledWith('Bad path!');
    mockExit.mockRestore();
    mockConsoleLog.mockRestore();
  });
});





