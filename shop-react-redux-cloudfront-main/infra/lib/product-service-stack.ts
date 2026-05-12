import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as nodejs from "aws-cdk-lib/aws-lambda-nodejs";
import * as iam from "aws-cdk-lib/aws-iam";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import { Construct } from "constructs";
import * as path from "path";

export class ProductServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const productsTable = "products";
    const stocksTable = "stocks";

    const lambdaProps = {
      runtime: lambda.Runtime.NODEJS_20_X,
      environment: {
        PRODUCTS_TABLE: productsTable,
        STOCKS_TABLE: stocksTable,
      },
    };

    const getProductsList = new nodejs.NodejsFunction(this, "getProductsList", {
      ...lambdaProps,
      entry: path.join(__dirname, "../lambda/getProductsList.ts"),
    });

    const getProductsById = new nodejs.NodejsFunction(this, "getProductsById", {
      ...lambdaProps,
      entry: path.join(__dirname, "../lambda/getProductsById.ts"),
    });

    const createProduct = new nodejs.NodejsFunction(this, "createProduct", {
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: path.join(__dirname, "../lambda/createProduct.ts"),
      environment: {
        PRODUCTS_TABLE: "products",
        STOCKS_TABLE: "stocks",
      },
    });

    const tableArnPrefix = `arn:aws:dynamodb:${this.region}:${this.account}:table`;
    const tableArns = [`${tableArnPrefix}/${productsTable}`, `${tableArnPrefix}/${stocksTable}`];
    [getProductsList, getProductsById].forEach((fn) => {
      fn.addToRolePolicy(
        new iam.PolicyStatement({
          actions: [
            "dynamodb:Scan",
            "dynamodb:GetItem",
            "dynamodb:Query",
          ],
          resources: tableArns,
        }),
      );
    });

    createProduct.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ["dynamodb:PutItem"],
        resources: tableArns,
      }),
    );

    const api = new apigateway.RestApi(this, "ProductsApi", {
      restApiName: "Product Service",
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ["*"],
      },
    });

    const products = api.root.addResource("products");
    products.addMethod(
      "GET",
      new apigateway.LambdaIntegration(getProductsList),
    );
    const productById = products.addResource("{productId}");
    productById.addMethod(
      "GET",
      new apigateway.LambdaIntegration(getProductsById),
    );
    products.addMethod("POST", new apigateway.LambdaIntegration(createProduct));
  }
}
