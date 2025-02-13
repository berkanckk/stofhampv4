import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

// E-posta gönderici yapılandırması
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD
  },
  tls: {
    rejectUnauthorized: false
  }
});

// Test email connection
transporter.verify(function (error, success) {
  if (error) {
    console.log("SMTP Bağlantı hatası:", error);
  } else {
    console.log("SMTP Bağlantısı başarılı!");
  }
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, subject, message } = body;

    console.log('Form verileri:', { name, email, subject, message });

    // Form validasyonu
    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { success: false, message: 'Tüm alanları doldurunuz' },
        { status: 400 }
      );
    }

    // E-posta gönderme
    const mailOptions = {
      from: {
        name: name,
        address: process.env.EMAIL_USER as string
      },
      to: process.env.EMAIL_USER,
      subject: `İletişim Formu: ${subject}`,
      html: `
        <h3>Yeni İletişim Formu Mesajı</h3>
        <p><strong>Gönderen:</strong> ${name}</p>
        <p><strong>E-posta:</strong> ${email}</p>
        <p><strong>Konu:</strong> ${subject}</p>
        <p><strong>Mesaj:</strong></p>
        <p>${message}</p>
      `
    };

    console.log('Mail gönderiliyor...');
    const info = await transporter.sendMail(mailOptions);
    console.log('Mail gönderildi:', info);

    return NextResponse.json({
      success: true,
      message: 'Mesajınız başarıyla gönderildi'
    });

  } catch (error) {
    console.error('Contact form error:', error);
    return NextResponse.json(
      { success: false, message: 'Mesaj gönderilirken bir hata oluştu' },
      { status: 500 }
    );
  }
} 