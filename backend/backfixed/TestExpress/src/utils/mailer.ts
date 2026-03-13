export const sendMail = async (to: string, subject: string, text: string) => {
  if (process.env.MAIL_ENABLED !== 'true') {
    console.log('📧 MAIL_DISABLED');
    console.log({ to, subject, text });
    return;
  }

  console.log('📧 sendMail placeholder');
  console.log({ to, subject, text });
};