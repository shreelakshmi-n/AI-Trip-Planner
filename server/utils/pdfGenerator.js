const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// Helper function to format currency
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
  }).format(amount || 0);
};

// Helper function to format date
const formatDate = (date) => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

// Helper function to format time
const formatTime = (time) => {
  if (!time) return 'N/A';
  // If time is a full date object
  if (time instanceof Date || !isNaN(Date.parse(time))) {
    return new Date(time).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }
  return time;
};

/**
 * Generate Booking Invoice PDF
 */
async function generateBookingInvoice(booking, userName, userEmail) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const chunks = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const bookingType = booking.bookingType || 'service';
      const details = booking.bookingDetails || {};
      const totalAmount = booking.totalAmount || booking.amount || 0;
      const bookingRef = booking.bookingReference || 'N/A';

      // Header with gradient effect (simulated with rectangles)
      doc.rect(0, 0, 612, 150).fill('#4F46E5');
      
      // Company name and invoice title
      doc.fillColor('#FFFFFF')
         .fontSize(28)
         .font('Helvetica-Bold')
         .text('AI TRIP PLANNER', 50, 40);
      
      doc.fontSize(14)
         .font('Helvetica')
         .text('Your Journey, Our Priority', 50, 75);
      
      doc.fontSize(20)
         .font('Helvetica-Bold')
         .text('INVOICE', 50, 110);

      // Reset to black for body
      doc.fillColor('#000000');

      // Invoice details box
      let yPos = 180;
      doc.fontSize(10)
         .font('Helvetica-Bold')
         .text('Invoice Number:', 50, yPos)
         .font('Helvetica')
         .text(bookingRef, 150, yPos);

      yPos += 20;
      doc.font('Helvetica-Bold')
         .text('Invoice Date:', 50, yPos)
         .font('Helvetica')
         .text(formatDate(booking.createdAt || new Date()), 150, yPos);

      yPos += 20;
      doc.font('Helvetica-Bold')
         .text('Booking Type:', 50, yPos)
         .font('Helvetica')
         .text(bookingType.toUpperCase(), 150, yPos);

      // Customer details
      yPos += 40;
      doc.fontSize(14)
         .font('Helvetica-Bold')
         .text('BILL TO:', 50, yPos);

      yPos += 25;
      doc.fontSize(10)
         .font('Helvetica')
         .text(userName || 'Valued Customer', 50, yPos);

      yPos += 15;
      doc.text(userEmail, 50, yPos);

      // Booking details
      yPos += 40;
      doc.fontSize(14)
         .font('Helvetica-Bold')
         .text('BOOKING DETAILS:', 50, yPos);

      yPos += 25;
      doc.fontSize(10)
         .font('Helvetica');

      // Type-specific details
      if (bookingType === 'hotel' || bookingType === 'resort') {
        doc.font('Helvetica-Bold').text('Property:', 50, yPos)
           .font('Helvetica').text(details.name || 'N/A', 150, yPos);
        yPos += 15;
        
        doc.font('Helvetica-Bold').text('Location:', 50, yPos)
           .font('Helvetica').text(details.location || 'N/A', 150, yPos);
        yPos += 15;
        
        doc.font('Helvetica-Bold').text('Check-in:', 50, yPos)
           .font('Helvetica').text(formatDate(booking.checkInDate), 150, yPos);
        yPos += 15;
        
        doc.font('Helvetica-Bold').text('Check-out:', 50, yPos)
           .font('Helvetica').text(formatDate(booking.checkOutDate), 150, yPos);
        yPos += 15;
        
        doc.font('Helvetica-Bold').text('Guests:', 50, yPos)
           .font('Helvetica').text(`${booking.numberOfGuests || 1} guest(s)`, 150, yPos);
        yPos += 15;
        
        if (details.roomType) {
          doc.font('Helvetica-Bold').text('Room Type:', 50, yPos)
             .font('Helvetica').text(details.roomType, 150, yPos);
          yPos += 15;
        }
      } else if (bookingType === 'restaurant' || bookingType === 'cafe') {
        doc.font('Helvetica-Bold').text('Restaurant:', 50, yPos)
           .font('Helvetica').text(details.name || 'N/A', 150, yPos);
        yPos += 15;
        
        doc.font('Helvetica-Bold').text('Location:', 50, yPos)
           .font('Helvetica').text(details.location || 'N/A', 150, yPos);
        yPos += 15;
        
        doc.font('Helvetica-Bold').text('Date:', 50, yPos)
           .font('Helvetica').text(formatDate(booking.bookingDate), 150, yPos);
        yPos += 15;
        
        doc.font('Helvetica-Bold').text('Time:', 50, yPos)
           .font('Helvetica').text(formatTime(booking.bookingTime), 150, yPos);
        yPos += 15;
        
        doc.font('Helvetica-Bold').text('Guests:', 50, yPos)
           .font('Helvetica').text(`${booking.numberOfGuests || 1} person(s)`, 150, yPos);
        yPos += 15;
      } else if (['car', 'bike', 'bus', 'train', 'flight', 'ship'].includes(bookingType)) {
        if (bookingType === 'car' || bookingType === 'bike') {
          doc.font('Helvetica-Bold').text('Vehicle:', 50, yPos)
             .font('Helvetica').text(details.vehicleModel || details.name || 'N/A', 150, yPos);
          yPos += 15;
          
          doc.font('Helvetica-Bold').text('Pick-up:', 50, yPos)
             .font('Helvetica').text(booking.pickup || 'N/A', 150, yPos);
          yPos += 15;
          
          doc.font('Helvetica-Bold').text('Drop-off:', 50, yPos)
             .font('Helvetica').text(booking.dropoff || 'N/A', 150, yPos);
          yPos += 15;
        } else {
          doc.font('Helvetica-Bold').text('Service:', 50, yPos)
             .font('Helvetica').text(details.name || bookingType.toUpperCase(), 150, yPos);
          yPos += 15;
          
          doc.font('Helvetica-Bold').text('From:', 50, yPos)
             .font('Helvetica').text(booking.from || booking.pickup || 'N/A', 150, yPos);
          yPos += 15;
          
          doc.font('Helvetica-Bold').text('To:', 50, yPos)
             .font('Helvetica').text(booking.to || booking.dropoff || 'N/A', 150, yPos);
          yPos += 15;
        }
        
        doc.font('Helvetica-Bold').text('Travel Date:', 50, yPos)
           .font('Helvetica').text(formatDate(booking.travelDate || booking.checkInDate), 150, yPos);
        yPos += 15;
        
        if (booking.numberOfPassengers) {
          doc.font('Helvetica-Bold').text('Passengers:', 50, yPos)
             .font('Helvetica').text(`${booking.numberOfPassengers} person(s)`, 150, yPos);
          yPos += 15;
        }
      } else if (bookingType === 'package') {
        doc.font('Helvetica-Bold').text('Package:', 50, yPos)
           .font('Helvetica').text(details.name || 'Travel Package', 150, yPos);
        yPos += 15;
        
        if (details.destination) {
          doc.font('Helvetica-Bold').text('Destination:', 50, yPos)
             .font('Helvetica').text(details.destination, 150, yPos);
          yPos += 15;
        }
        
        if (booking.checkInDate) {
          doc.font('Helvetica-Bold').text('Start Date:', 50, yPos)
             .font('Helvetica').text(formatDate(booking.checkInDate), 150, yPos);
          yPos += 15;
        }
        
        if (booking.checkOutDate) {
          doc.font('Helvetica-Bold').text('End Date:', 50, yPos)
             .font('Helvetica').text(formatDate(booking.checkOutDate), 150, yPos);
          yPos += 15;
        }
      } else if (bookingType === 'gas_station') {
        const gasDetails = booking.gasStationDetails || {};
        
        doc.font('Helvetica-Bold').text('Station:', 50, yPos)
           .font('Helvetica').text(gasDetails.stationName || details.name || 'N/A', 150, yPos);
        yPos += 15;
        
        doc.font('Helvetica-Bold').text('Location:', 50, yPos)
           .font('Helvetica').text(gasDetails.stationAddress || details.location || 'N/A', 150, yPos);
        yPos += 15;
        
        doc.font('Helvetica-Bold').text('Fuel Type:', 50, yPos)
           .font('Helvetica').text((gasDetails.fuelType || 'Petrol').toUpperCase(), 150, yPos);
        yPos += 15;
        
        doc.font('Helvetica-Bold').text('Quantity:', 50, yPos)
           .font('Helvetica').text(`${gasDetails.quantity || 0} Liters`, 150, yPos);
        yPos += 15;
        
        doc.font('Helvetica-Bold').text('Price per Liter:', 50, yPos)
           .font('Helvetica').text(formatCurrency(gasDetails.pricePerUnit || 0), 150, yPos);
        yPos += 15;
        
        if (gasDetails.vehicleNumber) {
          doc.font('Helvetica-Bold').text('Vehicle Number:', 50, yPos)
             .font('Helvetica').text(gasDetails.vehicleNumber, 150, yPos);
          yPos += 15;
        }
        
        if (gasDetails.fillDateTime) {
          doc.font('Helvetica-Bold').text('Fill Date/Time:', 50, yPos)
             .font('Helvetica').text(formatDate(gasDetails.fillDateTime), 150, yPos);
          yPos += 15;
        }
      }

      // Payment breakdown table
      yPos += 30;
      doc.fontSize(14)
         .font('Helvetica-Bold')
         .text('PAYMENT SUMMARY:', 50, yPos);

      yPos += 25;
      
      // Table header
      doc.rect(50, yPos, 512, 25).fillAndStroke('#4F46E5', '#4F46E5');
      doc.fillColor('#FFFFFF')
         .fontSize(10)
         .font('Helvetica-Bold')
         .text('Description', 60, yPos + 8)
         .text('Amount', 450, yPos + 8);

      yPos += 25;
      doc.fillColor('#000000');

      // Base amount row
      doc.rect(50, yPos, 512, 20).stroke();
      doc.font('Helvetica')
         .text(`${bookingType.charAt(0).toUpperCase() + bookingType.slice(1)} Booking`, 60, yPos + 5)
         .text(formatCurrency(totalAmount * 0.85), 450, yPos + 5);

      yPos += 20;

      // Tax row
      doc.rect(50, yPos, 512, 20).stroke();
      doc.text('Taxes & Service Charges', 60, yPos + 5)
         .text(formatCurrency(totalAmount * 0.15), 450, yPos + 5);

      yPos += 20;

      // Total row
      doc.rect(50, yPos, 512, 25).fillAndStroke('#F3F4F6', '#E5E7EB');
      doc.font('Helvetica-Bold')
         .text('TOTAL AMOUNT', 60, yPos + 7)
         .text(formatCurrency(totalAmount), 450, yPos + 7);

      // Payment status
      yPos += 40;
      const paymentStatus = booking.paymentDetails?.status || booking.paymentStatus || 'pending';
      doc.fontSize(10)
         .font('Helvetica-Bold')
         .text('Payment Status:', 50, yPos)
         .font('Helvetica')
         .fillColor(paymentStatus === 'completed' || paymentStatus === 'paid' ? '#10B981' : '#F59E0B')
         .text(paymentStatus.toUpperCase(), 150, yPos);

      // Footer
      yPos = 750;
      doc.fillColor('#6B7280')
         .fontSize(8)
         .font('Helvetica')
         .text('Thank you for choosing AI Trip Planner!', 50, yPos, { align: 'center', width: 512 });
      
      yPos += 12;
      doc.text('For support, contact us at support@aitripplanner.com', 50, yPos, { align: 'center', width: 512 });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Generate Booking Receipt PDF
 */
