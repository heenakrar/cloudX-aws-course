import {
  APIGatewayAuthorizerResult,
  APIGatewayTokenAuthorizerEvent,
} from "aws-lambda";

export const handler = async (
  event: APIGatewayTokenAuthorizerEvent,
): Promise<APIGatewayAuthorizerResult> => {
  console.log("Method ARN:", event.methodArn);
  const authorizationHeader = event.authorizationToken;

  if (!authorizationHeader || !authorizationHeader.startsWith("Basic ")) {
    console.error("Missing or invalid Authorization header format.");
    throw new Error("Unauthorized");
  }

  try {
    const base64Token = authorizationHeader.split(" ")[1];
    const decodedToken = Buffer.from(base64Token, "base64").toString("utf-8");
    const [username, password] = decodedToken.split(":");

    console.log(`Authenticating login attempt for user: ${username}`);

    const expectedPassword = process.env[username];

    if (expectedPassword && expectedPassword === password) {
      console.log("Authentication successful. Generating ALLOW policy.");
      return generatePolicy("user", "Allow", event.methodArn);
    } else {
      console.warn("Invalid credentials provided. Generating DENY policy.");
      return generatePolicy("user", "Deny", event.methodArn);
    }
  } catch (error) {
    console.error(
      "Failed to parse authorization token processing loop:",
      error,
    );
    throw new Error("Unauthorized");
  }
};

const generatePolicy = (
  principalId: string,
  effect: "Allow" | "Deny",
  resource: string,
): APIGatewayAuthorizerResult => {
  return {
    principalId,
    policyDocument: {
      Version: "2012-10-17",
      Statement: [
        {
          Action: "execute-api:Invoke",
          Effect: effect,
          Resource: resource,
        },
      ],
    },
  };
};
