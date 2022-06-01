## Bucket으로 파일 복사

- 아래와 같이 S3 bucket을 생성합니다. 

```java
    // create S3
    const s3Bucket = new s3.Bucket(this, "s3-bucket-for-web-application",{
      bucketName: "storage-web-application",
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      publicReadAccess: false,
      versioned: false,
    });
```

- s3 bucket으로 파일을 복사합니다. 

```java
    // copy web application files into s3 bucket
    new s3Deploy.BucketDeployment(this, "DeployWebApplication", {
      sources: [s3Deploy.Source.asset("../webapplication")],
      destinationBucket: s3Bucket,
    });
```    

## Role definition

아래는 S3와 log permission을 주기 위해 만든 Role 입니다. 

```java
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
```    
   
   Lambda에서는 아래처럼 간단히도 표현 할 수 있습니다.
   
   ```java
   s3Bucket.grantReadWrite(lambdaBasic);
   ```
   
   여기서 사용한 Lambda는 dummy여서 permission이 필요하지 않습니다. 상기는 Role 관련 sample 입니다.