async function generateBookingReceipt(booking, userName, userEmail) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const chunks = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const bookingType = booking.bookingType || 'service';
      const details = booking.bookingDetails || {};
      const totalAmount = booking.totalAmount || booking.amount || 0;
      const bookingRef = booking.bookingReference || 'N/A';

      // Header
      doc.rect(0, 0, 612, 120).fill('#10B981');
      
      doc.fillColor('#FFFFFF')
         .fontSize(28)
         .font('Helvetica-Bold')
         .text('PAYMENT RECEIPT', 50, 40);
      
      doc.fontSize(12)
         .font('Helvetica')
         .text('This is a computer-generated receipt', 50, 80);

      doc.fillColor('#000000');

      // Receipt details
      let yPos = 150;
      doc.fontSize(10)
         .font('Helvetica-Bold')
         .text('Receipt Number:', 50, yPos)
         .font('Helvetica')
         .text(bookingRef, 180, yPos);

      yPos += 20;
      const paidDate = booking.paymentDetails?.paidAt || booking.createdAt || new Date();
      doc.font('Helvetica-Bold')
         .text('Payment Date:', 50, yPos)
         .font('Helvetica')
         .text(formatDate(paidDate), 180, yPos);

      yPos += 20;
      const paymentMethod = booking.paymentDetails?.method || 'Online Payment';
      doc.font('Helvetica-Bold')
         .text('Payment Method:', 50, yPos)
         .font('Helvetica')
         .text(paymentMethod, 180, yPos);

      // Customer details
      yPos += 40;
      doc.fontSize(12)
         .font('Helvetica-Bold')
         .text('RECEIVED FROM:', 50, yPos);

      yPos += 25;
      doc.fontSize(10)
         .font('Helvetica')
         .text(userName || 'Valued Customer', 50, yPos);

      yPos += 15;
      doc.text(userEmail, 50, yPos);

      // Payment for
      yPos += 40;
      doc.fontSize(12)
         .font('Helvetica-Bold')
         .text('PAYMENT FOR:', 50, yPos);

      yPos += 25;
      doc.fontSize(10)
         .font('Helvetica')
         .text(`${bookingType.charAt(0).toUpperCase() + bookingType.slice(1)} Booking`, 50, yPos);

      yPos += 15;
      if (details.name) {
        doc.text(details.name, 50, yPos);
        yPos += 15;
      }
      if (details.location) {
        doc.text(details.location, 50, yPos);
        yPos += 15;
      }

      // Amount box
      yPos += 30;
      doc.rect(50, yPos, 512, 60).fillAndStroke('#EFF6FF', '#3B82F6');
      
      yPos += 20;
      doc.fillColor('#1E40AF')
         .fontSize(12)
         .font('Helvetica-Bold')
         .text('AMOUNT PAID:', 60, yPos);
      
      yPos += 20;
      doc.fontSize(24)
         .text(formatCurrency(totalAmount), 60, yPos);

      // Payment confirmation
      yPos += 60;
      doc.fillColor('#000000')
         .fontSize(10)
         .font('Helvetica')
         .text('This receipt confirms that the above amount has been received successfully.', 50, yPos, { width: 512 });

      // Footer
      yPos = 720;
      doc.rect(50, yPos, 512, 1).fillAndStroke('#E5E7EB', '#E5E7EB');
      
      yPos += 15;
      doc.fillColor('#6B7280')
         .fontSize(8)
         .font('Helvetica')
         .text('AI Trip Planner | www.aitripplanner.com | support@aitripplanner.com', 50, yPos, { align: 'center', width: 512 });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Generate Trip Invoice PDF
 */
