const axios = require('axios');

/**
 * Send WhatsApp notification for new order
 * You can integrate with services like Twilio, WhatsApp Business API, or Wati.io
 * This is a placeholder implementation
 */
async function sendWhatsAppNotification(order) {
  const adminPhone = process.env.ADMIN_PHONE;
  const adminEmail = process.env.ADMIN_EMAIL;
  const whatsappApiKey = process.env.WHATSAPP_API_KEY;

  if (!adminPhone && !adminEmail) {
    console.log('No admin contact info provided, skipping WhatsApp notification');
    return;
  }

  // Format order details
  const orderDetails = order.items.map(item => {
    const menuItem = item.menuItem;
    return `  • ${menuItem.name} x${item.quantity} - ₹${item.price * item.quantity}`;
  }).join('\n');

  const message = `
🍽️ *New Order Received!*

*Order ID:* ${order._id}
*Customer:* ${order.customerName}
*Phone:* ${order.customerPhone}
*Email:* ${order.customerEmail}
*Order Type:* ${order.orderType === 'take-away' ? 'Take Away' : 'Dine In'}

*Items:*
${orderDetails}

*Total Amount:* ₹${order.totalAmount}
*Time:* ${new Date(order.createdAt).toLocaleString('en-IN')}
  `.trim();

  // If you have WhatsApp API configured, use it here
  // Example with Twilio or WhatsApp Business API:
  if (whatsappApiKey && adminPhone) {
    try {
      // Replace this with your actual WhatsApp API integration
      // Example: await axios.post('https://api.twilio.com/...', { ... });
      console.log('WhatsApp notification would be sent:', message);
      console.log('To:', adminPhone);
      
      // For now, we'll just log it. You can integrate with:
      // - Twilio WhatsApp API
      // - WhatsApp Business API
      // - Wati.io
      // - Other WhatsApp messaging services
    } catch (error) {
      console.error('WhatsApp API error:', error);
      throw error;
    }
  }

  // Also send email notification as fallback
  if (adminEmail) {
    try {
      // You can integrate with nodemailer or sendgrid here
      console.log('Email notification would be sent to:', adminEmail);
      console.log('Subject: New Order - ChefGPT');
      console.log('Body:', message);
    } catch (error) {
      console.error('Email notification error:', error);
    }
  }

  return { success: true, message: 'Notification sent' };
}

module.exports = { sendWhatsAppNotification };

