import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { PutCommand } from "@aws-sdk/lib-dynamodb";

const ddb = new DynamoDBClient({});

export const handler = async (event: any) => {
  console.log("CONNECT EVENT:", JSON.stringify(event));

  const connectionId = event.requestContext.connectionId;
  const groupId = event.queryStringParameters?.groupId || "default";

  await ddb.send(
    new PutCommand({
      TableName: process.env.TABLE_NAME,
      Item: {
        groupId,
        connectionId
      }
    })
  );

  return { statusCode: 200 };
};
