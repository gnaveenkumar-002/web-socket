import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { QueryCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { ApiGatewayManagementApi } from "@aws-sdk/client-apigatewaymanagementapi";
import { z } from "zod";

/**
 * Exported DynamoDB client (important for Jest mocking)
 */
export const ddb = new DynamoDBClient({});

/**
 * Throttling (per connection)
 * Exported so tests can reset it
 */
export const lastMessageTime = new Map<string, number>();
const THROTTLE_MS = 1000; // 1 message / second

/**
 * Zod validation schema
 */
const messageSchema = z.object({
  action: z.literal("sendMessage"),
  groupId: z.string().min(1),
  user: z.string().min(1),
  message: z.string().min(1).max(500),
});

/**
 * WebSocket default handler
 */
export const handler = async (event: any) => {
  const { domainName, stage, connectionId } = event.requestContext ?? {};

  // ---------------- SAFETY CHECK ----------------
  if (!event.body) {
    return { statusCode: 400 };
  }

  // ---------------- VALIDATION ----------------
  let body;
  try {
    /* istanbul ignore next */
    body = messageSchema.parse(JSON.parse(event.body));
  } catch (err) {
    console.error("Invalid payload", err);
    return { statusCode: 400 };
  }

  const { groupId, user, message } = body;

  // ---------------- THROTTLING ----------------
  const now = Date.now();
  const lastTime = lastMessageTime.get(connectionId) ?? 0;

  if (now - lastTime < THROTTLE_MS) {
    return {
      statusCode: 429,
      body: "Too many messages. Slow down.",
    };
  }

  lastMessageTime.set(connectionId, now);

  // ---------------- API GATEWAY CLIENT ----------------
  const api = new ApiGatewayManagementApi({
    endpoint: `https://${domainName}/${stage}`,
  });

  // ---------------- FETCH CONNECTIONS ----------------
  const result = await ddb.send(
    new QueryCommand({
      TableName: process.env.TABLE_NAME,
      KeyConditionExpression: "groupId = :g",
      ExpressionAttributeValues: {
        ":g": groupId,
      },
    })
  );

  const connections = result.Items ?? [];

  const payload = {
    user,
    message,
    timestamp: new Date().toISOString(),
  };

  // ---------------- BROADCAST MESSAGE ----------------
  await Promise.all(
    connections.map(async (item: any) => {
      const targetConnectionId = item.connectionId;

      try {
        await api.postToConnection({
          ConnectionId: targetConnectionId,
          Data: JSON.stringify(payload),
        });
      } catch (err: any) {
        // Remove stale connections
        /* istanbul ignore else */
        if (err?.statusCode === 410) {
          await ddb.send(
            new DeleteCommand({
              TableName: process.env.TABLE_NAME,
              Key: {
                groupId,
                connectionId: targetConnectionId,
              },
            })
          );
        } else {
          console.error("postToConnection error", err);
        }
      }
    })
  );

  return { statusCode: 200 };
};
