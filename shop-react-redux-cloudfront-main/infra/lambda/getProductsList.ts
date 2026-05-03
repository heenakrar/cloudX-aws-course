const products = [
  { id: '1', title: 'Product 1', price: 10, description: 'Short Description 1' },
  { id: '2', title: 'Product 2', price: 20, description: 'Short Description 2' },
  { id: '3', title: 'Product 3', price: 30, description: 'Short Description 3' },
  { id: '4', title: 'Product 4', price: 40, description: 'Short Description 4' },
  { id: '5', title: 'Product 5', price: 50, description: 'Short Description 5' },
  { id: '6', title: 'Product 6', price: 60, description: 'Short Description 6' },
];

export const handler = async (event: any) => {
  return {
    statusCode: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Credentials": true,
      "Access-Control-Allow-Methods": "GET",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(products),
  };
};