async function generateTripInvoice(trip, userName, userEmail) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const chunks = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const tripTitle = trip.title || 'Trip Plan';
      const destination = trip.destination || 'Multiple Destinations';
      const budget = trip.budget || 0;
      const tripId = trip._id || 'N/A';

      // Header
      doc.rect(0, 0, 612, 150).fill('#8B5CF6');
      
      doc.fillColor('#FFFFFF')
         .fontSize(28)
         .font('Helvetica-Bold')
         .text('AI TRIP PLANNER', 50, 40);
      
      doc.fontSize(14)
         .font('Helvetica')
         .text('Trip Planning Invoice', 50, 75);
      
      doc.fontSize(20)
         .font('Helvetica-Bold')
         .text('INVOICE', 50, 110);

      doc.fillColor('#000000');

      // Invoice details
      let yPos = 180;
      doc.fontSize(10)
         .font('Helvetica-Bold')
         .text('Invoice Number:', 50, yPos)
         .font('Helvetica')
         .text(`TRIP-${tripId.toString().substring(0, 12).toUpperCase()}`, 150, yPos);

      yPos += 20;
      doc.font('Helvetica-Bold')
         .text('Invoice Date:', 50, yPos)
         .font('Helvetica')
         .text(formatDate(trip.createdAt || new Date()), 150, yPos);

      yPos += 20;
      doc.font('Helvetica-Bold')
         .text('Trip Status:', 50, yPos)
         .font('Helvetica')
         .text((trip.status || 'draft').toUpperCase(), 150, yPos);

      // Customer details
      yPos += 40;
      doc.fontSize(14)
         .font('Helvetica-Bold')
         .text('BILL TO:', 50, yPos);

      yPos += 25;
      doc.fontSize(10)
         .font('Helvetica')
         .text(userName || 'Valued Customer', 50, yPos);

      yPos += 15;
      doc.text(userEmail, 50, yPos);

      // Trip details
      yPos += 40;
      doc.fontSize(14)
         .font('Helvetica-Bold')
         .text('TRIP DETAILS:', 50, yPos);

      yPos += 25;
      doc.fontSize(10);

      doc.font('Helvetica-Bold').text('Trip Name:', 50, yPos)
         .font('Helvetica').text(tripTitle, 150, yPos);
      yPos += 15;

      doc.font('Helvetica-Bold').text('Destination:', 50, yPos)
         .font('Helvetica').text(destination, 150, yPos);
      yPos += 15;

      if (trip.startDate) {
        doc.font('Helvetica-Bold').text('Start Date:', 50, yPos)
           .font('Helvetica').text(formatDate(trip.startDate), 150, yPos);
        yPos += 15;
      }

      if (trip.endDate) {
        doc.font('Helvetica-Bold').text('End Date:', 50, yPos)
           .font('Helvetica').text(formatDate(trip.endDate), 150, yPos);
        yPos += 15;
      }

      if (trip.duration) {
        doc.font('Helvetica-Bold').text('Duration:', 50, yPos)
           .font('Helvetica').text(`${trip.duration} days`, 150, yPos);
        yPos += 15;
      }

      if (trip.travelers) {
        doc.font('Helvetica-Bold').text('Travelers:', 50, yPos)
           .font('Helvetica').text(`${trip.travelers} person(s)`, 150, yPos);
        yPos += 15;
      }

      // Budget summary
      yPos += 30;
      doc.fontSize(14)
         .font('Helvetica-Bold')
         .text('BUDGET SUMMARY:', 50, yPos);

      yPos += 25;

      // Table header
      doc.rect(50, yPos, 512, 25).fillAndStroke('#8B5CF6', '#8B5CF6');
      doc.fillColor('#FFFFFF')
         .fontSize(10)
         .font('Helvetica-Bold')
         .text('Description', 60, yPos + 8)
         .text('Amount', 450, yPos + 8);

      yPos += 25;
      doc.fillColor('#000000');

      // Trip planning service
      doc.rect(50, yPos, 512, 20).stroke();
      doc.font('Helvetica')
         .text('Trip Planning Service', 60, yPos + 5)
         .text(formatCurrency(budget * 0.7), 450, yPos + 5);

      yPos += 20;

      // Booking assistance
      doc.rect(50, yPos, 512, 20).stroke();
      doc.text('Booking & Coordination', 60, yPos + 5)
         .text(formatCurrency(budget * 0.2), 450, yPos + 5);

      yPos += 20;

      // Service charges
      doc.rect(50, yPos, 512, 20).stroke();
      doc.text('Service Charges', 60, yPos + 5)
         .text(formatCurrency(budget * 0.1), 450, yPos + 5);

      yPos += 20;

      // Total
      doc.rect(50, yPos, 512, 25).fillAndStroke('#F3F4F6', '#E5E7EB');
      doc.font('Helvetica-Bold')
         .text('ESTIMATED TOTAL', 60, yPos + 7)
         .text(formatCurrency(budget), 450, yPos + 7);

      // Footer
      yPos = 750;
      doc.fillColor('#6B7280')
         .fontSize(8)
         .font('Helvetica')
         .text('Thank you for planning with AI Trip Planner!', 50, yPos, { align: 'center', width: 512 });
      
      yPos += 12;
      doc.text('For support, contact us at support@aitripplanner.com', 50, yPos, { align: 'center', width: 512 });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Generate Trip Receipt PDF
 */
