const Razorpay = require('razorpay');
const crypto = require('crypto');
const Booking = require('../models/Booking');
const { logger } = require('../middleware/logging');
const { sendBookingConfirmation, sendPaymentReceipt } = require('../utils/emailService');
const { generateBookingReceipt } = require('../utils/pdfGenerator');

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_dummy_key',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'dummy_secret',
});

// @desc    Create Razorpay order
// @route   POST /api/payments/create-order
// @access  Private
const createPaymentOrder = async (req, res) => {
  try {
    const { amount, currency = 'INR', receipt, bookingId } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid amount',
      });
    }

    const options = {
      amount: Math.round(amount * 100), // Razorpay expects amount in paise
      currency,
      receipt: receipt || `receipt_${Date.now()}`,
      payment_capture: 1, // Auto capture payment
    };

    const order = await razorpay.orders.create(options);

    // If bookingId is provided, update booking with order ID
    if (bookingId) {
      await Booking.findByIdAndUpdate(bookingId, {
        'paymentDetails.orderId': order.id,
        'paymentDetails.gateway': 'razorpay',
      });
    }

    logger.info(`Razorpay order created: ${order.id} for amount: ${amount}`);

    res.status(200).json({
      success: true,
      data: {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        key: process.env.RAZORPAY_KEY_ID,
      },
    });
  } catch (error) {
    logger.error('Error creating Razorpay order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create payment order',
      error: error.message,
    });
  }
};

// @desc    Verify Razorpay payment
// @route   POST /api/payments/verify
// @access  Private
const verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      bookingId,
    } = req.body;

    // Verify signature
    const sign = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'dummy_secret')
      .update(sign.toString())
      .digest('hex');

    if (razorpay_signature === expectedSign) {
      // Payment is verified
      logger.info(`Payment verified: ${razorpay_payment_id}`);

      // Update booking with payment details
      if (bookingId) {
        const booking = await Booking.findByIdAndUpdate(
          bookingId,
          {
            paymentStatus: 'paid',
            paymentMethod: 'razorpay',
            'paymentDetails.gateway': 'razorpay',
            'paymentDetails.orderId': razorpay_order_id,
            'paymentDetails.paymentId': razorpay_payment_id,
            'paymentDetails.signature': razorpay_signature,
            'paymentDetails.paidAt': new Date(),
            status: 'confirmed',
          },
          { new: true }
        ).populate('user', 'name email');

        if (booking) {
          // Send confirmation email with PDF receipt
          try {
            const user = booking.user;
            const pdfBuffer = await generateBookingReceipt(
              booking.toObject(),
              user.name,
              user.email
            );

            await sendPaymentReceipt(
              user.email,
              user.name,
              booking.toObject(),
              pdfBuffer
            );

            logger.info(`Payment receipt sent for booking ${booking.bookingReference}`);
          } catch (emailError) {
            logger.error('Error sending payment receipt:', emailError);
          }
        }
      }

      res.status(200).json({
        success: true,
        message: 'Payment verified successfully',
        paymentId: razorpay_payment_id,
      });
    } else {
      logger.warn(`Payment verification failed for order: ${razorpay_order_id}`);
      res.status(400).json({
        success: false,
        message: 'Payment verification failed',
      });
    }
  } catch (error) {
    logger.error('Error verifying payment:', error);
    res.status(500).json({
      success: false,
      message: 'Payment verification error',
      error: error.message,
    });
  }
};

// @desc    Get payment details
// @route   GET /api/payments/:paymentId
// @access  Private
const getPaymentDetails = async (req, res) => {
  try {
    const { paymentId } = req.params;

    const payment = await razorpay.payments.fetch(paymentId);

    res.status(200).json({
      success: true,
      data: payment,
    });
  } catch (error) {
    logger.error('Error fetching payment details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment details',
      error: error.message,
    });
  }
};

// @desc    Initiate refund
// @route   POST /api/payments/refund
// @access  Private
const initiateRefund = async (req, res) => {
  try {
    const { paymentId, amount, bookingId } = req.body;

    if (!paymentId) {
      return res.status(400).json({
        success: false,
        message: 'Payment ID is required',
      });
    }

    const refundOptions = {
      payment_id: paymentId,
    };

    if (amount) {
      refundOptions.amount = Math.round(amount * 100); // Amount in paise
    }

    const refund = await razorpay.payments.refund(paymentId, refundOptions);

    // Update booking status
    if (bookingId) {
      await Booking.findByIdAndUpdate(bookingId, {
        paymentStatus: amount ? 'partially_refunded' : 'refunded',
        refundAmount: refund.amount / 100,
        status: 'cancelled',
      });
    }

    logger.info(`Refund initiated: ${refund.id} for payment: ${paymentId}`);

    res.status(200).json({
      success: true,
      message: 'Refund initiated successfully',
      data: refund,
    });
  } catch (error) {
    logger.error('Error initiating refund:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to initiate refund',
      error: error.message,
    });
  }
};

module.exports = {
  createPaymentOrder,
  verifyPayment,
  getPaymentDetails,
  initiateRefund,
};
