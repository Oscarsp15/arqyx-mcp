import { z } from 'zod';
import { AwsServiceId, VpcId } from './ids.js';

export const AwsServiceKind = z.enum([
  'ec2',
  'lambda',
  'rds',
  's3',
  'alb',
  'apigateway',
  'dynamodb',
  'sqs',
  'sns',
  'cloudfront',
]);
export type AwsServiceKind = z.infer<typeof AwsServiceKind>;

export const AwsService = z.object({
  id: AwsServiceId,
  kind: AwsServiceKind,
  label: z.string().min(1).max(64),
  vpcId: VpcId.nullable(),
  position: z.object({ x: z.number(), y: z.number() }),
});
export type AwsService = z.infer<typeof AwsService>;

export const Vpc = z.object({
  id: VpcId,
  name: z.string().min(1).max(64),
  cidr: z.string().regex(/^\d{1,3}(\.\d{1,3}){3}\/\d{1,2}$/),
});
export type Vpc = z.infer<typeof Vpc>;

export const AwsConnectionProtocol = z.enum(['https', 'http', 'grpc', 'tcp', 'event']);
export type AwsConnectionProtocol = z.infer<typeof AwsConnectionProtocol>;

export const AwsConnection = z.object({
  from: AwsServiceId,
  to: AwsServiceId,
  protocol: AwsConnectionProtocol,
  isAsync: z.boolean(),
});
export type AwsConnection = z.infer<typeof AwsConnection>;
