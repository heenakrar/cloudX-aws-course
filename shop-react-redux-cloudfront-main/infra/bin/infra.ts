#!/usr/bin/env node
import "@cspotcode/source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { DeployWebAppStack } from "../lib/deploy-web-app-stack";
import { ProductServiceStack } from "../lib/product-service-stack";
import { ImportServiceStack } from "../lib/import-service-stack";
import { ProductSqsStack } from "../lib/product-sqs/product-sqs-stack";

const app = new cdk.App();
const sqsStack = new ProductSqsStack(app, "ProductSqsStack");
new DeployWebAppStack(app, "DeployWebAppStack", {});
new ProductServiceStack(app, "ProductServiceStack", {});
new ImportServiceStack(app, "ImportServiceStack", {
  catalogItemsQueue: sqsStack.catalogItemsQueue,
});
