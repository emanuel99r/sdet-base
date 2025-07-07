import { Stack, Duration } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as sfn from 'aws-cdk-lib/aws-stepfunctions';
import * as tasks from 'aws-cdk-lib/aws-stepfunctions-tasks';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as iam from 'aws-cdk-lib/aws-iam';
import S3AppProps from '../../../interfaces/s3-app-props';

export class StepFunctionStack extends Stack {
  public readonly stateMachine: sfn.IStateMachine;

  constructor(scope: Construct, id: string, props: S3AppProps, snsTopic: sns.Topic) {
    super(scope, id, props);

    const stage = props.stage;
    const baseName = `${props.client}-${props.project}`;

    // IAM Role para Step Functions
    const sfnIngestionRole = new iam.Role(this, 'GlueStepRole', {
      assumedBy: new iam.ServicePrincipal('states.amazonaws.com'),
    });

    sfnIngestionRole.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSGlueServiceRole')
    );
    sfnIngestionRole.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonS3FullAccess')
    );
    sfnIngestionRole.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName('CloudWatchFullAccess')
    );
    sfnIngestionRole.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSNSFullAccess')
    );

    const smallJob = new tasks.GlueStartJobRun(this, 'Small CSV Ingestion Job', {
      glueJobName: `pandas-csv-to-parquet-job-${stage}`,
      arguments: sfn.TaskInput.fromObject({
        '--RAW_BUCKET': `${baseName}-raw-${stage}`,
        '--CSV_KEY': sfn.JsonPath.stringAt('$.detail.object.key'),
      }),
      integrationPattern: sfn.IntegrationPattern.RUN_JOB,
    });

    const largeJob = new tasks.GlueStartJobRun(this, 'Large CSV Ingestion Job', {
      glueJobName: `glue-etl-spark-job-${stage}`,
      arguments: sfn.TaskInput.fromObject({
        '--RAW_BUCKET': `${baseName}-raw-${stage}`,
        '--CSV_KEY': sfn.JsonPath.stringAt('$.detail.object.key'),
      }),
      integrationPattern: sfn.IntegrationPattern.RUN_JOB,
    });

    const transformJob = new tasks.GlueStartJobRun(this, 'Spark Transform Job', {
      glueJobName: `spark-transform-models-job-${stage}`,
      integrationPattern: sfn.IntegrationPattern.RUN_JOB,
    });

    const notifyError = new tasks.SnsPublish(this, 'Notify Error', {
      topic: snsTopic,
      message: sfn.TaskInput.fromText('Error al ejecutar el Glue Job en StepFunctions'),
      subject: 'Error en Step Function Glue Job',
    });

    smallJob.addCatch(notifyError);
    largeJob.addCatch(notifyError);
    transformJob.addCatch(notifyError);

    const smallChain = sfn.Chain.start(smallJob).next(transformJob);
    const largeChain = sfn.Chain.start(largeJob).next(transformJob);

    const definition = 
      new sfn.Choice(this, 'Is file < 500MB?')
        .when(sfn.Condition.numberLessThan('$.detail.object.size', 524288000), smallChain)
        .otherwise(largeChain);

    this.stateMachine = new sfn.StateMachine(this, 'IngestionStateMachine', {
      definitionBody: sfn.DefinitionBody.fromChainable(definition),
      timeout: Duration.minutes(30),
      stateMachineName: `${baseName}-ingestion-stepfn-${stage}`,
      role: sfnIngestionRole,
    });
  }
}
