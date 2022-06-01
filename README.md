# cdk-webclient


[AWS Solutions Constructs](https://docs.aws.amazon.com/solutions/latest/constructs/welcome.html)에서 제공하는 
[aws-cloudfront-apigateway](https://docs.aws.amazon.com/solutions/latest/constructs/aws-cloudfront-apigateway.html)을 적용하여 결과 및 코드를 공유하고자 합니다. 

- API Gateway 사용

- CORS를 우회

- [AWS Solutions Constructs](https://docs.aws.amazon.com/solutions/latest/constructs/welcome.html)를 이용

<img width="640" alt="image" src="https://user-images.githubusercontent.com/52392004/171332403-159b38ca-02c4-4f94-95b5-db8b1b2293a7.png">


AWS Solutions Constructs (Constructs) is an open-source extension of the AWS Cloud Development Kit (CDK) that provides multi-service, well-architected patterns for quickly defining solutions in code to create predictable and repeatable infrastructure. The goal is to accelerate the experience for developers to build solutions of any size using pattern-based definitions for their architecture.

Use the AWS Solutions Constructs to define your solutions in a familiar programming language. The AWS Solutions Constructs supports TypeScript, JavaScript, Python, and Java at this time.

### CDK Initiate

Typescript로 cdk를 설정시 아래와 같이 합니다.

```c
$ cdk init app --language typescript

$ cdk bootstrap aws://123456789012/ap-northeast-2
```
여기서 '123456789012'은 Account Number를 의미합니다.


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

이 경우에 버전을 2.23.0으로 변경후에 설치 가능합니다. 

## Reference
[AWS Solutions Library](https://aws.amazon.com/solutions/)

[AWS Solutions Constructs](https://docs.aws.amazon.com/solutions/latest/constructs/welcome.html)

[aws-cloudfront-apigateway](https://docs.aws.amazon.com/solutions/latest/constructs/aws-cloudfront-apigateway.html)

