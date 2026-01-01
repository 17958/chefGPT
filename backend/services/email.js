// ============================================
// EMAIL SERVICE - Sends email notifications for new orders
// ============================================
// This file handles sending emails when a new order is placed

const nodemailer = require('nodemailer'); // Library to send emails

/**
 * Send email notification for new order
 * Uses free SMTP services (Gmail, Outlook, etc.)
 * 
 * @param {object} order - The order object with all order details
 * @returns {object} - { success: true/false, message: '...' }
 * 
 * How it works:
 * 1. Gets admin email and SMTP settings from .env file
 * 2. Formats order details into a nice email message
 * 3. Sends email using SMTP (if configured) or just logs it
 */
async function sendEmailNotification(order) {
  // Step 1: Get email settings from environment variables
  // These are stored in .env file
  const adminEmail = process.env.ADMIN_EMAIL; // Where to send the email (restaurant owner's email)
  const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com'; // Email server address
  const smtpPort = process.env.SMTP_PORT || 587; // Port number (587 for Gmail)
  const smtpUser = process.env.SMTP_USER || adminEmail; // Email account to send from
  const smtpPass = process.env.SMTP_PASSWORD; // Password for email account

  // Step 2: Check if admin email is configured
  if (!adminEmail) {
    console.log('No admin email provided, skipping email notification');
    return { success: false, message: 'No admin email configured' };
  }

  // Step 3: Format order details into a readable list
  // Loop through each item and create a line like "• Biryani x2 - ₹300"
  const orderDetails = order.items.map(item => {
    const menuItem = item.menuItem; // Get menu item details
    const itemTotal = item.price * item.quantity; // Calculate total for this item
    return `  • ${menuItem.name} x${item.quantity} - ₹${itemTotal}`;
  }).join('\n'); // Join all lines with newline character

  // Step 4: Create email subject
  // Example: "🍽️ New Order - ChefGPT - Order #123456"
  const emailSubject = `🍽️ New Order - ChefGPT - Order #${order._id.toString().slice(-6)}`;
  
  // Step 5: Create email body (plain text version)
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
    // Step 6: Check if SMTP credentials are provided
    // If not configured, just log the email (for development)
    if (smtpUser && smtpPass) {
      // Step 7: Create email transporter (the thing that sends emails)
      const transporter = nodemailer.createTransport({
        host: smtpHost, // Email server address
        port: smtpPort, // Port number
        secure: smtpPort === 465, // true for port 465 (SSL), false for other ports
        auth: {
          user: smtpUser, // Email username
          pass: smtpPass // Email password
        }
      });

      // Step 8: Send the email
      const info = await transporter.sendMail({
        from: `"ChefGPT" <${smtpUser}>`, // Sender name and email
        to: adminEmail, // Recipient email
        subject: emailSubject, // Email subject
        text: emailBody, // Plain text version
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
        ` // HTML version (nicer looking)
      });

      // Step 9: Log success and return
      console.log('Email sent successfully:', info.messageId);
      return { success: true, message: 'Email sent successfully', messageId: info.messageId };
    } else {
      // Step 10: If no SMTP credentials, just log the email (for development)
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
    // Step 11: If sending fails, log error and return
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

/**
 * Send invitation email to new user (free onboarding)
 * @param {string} friendEmail - Email of the friend being invited
 * @param {string} friendName - Name of the friend
 * @param {string} inviterName - Name of person who invited them
 * @param {string} tempPassword - Temporary password for login (null if existing user)
 * @returns {object} - { success: true/false, message: '...' }
 */
async function sendInvitationEmail(friendEmail, friendName, inviterName, tempPassword) {
  const isExistingUser = !tempPassword;
  const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
  const smtpPort = process.env.SMTP_PORT || 587;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASSWORD;
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

  // If no SMTP configured, just log (for free tier)
  if (!smtpUser || !smtpPass) {
    console.log('\n=== INVITATION EMAIL (SMTP not configured) ===');
    console.log('To:', friendEmail);
    if (isExistingUser) {
      console.log('Subject: You have a new friend on ChefGPT!');
      console.log(`Body: Hi ${friendName}, ${inviterName} added you as a friend!`);
      console.log(`Smart link: ${frontendUrl}/auth?email=${encodeURIComponent(friendEmail)}`);
    } else {
      console.log('Subject: Welcome to ChefGPT!');
      console.log(`Body: Hi ${friendName}, ${inviterName} invited you to ChefGPT!`);
      console.log(`Smart link: ${frontendUrl}/auth?email=${encodeURIComponent(friendEmail)}`);
      console.log(`Email: ${friendEmail}`);
      console.log(`Temporary Password: ${tempPassword}`);
      console.log('Complete registration by signing up with your own password.');
    }
    console.log('==========================================\n');
    return { success: true, message: 'Invitation logged (SMTP not configured)' };
  }

  try {
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass
      }
    });

    const emailSubject = isExistingUser 
      ? `👋 ${inviterName} added you as a friend on ChefGPT!`
      : `🎉 Welcome to ChefGPT! ${inviterName} invited you!`;
    
    const emailContent = isExistingUser ? `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #ffffff;">
          <h2 style="color: #667eea; text-align: center;">👋 You have a new friend!</h2>
          <p>Hi ${friendName},</p>
          <p><strong>${inviterName}</strong> added you as a friend on ChefGPT!</p>
          
          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
            <p style="margin: 0 0 10px 0;"><strong>💬 Start Chatting:</strong></p>
            <p style="margin: 5px 0;">Sign in to ChefGPT and start chatting with ${inviterName}!</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${frontendUrl}/auth?email=${encodeURIComponent(friendEmail)}" style="display: inline-block; padding: 14px 28px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);">
              Sign In to Chat →
            </a>
          </div>
          
          <p style="color: #666; font-size: 14px; margin-top: 30px; text-align: center;">
            Happy chatting! 💬<br>
            <strong>ChefGPT Team</strong>
          </p>
        </div>
      ` : `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #ffffff;">
          <h2 style="color: #667eea; text-align: center;">🎉 Welcome to ChefGPT!</h2>
          <p>Hi ${friendName},</p>
          <p><strong>${inviterName}</strong> invited you to join ChefGPT - an AI-powered restaurant platform with real-time chat!</p>
          
          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
            <p style="margin: 0 0 10px 0;"><strong>📧 Your Account Details:</strong></p>
            <p style="margin: 5px 0;"><strong>Email:</strong> ${friendEmail}</p>
            <p style="margin: 5px 0;"><strong>Temporary Password:</strong> <code style="background: #fff; padding: 4px 8px; border-radius: 4px; font-size: 14px;">${tempPassword}</code></p>
            <p style="color: #d32f2f; font-size: 14px; margin: 10px 0 0 0; font-weight: bold;">⚠️ Important: Complete your registration by signing up with your own password!</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${frontendUrl}/auth?email=${encodeURIComponent(friendEmail)}" style="display: inline-block; padding: 14px 28px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);">
              Get Started →
            </a>
          </div>
          
          <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; font-size: 14px; color: #1976d2;"><strong>💡 What to do:</strong></p>
            <ol style="margin: 10px 0 0 20px; padding: 0; font-size: 14px; color: #424242;">
              <li>Click the button above to go to the signup page</li>
              <li>Your email will be pre-filled</li>
              <li>Enter your name and choose a new password</li>
              <li>Start chatting with ${inviterName} and ordering delicious food!</li>
            </ol>
          </div>
          
          <p style="color: #666; font-size: 14px; margin-top: 30px; text-align: center;">
            Happy ordering! 🍽️<br>
            <strong>ChefGPT Team</strong>
          </p>
        </div>
      `;

    const info = await transporter.sendMail({
      from: `"ChefGPT" <${smtpUser}>`,
      to: friendEmail,
      subject: emailSubject,
      html: emailContent
    });

    console.log('Invitation email sent:', info.messageId);
    return { success: true, message: 'Invitation email sent' };
  } catch (error) {
    console.error('Invitation email error:', error);
    // Log even if sending fails
    console.log('\n=== INVITATION EMAIL (Failed to send) ===');
    console.log('To:', friendEmail);
    console.log(`Temporary Password: ${tempPassword}`);
    console.log('==========================================\n');
    return { success: false, message: 'Failed to send invitation email' };
  }
}

module.exports = { sendEmailNotification, sendInvitationEmail };
