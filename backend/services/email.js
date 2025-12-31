const nodemailer = require('nodemailer');

/**
 * Send email notification for new order
 * Uses free SMTP services (Gmail, Outlook, etc.)
 */
async function sendEmailNotification(order) {
  const adminEmail = process.env.ADMIN_EMAIL;
  const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
  const smtpPort = process.env.SMTP_PORT || 587;
  const smtpUser = process.env.SMTP_USER || adminEmail;
  const smtpPass = process.env.SMTP_PASSWORD;

  if (!adminEmail) {
    console.log('No admin email provided, skipping email notification');
    return { success: false, message: 'No admin email configured' };
  }

  // Format order details
  const orderDetails = order.items.map(item => {
    const menuItem = item.menuItem;
    return `  • ${menuItem.name} x${item.quantity} - ₹${item.price * item.quantity}`;
  }).join('\n');

  const emailSubject = `🍽️ New Order - ChefGPT - Order #${order._id.toString().slice(-6)}`;
  
  const emailBody = `
New Order Received!

Order ID: ${order._id}
Customer Name: ${order.customerName}
Phone: ${order.customerPhone}
${order.customerEmail ? `Email: ${order.customerEmail}` : ''}
Order Type: ${order.orderType === 'take-away' ? 'Take Away' : 'Dine In'}

Items:
${orderDetails}

Total Amount: ₹${order.totalAmount}
Order Time: ${new Date(order.createdAt).toLocaleString('en-IN', { 
  timeZone: 'Asia/Kolkata',
  dateStyle: 'full',
  timeStyle: 'medium'
})}

---
ChefGPT Restaurant
  `.trim();

  try {
    // Create transporter - if SMTP credentials are provided
    if (smtpUser && smtpPass) {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465, // true for 465, false for other ports
        auth: {
          user: smtpUser,
          pass: smtpPass
        }
      });

      // Send email
      const info = await transporter.sendMail({
        from: `"ChefGPT" <${smtpUser}>`,
        to: adminEmail,
        subject: emailSubject,
        text: emailBody,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #ff6b35;">🍽️ New Order Received!</h2>
            <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Order ID:</strong> ${order._id}</p>
              <p><strong>Customer Name:</strong> ${order.customerName}</p>
              <p><strong>Phone:</strong> ${order.customerPhone}</p>
              ${order.customerEmail ? `<p><strong>Email:</strong> ${order.customerEmail}</p>` : ''}
              <p><strong>Order Type:</strong> ${order.orderType === 'take-away' ? 'Take Away' : 'Dine In'}</p>
            </div>
            <div style="margin: 20px 0;">
              <h3>Items:</h3>
              <ul>
                ${order.items.map(item => {
                  const menuItem = item.menuItem;
                  return `<li>${menuItem.name} x${item.quantity} - ₹${item.price * item.quantity}</li>`;
                }).join('')}
              </ul>
            </div>
            <div style="background: #fff5f0; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="font-size: 18px; font-weight: bold; color: #ff6b35;">
                Total Amount: ₹${order.totalAmount}
              </p>
              <p>Order Time: ${new Date(order.createdAt).toLocaleString('en-IN', { 
                timeZone: 'Asia/Kolkata',
                dateStyle: 'full',
                timeStyle: 'medium'
              })}</p>
            </div>
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
            <p style="color: #666; font-size: 12px;">
              ChefGPT Restaurant<br>
              AI-Powered Restaurant
            </p>
          </div>
        `
      });

      console.log('Email sent successfully:', info.messageId);
      return { success: true, message: 'Email sent successfully', messageId: info.messageId };
    } else {
      // If no SMTP credentials, just log the email (for development)
      console.log('\n=== EMAIL NOTIFICATION ===');
      console.log('To:', adminEmail);
      console.log('Subject:', emailSubject);
      console.log('Body:', emailBody);
      console.log('========================\n');
      console.log('Note: Configure SMTP credentials in .env to send actual emails');
      console.log('Add these to your .env file:');
      console.log('SMTP_HOST=smtp.gmail.com');
      console.log('SMTP_PORT=587');
      console.log('SMTP_USER=your-email@gmail.com');
      console.log('SMTP_PASSWORD=your-app-password');
      return { success: true, message: 'Email logged (SMTP not configured)' };
    }
  } catch (error) {
    console.error('Email notification error:', error);
    // Log the email content even if sending fails
    console.log('\n=== EMAIL NOTIFICATION (Failed to send) ===');
    console.log('To:', adminEmail);
    console.log('Subject:', emailSubject);
    console.log('Body:', emailBody);
    console.log('==========================================\n');
    return { success: false, message: 'Failed to send email', error: error.message };
  }
}

module.exports = { sendEmailNotification };

