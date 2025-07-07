import { Duration, Stack } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import { IBucket } from 'aws-cdk-lib/aws-s3';
import S3AppProps from '../../../interfaces/s3-app-props';

interface ApiGatewayLambdaStackProps extends S3AppProps {
  stagingBucket: IBucket;
}

export class ApiGatewayLambdaStack extends Stack {
  constructor(scope: Construct, id: string, props: ApiGatewayLambdaStackProps) {
    super(scope, id, props);

    const stage = props.stage;
    const baseName = `${props.client}-${props.project}`;

    const lambdaRole = new iam.Role(this, 'AthenaLambdaRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonAthenaFullAccess'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonS3FullAccess'),
      ],
    });

    const athenaLambda = new lambda.Function(this, 'AthenaQueryLambda', {
      functionName: `${baseName}-apigateway-lambda-query-${stage}`,
      runtime: lambda.Runtime.PYTHON_3_9,
      code: lambda.Code.fromAsset('./scripts/lambda_scripts/apigateway-lambda/'),
      handler: 'handler.lambda_handler',
      environment: {
        ATHENA_DATABASE: `analytics_db_${stage}`,
        ATHENA_OUTPUT: `s3://${props.stagingBucket.bucketName}/athena-results/`,
      },
      role: lambdaRole,
      timeout: Duration.seconds(30),
    });

    const api = new apigateway.RestApi(this, 'AthenaRestApi', {
      restApiName: `${baseName}-api-${stage}`,
      deployOptions: {
        stageName: stage
      },
    });

    const clientsResource = api.root.addResource('clients');
    clientsResource.addMethod('GET', new apigateway.LambdaIntegration(athenaLambda));

    const ordersResource = api.root.addResource('orders')
    ordersResource.addMethod('GET', new apigateway.LambdaIntegration(athenaLambda));
    
    const orders_per_clientResource = api.root.addResource('orders_per_client')
    orders_per_clientResource.addMethod('GET', new apigateway.LambdaIntegration(athenaLambda));
    
    const orders_status_summaryResource = api.root.addResource('orders_status_summary')
    orders_status_summaryResource.addMethod('GET', new apigateway.LambdaIntegration(athenaLambda));
    
    const productsResource = api.root.addResource('products')
    productsResource.addMethod('GET', new apigateway.LambdaIntegration(athenaLambda));
    
    const sales_per_productResource = api.root.addResource('sales_per_product')
    sales_per_productResource.addMethod('GET', new apigateway.LambdaIntegration(athenaLambda));


  }
}
