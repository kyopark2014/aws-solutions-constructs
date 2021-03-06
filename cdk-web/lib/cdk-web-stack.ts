import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as cloudFront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as s3Deploy from "aws-cdk-lib/aws-s3-deployment"
import * as apiGateway from 'aws-cdk-lib/aws-apigateway';

import { CloudFrontToApiGateway } from '@aws-solutions-constructs/aws-cloudfront-apigateway';

export class CdkWebStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // create S3
    const s3Bucket = new s3.Bucket(this, "s3-bucket-for-web-application",{
      bucketName: "storage-web-application",
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      publicReadAccess: false,
      versioned: false,
    });
    new cdk.CfnOutput(this, 'bucketName', {
      value: s3Bucket.bucketName,
      description: 'The nmae of bucket',
    });
    new cdk.CfnOutput(this, 's3Arn', {
      value: s3Bucket.bucketArn,
      description: 'The arn of s3',
    });
    new cdk.CfnOutput(this, 's3Path', {
      value: 's3://'+s3Bucket.bucketName,
      description: 'The path of s3',
    });

    // copy web application files into s3 bucket
    new s3Deploy.BucketDeployment(this, "DeployWebApplication", {
      sources: [s3Deploy.Source.asset("../webapplication")],
      destinationBucket: s3Bucket,
    });

    // lambda role 
    const lambdaRole = new iam.Role(this, "lambdaRole", {
      roleName: 'lambdaRole',
      assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
      description: "Lambda Role",
    });
    lambdaRole.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        "s3:GetBucketLocation",
        "s3:GetObject",
        "s3:GetBucketLocation",
        "s3:ListBucket",
        "s3:ListBucketMultipartUploads",
        "s3:ListMultipartUploadParts",
        "s3:AbortMultipartUpload",
        "s3:CreateBucket",
        "s3:PutObject",
        "s3:PutBucketPublicAccessBlock"
      ],
      resources: [
        s3Bucket.bucketArn,
        s3Bucket.bucketArn + "/*"
      ],
    }));
    lambdaRole.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      resources: [
        `arn:aws:logs:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:*`
      ],
    }));
    new cdk.CfnOutput(this, 'lambdaRoleArn', {
      value: lambdaRole.roleArn,
      description: 'The arn of lambdaRole',
    });

    // lambda function
    const lambdaBasic = new lambda.Function(this, "lambdaBasic", {
      description: 'Basic Lambda Function',
      runtime: lambda.Runtime.NODEJS_14_X, 
      code: lambda.Code.fromAsset("../basic-lambda-function"), 
      role: lambdaRole,
      handler: "index.handler", 
      timeout: cdk.Duration.seconds(3),
      environment: {
      }
    }); 
    new cdk.CfnOutput(this, 'lambdaBasicARN', {
      value: lambdaBasic.functionArn,
      description: 'The arn of basic lambda',
    });
  
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
      
      cloudFrontDistributionProps: {    // not working
        origin: new origins.S3Origin(s3Bucket),
        behaviors: [{ isDefaultBehavior: true }] 
      } 
    }); 

    // the API URL based on cloudfront
    new cdk.CfnOutput(this, 'cloudfrontApiURL', {
      value: `https://${cloudfront.cloudFrontWebDistribution.distributionDomainName}/${mathodName}`, 
      description: 'The url of cloudfront',
    }); 
  }
}
