# AWS Solution Constructs을 이용한 CloudFront / Api Gateway 구현

[AWS Solutions Constructs](https://docs.aws.amazon.com/solutions/latest/constructs/welcome.html)에서 제공하는 
[aws-cloudfront-apigateway](https://docs.aws.amazon.com/solutions/latest/constructs/aws-cloudfront-apigateway.html)을 적용하여 cloudfront와 api gateway연결을 생성합니다. AWS Solutions Constructs는 well-architectured pattern으로 design하는것을 돕고 multi-services를 지원하기 위해 만들어진 [CDK](https://github.com/kyopark2014/technical-summary/blob/main/cdk-introduction.md)의 open source extension입니다. 

원래 목적은 [CloudFront to S3 and API Gateway](https://serverlessland.com/patterns/cloudfront-s3-lambda-cdk)와 같이 '/'로는 web page를 열고, '/status'로는 api를 호출 할 수 있도록 해서, web page에 있는 index.html의 request.js가 cloudfront의 같은 domain으로 설정해서 cors 우회에 활용하려고 했으나, 실제로는 origin이 lambda로 설정되면서, s3로는 접근이 안되어서, 이런 용도로는 활용할 수 없었습니다. [aws-cloudfront-apigateway](https://docs.aws.amazon.com/solutions/latest/constructs/aws-cloudfront-apigateway.html)의 architecture 그림에 있는 S3는 multple routing을 고려한 구조가 아니라, 단순히 api-gateway의 logging을 위한 것입니다. 

AWS Solution Constructs를 활용함으로 multiple service를 기존보다 쉽게 구현할 수 있다는 장점이 있겠으나, 기존에 있는 api를 조합해서 충분히 대체 가능하므로 AWS Solution Constructs의 용도는 제한적인 것으로 보입니다. 
 

구현된 architecture는 아래와 같습니다.

<img width="665" alt="image" src="https://user-images.githubusercontent.com/52392004/171373434-e860df2a-9105-4ae5-9f41-35e2917a8b2d.png">

구현하려고 했던 architecture는 아래와 같습니다. 

<img width="640" alt="image" src="https://user-images.githubusercontent.com/52392004/171332403-159b38ca-02c4-4f94-95b5-db8b1b2293a7.png">


## AWS Solutions Constructs

AWS Solutions Constructs (Constructs) is an **open-source extension** of the AWS Cloud Development Kit (CDK) that provides multi-service, well-architected patterns for quickly defining solutions in code to create predictable and repeatable infrastructure. The goal is to accelerate the experience for developers to build solutions of any size using pattern-based definitions for their architecture.



### CDK Initiate

Typescript로 cdk를 설정시 아래와 같이 합니다.

```c
$ cdk init app --language typescript

$ cdk bootstrap aws://123456789012/ap-northeast-2
```
여기서 '123456789012'은 Account Number를 의미합니다.

- aws-cdk-lib의 수동 Upgrade가 필요합니다.

```c
$ npm install -g aws-cdk-lib
```

- CloudFrontToApiGateway를 위한 aws-solutions-constructs의 aws-cloudfront-apigateway package 설치하여야 합니다.

```c
$ npm install @aws-solutions-constructs/aws-cloudfront-apigateway
```

## LambdaRestApi로 구현시

[aws-cloudfront-apigateway](https://docs.aws.amazon.com/solutions/latest/constructs/aws-cloudfront-apigateway.html)에서는 아래와 같이 LambdaRestApi을 이용해 api gateway를 생성합니다. proxy를 true로 하면, 모든 request들이 lambda function으로 갑니다. proxy를 false로 하면, addResource와 addMethod를 이용해 정의할 수 있습니다. 기본은 true 입니다.

```java
    // api gateway
    const apigw = new apiGateway.LambdaRestApi(this, 'api-gateway', {
      handler: lambdaBasic,
      endpointConfiguration: {
        types: [apiGateway.EndpointType.REGIONAL]
      },
      defaultMethodOptions: {
        authorizationType: apiGateway.AuthorizationType.NONE
      },
      proxy: true
    });
```

## RestApi로 구현시

여기서는 RestAPI를 활용합니다. CloudFrontToApiGateway를 이용하여 cloudfront와 api gateway를 동시에 설정 가능합니다.


```java
    // define api gateway
    const mathodName = "status"
    const apigw = new apiGateway.RestApi(this, 'api-gateway', {
      description: 'API Gateway',
      endpointTypes: [apiGateway.EndpointType.REGIONAL],
      deployOptions: {
        stageName: 'dev',
      },
      defaultMethodOptions: {
        authorizationType: apiGateway.AuthorizationType.NONE
      },
    });   

    // define method of "status"
    const api = apigw.root.addResource(mathodName);
    api.addMethod('GET', new apiGateway.LambdaIntegration(lambdaBasic, {
      integrationResponses: [{
        statusCode: '200',
      }], 
      proxy:false, 
    }), {
      methodResponses: [   // API Gateway sends to the client that called a method.
        {
          statusCode: '200',
          responseModels: {
            'application/json': apiGateway.Model.EMPTY_MODEL,
          }, 
        }
      ]
    }); 

    // cloudfront + api gateway
    let cloudfront = new CloudFrontToApiGateway(this, 'Destribution', {
      existingApiGatewayObj: apigw,
      
    /*  cloudFrontDistributionProps: {    // not working
        origin: new origins.S3Origin(s3Bucket),
        behaviors: [{ isDefaultBehavior: true }] 
      } */
    }); 
```


## Basic Lambda Function

여기서는 CloudFront - Api gateway 조합을 설명하기 위함이므로 Lambda는 기본 생성된 코드를 사용합니다. 아래 Lambda 호출시에 "Hello from Lambda"를 200OK의 body에 포함하여 전송합니다. 

```java
exports.handler = async (event) => {
    // TODO implement
    const response = {
        statusCode: 200,
        body: JSON.stringify('Hello from Lambda!'),
    };
    return response;
};
```

## 결과

Lambda가 cloudfront의 origin으로 설정됩니다.

![image](https://user-images.githubusercontent.com/52392004/171371889-231fd84a-07ba-4ba5-9fb5-b51a1cc58909.png)

cloudfront의 도메인으로 api('/status')를 호출시 lambada가 실행되어 아래와 같은 결과를 얻습니다. 이것은 api gateway endpoint를 이용할때와 동일한 결과 입니다. 

<img width="772" alt="image" src="https://user-images.githubusercontent.com/52392004/171375890-3e81795d-1450-4fe1-a4cb-3227d603e835.png">


## Troubleshoot

```c
$ npm install @aws-solutions-constructs/aws-cloudfront-apigateway
npm ERR! code ERESOLVE
npm ERR! ERESOLVE unable to resolve dependency tree
npm ERR! 
npm ERR! While resolving: cdk-iot@0.1.0
npm ERR! Found: aws-cdk-lib@2.17.0
npm ERR! node_modules/aws-cdk-lib
npm ERR!   aws-cdk-lib@"2.17.0" from the root project
npm ERR! 
npm ERR! Could not resolve dependency:
npm ERR! peer aws-cdk-lib@"^2.23.0" from @aws-solutions-constructs/aws-cloudfront-apigateway@2.8.0
npm ERR! node_modules/@aws-solutions-constructs/aws-cloudfront-apigateway
npm ERR!   @aws-solutions-constructs/aws-cloudfront-apigateway@"*" from the root project
npm ERR! 
npm ERR! Fix the upstream dependency conflict, or retry
npm ERR! this command with --force, or --legacy-peer-deps
npm ERR! to accept an incorrect (and potentially broken) dependency resolution.
npm ERR! 
npm ERR! See /Users/ksdyb/.npm/eresolve-report.txt for a full report.

npm ERR! A complete log of this run can be found in:
npm ERR!     /Users/ksdyb/.npm/_logs/2022-06-01T01_40_16_351Z-debug-0.log
```
 
- 현재 버전은 package.json에서 확인합니다. 

```java
  "dependencies": {
    "aws-cdk-lib": "2.17.0",
```

Upgrade를 아래처럼 수행합니다.

```c
$ npm install -g aws-cdk-lib
```

이후 버전을 확인해보면 "2.25.0"이상으로 업그레이드 됩니다.

## Reference
[AWS Solutions Library](https://aws.amazon.com/solutions/)

[AWS Solutions Constructs](https://docs.aws.amazon.com/solutions/latest/constructs/welcome.html)

[aws-cloudfront-apigateway](https://docs.aws.amazon.com/solutions/latest/constructs/aws-cloudfront-apigateway.html)

