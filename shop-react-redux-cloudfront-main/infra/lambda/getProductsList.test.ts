import { handler } from './getProductsList';

describe('getProductsList handler', () => {
  it('should return a 200 status code', async () => {
    const response = await handler({});
    expect(response.statusCode).toBe(200);
  });

  it('should return the list of products as a JSON string', async () => {
    const response = await handler({});
    const body = JSON.parse(response.body);
    
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBe(6);
    expect(body[0]).toHaveProperty('title', 'Product 1');
  });

  it('should include CORS headers', async () => {
    const response = await handler({});
    expect(response.headers['Access-Control-Allow-Origin']).toBe('*');
    expect(response.headers['Content-Type']).toBe('application/json');
  });
});
