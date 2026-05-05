import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, TransactWriteCommand } from "@aws-sdk/lib-dynamodb";
import { v4 as uuidv4 } from "uuid";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

export const handler = async (event: any) => {
  console.log("Incoming Request:", JSON.stringify(event, null, 2));

  try {
    const body = typeof event.body === "string" ? JSON.parse(event.body) : event.body;
    const { title, description, price, count } = body;

    if (!title || typeof price !== 'number' || price < 0 || typeof count !== 'number' || count < 0) {
      return {
        statusCode: 400,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({
          message: "Invalid product data. Ensure title, price (>=0), and count (>=0) are provided correctly.",
        }),
      };
    }

    const id = uuidv4();

    await docClient.send(
      new TransactWriteCommand({
        TransactItems: [
          {
            Put: {
              TableName: process.env.PRODUCTS_TABLE,
              Item: { id, title, description, price },
            },
          },
          {
            Put: {
              TableName: process.env.STOCKS_TABLE,
              Item: { product_id: id, count },
            },
          },
        ],
      }),
    );

    console.log(`Successfully created product ${id}`);
    return {
      statusCode: 201,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST,OPTIONS",
      },
      body: JSON.stringify({ id, title, description, price, count }),
    };

  } catch (err: any) {
    console.error("Transaction Error:", err);
    return {
      statusCode: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ message: "Internal Server Error: Failed to create product." }),
    };
  }
};
