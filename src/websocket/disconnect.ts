import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { ScanCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";

const ddb = new DynamoDBClient({});

export const handler = async (event: any) => {
  const connectionId = event.requestContext.connectionId;

  const result = await ddb.send(
    new ScanCommand({
      TableName: process.env.TABLE_NAME,
      FilterExpression: "connectionId = :c",
      ExpressionAttributeValues: {
        ":c": connectionId
      }
    })
  ) as any;

  if (result.Items?.length) {
    const { groupId } = result.Items[0];

    await ddb.send(
      new DeleteCommand({
        TableName: process.env.TABLE_NAME,
        Key: {
          groupId,
          connectionId
        }
      })
    );
  }

  return { statusCode: 200 };
};
