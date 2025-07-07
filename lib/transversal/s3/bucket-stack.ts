import { Construct } from "constructs";
import { App, RemovalPolicy, CfnOutput, Stack } from "aws-cdk-lib";
import {
  Bucket,
  BlockPublicAccess,
  IBucket,
  ObjectOwnership,
} from "aws-cdk-lib/aws-s3";
import S3AppProps from "../../../interfaces/s3-app-props";
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as athena from 'aws-cdk-lib/aws-athena';

export class BucketsStack extends Stack {
  public readonly bucketRaw: IBucket;
  public readonly bucketDependencies: IBucket;
  public readonly bucketStaging: IBucket;
  public readonly bucketAnalytics: IBucket;

  constructor(scope: Construct, id: string, props: S3AppProps) {
    super(scope, id, props);

    const baseName = `${props.client}-${props.project}`;
    const stage = props.stage;

    this.bucketRaw = new Bucket(this, `bucket-raw-${stage}`, {
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      objectOwnership: ObjectOwnership.BUCKET_OWNER_ENFORCED,
      bucketName: `${baseName}-raw-${stage}`,
      versioned: true,
      enforceSSL: true,
      removalPolicy: RemovalPolicy.RETAIN,
      eventBridgeEnabled: true,
    });

    this.bucketDependencies = this.createBucket(`bucket-dependencies-${stage}`, `${baseName}-dependencies-${stage}`);
    this.bucketStaging = this.createBucket(`bucket-staging-${stage}`, `${baseName}-staging-${stage}`);
    this.bucketAnalytics = this.createBucket(`bucket-analytics-${stage}`, `${baseName}-analytics-${stage}`);

    new s3deploy.BucketDeployment(this, `bucket-dependencies-${stage}-artifacts_deployment`, {
      sources: [s3deploy.Source.asset('./scripts/glue_scripts/')],
      destinationBucket: this.bucketDependencies,
      destinationKeyPrefix: 'glue_scripts'
    });

    new s3deploy.BucketDeployment(this, `athena-results-prefix-${stage}`, {
      sources: [s3deploy.Source.data('.keep', '')],
      destinationBucket: this.bucketStaging,
      destinationKeyPrefix: 'athena-results/',
    });    

    new athena.CfnWorkGroup(this, `AthenaWorkgroup-${stage}`, {
      name: `athena-workgroup-${stage}`,
      state: "ENABLED",
      workGroupConfiguration: {
        resultConfiguration: {
          outputLocation: `s3://${this.bucketStaging.bucketName}/athena-results/`
        },
        enforceWorkGroupConfiguration: true,
        publishCloudWatchMetricsEnabled: true
      }
    });

    new CfnOutput(this, 'BucketRawName', { value: this.bucketRaw.bucketName });
    new CfnOutput(this, 'BucketDependenciesName', { value: this.bucketDependencies.bucketName });
    new CfnOutput(this, 'BucketStagingName', { value: this.bucketStaging.bucketName });
    new CfnOutput(this, 'BucketAnalyticsName', { value: this.bucketAnalytics.bucketName });
  }

  private createBucket(logicalId: string, bucketName: string): IBucket {
    return new Bucket(this, logicalId, {
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      objectOwnership: ObjectOwnership.BUCKET_OWNER_ENFORCED,
      bucketName,
      versioned: true,
      enforceSSL: true,
      removalPolicy: RemovalPolicy.RETAIN,
    });
  }
}
