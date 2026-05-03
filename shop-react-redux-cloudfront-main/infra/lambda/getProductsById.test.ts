import { handler } from './getProductsById';

describe('getProductsById handler', () => {
  it('should return 200 and the product if found', async () => {
    const event = {
      pathParameters: { productId: '1' }
    };
    const response = await handler(event);
    const body = JSON.parse(response.body);

    expect(response.statusCode).toBe(200);
    expect(body.id).toBe('1');
    expect(body.title).toBe('Product 1');
  });

  it('should return 404 if the product is not found', async () => {
    const event = {
      pathParameters: { productId: '999' }
    };
    const response = await handler(event);
    
    expect(response.statusCode).toBe(404);
    expect(JSON.parse(response.body).message).toBe('Product not found');
  });
});
