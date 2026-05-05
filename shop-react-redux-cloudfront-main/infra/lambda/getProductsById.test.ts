import { GetCommand } from '@aws-sdk/lib-dynamodb';

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

describe('getProductsById handler', () => {
  beforeEach(() => {
    jest.resetModules();
    sendMock.mockReset();
    process.env.PRODUCTS_TABLE = 'products';
    process.env.STOCKS_TABLE = 'stocks';
    process.env.AWS_REGION = 'us-east-1';
    process.env.AWS_ACCESS_KEY_ID = 'test';
    process.env.AWS_SECRET_ACCESS_KEY = 'test';
  });

  it('should return 200 and the joined product if it exists', async () => {
    const productId = 'uuid-1234-5678-9012-3456-7890-abcdef';

    sendMock.mockResolvedValueOnce({ Item: { id: productId, title: 'Product 1', price: 10, description: 'Desc 1' } });
    sendMock.mockResolvedValueOnce({ Item: { product_id: productId, count: 10 } });

    const { handler } = await import('./getProductsById');
    const response = await handler({ pathParameters: { productId } });
    const body = JSON.parse(response.body);

    expect(response.statusCode).toBe(200);
    expect(body.id).toBe(productId);
    expect(body.title).toBe('Product 1');
    expect(body.count).toBe(10);
    expect(sendMock).toHaveBeenCalledTimes(2);
  });

  it('should return 404 if product is not in DB', async () => {
    const productId = 'uuid-nonexistent-1234-5678-9012';

    sendMock.mockResolvedValueOnce({ Item: undefined });
    sendMock.mockResolvedValueOnce({ Item: undefined });

    const { handler } = await import('./getProductsById');
    const response = await handler({ pathParameters: { productId } });

    expect(response.statusCode).toBe(404);
    expect(JSON.parse(response.body).message).toBe('Product not found');
    expect(sendMock).toHaveBeenCalledTimes(2);
  });

  it('should return 400 if productId is missing', async () => {
    const { handler } = await import('./getProductsById');
    const response = await handler({ pathParameters: {} });

    expect(response.statusCode).toBe(400);
    expect(JSON.parse(response.body).message).toBe('Product ID is required');
    expect(sendMock).not.toHaveBeenCalled();
  });
});
