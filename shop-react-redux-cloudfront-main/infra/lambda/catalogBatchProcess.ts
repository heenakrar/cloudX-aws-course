import { SQSEvent } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  TransactWriteCommand,
} from "@aws-sdk/lib-dynamodb";
import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";
import { randomUUID } from "crypto";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);
const snsClient = new SNSClient({});

export async function main(event: SQSEvent) {
  console.log(`Processing batch of ${event.Records.length} SQS messages.`);

  const createdProducts: string[] = [];

  let hasExpensiveProduct = false;

  for (const record of event.Records) {
    try {
      let productRaw = JSON.parse(record.body);
      console.log("Parsing row record data:", record.body);

      productRaw = Object.keys(productRaw).reduce((acc: any, key) => {
        const cleanKey = key
          .replace(/^\ufeff/, "")
          .trim()
          .toLowerCase();
        acc[cleanKey] = productRaw[key];
        return acc;
      }, {});

      const title = productRaw.title;
      const description = productRaw.description || "";
      const price = parseFloat(productRaw.price);
      const count = parseInt(productRaw.count, 10) || 0;
      const id = productRaw.id || randomUUID();

      if (!title || isNaN(price)) {
        console.error(
          "Missing required title or price parameters. Skipping item.",
        );
        continue;
      }

      if (price >= 100) {
        hasExpensiveProduct = true;
      }

      await docClient.send(
        new TransactWriteCommand({
          TransactItems: [
            {
              Put: {
                TableName: process.env.PRODUCTS_TABLE_NAME,
                Item: { id, title, description, price },
              },
            },
            {
              Put: {
                TableName: process.env.STOCKS_TABLE_NAME,
                Item: { product_id: id, count },
              },
            },
          ],
        }),
      );

      console.log(`Successfully created product ${id} (${title}) in database.`);
      createdProducts.push(
        `${title} (Price: $${price}, Stock Count: ${count})`,
      );
    } catch (error) {
      console.error(
        `Failed to process message item ${record.messageId}:`,
        error,
      );
      throw error;
    }
  }

  if (createdProducts.length > 0) {
    try {
      const emailBody =
        `The following products were successfully parsed and imported into the e-commerce database:\n\n` +
        createdProducts.map((p) => `- ${p}`).join("\n");

      await snsClient.send(
        new PublishCommand({
          TopicArn: process.env.SNS_TOPIC_ARN,
          Subject: "New Products Imported via SQS Batch Process",
          Message: emailBody,
          MessageAttributes: {
            priceCategory: {
              DataType: "String",
              StringValue: hasExpensiveProduct ? "expensive" : "regular",
            },
          },
        }),
      );

      console.log(
        `Successfully published notification. Batch tagged as: ${
          hasExpensiveProduct ? "expensive" : "regular"
        }`,
      );
    } catch (snsError) {
      console.error("Failed to publish message to SNS topic:", snsError);
    }
  }
}
