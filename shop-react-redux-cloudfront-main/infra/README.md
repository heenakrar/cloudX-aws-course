# Welcome to your CDK TypeScript project

This is a blank project for CDK development with TypeScript.

The `cdk.json` file tells the CDK Toolkit how to execute your app.

## Useful commands

* `npm run build`   compile typescript to js
* `npm run watch`   watch for changes and compile
* `npm run test`    perform the jest unit tests
* `npx cdk deploy`  deploy this stack to your default AWS account/region
* `npx cdk diff`    compare deployed stack with current state
* `npx cdk synth`   emits the synthesized CloudFormation template

* `npm run seed`   run this from infra folder to set up the data in DynamoDB


From the infra folder, just run `npm run full-deploy`. This will automatically build the React app and then deploy the infrastructure.

Automated CDK deployment:
CloudFront URL: dd68w7uhazhum.cloudfront.net

API Gateway Generated URL after deployment to get all products in JSON format - https://d850b7qo24.execute-api.eu-north-1.amazonaws.com/prod/products

API Gateway Generated URL after deployment to get specific products in JSON format - https://d850b7qo24.execute-api.eu-north-1.amazonaws.com/prod/products/c3d4e5f6-g7h8-i9j0-k1l2-m3n4o5p6q7r8