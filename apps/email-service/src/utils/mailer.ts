import { Resend } from "resend";

const sendMail = async ({
  email,
  subject,
  text,
}: {
  email: string;
  subject: string;
  text: string;
}) => {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is required to send email");
  }

  if (!process.env.RESEND_FROM_EMAIL) {
    throw new Error("RESEND_FROM_EMAIL is required to send email");
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const { data, error } = await resend.emails.send({
    from: `Spacefly.ai <${process.env.RESEND_FROM_EMAIL}>`,
    to: email,
    subject,
    text,
  });

  if (error) {
    throw new Error(`Failed to send email: ${error.message}`);
  }

  console.log("MESSAGE SENT:", data);
};

export default sendMail;
