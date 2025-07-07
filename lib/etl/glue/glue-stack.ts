import { Stack } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Role, ServicePrincipal, ManagedPolicy, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { IBucket } from 'aws-cdk-lib/aws-s3';
import { CfnJob } from 'aws-cdk-lib/aws-glue';
import { Database } from '@aws-cdk/aws-glue-alpha';

import S3AppProps from '../../../interfaces/s3-app-props';

export class GlueStack extends Stack {
  constructor(scope: Construct, id: string, props: S3AppProps & {
    rawBucket: IBucket;
    stagingBucket: IBucket;
    analyticsBucket: IBucket;
    dependenciesBucket: IBucket;
  }) {
    super(scope, id, props);

    new Database(this, 'StagingGlueDatabase', {
      databaseName: `staging_db_${props.stage}`,
    });

    new Database(this, 'AnalyticGlueDatabase', {
      databaseName: `analytics_db_${props.stage}`,
    });

    const glueRole = this.createGlueRole(
      props.rawBucket,
      props.stagingBucket,
      props.analyticsBucket,
      props.dependenciesBucket
    );

    this.createPythonShell(glueRole.roleArn, props);
    this.createSparkJob(glueRole.roleArn, props);
    this.createTransformSparkJob(glueRole.roleArn, props);
  }

  private createGlueRole(
    rawBucket: IBucket,
    stagingBucket: IBucket,
    analyticsBucket: IBucket,
    dependenciesBucket: IBucket
  ): Role {
    const glueRole = new Role(this, 'GlueExecutionRole', {
      assumedBy: new ServicePrincipal('glue.amazonaws.com'),
      managedPolicies: [
        ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSGlueServiceRole'),
      ],
    });

    glueRole.addToPolicy(
      new PolicyStatement({
        actions: ['s3:*'],
        resources: [
          rawBucket.bucketArn, `${rawBucket.bucketArn}/*`,
          stagingBucket.bucketArn, `${stagingBucket.bucketArn}/*`,
          analyticsBucket.bucketArn, `${analyticsBucket.bucketArn}/*`,
          dependenciesBucket.bucketArn, `${dependenciesBucket.bucketArn}/*`,
        ],
      })
    );

    return glueRole;
  }

  private createPythonShell(
    roleArn: string,
    props: S3AppProps & {
      rawBucket: IBucket;
      stagingBucket: IBucket;
      dependenciesBucket: IBucket;
    }
  ) {
    new CfnJob(this, 'PandasJob', {
      name: `pandas-csv-to-parquet-job-${props.stage}`,
      role: roleArn,
      command: {
        name: 'pythonshell',
        pythonVersion: '3.9',
        scriptLocation: `s3://${props.dependenciesBucket.bucketName}/glue_scripts/small_csv_ingestion.py`,
      },
      defaultArguments: {
        '--RAW_BUCKET': props.rawBucket.bucketName,
        '--STAGING_BUCKET': props.stagingBucket.bucketName,
        '--CSV_KEY': 'orders_lite.csv',
        '--GLUE_DATABASE': `staging_db_${props.stage}`,
        '--GLUE_TABLE_NAME': 'orders',
      },
      maxCapacity: 1.0,
      timeout: 10,
    });
  }

  private createSparkJob(
    roleArn: string,
    props: S3AppProps & {
      rawBucket: IBucket;
      stagingBucket: IBucket;
      dependenciesBucket: IBucket;
    }
  ) {
    new CfnJob(this, 'SparkJob', {
      name: `glue-etl-spark-job-${props.stage}`,
      role: roleArn,
      command: {
        name: 'glueetl',
        pythonVersion: '3',
        scriptLocation: `s3://${props.dependenciesBucket.bucketName}/glue_scripts/large_csv_ingestion.py`,
      },
      defaultArguments: {
        '--RAW_BUCKET': props.rawBucket.bucketName,
        '--STAGING_BUCKET': props.stagingBucket.bucketName,
        '--CSV_KEY': 'orders_heavy.csv',
        '--GLUE_DATABASE': `staging_db_${props.stage}`,
        '--GLUE_TABLE_NAME': 'orders',
        '--enable-glue-datacatalog': 'true',
      },
      glueVersion: '4.0',
      numberOfWorkers: 2,
      workerType: 'G.1X',
      timeout: 15,
    });
  }

  private createTransformSparkJob(
    roleArn: string,
    props: S3AppProps & {
      stagingBucket: IBucket;
      analyticsBucket: IBucket;
      dependenciesBucket: IBucket;
    }
  ) {
    new CfnJob(this, 'SparkTransformJob', {
      name: `spark-transform-models-job-${props.stage}`,
      role: roleArn,
      command: {
        name: 'glueetl',
        pythonVersion: '3',
        scriptLocation: `s3://${props.dependenciesBucket.bucketName}/glue_scripts/transform.py`,
      },
      defaultArguments: {
        '--STAGING_BUCKET': props.stagingBucket.bucketName,
        '--ANALYTICS_BUCKET': props.analyticsBucket.bucketName,
        '--GLUE_DATABASE': `analytics_db_${props.stage}`,
        '--enable-glue-datacatalog': 'true',
      },
      glueVersion: '4.0',
      numberOfWorkers: 2,
      workerType: 'G.1X',
      timeout: 15,
    });
  }
}