async function generateTripReceipt(trip, userName, userEmail) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const chunks = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const tripTitle = trip.title || 'Trip Plan';
      const destination = trip.destination || 'Multiple Destinations';
      const tripId = trip._id || 'N/A';

      // Header
      doc.rect(0, 0, 612, 120).fill('#10B981');
      
      doc.fillColor('#FFFFFF')
         .fontSize(28)
         .font('Helvetica-Bold')
         .text('TRIP CONFIRMATION', 50, 40);
      
      doc.fontSize(12)
         .font('Helvetica')
         .text('Your trip has been successfully saved', 50, 80);

      doc.fillColor('#000000');

      // Receipt details
      let yPos = 150;
      doc.fontSize(10)
         .font('Helvetica-Bold')
         .text('Trip ID:', 50, yPos)
         .font('Helvetica')
         .text(tripId.toString(), 180, yPos);

      yPos += 20;
      doc.font('Helvetica-Bold')
         .text('Created On:', 50, yPos)
         .font('Helvetica')
         .text(formatDate(trip.createdAt || new Date()), 180, yPos);

      yPos += 20;
      doc.font('Helvetica-Bold')
         .text('Status:', 50, yPos)
         .font('Helvetica')
         .fillColor(trip.status === 'upcoming' ? '#10B981' : '#F59E0B')
         .text((trip.status || 'draft').toUpperCase(), 180, yPos);

      // Customer details
      doc.fillColor('#000000');
      yPos += 40;
      doc.fontSize(12)
         .font('Helvetica-Bold')
         .text('PLANNED FOR:', 50, yPos);

      yPos += 25;
      doc.fontSize(10)
         .font('Helvetica')
         .text(userName || 'Valued Customer', 50, yPos);

      yPos += 15;
      doc.text(userEmail, 50, yPos);

      // Trip summary box
      yPos += 40;
      doc.rect(50, yPos, 512, 120).fillAndStroke('#EEF2FF', '#818CF8');
      
      yPos += 20;
      doc.fillColor('#000000')
         .fontSize(16)
         .font('Helvetica-Bold')
         .text(tripTitle, 60, yPos, { width: 492 });

      yPos += 30;
      doc.fontSize(10)
         .font('Helvetica')
         .text(`📍 ${destination}`, 60, yPos);

      yPos += 20;
      if (trip.startDate && trip.endDate) {
        doc.text(`🗓️ ${formatDate(trip.startDate)} - ${formatDate(trip.endDate)}`, 60, yPos);
      }

      yPos += 20;
      if (trip.duration) {
        doc.text(`⏱️ ${trip.duration} days`, 60, yPos);
      }

      // Footer
      yPos = 720;
      doc.rect(50, yPos, 512, 1).fillAndStroke('#E5E7EB', '#E5E7EB');
      
      yPos += 15;
      doc.fillColor('#6B7280')
         .fontSize(8)
         .font('Helvetica')
         .text('AI Trip Planner | www.aitripplanner.com | support@aitripplanner.com', 50, yPos, { align: 'center', width: 512 });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Generate Invoice PDF for Gas Agency Booking
 */
