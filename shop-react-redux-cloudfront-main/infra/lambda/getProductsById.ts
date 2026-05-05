import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { GetCommand, DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

export const handler = async (event: any) => {
  console.log('Incoming Request:', JSON.stringify(event, null, 2));
  
  const productId = event.pathParameters?.productId;

  if (!productId) {
    return {
      statusCode: 400,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ message: "Product ID is required" }),
    };
  }

  try {
    const [productRes, stockRes] = await Promise.all([
      docClient.send(new GetCommand({ TableName: process.env.PRODUCTS_TABLE, Key: { id: productId } })),
      docClient.send(new GetCommand({ TableName: process.env.STOCKS_TABLE, Key: { product_id: productId } }))
    ]);

    if (!productRes.Item) {
      console.log(`Product ${productId} not found`);
      return {
        statusCode: 404,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ message: "Product not found" }),
      };
    }

    return {
      statusCode: 200,
      headers: { 
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        ...productRes.Item,
        count: stockRes.Item ? stockRes.Item.count : 0
      }),
    };
  } catch (err: any) {
    console.error(`Error fetching product ${productId}:`, err);
    return { 
      statusCode: 500, 
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ message: "Internal Server Error" }) 
    };
  }
};