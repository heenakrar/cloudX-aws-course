import * as path from "path";
import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import * as sqs from "aws-cdk-lib/aws-sqs";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as sns from "aws-cdk-lib/aws-sns";
import * as subs from "aws-cdk-lib/aws-sns-subscriptions";
import { SqsEventSource } from "aws-cdk-lib/aws-lambda-event-sources";

export class ProductSqsStack extends cdk.Stack {
  public readonly catalogItemsQueue: sqs.IQueue;
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const productsTable = dynamodb.Table.fromTableName(
      this,
      "ProductsTableRef",
      "products",
    );
    const stocksTable = dynamodb.Table.fromTableName(
      this,
      "StocksTableRef",
      "stocks",
    );

    this.catalogItemsQueue = new sqs.Queue(this, "catalogItemsQueue", {
      queueName: "catalogItemsQueue",
      visibilityTimeout: cdk.Duration.seconds(30),
    });

    const createProductTopic = new sns.Topic(this, "createProductTopic", {
      topicName: "createProductTopic",
    });

    createProductTopic.addSubscription(
      new subs.EmailSubscription("heena_pasha@epam.com", {
        filterPolicy: {
          priceCategory: sns.SubscriptionFilter.stringFilter({
            allowlist: ["regular"],
          }),
        },
      }),
    );

    createProductTopic.addSubscription(
      new subs.EmailSubscription("heenakrar96@gmail.com", {
        filterPolicy: {
          priceCategory: sns.SubscriptionFilter.stringFilter({
            allowlist: ["expensive"],
          }),
        },
      }),
    );

    const catalogBatchProcess = new NodejsFunction(
      this,
      "catalogBatchProcess",
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        memorySize: 1024,
        timeout: cdk.Duration.seconds(5),
        entry: path.join(__dirname, "../../lambda/catalogBatchProcess.ts"),
        handler: "main",
        environment: {
          PRODUCTS_TABLE_NAME: productsTable.tableName,
          STOCKS_TABLE_NAME: stocksTable.tableName,
          SNS_TOPIC_ARN: createProductTopic.topicArn,
        },
      },
    );

    catalogBatchProcess.addEventSource(
      new SqsEventSource(this.catalogItemsQueue, {
        batchSize: 5,
      }),
    );

    productsTable.grantWriteData(catalogBatchProcess);
    stocksTable.grantWriteData(catalogBatchProcess);
    createProductTopic.grantPublish(catalogBatchProcess);
  }
}
