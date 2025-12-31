import React from 'react';
import QRCode from 'qrcode.react';
import './UPIQRCode.css';

const UPIQRCode = ({ upiId, amount, merchantName }) => {
  // Generate UPI payment URL
  // Format: upi://pay?pa=<UPI_ID>&pn=<MERCHANT_NAME>&am=<AMOUNT>&cu=INR&tn=<TRANSACTION_NOTE>
  const upiUrl = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(merchantName)}&am=${amount.toFixed(2)}&cu=INR&tn=${encodeURIComponent(`Order from ${merchantName}`)}`;

  return (
    <div className="upi-qr-container">
      <div className="upi-qr-header">
        <h3>Scan to Pay</h3>
        <p className="upi-amount">₹{amount.toFixed(2)}</p>
      </div>
      
      <div className="upi-qr-code">
        <QRCode
          value={upiUrl}
          size={200}
          level="H"
          includeMargin={true}
          fgColor="#202124"
          bgColor="#ffffff"
        />
      </div>
      
      <div className="upi-details">
        <p className="upi-merchant-name">{merchantName}</p>
        <p className="upi-id">{upiId}</p>
        <p className="upi-instruction">Scan with any UPI app to pay</p>
      </div>
    </div>
  );
};

export default UPIQRCode;

