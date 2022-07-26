process.env = Object.assign(process.env, {
  stage: 'test',
  serviceName: 'bgc-default',
  shortServiceName: 'default',

  jwtKey: 'HS256',
  serviceToken: 'xxxx',

  serviceDomain: 'default.test-bgcbrasil.cf',
});
