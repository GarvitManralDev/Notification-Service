import { Job, Worker } from "bullmq";
import { MAILER_QUEUE } from "../queues/mailer.queue";
import { getRedisConnObject } from "../config/redis.config";
import { NotificationDto } from "../dto/notification.dto";
import { MAILER_PAYLOAD } from "../producers/email.producer";
import { renderMailTemplate } from "../templates/templates.handler";
import { sendEmail } from "../services/mailer.service";

export const setupMailerWorker = () => {
  const emailProcessor = new Worker<NotificationDto>(
    MAILER_QUEUE, //Name of queue
    async (job: Job) => {
      if (job.name !== MAILER_PAYLOAD) {
        throw new Error("Invalid job name");
      }

      //call the service layer from here
      const payload = job.data;
      console.log(`Processing email for:${JSON.stringify(payload)}`);
      const emailContent = await renderMailTemplate(
        payload.templateId,
        payload.params
      );
      await sendEmail(payload.to, payload.subject, emailContent);
    }, //Process function
    {
      connection: getRedisConnObject(),
    }
  );

  emailProcessor.on("failed", () => {
    console.error("Email processing failed");
  });

  emailProcessor.on("completed", () => {
    console.log("Email processing completed successfully");
  });
};
