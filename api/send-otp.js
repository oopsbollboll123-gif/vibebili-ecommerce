const nodemailer = require('nodemailer');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const { email, otp } = req.body || {};
  if (!email || !otp) {
    return res.status(400).json({ success: false, message: 'Thiếu email hoặc mã OTP!' });
  }

  const gmailUser = process.env.GMAIL_USER || 'oopsbollboll123@gmail.com';
  const gmailPass = process.env.GMAIL_APP_PASSWORD || '';

  if (!gmailPass) {
    return res.status(500).json({
      success: false,
      message: 'Máy chủ chưa cấu hình GMAIL_APP_PASSWORD để gửi email OTP.'
    });
  }

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: gmailUser,
        pass: gmailPass
      }
    });

    await transporter.sendMail({
      from: `"VibeBili.vn" <${gmailUser}>`,
      to: email.trim().toLowerCase(),
      subject: '🔐 Mã OTP Khôi Phục Mật Khẩu VibeBili.vn',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; background: #fff; border-radius: 12px; overflow: hidden; border: 1px solid #e5e7eb;">
          <div style="background: #1a1a2e; padding: 24px; text-align: center;">
            <h1 style="color: #fff; margin: 0; font-size: 24px; font-weight: 900; letter-spacing: -0.5px;">
              VIBE<span style="color: #ff7c2a;">BILI</span><span style="color: #666; font-size: 16px;">.vn</span>
            </h1>
          </div>
          <div style="padding: 32px; text-align: center;">
            <h2 style="color: #1a1a2e; font-size: 20px; margin-bottom: 8px;">Khôi Phục Mật Khẩu</h2>
            <p style="color: #6b7280; font-size: 14px; margin-bottom: 24px;">
              Bạn đã yêu cầu đặt lại mật khẩu. Vui lòng sử dụng mã OTP bên dưới.
            </p>
            <div style="background: #f9fafb; border: 2px dashed #ff7c2a; border-radius: 12px; padding: 20px; margin-bottom: 24px; display: inline-block;">
              <p style="color: #6b7280; font-size: 12px; margin: 0 0 8px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Mã OTP của bạn</p>
              <div style="font-size: 36px; font-weight: 900; letter-spacing: 8px; color: #1a1a2e; font-family: monospace;">${otp}</div>
            </div>
            <p style="color: #ef4444; font-size: 13px; font-weight: 600; margin-bottom: 16px;">
              ⏰ Mã có hiệu lực trong <strong>10 phút</strong>
            </p>
            <p style="color: #9ca3af; font-size: 12px; line-height: 1.6;">
              Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email này.<br>
              Mật khẩu của bạn sẽ <strong>không thay đổi</strong> cho đến khi bạn nhập mã OTP.
            </p>
          </div>
          <div style="background: #f9fafb; padding: 16px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="color: #9ca3af; font-size: 11px; margin: 0;">
              © 2026 VibeBili.vn — Bảo mật SSL 256-bit. Email tự động, vui lòng không reply.
            </p>
          </div>
        </div>
      `
    });

    return res.status(200).json({
      success: true,
      message: `Mã OTP đã được gửi đến ${email}. Vui lòng kiểm tra hộp thư (và thư mục spam).`
    });
  } catch (err) {
    console.error('[Vercel Send OTP Error]:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Không thể gửi email OTP: ' + err.message
    });
  }
};
