const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { PutCommand, DynamoDBDocumentClient } = require("@aws-sdk/lib-dynamodb");

const client = new DynamoDBClient({ region: process.env.AWS_REGION || "eu-north-1" });
const docClient = DynamoDBDocumentClient.from(client);

const products = [
  { id: "27e6b424-7b8f-4d57-ad21-5f11a44a828c", title: "Product 1", description: "Short Description 1", price: 10, count: 5 },
  { id: "f9a1b2c3-d4e5-f6g7-h8i9-j0k1l2m3n4o5", title: "Product 2", description: "Short Description 2", price: 20, count: 10 },
  { id: "a1b2c3d4-e5f6-g7h8-i9j0-k1l2m3n4o5p6", title: "Product 3", description: "Short Description 3", price: 30, count: 15 },
  { id: "b2c3d4e5-f6g7-h8i9-j0k1-l2m3n4o5p6q7", title: "Product 4", description: "Short Description 4", price: 40, count: 20 },
  { id: "c3d4e5f6-g7h8-i9j0-k1l2-m3n4o5p6q7r8", title: "Product 5", description: "Short Description 5", price: 50, count: 25 },
  { id: "d4e5f6g7-h8i9-j0k1-l2m3-n4o5p6q7r8s9", title: "Product 6", description: "Short Description 6", price: 60, count: 30 },
];

async function seed() {
  for (const item of products) {
    const { count, ...productData } = item;
    
    await docClient.send(new PutCommand({
      TableName: "products",
      Item: productData
    }));

    await docClient.send(new PutCommand({
      TableName: "stocks",
      Item: { product_id: productData.id, count }
    }));
    
    console.log(`Seeded: ${productData.title}`);
  }
}

seed().catch(console.error);
