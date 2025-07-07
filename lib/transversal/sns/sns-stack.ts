import { Stack} from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as sns_subs from 'aws-cdk-lib/aws-sns-subscriptions';
import S3AppProps from '../../../interfaces/s3-app-props';


export class SnsStack extends Stack {
  public readonly errorTopic: sns.Topic;

  constructor(scope: Construct, id: string, props: S3AppProps) {
    super(scope, id, props);

    const stage = props.stage;
    const baseName = `${props.client}-${props.project}`;

    this.errorTopic = new sns.Topic(this, `JobErrorTopic-${stage}`,{
      topicName: `${baseName}-error-topic-${stage}`,
      displayName: `Error Notifications for ${baseName} in ${stage}`,
    });
    this.errorTopic.addSubscription(new sns_subs.EmailSubscription('emanuel99.rivera@hotmail.com'));
    
  }
}