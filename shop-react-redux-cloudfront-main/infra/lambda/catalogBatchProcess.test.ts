import { main } from "./catalogBatchProcess";
import { SQSEvent, SQSRecord } from "aws-lambda";
import { mockClient } from "aws-sdk-client-mock";
import {
  DynamoDBDocumentClient,
  TransactWriteCommand,
} from "@aws-sdk/lib-dynamodb";
import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";

const ddbMock = mockClient(DynamoDBDocumentClient);
const snsMock = mockClient(SNSClient);

describe("catalogBatchProcess Lambda Function", () => {
  beforeEach(() => {
    ddbMock.reset();
    snsMock.reset();

    process.env.PRODUCTS_TABLE_NAME = "products";
    process.env.STOCKS_TABLE_NAME = "stocks";
    process.env.SNS_TOPIC_ARN =
      "arn:aws:sns:us-east-1:123456789012:createProductTopic";
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const createMockSqsEvent = (bodies: any[]): SQSEvent => ({
    Records: bodies.map(
      (body, index) =>
        ({
          messageId: `mock-id-${index}`,
          body: JSON.stringify(body),
          receiptHandle: "mock-handle",
          attributes: {} as any,
          messageAttributes: {},
          md5OfBody: "mock-md5",
          eventSource: "aws:sqs",
          eventSourceARN:
            "arn:aws:sqs:us-east-1:123456789012:catalogItemsQueue",
          awsRegion: "us-east-1",
        } as SQSRecord),
    ),
  });

  it("should successfully parse records, insert into DynamoDB, and send an SNS notification", async () => {
    ddbMock.on(TransactWriteCommand).resolves({});
    snsMock.on(PublishCommand).resolves({ MessageId: "mock-msg-123" });

    const mockCsvRows = [
      {
        Title: "Product 1",
        Description: "Desc 1",
        price: "99.99",
        count: "10",
      },
      { Title: "Product 2", Description: "Desc 2", price: "19.50", count: "5" },
    ];

    const event = createMockSqsEvent(mockCsvRows);

    await main(event);

    expect(ddbMock.commandCalls(TransactWriteCommand)).toHaveLength(2);

    const firstDbCallArgs = ddbMock.commandCalls(TransactWriteCommand)[0]
      .args[0].input as any;
    expect(firstDbCallArgs.TransactItems?.[0].Put?.Item.title).toBe(
      "Product 1",
    );
    expect(firstDbCallArgs.TransactItems?.[0].Put?.Item.price).toBe(99.99);
    expect(firstDbCallArgs.TransactItems?.[1].Put?.Item.count).toBe(10);

    expect(snsMock.commandCalls(PublishCommand)).toHaveLength(1);

    const snsCallArgs = snsMock.commandCalls(PublishCommand)[0].args[0]
      .input as any;
    expect(snsCallArgs.Subject).toBe(
      "New Products Imported via SQS Batch Process",
    );
    expect(snsCallArgs.Message).toContain("Product 1");
    expect(snsCallArgs.Message).toContain("Product 2");
  });

  it("should skip rows missing required fields like title or price", async () => {
    ddbMock.on(TransactWriteCommand).resolves({});
    snsMock.on(PublishCommand).resolves({});

    const invalidCsvRows = [
      { Title: "", Description: "No Title", price: "10.00", count: "5" },
      {
        Title: "Product Missing Price",
        Description: "No Price",
        price: "abc",
        count: "2",
      },
    ];

    const event = createMockSqsEvent(invalidCsvRows);

    await main(event);

    expect(ddbMock.commandCalls(TransactWriteCommand)).toHaveLength(0);
    expect(snsMock.commandCalls(PublishCommand)).toHaveLength(0);
  });

  it("should bubble up database transaction errors to trigger SQS retries", async () => {
    ddbMock
      .on(TransactWriteCommand)
      .rejects(new Error("DynamoDB connection timeout"));

    const mockRow = [{ Title: "Faulty Row", price: "100", count: "1" }];
    const event = createMockSqsEvent(mockRow);

    await expect(main(event)).rejects.toThrow("DynamoDB connection timeout");
  });
});
