const AWS = jest.createMockFromModule('aws-sdk');

AWS.S3.prototype.getSignedUrlPromise = jest.fn(() => 'www.signedUrl.com.br');

const TagSet = [{ Key: 'comment', Value: 'comentario' }];
AWS.S3.prototype.getObjectTagging = jest.fn(() => ({
  promise: jest.fn(() => ({
    TagSet,
  })),
}));

AWS.S3.prototype.getObject = jest.fn(() => ({
  promise: jest.fn(() => ({ Body: Buffer.from('[]') })),
}));

AWS.S3.prototype.listObjectsV2 = jest.fn(() => ({
  promise: jest.fn(() => ({
    Contents: [
      {
        Key: '580038a8-a87d-4fd1-8514-793179b57292/6315c04a-8835-4998-a66e-bf1356f54915.zip',
      },
      {
        Key: '580038a8-a87d-4fd1-8514-793179b57292/d2bf0596-86fc-4c02-9780-22c0d0d16b87.zip',
      },
      {
        Key: '580038a8-a87d-4fd1-8514-793179b57292/def4139a-aa30-40a9-935d-deb7f7240672.zip',
      },
    ],
  })),
}));

AWS.DynamoDB.DocumentClient.prototype.getTranslator = jest.fn(() => ({
  translateOutput: jest.fn((dynamoRecord, itemShape) => dynamoRecord),
}));

AWS.DynamoDB.DocumentClient.prototype.service = {
  api: {
    operations: {
      getItem: {
        output: {
          members: {
            Item: 'any_item',
          },
        },
      },
    },
  },
};

AWS.StepFunctions.prototype.startExecution = jest.fn(() => ({
  promise: jest.fn(() => true),
}));

AWS.SNS.prototype.publish = jest.fn(() => ({
  promise: jest.fn(() => true),
}));

AWS.SecretsManager.prototype.getSecretValue = jest.fn(() => ({
  promise: jest.fn(() => ({
    SecretString: 'Uma chave qualquer',
  })),
}));

AWS.SQS.prototype.getQueueAttributes = jest.fn(() => ({
  promise: jest.fn(() => ({
    Attributes: { ApproximateNumberOfMessages: 20 },
  })),
}));

AWS.SQS.prototype.receiveMessage = jest.fn(() => ({
  promise: jest.fn(() => ({
    Messages: [
      { body: {}, MessageId: 'xxx' },
      { body: {}, MessageId: 'xxx' },
      { body: {}, MessageId: 'xxx' },
      { body: {}, MessageId: 'xxx' },
      { body: {}, MessageId: 'xxx' },
      { body: {}, MessageId: 'xxx' },
      { body: {}, MessageId: 'xxx' },
      { body: {}, MessageId: 'xxx' },
      { body: {}, MessageId: 'xxx' },
      { body: {}, MessageId: 'xxx' },
    ],
  })),
}));

AWS.SQS.prototype.sendMessage = jest.fn(() => ({
  promise: jest.fn(() => true),
}));

AWS.SQS.prototype.deleteMessage = jest.fn(() => ({
  promise: jest.fn(() => true),
}));

AWS.SQS.prototype.getQueueUrl = jest.fn(() => ({
  promise: jest.fn(() => ({
    QueueUrl: 'sou-uma-url',
  })),
}));

module.exports = AWS;
