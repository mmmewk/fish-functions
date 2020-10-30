const { promisify } = require('util');
const exec = promisify(require('child_process').exec);
const { prompt, execCommand, getCurrentBranch, checkout, getBranches, getCurrentDirectory, getChangedFiles, getMigrations } = require('./utils');
const stdin = require('mock-stdin').stdin();
const logSymbols = require('log-symbols');
const { describe, expect, test } = require('@jest/globals');
const ora = require('ora');
const testDir = '/Users/matthewkoppe/dev/cli-test';
const functionsDir = '/Users/matthewkoppe/.config/fish/functions/scripts/node';

process.chdir(testDir);
process.env.NODE_ENV = 'test';
jest.mock('ora');
const mockStopAndPersist = jest.fn();
const mockStart = jest.fn().mockImplementation(() => {
  return {
    stopAndPersist: mockStopAndPersist,
  };
});
ora.mockImplementation(() => {
  return {
    start: mockStart,
  };
});

beforeAll(async () => {
  await exec('git checkout master');
})

beforeEach(() => {
  ora.mockClear();
  mockStart.mockClear();
  mockStopAndPersist.mockClear();
});

describe('prompt', () => {
  test('Should return true on user input of y', async () => {
    setTimeout(() => {
      stdin.send('y');
    }, 10);

    const confirmation = await prompt('should this succeed?');
    expect(confirmation).toBeTruthy();
  });

  test('Should return true on user input of Y', async () => {
    setTimeout(() => {
      stdin.send('Y');
    }, 10);

    const confirmation = await prompt('should this succeed?');
    expect(confirmation).toBeTruthy();
  });

  test('Should return false on user input of n', async () => {
    setTimeout(() => {
      stdin.send('n');
    }, 10);

    const confirmation = await prompt('should this succeed?');
    expect(confirmation).toBeFalsy();
  });

  test('Should return false on user input of N', async () => {
    setTimeout(() => {
      stdin.send('N');
    }, 10);

    const confirmation = await prompt('should this succeed?');
    expect(confirmation).toBeFalsy();
  });
});


describe('execCommand', () => {
  test('should correctly execute a command in a directory', async () => {
    expect(await execCommand('ls', { cwd: functionsDir })).toEqual(0);
  });

  test('should correctly execute a command in the current directory', async () => {
    expect(await execCommand('ls')).toEqual(0);
  });

  test('fails on missing directory', async () => {
    expect(await execCommand('ls', { cwd: 'adsf' })).toEqual(1);
  });

  test('boots up and modifies a spinner on success', async () => {
    await execCommand('ls');
    expect(ora).toHaveBeenCalledTimes(1)
    expect(mockStart).toHaveBeenCalledTimes(1)
    expect(mockStopAndPersist).toHaveBeenCalledWith({ symbol: logSymbols.success, color: 'green' })
  });

  test('boots up and modifies a spinner on error', async () => {
    await execCommand('asdf');
    expect(ora).toHaveBeenCalledTimes(1)
    expect(mockStart).toHaveBeenCalledTimes(1)
    expect(mockStopAndPersist).toHaveBeenCalledWith({ symbol: logSymbols.error, color: 'red' })
  });
});


describe('getCurrentBranch', () => {
  test('should be able to find master branch in current directory', async () => {
    expect(await getCurrentBranch()).toEqual('master');
  });

  test('should be able to find master branch in another directory', async () => {
    expect(await getCurrentBranch({ cwd: functionsDir })).toEqual('master');
  });
});

describe('getBranches', () => {
  test('should be able to find all branches', async () => {
    const branches = await getBranches();
    ['master', 'test1', 'test2'].forEach((knownBranch) => {
      expect(branches.some(branch => branch.includes(knownBranch))).toBeTruthy();
    });
  });

  test('should be able to find all branches by name only', async () => {
    const branches = await getBranches({ nameOnly: true });
    expect(branches.sort()).toEqual(['master', 'test1', 'test2']);
  });
});

describe('checkout', () => {
  afterEach(async () => {
    await execCommand('git checkout master');
  })

  test('should be able to switch between branches', async () => {
    await checkout('test1');
    expect(await getCurrentBranch()).toEqual('test1');
  });
});

describe('getCurrentDirectory', () => {
  test('should be able to find current directory', async () => {
    expect(await getCurrentDirectory()).toEqual(testDir);
  });

  test('should find current directory when in another directory', async () => {
    expect(await getCurrentDirectory({ cwd: functionsDir })).toEqual(functionsDir);
  });
});

async function addFile(file) {
  await execCommand(`touch ${file}`);
}

async function modifyFile(file, text) {
  await execCommand(`echo ${text} >> ${file}`);
}

async function deleteFile(file) {
  await execCommand(`rm ${file}`);
}

describe('getChangedFiles', () => {
  beforeEach(async () => {
    await addFile('test.txt');
    await modifyFile('README.md', 'test');
    await deleteFile('app/controllers/application_controller.rb');
  });

  afterEach(async () => {
    await execCommand('git clean -f;git reset --hard; git checkout master');
  })

  test('should find all added or modified files if unspecified', async () => {
    expect((await getChangedFiles()).sort()).toEqual(['README.md', 'test.txt']);
  });

  test('can filter files by modification type', async () => {
    expect(await getChangedFiles({ types: ['A'] })).toEqual(['test.txt']);
    expect(await getChangedFiles({ types: ['M'] })).toEqual(['README.md']);
    expect(await getChangedFiles({ types: ['D'] })).toEqual(['app/controllers/application_controller.rb']);
  });

  test('can filter files by extension type', async () => {
    expect(await getChangedFiles({ extensions: ['.txt'] })).toEqual(['test.txt']);
    expect(await getChangedFiles({ extensions: ['.md'] })).toEqual(['README.md']);
    expect(await getChangedFiles({ extensions: ['.rb'], types: ['D'] })).toEqual(['app/controllers/application_controller.rb']);
  });

  test('can identify deleted files compared to another branch', async () => {
    expect(await getChangedFiles({ types: ['D'], branch: 'test2' })).toContain('db/schema.rb');
  });

  test('can identify change files compared to another branch', async () => {
    await(checkout('test1', { stash: true }))
    expect(await getChangedFiles({ types: ['M'], branch: 'test2' })).toContain('db/schema.rb');
  });

  test('can identify files added by another branch', async () => {
    await(checkout('test2', { stash: true }));
    expect(await getChangedFiles({ types: ['A'] })).toContain('db/schema.rb');
  });
});

describe('getMigrations', () => {
  afterEach(async () => {
    await checkout('master');
  });

  test('should forward and back migrations between a diverged db state', async () => {
    await checkout('test2');
    const migrations = await getMigrations('test1');
    expect(migrations.forward).toEqual('20201029074346');
    expect(migrations.back).toEqual('20201029074530');
  });

  test('should find migrations that should be made to checkout another branch', async () => {
    const migrationsForTest1 = await getMigrations('test1');
    expect(migrationsForTest1.forward).toEqual('20201029074346');
    const migrationsForTest2 = await getMigrations('test2');
    expect(migrationsForTest2.forward).toEqual('20201029074530');
  });

  test('should find migrations that should be removed to checkout another branch', async () => {
    await checkout('test1');
    const migrationsForTest1 = await getMigrations();
    expect(migrationsForTest1.back).toEqual('20201029074346');
    await checkout('test2');
    const migrationsForTest2 = await getMigrations();
    expect(migrationsForTest2.back).toEqual('20201029074530');
  });
});