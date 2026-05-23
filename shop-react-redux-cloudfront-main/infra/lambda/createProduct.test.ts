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

describe('createProduct handler', () => {
  beforeEach(() => {
    jest.resetModules();
    sendMock.mockReset();
    process.env.PRODUCTS_TABLE = 'products';
    process.env.STOCKS_TABLE = 'stocks';
    process.env.AWS_REGION = 'us-east-1';
    process.env.AWS_ACCESS_KEY_ID = 'test';
    process.env.AWS_SECRET_ACCESS_KEY = 'test';
  });

  afterAll(() => {
    sendMock.mockReset();
  });

  it('should return 201 when product is successfully created via transaction', async () => {
    sendMock.mockResolvedValueOnce({});

    const { handler } = await import('./createProduct');
    const event = {
      body: JSON.stringify({ title: 'New Item', price: 50, count: 5, description: 'Test' })
    };

    const response = await handler(event);
    const body = JSON.parse(response.body);

    expect(response.statusCode).toBe(201);
    expect(body.title).toBe('New Item');
    expect(body.count).toBe(5);
    expect(typeof body.id).toBe('string');
    expect(body.id.length).toBeGreaterThan(0);
    expect(sendMock).toHaveBeenCalledTimes(1);
  });

  it('should return 400 if validation fails (e.g., negative price)', async () => {
    const { handler } = await import('./createProduct');
    const event = {
      body: JSON.stringify({ title: 'Bad Item', price: -10, count: 5 })
    };

    const response = await handler(event);
    expect(response.statusCode).toBe(400);
    expect(JSON.parse(response.body).message).toContain('Invalid product data');
    expect(sendMock).not.toHaveBeenCalled();
  });

  it('should return 500 if the transaction fails', async () => {
    sendMock.mockRejectedValueOnce(new Error('Transaction Cancelled'));

    const { handler } = await import('./createProduct');
    const event = {
      body: JSON.stringify({ title: 'Item', price: 10, count: 1 })
    };

    const response = await handler(event);
    expect(response.statusCode).toBe(500);
    expect(JSON.parse(response.body).message).toContain('Internal Server Error');
    expect(sendMock).toHaveBeenCalledTimes(1);
  });
});
export {};