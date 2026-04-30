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

From the infra folder, just run `npm run full-deploy`. This will automatically build the React app and then deploy the infrastructure.

Automated CDK deployment:
CloudFront URL: dd68w7uhazhum.cloudfront.net

Manual deployment:
S3 Website URL: https://web-app-react-aws-deploy.s3.eu-north-1.amazonaws.com/index.html
Cloudfront URL created by cloudformation: d2hsywb3ftpcmj.cloudfront.net

