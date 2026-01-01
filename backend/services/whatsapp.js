// ============================================
// WHATSAPP SERVICE - Sends WhatsApp notifications for new orders
// ============================================
// This file handles sending WhatsApp messages when a new order is placed
// Currently this is a placeholder - actual WhatsApp integration needs to be added

const axios = require('axios'); // Library to make HTTP requests (for WhatsApp API)

/**
 * Send WhatsApp notification for new order
 * You can integrate with services like Twilio, WhatsApp Business API, or Wati.io
 * This is a placeholder implementation
 * 
 * @param {object} order - The order object with all order details
 * @returns {object} - { success: true/false, message: '...' }
 * 
 * How it works:
 * 1. Gets admin phone and API key from .env file
 * 2. Formats order details into a WhatsApp message
 * 3. Logs the message (actual sending needs API integration)
 */
async function sendWhatsAppNotification(order) {
  // Step 1: Get WhatsApp settings from environment variables
  // These are stored in .env file
  const adminPhone = process.env.ADMIN_PHONE; // Admin's phone number
  const adminEmail = process.env.ADMIN_EMAIL; // Admin's email (as fallback)
  const whatsappApiKey = process.env.WHATSAPP_API_KEY; // API key for WhatsApp service

  // Step 2: Check if admin contact info is provided
  if (!adminPhone && !adminEmail) {
    console.log('No admin contact info provided, skipping WhatsApp notification');
    return;
  }

  // Step 3: Format order details into a WhatsApp message
  // Loop through each item and create a line like "• Biryani x2 - ₹300"
  const orderDetails = order.items.map(item => {
    const menuItem = item.menuItem; // Get menu item details
    const itemTotal = item.price * item.quantity; // Calculate total for this item
    return `  • ${menuItem.name} x${item.quantity} - ₹${itemTotal}`;
  }).join('\n'); // Join all lines with newline character

  // Step 4: Create WhatsApp message
  // *text* makes text bold in WhatsApp
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

  // Step 5: If WhatsApp API is configured, use it here
  // Example with Twilio or WhatsApp Business API:
  if (whatsappApiKey && adminPhone) {
    try {
      // TODO: Replace this with your actual WhatsApp API integration
      // Example: await axios.post('https://api.twilio.com/...', { ... });
      // Example: await axios.post('https://api.whatsapp.com/...', { ... });
      
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

  // Step 6: Also send email notification as fallback
  // If WhatsApp fails, at least send email
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

  // Step 7: Return success
  return { success: true, message: 'Notification sent' };
}

module.exports = { sendWhatsAppNotification };
