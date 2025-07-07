import * as cdk from 'aws-cdk-lib';

export default interface S3AppProps extends cdk.StackProps {
    client?: string
    project: string
    stage: string
}
