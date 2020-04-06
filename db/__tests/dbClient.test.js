const AWS = require('aws-sdk');

jest.mock('aws-sdk');

const documentClientMock = {
  get: jest.fn(),
  query: jest.fn(),
  scan: jest.fn(),
  update: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
  batchWrite: jest.fn()
};

AWS.DynamoDB.DocumentClient.mockImplementation(() => documentClientMock);

const dbClient = require('../dbClient');

const testDbResult = { Item: 'testItem', Items: 'testItems' };

describe('get', () => {
  it('resolves with the retrieved item', async () => {
    documentClientMock.get.mockReturnValueOnce({
      promise: () => Promise.resolve(testDbResult)
    });

    const result = await dbClient.get('testParams');

    expect(documentClientMock.get).toHaveBeenCalledWith('testParams');
    expect(result).toBe(testDbResult.Item);
  });

  it('rejects with an error, when retrieving item fails', async () => {
    documentClientMock.get.mockReturnValueOnce({
      promise: () => Promise.reject(new Error('getError'))
    });

    await expect(dbClient.get()).rejects.toEqual(new Error('getError'));
  });
});

describe('query', () => {
  it('resolves with the retrieved items', async () => {
    documentClientMock.query.mockReturnValueOnce({
      promise: () => Promise.resolve(testDbResult)
    });

    const result = await dbClient.query('testParams');

    expect(documentClientMock.query).toHaveBeenCalledWith('testParams');
    expect(result).toBe(testDbResult.Items);
  });

  it('rejects with an error, when retrieving items fails', async () => {
    documentClientMock.query.mockReturnValueOnce({
      promise: () => Promise.reject(new Error('getError'))
    });

    await expect(dbClient.query()).rejects.toEqual(new Error('getError'));
  });
});

describe('scan', () => {
  it('resolves with the retrieved items', async () => {
    documentClientMock.scan.mockReturnValueOnce({
      promise: () => Promise.resolve(testDbResult)
    });

    const result = await dbClient.scan('testParams');

    expect(documentClientMock.scan).toHaveBeenCalledWith('testParams');
    expect(result).toBe(testDbResult.Items);
  });

  it('rejects with error, when retrieving items fails', async () => {
    documentClientMock.scan.mockReturnValueOnce({
      promise: () => Promise.reject(new Error('getError'))
    });

    await expect(dbClient.scan()).rejects.toEqual(new Error('getError'));
  });
});

describe('put', () => {
  it('resolves when item is saved', async () => {
    documentClientMock.put.mockReturnValueOnce({
      promise: () => Promise.resolve(testDbResult)
    });

    const result = await dbClient.put('testParams');

    expect(documentClientMock.put).toHaveBeenCalledWith('testParams');
    expect(result).toBe(testDbResult);
  });

  it('rejects with error, when saving an item fails', async () => {
    documentClientMock.put.mockReturnValueOnce({
      promise: () => Promise.reject(new Error('getError'))
    });

    await expect(dbClient.put()).rejects.toEqual(new Error('getError'));
  });
});

describe('update', () => {
  it('resolves when item is updated', async () => {
    documentClientMock.update.mockReturnValueOnce({
      promise: () => Promise.resolve(testDbResult)
    });

    const result = await dbClient.update('testParams');

    expect(documentClientMock.update).toHaveBeenCalledWith('testParams');
    expect(result).toBe(testDbResult);
  });

  it('rejects with error, when updating an item fails', async () => {
    documentClientMock.update.mockReturnValueOnce({
      promise: () => Promise.reject(new Error('getError'))
    });

    await expect(dbClient.update()).rejects.toEqual(new Error('getError'));
  });
});

describe('deleteMultiple', () => {
  it('resolves when multiple items are deleted', async () => {
    documentClientMock.batchWrite.mockReturnValueOnce({
      promise: () => Promise.resolve(testDbResult)
    });

    const result = await dbClient.deleteMultiple({
      DeleteRequest: {
        Key: {
          foo: 1,
          bar: 2
        }
      }
    });

    expect(documentClientMock.batchWrite).toHaveBeenCalledWith({
      DeleteRequest: {
        Key: {
          foo: 1,
          bar: 2
        }
      }
    });
    expect(result).toBe(testDbResult);
  });

  it('rejects with error, when deleting multiple items fails', async () => {
    documentClientMock.batchWrite.mockReturnValueOnce({
      promise: () => Promise.reject(new Error('getError'))
    });

    await expect(dbClient.deleteMultiple()).rejects.toEqual(new Error('getError'));
  });
});

describe('delete', () => {
  it('deletes the item', async () => {
    documentClientMock.delete.mockReturnValueOnce({
      promise: () => Promise.resolve('Item deleted!')
    });
    const result = await dbClient.delete('testParams');

    expect(documentClientMock.delete).toHaveBeenCalledWith('testParams');
    expect(result).toEqual('Item deleted!');
  });

  it('rejects with an error, when deletion fails', async () => {
    documentClientMock.delete.mockReturnValueOnce({
      promise: () => Promise.reject(new Error('deleteError'))
    });

    await expect(dbClient.delete()).rejects.toEqual(new Error('deleteError'));
  });
});
