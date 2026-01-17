export const DynamoDBClient = jest.fn().mockImplementation(() => ({
  send: jest.fn().mockResolvedValue({})
}));