async function generateGasAgencyInvoice(booking) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const chunks = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header - Company Logo and Details
      doc
        .fontSize(28)
        .fillColor('#FF6B35')
        .text('GAS AGENCY', 50, 50, { bold: true });

      doc
        .fontSize(10)
        .fillColor('#666666')
        .text('Fast & Safe LPG Delivery', 50, 85)
        .text('Customer Care: 1800-XXX-XXXX', 50, 100)
        .text('Email: support@gasagency.com', 50, 115);

      // Invoice Title
      doc
        .fontSize(24)
        .fillColor('#FF6B35')
        .text('INVOICE', 400, 50, { align: 'right' });

      // Invoice Details Box
      doc
        .fontSize(10)
        .fillColor('#333333')
        .text(`Invoice No: ${booking.bookingReference}`, 400, 85, { align: 'right' })
        .text(`Date: ${formatDate(booking.createdAt)}`, 400, 100, { align: 'right' })
        .text(`Transaction ID: ${booking.payment.transactionId}`, 400, 115, { align: 'right' });

      // Horizontal Line
      doc
        .strokeColor('#FF6B35')
        .lineWidth(2)
        .moveTo(50, 150)
        .lineTo(545, 150)
        .stroke();

      // Customer Details Section
      doc
        .fontSize(14)
        .fillColor('#FF6B35')
        .text('BILL TO:', 50, 170);

      doc
        .fontSize(11)
        .fillColor('#333333')
        .font('Helvetica-Bold')
        .text(booking.customerDetails.name, 50, 195)
        .font('Helvetica')
        .text(booking.customerDetails.deliveryAddress, 50, 212, { width: 250 })
        .text(`${booking.customerDetails.city}, ${booking.customerDetails.pincode}`, 50, 245)
        .text(`Phone: ${booking.customerDetails.phone}`, 50, 260)
        .text(`Email: ${booking.customerDetails.email}`, 50, 275);

      // Delivery Details Section
      doc
        .fontSize(14)
        .fillColor('#FF6B35')
        .text('DELIVERY DETAILS:', 320, 170);

      doc
        .fontSize(11)
        .fillColor('#333333')
        .text(`Date: ${formatDate(booking.orderDetails.deliveryDate)}`, 320, 195)
        .text(`Time: ${booking.orderDetails.deliveryTime.charAt(0).toUpperCase() + booking.orderDetails.deliveryTime.slice(1)}`, 320, 212)
        .text(`Connection Type: ${booking.orderDetails.connectionType.toUpperCase()}`, 320, 229);

      if (booking.orderDetails.connectionNumber) {
        doc.text(`Connection No: ${booking.orderDetails.connectionNumber}`, 320, 246);
      }

      // Order Items Table
      const tableTop = 330;
      
      // Table Header
      doc
        .rect(50, tableTop, 495, 30)
        .fillAndStroke('#FF6B35', '#FF6B35');

      doc
        .fontSize(11)
        .fillColor('#FFFFFF')
        .font('Helvetica-Bold')
        .text('ITEM DESCRIPTION', 60, tableTop + 10)
        .text('QTY', 340, tableTop + 10)
        .text('RATE', 400, tableTop + 10)
        .text('AMOUNT', 480, tableTop + 10, { align: 'right' });

      // Table Row - Cylinder Details
      let yPosition = tableTop + 40;
      
      doc
        .font('Helvetica')
        .fillColor('#333333')
        .text(booking.orderDetails.cylinderType, 60, yPosition)
        .text(booking.orderDetails.quantity.toString(), 340, yPosition)
        .text(formatCurrency(booking.pricing.basePrice / booking.orderDetails.quantity), 400, yPosition)
        .text(formatCurrency(booking.pricing.basePrice), 480, yPosition, { align: 'right' });

      yPosition += 25;

      // Deposit Row (if applicable)
      if (booking.pricing.deposit > 0) {
        doc
          .text('Security Deposit (Refundable)', 60, yPosition)
          .text('-', 340, yPosition)
          .text('-', 400, yPosition)
          .text(formatCurrency(booking.pricing.deposit), 480, yPosition, { align: 'right' });
        
        yPosition += 25;
      }

      // Delivery Charges Row
      doc
        .text('Delivery Charges', 60, yPosition)
        .text('-', 340, yPosition)
        .text('-', 400, yPosition)
        .text(formatCurrency(booking.pricing.deliveryCharges), 480, yPosition, { align: 'right' });

      yPosition += 25;

      // Subtotal Line
      doc
        .strokeColor('#CCCCCC')
        .lineWidth(1)
        .moveTo(50, yPosition)
        .lineTo(545, yPosition)
        .stroke();

      yPosition += 15;

      // Subtotal
      const subtotal = booking.pricing.basePrice + booking.pricing.deposit + booking.pricing.deliveryCharges;
      doc
        .font('Helvetica-Bold')
        .text('Subtotal:', 380, yPosition)
        .text(formatCurrency(subtotal), 480, yPosition, { align: 'right' });

      yPosition += 20;

      // GST
      doc
        .font('Helvetica')
        .text('GST (5%):', 380, yPosition)
        .text(formatCurrency(booking.pricing.gst), 480, yPosition, { align: 'right' });

      yPosition += 25;

      // Total Line
      doc
        .strokeColor('#FF6B35')
        .lineWidth(2)
        .moveTo(50, yPosition)
        .lineTo(545, yPosition)
        .stroke();

      yPosition += 15;

      // Total Amount
      doc
        .rect(350, yPosition, 195, 35)
        .fillAndStroke('#FF6B35', '#FF6B35');

      doc
        .fontSize(14)
        .fillColor('#FFFFFF')
        .font('Helvetica-Bold')
        .text('TOTAL AMOUNT:', 360, yPosition + 10)
        .fontSize(16)
        .text(formatCurrency(booking.pricing.totalPrice), 480, yPosition + 10, { align: 'right' });

      yPosition += 50;

      // Payment Details
      doc
        .fontSize(12)
        .fillColor('#FF6B35')
        .font('Helvetica-Bold')
        .text('PAYMENT DETAILS:', 50, yPosition + 10);

      yPosition += 30;

      doc
        .fontSize(10)
        .fillColor('#333333')
        .font('Helvetica')
        .text(`Payment Method: ${booking.payment.method.toUpperCase()}`, 50, yPosition)
        .text(`Payment Status: PAID`, 50, yPosition + 15)
        .text(`Transaction ID: ${booking.payment.transactionId}`, 50, yPosition + 30)
        .text(`Paid On: ${formatDate(booking.payment.paidAt)} ${formatTime(booking.payment.paidAt)}`, 50, yPosition + 45);

      // Terms and Conditions
      yPosition += 80;
      
      if (yPosition > 650) {
        doc.addPage();
        yPosition = 50;
      }

      doc
        .fontSize(10)
        .fillColor('#FF6B35')
        .font('Helvetica-Bold')
        .text('Terms & Conditions:', 50, yPosition);

      doc
        .fontSize(9)
        .fillColor('#666666')
        .font('Helvetica')
        .text('• Security deposit is refundable upon returning the empty cylinder.', 50, yPosition + 20)
        .text('• Please keep this invoice for future reference.', 50, yPosition + 35)
        .text('• Delivery will be made during the selected time slot.', 50, yPosition + 50)
        .text('• In case of any issues, contact customer care within 24 hours.', 50, yPosition + 65);

      // Footer
      doc
        .fontSize(8)
        .fillColor('#999999')
        .text(
          'This is a computer-generated invoice and does not require a signature.',
          50,
          750,
          { align: 'center', width: 495 }
        )
        .text('Thank you for choosing our service!', 50, 765, { align: 'center', width: 495 });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Generate Payment Receipt PDF for Gas Agency Booking
 */
