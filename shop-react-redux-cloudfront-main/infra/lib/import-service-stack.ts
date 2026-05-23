import * as cdk from "aws-cdk-lib";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as s3n from "aws-cdk-lib/aws-s3-notifications";
import { Construct } from "constructs";
import * as s3deploy from "aws-cdk-lib/aws-s3-deployment";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigw from "aws-cdk-lib/aws-apigateway";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import * as sqs from "aws-cdk-lib/aws-sqs";
import * as iam from "aws-cdk-lib/aws-iam";

interface ImportServiceStackProps extends cdk.StackProps {
  catalogItemsQueue: sqs.IQueue;
}

export class ImportServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: ImportServiceStackProps) {
    super(scope, id, props);

    const authorizerFunctionArn = cdk.Fn.importValue("BasicAuthorizerFunctionArn");
    const authorizerFunction = lambda.Function.fromFunctionArn(
      this,
      "BasicAuthorizerFunction",
      authorizerFunctionArn
    );

    const bucket = new s3.Bucket(this, "ImportBucket", {
      versioned: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      cors: [
        {
          allowedMethods: [s3.HttpMethods.PUT, s3.HttpMethods.GET],
          allowedOrigins: ["*"],
          allowedHeaders: ["*"],
        },
      ],
    });

    new s3deploy.BucketDeployment(this, "DeployEmptyFolder", {
      sources: [s3deploy.Source.data("uploaded/.keep", "")],
      destinationBucket: bucket,
    });

    const importProductsFile = new NodejsFunction(
      this,
      "ImportProductsFileHandler",
      {
        entry: "lambda/importProductsFile.ts",
        handler: "handler",
        runtime: lambda.Runtime.NODEJS_20_X,
        environment: {
          BUCKET_NAME: bucket.bucketName,
        },
      },
    );

    bucket.grantWrite(importProductsFile);

    const api = new apigw.RestApi(this, "ImportApi", {
      defaultCorsPreflightOptions: {
        allowOrigins: apigw.Cors.ALL_ORIGINS,
        allowMethods: apigw.Cors.ALL_METHODS,
        allowHeaders: ["Authorization", "Content-Type", "X-Amz-Date", "X-Api-Key", "X-Amz-Security-Token", "X-Amz-User-Agent"],
      },
    });

    const tokenAuthorizer = new apigw.TokenAuthorizer(
      this,
      "ImportTokenAuthorizerV2",
      {
        handler: authorizerFunction,
        identitySource: apigw.IdentitySource.header("Authorization"),
        resultsCacheTtl: cdk.Duration.seconds(0),
      },
    );

    const importResource = api.root.addResource("import");
    importResource.addMethod(
      "GET",
      new apigw.LambdaIntegration(importProductsFile),
      {
        requestParameters: {
          "method.request.querystring.name": true,
        },
        authorizer: tokenAuthorizer,
        authorizationType: apigw.AuthorizationType.CUSTOM,
      },
    );

    const importFileParser = new NodejsFunction(
      this,
      "ImportFileParserHandler",
      {
        entry: "lambda/importFileParser.ts",
        handler: "handler",
        runtime: lambda.Runtime.NODEJS_20_X,
        environment: {
          CATALOG_ITEMS_QUEUE_URL: props.catalogItemsQueue.queueUrl,
        },
      },
    );

    props.catalogItemsQueue.grantSendMessages(importFileParser);

    bucket.grantRead(importFileParser);
    bucket.grantReadWrite(importFileParser);
    bucket.grantDelete(importFileParser);

    bucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3n.LambdaDestination(importFileParser),
      { prefix: "uploaded/" },
    );
  }
}
