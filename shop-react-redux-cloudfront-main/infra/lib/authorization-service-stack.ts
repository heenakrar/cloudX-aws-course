import * as path from "path";
import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import * as iam from "aws-cdk-lib/aws-iam";
import * as dotenv from "dotenv";

dotenv.config();

export class AuthorizationServiceStack extends cdk.Stack {
  public readonly basicAuthorizerHandler: lambda.IFunction;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const githubUser = Object.keys(process.env).find(
      (key) => process.env[key] === "TEST_PASSWORD",
    );

    if (!githubUser) {
      throw new Error(
        "CRITICAL: No matching TEST_PASSWORD user environment setting found inside your local .env file.",
      );
    }

    const environment: { [key: string]: string } = {};
    environment[githubUser] = process.env[githubUser] || "TEST_PASSWORD";

    this.basicAuthorizerHandler = new NodejsFunction(
      this,
      "BasicAuthorizerHandler",
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        memorySize: 1024,
        timeout: cdk.Duration.seconds(5),
        entry: path.join(__dirname, "../lambda/basicAuthorizer.ts"),
        handler: "handler",
        environment,
      },
    );

    new lambda.CfnPermission(this, "AllowApiGatewayInvokePermission", {
      action: "lambda:InvokeFunction",
      functionName: this.basicAuthorizerHandler.functionName,
      principal: "apigateway.amazonaws.com",
    });

    new cdk.CfnOutput(this, "BasicAuthorizerFunctionArn", {
      value: this.basicAuthorizerHandler.functionArn,
      exportName: "BasicAuthorizerFunctionArn",
    });
  }
}
