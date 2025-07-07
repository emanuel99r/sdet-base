#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { BucketsStack } from '../lib/transversal/s3/bucket-stack';
import { EventBridgeStack } from '../lib/transversal/eventbridge/eventbridge-stack';
import { GlueStack } from '../lib/etl/glue/glue-stack';
import { BASE_PROPS } from '../bin/variables/base-props';
import { CONSTANTS } from '../bin/variables/constants';
import { SnsStack } from '../lib/transversal/sns/sns-stack';
import { StepFunctionStack } from '../lib/etl/stepfunction/stepfunction-stack';
import { ApiGatewayLambdaStack } from '../lib/etl/apigateway-lambda/apigateway-lambda';

const app = new cdk.App();

// CREACIÓN DE BUCKETS
const BucketsStackDEV = new BucketsStack(app, "BucketsStackDEV", BASE_PROPS.devProps);
const BucketsStackQA = new BucketsStack(app, "BucketsStackQA", BASE_PROPS.qaProps);
const BucketsStackPRD = new BucketsStack(app, "BucketsStackPRD", BASE_PROPS.prdProps);

// CREACIÓN DE STACKS PARA DEV
const GlueStackDEV = new GlueStack(app, 'GlueStackDEV', {
  ...BASE_PROPS.devProps,
  rawBucket: BucketsStackDEV.bucketRaw,
  stagingBucket: BucketsStackDEV.bucketStaging,
  dependenciesBucket: BucketsStackDEV.bucketDependencies,
  analyticsBucket: BucketsStackDEV.bucketAnalytics
});

const SnsStackDEV = new SnsStack(app, 'SnsStackDEV', BASE_PROPS.devProps);

const StepFunctionStackDEV = new StepFunctionStack(app, 'StepFunctionStackDEV',
  BASE_PROPS.devProps, SnsStackDEV.errorTopic);

const EventBridgeStackDev = new EventBridgeStack(app, "EventBridgeStackDEV", {
  bucket: BucketsStackDEV.bucketRaw,
  sfnTarget: StepFunctionStackDEV.stateMachine
});

const ApiGatewayLambdaStackDev = new ApiGatewayLambdaStack(app, "ApiGatewayLambdaStackDEV", {
  ...BASE_PROPS.devProps,
  stagingBucket: BucketsStackDEV.bucketStaging
});

// CREACIÓN DE STACKS PARA QA
const GlueStackQA = new GlueStack(app, 'GlueStackQA', {
  ...BASE_PROPS.qaProps,
  rawBucket: BucketsStackQA.bucketRaw,
  stagingBucket: BucketsStackQA.bucketStaging,
  dependenciesBucket: BucketsStackQA.bucketDependencies,
  analyticsBucket: BucketsStackQA.bucketAnalytics
});

const SnsStackQA = new SnsStack(app, 'SnsStackQA', BASE_PROPS.qaProps);

const StepFunctionStackQA = new StepFunctionStack(app, 'StepFunctionStackQA',
  BASE_PROPS.qaProps, SnsStackQA.errorTopic);

const EventBridgeStackQA = new EventBridgeStack(app, "EventBridgeStackQA", {
  bucket: BucketsStackQA.bucketRaw,
  sfnTarget: StepFunctionStackQA.stateMachine
});

const ApiGatewayLambdaStackQA = new ApiGatewayLambdaStack(app, "ApiGatewayLambdaStackQA", {
  ...BASE_PROPS.qaProps,
  stagingBucket: BucketsStackQA.bucketStaging
});

// CREACIÓN DE STACKS PARA PRD
const GlueStackPRD = new GlueStack(app, 'GlueStackPRD', {
  ...BASE_PROPS.prdProps,
  rawBucket: BucketsStackPRD.bucketRaw,
  stagingBucket: BucketsStackPRD.bucketStaging,
  dependenciesBucket: BucketsStackPRD.bucketDependencies,
  analyticsBucket: BucketsStackPRD.bucketAnalytics
});

const SnsStackPRD = new SnsStack(app, 'SnsStackPRD', BASE_PROPS.prdProps);

const StepFunctionStackPRD = new StepFunctionStack(app, 'StepFunctionStackPRD',
  BASE_PROPS.prdProps, SnsStackPRD.errorTopic);

const EventBridgeStackPRD = new EventBridgeStack(app, "EventBridgeStackPRD", {
  bucket: BucketsStackPRD.bucketRaw,
  sfnTarget: StepFunctionStackPRD.stateMachine
});

const ApiGatewayLambdaStackPRD = new ApiGatewayLambdaStack(app, "ApiGatewayLambdaStackPRD", {
  ...BASE_PROPS.prdProps,
  stagingBucket: BucketsStackPRD.bucketStaging
});

// TAGS PARA DEV
cdk.Tags.of(BucketsStackDEV).add("Enviroment", "dev");
cdk.Tags.of(GlueStackDEV).add("Enviroment", "dev");
cdk.Tags.of(SnsStackDEV).add("Enviroment", "dev");
cdk.Tags.of(StepFunctionStackDEV).add("Enviroment", "dev");
cdk.Tags.of(EventBridgeStackDev).add("Enviroment", "dev");
cdk.Tags.of(ApiGatewayLambdaStackDev).add("Enviroment", "dev");

// TAGS PARA QA
cdk.Tags.of(BucketsStackQA).add("Enviroment", "qa");
cdk.Tags.of(GlueStackQA).add("Enviroment", "qa");
cdk.Tags.of(SnsStackQA).add("Enviroment", "qa");
cdk.Tags.of(StepFunctionStackQA).add("Enviroment", "qa");
cdk.Tags.of(EventBridgeStackQA).add("Enviroment", "qa");
cdk.Tags.of(ApiGatewayLambdaStackQA).add("Enviroment", "qa");

// TAGS PARA PRD
cdk.Tags.of(BucketsStackPRD).add("Enviroment", "prd");
cdk.Tags.of(GlueStackPRD).add("Enviroment", "prd");
cdk.Tags.of(SnsStackPRD).add("Enviroment", "prd");
cdk.Tags.of(StepFunctionStackPRD).add("Enviroment", "prd");
cdk.Tags.of(EventBridgeStackPRD).add("Enviroment", "prd");
cdk.Tags.of(ApiGatewayLambdaStackPRD).add("Enviroment", "prd");

// TAGS GENERALES
cdk.Tags.of(app).add("Project", CONSTANTS.PROJECT);
cdk.Tags.of(app).add("Client", CONSTANTS.CLIENT);
cdk.Tags.of(app).add("Author", "erivera");
