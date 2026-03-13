import nodemailer from 'nodemailer';

const isMailConfigured = () => {
  return Boolean(
    process.env.SMTP_HOST &&
      process.env.SMTP_PORT &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS
  );
};

const getTransporter = () =>
  nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 465),
    secure: String(process.env.SMTP_SECURE || 'true') === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

export const sendResetPasswordEmail = async (
  to: string,
  resetLink: string
) => {
  if (!isMailConfigured()) {
    console.warn('SMTP is not configured. Reset password email was skipped.');
    return;
  }

  await getTransporter().sendMail({
    from: process.env.SMTP_USER,
    to,
    subject: 'Восстановление пароля',
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>Восстановление пароля</h2>
        <p>Вы запросили восстановление пароля.</p>
        <p>Перейдите по ссылке ниже, чтобы задать новый пароль:</p>
        <p>
          <a href="${resetLink}" target="_blank">${resetLink}</a>
        </p>
        <p>Если вы не запрашивали восстановление, просто проигнорируйте это письмо.</p>
      </div>
    `,
  });
};

/**
 * Совместимо с двумя вариантами:
 * 1) sendFamilyInviteEmail(email, token)
 * 2) sendFamilyInviteEmail(email, familyName, inviterName, inviteLink)
 */
export const sendFamilyInviteEmail = async (
  to: string,
  arg2: string,
  arg3?: string,
  arg4?: string
) => {
  // Старый вариант: (email, token)
  if (!arg3) {
    const token = arg2;
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const inviteLink = `${frontendUrl}/family/invite?token=${token}`;

    if (!isMailConfigured()) {
      console.warn('SMTP is not configured. Family invite email was skipped.');
      return;
    }

    await getTransporter().sendMail({
      from: process.env.SMTP_USER,
      to,
      subject: 'Приглашение в семью',
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
          <h2>Приглашение в семью</h2>
          <p>Вас пригласили присоединиться к семье.</p>
          <p>Перейдите по ссылке ниже:</p>
          <p>
            <a href="${inviteLink}" target="_blank">${inviteLink}</a>
          </p>
          <p>Если вы не ожидали это письмо, просто проигнорируйте его.</p>
        </div>
      `,
    });

    return;
  }

  // Новый вариант: (email, familyName, inviterName, inviteLink?)
  const familyName = arg2;
  const inviterName = arg3;
  const inviteLink = arg4;

  if (!isMailConfigured()) {
    console.warn('SMTP is not configured. Family invite email was skipped.');
    return;
  }

  await getTransporter().sendMail({
    from: process.env.SMTP_USER,
    to,
    subject: `Приглашение в семью "${familyName}"`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>Приглашение в семью</h2>
        <p><strong>${inviterName}</strong> пригласил(а) вас присоединиться к семье <strong>${familyName}</strong>.</p>
        ${
          inviteLink
            ? `<p>Перейдите по ссылке ниже:</p>
               <p><a href="${inviteLink}" target="_blank">${inviteLink}</a></p>`
            : ''
        }
        <p>Если вы не ожидали это письмо, просто проигнорируйте его.</p>
      </div>
    `,
  });
};