async function generateGasAgencyReceipt(booking) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const chunks = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header
      doc
        .fontSize(28)
        .fillColor('#4CAF50')
        .text('GAS AGENCY', 50, 50, { bold: true });

      doc
        .fontSize(10)
        .fillColor('#666666')
        .text('Fast & Safe LPG Delivery', 50, 85)
        .text('Customer Care: 1800-XXX-XXXX', 50, 100);

      // Receipt Title
      doc
        .fontSize(24)
        .fillColor('#4CAF50')
        .text('PAYMENT RECEIPT', 350, 50, { align: 'right' });

      // Success Icon (using text symbol)
      doc
        .fontSize(60)
        .fillColor('#4CAF50')
        .text('✓', 270, 150, { align: 'center' });

      // Payment Confirmed Text
      doc
        .fontSize(18)
        .fillColor('#333333')
        .font('Helvetica-Bold')
        .text('PAYMENT SUCCESSFUL', 50, 230, { align: 'center', width: 495 });

      // Horizontal Line
      doc
        .strokeColor('#4CAF50')
        .lineWidth(2)
        .moveTo(50, 270)
        .lineTo(545, 270)
        .stroke();

      // Receipt Details Box
      const boxTop = 290;
      doc
        .rect(50, boxTop, 495, 280)
        .stroke('#CCCCCC');

      let yPos = boxTop + 20;

      // Receipt Number
      doc
        .fontSize(12)
        .fillColor('#4CAF50')
        .font('Helvetica-Bold')
        .text('Receipt No:', 70, yPos)
        .fillColor('#333333')
        .font('Helvetica')
        .text(booking.bookingReference, 300, yPos);

      yPos += 25;

      // Transaction ID
      doc
        .fillColor('#4CAF50')
        .font('Helvetica-Bold')
        .text('Transaction ID:', 70, yPos)
        .fillColor('#333333')
        .font('Helvetica')
        .text(booking.payment.transactionId, 300, yPos);

      yPos += 25;

      // Payment Date
      doc
        .fillColor('#4CAF50')
        .font('Helvetica-Bold')
        .text('Payment Date:', 70, yPos)
        .fillColor('#333333')
        .font('Helvetica')
        .text(`${formatDate(booking.payment.paidAt)} ${formatTime(booking.payment.paidAt)}`, 300, yPos);

      yPos += 25;

      // Payment Method
      doc
        .fillColor('#4CAF50')
        .font('Helvetica-Bold')
        .text('Payment Method:', 70, yPos)
        .fillColor('#333333')
        .font('Helvetica')
        .text(booking.payment.method.toUpperCase(), 300, yPos);

      yPos += 35;

      // Separator Line
      doc
        .strokeColor('#EEEEEE')
        .lineWidth(1)
        .moveTo(70, yPos)
        .lineTo(525, yPos)
        .stroke();

      yPos += 20;

      // Customer Name
      doc
        .fillColor('#4CAF50')
        .font('Helvetica-Bold')
        .text('Customer Name:', 70, yPos)
        .fillColor('#333333')
        .font('Helvetica')
        .text(booking.customerDetails.name, 300, yPos);

      yPos += 25;

      // Email
      doc
        .fillColor('#4CAF50')
        .font('Helvetica-Bold')
        .text('Email:', 70, yPos)
        .fillColor('#333333')
        .font('Helvetica')
        .text(booking.customerDetails.email, 300, yPos);

      yPos += 25;

      // Phone
      doc
        .fillColor('#4CAF50')
        .font('Helvetica-Bold')
        .text('Phone:', 70, yPos)
        .fillColor('#333333')
        .font('Helvetica')
        .text(booking.customerDetails.phone, 300, yPos);

      yPos += 35;

      // Separator Line
      doc
        .strokeColor('#EEEEEE')
        .lineWidth(1)
        .moveTo(70, yPos)
        .lineTo(525, yPos)
        .stroke();

      yPos += 20;

      // Item Description
      doc
        .fillColor('#4CAF50')
        .font('Helvetica-Bold')
        .text('Item:', 70, yPos)
        .fillColor('#333333')
        .font('Helvetica')
        .text(booking.orderDetails.cylinderType, 300, yPos);

      yPos += 25;

      // Quantity
      doc
        .fillColor('#4CAF50')
        .font('Helvetica-Bold')
        .text('Quantity:', 70, yPos)
        .fillColor('#333333')
        .font('Helvetica')
        .text(booking.orderDetails.quantity.toString(), 300, yPos);

      // Amount Paid Box
      yPos += 50;
      doc
        .rect(70, yPos, 455, 50)
        .fillAndStroke('#4CAF50', '#4CAF50');

      doc
        .fontSize(14)
        .fillColor('#FFFFFF')
        .font('Helvetica-Bold')
        .text('AMOUNT PAID:', 90, yPos + 17)
        .fontSize(18)
        .text(formatCurrency(booking.pricing.totalPrice), 300, yPos + 15);

      // Order Summary
      yPos = 610;
      doc
        .fontSize(12)
        .fillColor('#4CAF50')
        .font('Helvetica-Bold')
        .text('ORDER SUMMARY:', 50, yPos);

      yPos += 30;

      doc
        .fontSize(10)
        .fillColor('#333333')
        .font('Helvetica')
        .text('Base Amount:', 70, yPos)
        .text(formatCurrency(booking.pricing.basePrice), 480, yPos, { align: 'right' });

      yPos += 20;

      if (booking.pricing.deposit > 0) {
        doc
          .text('Security Deposit:', 70, yPos)
          .text(formatCurrency(booking.pricing.deposit), 480, yPos, { align: 'right' });
        
        yPos += 20;
      }

      doc
        .text('Delivery Charges:', 70, yPos)
        .text(formatCurrency(booking.pricing.deliveryCharges), 480, yPos, { align: 'right' });

      yPos += 20;

      doc
        .text('GST (5%):', 70, yPos)
        .text(formatCurrency(booking.pricing.gst), 480, yPos, { align: 'right' });

      // Footer Note
      doc
        .fontSize(9)
        .fillColor('#999999')
        .text(
          'Please retain this receipt for your records. For any queries, contact customer support.',
          50,
          730,
          { align: 'center', width: 495 }
        )
        .text('Thank you for your payment!', 50, 750, { align: 'center', width: 495 });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

module.exports = {
  generateBookingInvoice,
  generateBookingReceipt,
  generateTripInvoice,
  generateTripReceipt,
  generateGasAgencyInvoice,
  generateGasAgencyReceipt,
};
