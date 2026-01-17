/* ===================== MOCKS ===================== */

const postToConnectionMock = jest.fn();
const sendMock = jest.fn();

jest.mock("@aws-sdk/client-dynamodb", () => {
  return {
    DynamoDBClient: jest.fn().mockImplementation(() => ({
      send: sendMock,
    })),
  };
});

jest.mock("@aws-sdk/lib-dynamodb", () => {
  return {
    QueryCommand: jest.fn().mockImplementation((input) => input),
    DeleteCommand: jest.fn().mockImplementation((input) => input),
  };
});

jest.mock("@aws-sdk/client-apigatewaymanagementapi", () => {
  return {
    ApiGatewayManagementApi: jest.fn().mockImplementation(() => ({
      postToConnection: postToConnectionMock,
    })),
  };
});

/* ===================== IMPORTS ===================== */

import { handler, lastMessageTime } from "../../src/websocket/default";

/* ===================== SETUP ===================== */

beforeAll(() => {
  jest.spyOn(console, "error").mockImplementation(() => {});
});

beforeEach(() => {
  jest.clearAllMocks();
  lastMessageTime.clear();
});

/* ===================== TESTS ===================== */

describe("WebSocket default handler – FULL coverage", () => {
  test("returns 400 when body is missing", async () => {
    const res = await handler({
      requestContext: {},
    } as any);

    expect(res.statusCode).toBe(400);
  });

  test("returns 400 for invalid payload", async () => {
    const res = await handler({
      body: JSON.stringify({}),
      requestContext: {},
    } as any);

    expect(res.statusCode).toBe(400);
  });

  test("returns 200 for valid message", async () => {
    sendMock.mockResolvedValueOnce({
      Items: [{ connectionId: "abc" }],
    });

    postToConnectionMock.mockResolvedValueOnce({});

    const res = await handler({
      body: JSON.stringify({
        action: "sendMessage",
        groupId: "team-1",
        user: "nav",
        message: "hello",
      }),
      requestContext: {
        domainName: "example.com",
        stage: "Prod",
        connectionId: "conn-1",
      },
    } as any);

    expect(res.statusCode).toBe(200);
    expect(postToConnectionMock).toHaveBeenCalled();
  });

  test("handles empty connection list", async () => {
    sendMock.mockResolvedValueOnce({ Items: [] });

    const res = await handler({
      body: JSON.stringify({
        action: "sendMessage",
        groupId: "team-1",
        user: "nav",
        message: "hello",
      }),
      requestContext: {
        domainName: "example.com",
        stage: "Prod",
        connectionId: "conn-2",
      },
    } as any);

    expect(res.statusCode).toBe(200);
  });

  test("handles postToConnection failure (GoneException)", async () => {
    sendMock
      .mockResolvedValueOnce({
        Items: [{ connectionId: "gone-id" }],
      })
      .mockResolvedValueOnce({}); // DeleteCommand

    postToConnectionMock.mockRejectedValueOnce({ statusCode: 410 });

    const res = await handler({
      body: JSON.stringify({
        action: "sendMessage",
        groupId: "team-1",
        user: "nav",
        message: "hello",
      }),
      requestContext: {
        domainName: "example.com",
        stage: "Prod",
        connectionId: "conn-3",
      },
    } as any);

    expect(res.statusCode).toBe(200);
  });
});
test("returns 429 when client is throttled", async () => {
  // First call → allowed
  sendMock.mockResolvedValueOnce({
    Items: [{ connectionId: "abc" }],
  });

  await handler({
    body: JSON.stringify({
      action: "sendMessage",
      groupId: "team-1",
      user: "nav",
      message: "hello",
    }),
    requestContext: {
      domainName: "example.com",
      stage: "Prod",
      connectionId: "throttle-conn",
    },
  } as any);

  // Second call immediately → throttled
  const res = await handler({
    body: JSON.stringify({
      action: "sendMessage",
      groupId: "team-1",
      user: "nav",
      message: "hello again",
    }),
    requestContext: {
      domainName: "example.com",
      stage: "Prod",
      connectionId: "throttle-conn",
    },
  } as any);

  expect(res.statusCode).toBe(429);
});
test("returns 400 for malformed JSON body", async () => {
  const res = await handler({
    body: "{invalid-json", //  JSON.parse throws
    requestContext: {},
  } as any);

  expect(res.statusCode).toBe(400);
});
test("handles postToConnection non-410 error", async () => {
  sendMock
    .mockResolvedValueOnce({ Items: [{ connectionId: "abc" }] })
    .mockRejectedValueOnce({ statusCode: 500 }); //  not 410

  const res = await handler({
    body: JSON.stringify({
      action: "sendMessage",
      groupId: "team-1",
      user: "nav",
      message: "hello",
    }),
    requestContext: {
      domainName: "example.com",
      stage: "Prod",
      connectionId: "err-conn",
    },
  } as any);

  expect(res.statusCode).toBe(200);
});
