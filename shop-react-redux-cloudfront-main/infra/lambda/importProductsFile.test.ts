import { mockClient } from 'aws-sdk-client-mock';
import { S3Client } from '@aws-sdk/client-s3';
import * as s3Presigner from '@aws-sdk/s3-request-presigner';
import { handler } from '../lambda/importProductsFile';

const s3Mock = mockClient(S3Client);

describe('importProductsFile handler', () => {
  beforeEach(() => {
    process.env.BUCKET_NAME = 'test-bucket';
    s3Mock.reset();
    jest.spyOn(s3Presigner, 'getSignedUrl').mockResolvedValue('https://example.com/signed-url');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns 200 and a signed URL', async () => {
    const event = { queryStringParameters: { name: 'test.csv' } };
    const result = await handler(event);

    expect(result.statusCode).toBe(200);
    expect(result.body).toBe('https://example.com/signed-url');
  });

  it('returns 400 if name is missing', async () => {
    const event = { queryStringParameters: {} };
    const result = await handler(event);

    expect(result.statusCode).toBe(400);
    expect(JSON.parse(result.body).message).toBe('Missing query parameter: name');
  });
});