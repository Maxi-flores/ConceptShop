import { S3Client } from '@aws-sdk/client-s3'
import { LambdaClient } from '@aws-sdk/client-lambda'

const awsConfig = {
  region: import.meta.env.VITE_AWS_REGION || 'eu-central-1',
  credentials: {
    accessKeyId: import.meta.env.VITE_AWS_ACCESS_KEY_ID,
    secretAccessKey: import.meta.env.VITE_AWS_SECRET_ACCESS_KEY
  }
}

// S3 Client for asset storage
export const s3Client = new S3Client(awsConfig)

// Lambda Client for serverless functions
export const lambdaClient = new LambdaClient(awsConfig)

// S3 Bucket name
export const S3_BUCKET = import.meta.env.VITE_AWS_S3_BUCKET

// Lambda endpoint for forecasting
export const LAMBDA_ENDPOINT = import.meta.env.VITE_AWS_LAMBDA_ENDPOINT

export default awsConfig
