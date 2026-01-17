export const ApiGatewayManagementApi = jest.fn().mockImplementation(() => ({
  postToConnection: jest.fn().mockResolvedValue({})
  
}));
