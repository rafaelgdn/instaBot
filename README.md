# BGC Default

![Dog-Pic](https://images.vexels.com/media/users/3/169089/isolated/lists/fd79f80666e51a2d808eaedee546d896-doodle-de-orelha-de-lingua-de-cachorro-filhote-de-cachorro.png)

## Descrição

Esse repositorio tem como objetivo representar um repositorio default e você pode colocar aqui o que mais for necessário para explicar o que ele faz.

## Endpoints

- Example

  > Esse endpoint representa um endpoint default.

  ```json
    {
      "number": 9,  /*number-value*/,
      "string": "example", /*string-value*/,
      "array": [], /*string-array-value*/,
      "object": {}, /*object-value*/,
    }
  ```

## Como Criar Repositório

- Acessar <https://bitbucket.org/repo/import?workspace=bgcbrasil>

- Preencher conforme imagem a baixo

  ![import-repo](https://i.imgur.com/dPWRfLe.png)

- Acessar <https://bitbucket.org/bgcbrasil/{{your-service-name}}/admin/addon/admin/pipelines/deployment-settings>

- Adicionar **STAGE** e **AWS_ROLE_ARN** as variaveis de environment

  - Test

    - **STAGE:** dev
    - **AWS_ROLE_ARN:** arn:aws:iam::150996556957:role/bitbucket-openID-iam-role

  - Staging

    - **STAGE:** staging
    - **AWS_ROLE_ARN:** arn:aws:iam::618187453002:role/staging-bgc-bitbucket-openid-role

  - Production
    - **STAGE:** production
    - **AWS_ROLE_ARN:** arn:aws:iam::633732583642:role/bgc-production-bitbucket-role

## O que alterar **antes** do primeiro deploy

- Caso você não vá utilizar websocket, é necessário:

  - Excluir os arquivos:

    - `src/functions/websocket/*`
    - `sls/functions/websocket/*`
    - `sls/resource/domain/websocketDomain`

  - Excluir a seguinte linha do serverless.yml:

    ```yml
    36 | - ${file(sls/resources/domain/websocketDomain.yml)}
    ```

  - Excluir a seguinte linha do sls/functions/index.yml

    ```yml
    6 | - ${file(sls/functions/websocket/websocketConnectionHandler.yml)}
    ```

- Alterar o nome do serviço nos seguintes arquivos:

  - `sls/custom/index.yml`

    ```yml
    2 | shortServiceName: default # the name of the service here!
    ```

  - `jest-env.js`

  ```js
  process.env = Object.assign(process.env, {
    stage: 'test',
    serviceName: 'bgc-default', // change here
    shortServiceName: 'default', // change here

    jwtKey: 'HS256',
    serviceToken: 'xxxx',

    serviceDomain: 'default.test-bgcbrasil.cf', // change here
  });
  ```

  - `package.json`

  ```json
  {
    "name": "bgc-default", // change here
    "version": "1.0.0",
    "description": "default repository to work like a guide to new micro-services", // change the description
    "author": "BGC Brasil",
    "license": "ISC",
    "homepage": "https://bitbucket.org/bgcbrasil/bgc-default#readme", // change here
    "private": true,
    "repository": {
      "type": "git",
      "url": "git+ssh://git@bitbucket.org/bgcbrasil/bgc-default.git" // change here
    },
    ...
  }
  ```

  - `commitlint.config.js`

  ```js
  rules: {
    // Removing subject because we validate it on custom hast-jira-issue rule
    'subject-case': [0, 'always'],
    'has-jira-issue': [2, 'always', 'TE'], // put your team's initials here (like is in the jira issues)
  },
  ```

  - `bitbucket-pipelines.yml`

  ```yaml
  - aws s3api put-object --profile $STAGE-bgc --bucket bgc-swagger-ui-$STAGE --key apis/default --content-type "application/json" --body documentation_external.json # change the --key flag
  - aws s3api put-object --profile $STAGE-bgc --bucket bgc-swagger-ui-$STAGE-private --key apis/default --content-type "application/json" --body documentation.json # change the --key flag
  ```

  - `sls/custom/mtls.yml`

  ```yaml
  authorityName: ${cf:bgc-infra-${self:custom.stage}.TeamCCertificateAuthority} # change to your team certificate
  ```

  - `sls/custom/apiGatewayTags.yml`

  ```yaml
  type: sync # or 'async' or 'orchestrator'
  ```

  - Alterar esse arquivo, vulgo README

## Após o primeiro deploy

Caso vá habilitar o mtls, siga o passo a passo na wiki [aqui!](https://wiki.bgcbrasil.com.br/en/private/components/bgc-mtls-integration-plugin)
