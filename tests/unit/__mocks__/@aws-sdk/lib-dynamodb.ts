export const DynamoDBDocumentClient = {
  from: jest.fn().mockReturnValue({
    send: jest.fn()
  })
};

export const ScanCommand = jest.fn();
export const DeleteCommand = jest.fn();
