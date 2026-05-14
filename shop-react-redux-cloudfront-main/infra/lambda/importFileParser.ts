import {
  S3Client,
  GetObjectCommand,
  CopyObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import csv from "csv-parser";

const s3 = new S3Client({});

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

    await new Promise((resolve, reject) => {
      stream
        .pipe(csv())
        .on("data", (data: any) => {
          console.log("CSV Record:", JSON.stringify(data));
        })
        .on("end", () => {
          console.log("Finished processing CSV.");
          resolve(null);
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
  }
};
