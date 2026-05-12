
const sendMock = jest.fn();

jest.mock('@aws-sdk/lib-dynamodb', () => {
  const actual = jest.requireActual('@aws-sdk/lib-dynamodb') as any;
  return {
    ...actual,
    DynamoDBDocumentClient: {
      from: () => ({ send: sendMock })
    }
  };
});

describe('getProductsList handler', () => {
  beforeEach(() => {
    jest.resetModules();
    sendMock.mockReset();
    process.env.PRODUCTS_TABLE = 'products';
    process.env.STOCKS_TABLE = 'stocks';
    process.env.AWS_REGION = 'us-east-1';
    process.env.AWS_ACCESS_KEY_ID = 'test';
    process.env.AWS_SECRET_ACCESS_KEY = 'test';
  });

  it('should return 200 and joined products', async () => {
    sendMock.mockResolvedValueOnce({
      Items: [
        { id: 'uuid-1234-5678-9012', title: 'Product 1', price: 10 },
        { id: 'uuid-abcd-efgh-ijkl', title: 'Product 2', price: 20 }
      ]
    });
    sendMock.mockResolvedValueOnce({
      Items: [
        { product_id: 'uuid-1234-5678-9012', count: 5 },
        { product_id: 'uuid-abcd-efgh-ijkl', count: 2 }
      ]
    });

    const { handler } = await import('./getProductsList');
    const response = await handler({});
    const body = JSON.parse(response.body);

    expect(response.statusCode).toBe(200);
    expect(body).toHaveLength(2);
    expect(body[0]).toEqual({ id: 'uuid-1234-5678-9012', title: 'Product 1', price: 10, count: 5 });
    expect(body[1]).toEqual({ id: 'uuid-abcd-efgh-ijkl', title: 'Product 2', price: 20, count: 2 });
    expect(response.headers['Content-Type']).toBe('application/json');
    expect(sendMock).toHaveBeenCalledTimes(2);
  });

  it('should return 500 on database failure', async () => {
    sendMock.mockRejectedValueOnce(new Error('DB Fail')).mockRejectedValueOnce(new Error('DB Fail'));

    const { handler } = await import('./getProductsList');
    const response = await handler({});

    expect(response.statusCode).toBe(500);
    expect(JSON.parse(response.body).message).toContain('Could not retrieve products');
    expect(sendMock).toHaveBeenCalledTimes(2);
  });
});
