import { Stack, StackProps, Duration } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as sfn from 'aws-cdk-lib/aws-stepfunctions';

interface EventBridgeStackProps extends StackProps {
  bucket: s3.IBucket;
  sfnTarget: sfn.IStateMachine;
}

export class EventBridgeStack extends Stack {
  constructor(scope: Construct, id: string, props: EventBridgeStackProps) {
    super(scope, id, props);

    const rule = new events.Rule(this, 'CsvUploadRule', {
      ruleName: `${props.bucket.bucketName}-csv-upload-rule`,
      eventPattern: {
        source: ['aws.s3'],
        detailType: ['Object Created'],
        detail: {
          bucket: {
            name: [props.bucket.bucketName]
          },
          object: {
            key: [{ suffix: '.csv' }]
          }
        }
      },
      description: 'Detect CSV uploads to S3 and trigger Lambda',
      enabled: true,
    });

    rule.addTarget(new targets.SfnStateMachine(props.sfnTarget));
  }
}
