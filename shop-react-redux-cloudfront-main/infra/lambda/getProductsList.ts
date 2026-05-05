import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { ScanCommand, DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
export const docClient = DynamoDBDocumentClient.from(client);

export const handler = async (event: any) => {
  console.log('Incoming Request:', JSON.stringify(event, null, 2)); 
  
  try {
    const [productsData, stocksData] = await Promise.all([
      docClient.send(new ScanCommand({ TableName: process.env.PRODUCTS_TABLE })),
      docClient.send(new ScanCommand({ TableName: process.env.STOCKS_TABLE }))
    ]);

    const joinedProducts = productsData.Items?.map(product => {
      const stock = stocksData.Items?.find(s => s.product_id === product.id);
      return {
        ...product,
        count: stock ? stock.count : 0 
      };
    }) || [];

    return {
      statusCode: 200,
      headers: { 
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json" 
      },
      body: JSON.stringify(joinedProducts),
    };
  } catch (err: any) {
    console.error("DATABASE_ERROR:", err);
    return {
      statusCode: 500,
      headers: { "Access-Control-Allow-Origin": "*" }, 
      body: JSON.stringify({ message: "Internal Server Error: Could not retrieve products." }),
    };
  }
};
