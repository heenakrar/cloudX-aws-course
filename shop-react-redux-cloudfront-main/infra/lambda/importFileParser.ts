import {
  S3Client,
  GetObjectCommand,
  CopyObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";
import csv from "csv-parser";

const s3 = new S3Client({});
const sqs = new SQSClient({});

export const handler = async (event: any) => {
  for (const record of event.Records) {
    const bucket = record.s3.bucket.name;
    const key = record.s3.object.key;
    const targetKey = key.replace("uploaded/", "parsed/");

    console.log(`Processing file: ${key} from bucket: ${bucket}`);

    const s3Response = await s3.send(
      new GetObjectCommand({ Bucket: bucket, Key: key }),
    );

    const stream = s3Response.Body as any;
    const processingPromises: Promise<any>[] = [];

    try {
      await new Promise((resolve, reject) => {
        stream
          .pipe(csv({ separator: ",", strict: true }))
          .on("data", (data: any) => {
            console.log("CSV Record:", JSON.stringify(data));

            const sendSqsPromise = sqs.send(
              new SendMessageCommand({
                QueueUrl: process.env.CATALOG_ITEMS_QUEUE_URL,
                MessageBody: JSON.stringify(data),
              }),
            );

            processingPromises.push(sendSqsPromise);
          })
          .on("end", async () => {
            try {
              await Promise.all(processingPromises);
              console.log(
                "Finished processing CSV and forwarding messages to SQS.",
              );
              resolve(null);
            } catch (err) {
              reject(err);
            }
          })
          .on("error", (error: any) => {
            reject(error);
          });
      });

      console.log(`Copying to ${targetKey}`);
      await s3.send(
        new CopyObjectCommand({
          Bucket: bucket,
          CopySource: `${bucket}/${key}`,
          Key: targetKey,
        }),
      );

      console.log(`Deleting from ${key}`);
      await s3.send(
        new DeleteObjectCommand({
          Bucket: bucket,
          Key: key,
        }),
      );
    } catch (pipelineError) {
      console.error(
        "CRITICAL: Pipeline processing failed. S3 file preservation maintained.",
        pipelineError,
      );
      throw pipelineError;
    }
  }
};
