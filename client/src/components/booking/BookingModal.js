import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import {
  FaTimes,
  FaHotel,
  FaUtensils,
  FaCoffee,
  FaCar,
  FaMotorcycle,
  FaBus,
  FaTrain,
  FaPlane,
  FaShip,
  FaCalendar,
  FaClock,
  FaUsers,
  FaRupeeSign,
  FaCheckCircle,
  FaCreditCard,
  FaMobileAlt,
  FaUniversity,
  FaWallet,
  FaMoneyBillWave,
  FaLock,
  FaArrowLeft,
  FaSuitcase,
} from 'react-icons/fa';
import { bookingAPI } from '../../services/api';

const BookingModal = ({ isOpen, onClose, bookingType, placeDetails = {}, defaultFormData = {} }) => {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Booking Details, 2: Payment
  const [paymentMethod, setPaymentMethod] = useState('');
  const [processingPayment, setProcessingPayment] = useState(false);
  const [formData, setFormData] = useState({
    numberOfGuests: 1,
    adults: 1,
    children: 0,
    infants: 0,
    checkInDate: '',
    checkOutDate: '',
    bookingDate: '',
    bookingTime: '',
    departureDate: '',
    returnDate: '',
    roomType: '',
    numberOfRooms: 1,
    vehicleType: '',
    from: '',
    to: '',
    specialRequests: '',
  });

  // Restaurant menu items with quantities
  const [selectedMenuItems, setSelectedMenuItems] = useState([]);
  
  // Selected room type for hotels
  const [selectedRoomType, setSelectedRoomType] = useState(null);
  
  // Selected transport type for transportation bookings
  const [selectedTransportType, setSelectedTransportType] = useState(null);
  
  // Distance calculation state
  const [routeDistance, setRouteDistance] = useState(null);
  const [calculatingDistance, setCalculatingDistance] = useState(false);

  // Transport types for each category with per-km rates
  const transportTypes = {
    car: {
      'Economy Cars': [
        { id: 1, name: 'Hatchback', price: 1200, pricePerKm: 12, capacity: 4, features: ['AC', 'Music System', 'Basic Insurance'] },
        { id: 2, name: 'Sedan', price: 1800, pricePerKm: 15, capacity: 4, features: ['AC', 'Music System', 'GPS', 'Full Insurance'] },
        { id: 3, name: 'Compact SUV', price: 2500, pricePerKm: 18, capacity: 5, features: ['AC', 'Music System', 'GPS', 'Full Insurance'] },
      ],
      'Luxury Cars': [
        { id: 4, name: 'Premium Sedan', price: 4000, pricePerKm: 25, capacity: 4, features: ['AC', 'Premium Sound', 'GPS', 'Leather Seats', 'Full Insurance'] },
        { id: 5, name: 'Luxury SUV', price: 6000, pricePerKm: 35, capacity: 7, features: ['AC', 'Premium Sound', 'GPS', 'Leather Seats', 'Sunroof', 'Full Insurance'] },
        { id: 6, name: 'Sports Car', price: 10000, pricePerKm: 50, capacity: 2, features: ['AC', 'Premium Sound', 'GPS', 'Leather Seats', 'High Performance', 'Full Insurance'] },
      ],
    },
    bike: {
      'Standard Bikes': [
        { id: 1, name: 'Scooter', price: 400, pricePerKm: 5, capacity: 2, features: ['Fuel Efficient', 'Helmet', 'Basic Insurance'] },
        { id: 2, name: '150cc Bike', price: 600, pricePerKm: 6, capacity: 2, features: ['Fuel Efficient', 'Helmet', 'Basic Insurance'] },
        { id: 3, name: '200cc Bike', price: 800, pricePerKm: 8, capacity: 2, features: ['Good Power', 'Helmet', 'Full Insurance'] },
      ],
      'Premium Bikes': [
        { id: 4, name: 'Sport Bike (300cc)', price: 1500, pricePerKm: 10, capacity: 2, features: ['High Performance', 'Helmet', 'Riding Gear', 'Full Insurance'] },
        { id: 5, name: 'Cruiser (500cc)', price: 2000, pricePerKm: 12, capacity: 2, features: ['Comfortable Ride', 'Helmet', 'Riding Gear', 'Full Insurance'] },
        { id: 6, name: 'Superbike (1000cc)', price: 4000, pricePerKm: 20, capacity: 2, features: ['Super Performance', 'Helmet', 'Full Gear', 'Premium Insurance'] },
      ],
    },
    bus: {
      'Regular Buses': [
        { id: 1, name: 'Non-AC Seater', price: 500, pricePerKm: 1.5, capacity: 40, features: ['Basic Seating', 'Luggage Space'] },
        { id: 2, name: 'AC Seater', price: 800, pricePerKm: 2, capacity: 40, features: ['AC', 'Comfortable Seats', 'Luggage Space', 'Water Bottle'] },
        { id: 3, name: 'Volvo AC', price: 1200, pricePerKm: 3, capacity: 40, features: ['AC', 'Reclining Seats', 'Charging Port', 'Blanket', 'Water'] },
      ],
      'Luxury Buses': [
        { id: 4, name: 'Semi-Sleeper', price: 1500, pricePerKm: 3.5, capacity: 35, features: ['AC', 'Reclining Seats', 'Charging Port', 'Blanket', 'Water', 'Snacks'] },
        { id: 5, name: 'Sleeper', price: 1800, pricePerKm: 4, capacity: 30, features: ['AC', 'Berth Beds', 'Charging Port', 'Blanket', 'Pillow', 'Water'] },
        { id: 6, name: 'Volvo Multi-Axle Sleeper', price: 2500, pricePerKm: 5, capacity: 28, features: ['AC', 'Premium Berth', 'Entertainment', 'Charging', 'Blanket', 'Pillow', 'Snacks'] },
      ],
    },
    train: {
      'General Classes': [
        { id: 1, name: 'Unreserved (UR)', price: 200, pricePerKm: 0.5, capacity: 100, features: ['General Seating'] },
        { id: 2, name: 'Second Sitting (2S)', price: 400, pricePerKm: 0.8, capacity: 80, features: ['Reserved Seating'] },
        { id: 3, name: 'Sleeper Class (SL)', price: 600, pricePerKm: 1, capacity: 72, features: ['Berth', 'Bedroll Available'] },
      ],
      'AC Classes': [
        { id: 4, name: 'AC 3 Tier (3A)', price: 1200, pricePerKm: 1.5, capacity: 64, features: ['AC', 'Berth', 'Bedroll', 'Charging Point'] },
        { id: 5, name: 'AC 2 Tier (2A)', price: 1800, pricePerKm: 2, capacity: 48, features: ['AC', 'Berth', 'Bedroll', 'Charging Point', 'More Space'] },
        { id: 6, name: 'AC First Class (1A)', price: 3000, pricePerKm: 3, capacity: 24, features: ['AC', 'Cabin', 'Bedroll', 'Charging', 'Premium Service'] },
      ],
    },
    flight: {
      'Domestic Flights': [
        { id: 1, name: 'Economy Class', price: 4000, pricePerKm: 4, capacity: 180, features: ['7kg Cabin Bag', 'Meal Available'] },
        { id: 2, name: 'Premium Economy', price: 6000, pricePerKm: 6, capacity: 60, features: ['7kg Cabin + 15kg Check-in', 'Meal', 'Extra Legroom'] },
        { id: 3, name: 'Business Class', price: 12000, pricePerKm: 10, capacity: 30, features: ['7kg Cabin + 25kg Check-in', 'Premium Meal', 'Lounge Access', 'Priority'] },
      ],
      'International Flights': [
        { id: 4, name: 'International Economy', price: 15000, pricePerKm: 8, capacity: 200, features: ['30kg Baggage', 'Meals', 'Entertainment'] },
        { id: 5, name: 'International Premium Economy', price: 25000, pricePerKm: 12, capacity: 60, features: ['40kg Baggage', 'Premium Meals', 'Entertainment', 'Extra Space'] },
        { id: 6, name: 'International Business', price: 60000, pricePerKm: 20, capacity: 40, features: ['50kg Baggage', 'Lie-flat Seats', 'Premium Service', 'Lounge', 'Priority'] },
        { id: 7, name: 'First Class', price: 120000, pricePerKm: 35, capacity: 12, features: ['70kg Baggage', 'Private Suite', 'Premium Dining', 'Lounge', 'Priority', 'Chauffeur'] },
      ],
    },
    ship: {
      'Ferry Services': [
        { id: 1, name: 'Deck Class', price: 800, pricePerKm: 2, capacity: 200, features: ['Basic Seating', 'Open Deck Access'] },
        { id: 2, name: 'Cabin Class', price: 1500, pricePerKm: 3, capacity: 100, features: ['Private Cabin', 'AC', 'Bed'] },
        { id: 3, name: 'Deluxe Cabin', price: 2500, pricePerKm: 5, capacity: 50, features: ['Deluxe Cabin', 'AC', 'Bed', 'Bathroom', 'TV'] },
      ],
      'Cruise Ships': [
        { id: 4, name: 'Inside Cabin', price: 8000, pricePerKm: 15, capacity: 4, features: ['AC Cabin', 'Bed', 'Bathroom', 'Dining Access', 'Entertainment'] },
        { id: 5, name: 'Ocean View', price: 15000, pricePerKm: 25, capacity: 4, features: ['Window', 'AC Cabin', 'Bed', 'Bathroom', 'Premium Dining', 'Entertainment'] },
        { id: 6, name: 'Balcony Suite', price: 25000, pricePerKm: 40, capacity: 4, features: ['Private Balcony', 'AC Suite', 'Premium Bed', 'Bathroom', 'Spa Access', 'Premium Dining'] },
        { id: 7, name: 'Royal Suite', price: 50000, pricePerKm: 70, capacity: 6, features: ['Large Balcony', 'Luxury Suite', 'Butler Service', 'Premium Spa', 'Exclusive Dining', 'All Access'] },
      ],
    },
  };

  // Hotel room types (in a real app, this would come from the hotel API)
  const hotelRoomTypes = {
    'Standard Rooms': [
      { id: 1, name: 'Single Room', price: 1500, capacity: 1, amenities: ['Wi-Fi', 'TV', 'AC'] },
      { id: 2, name: 'Double Room', price: 2500, capacity: 2, amenities: ['Wi-Fi', 'TV', 'AC', 'Mini Bar'] },
      { id: 3, name: 'Twin Room', price: 2800, capacity: 2, amenities: ['Wi-Fi', 'TV', 'AC', 'Mini Bar'] },
    ],
    'Premium Rooms': [
      { id: 4, name: 'Deluxe Room', price: 4000, capacity: 2, amenities: ['Wi-Fi', 'Smart TV', 'AC', 'Mini Bar', 'Balcony'] },
      { id: 5, name: 'Executive Room', price: 5500, capacity: 3, amenities: ['Wi-Fi', 'Smart TV', 'AC', 'Mini Bar', 'Work Desk', 'Sofa'] },
      { id: 6, name: 'Premium Suite', price: 7500, capacity: 3, amenities: ['Wi-Fi', 'Smart TV', 'AC', 'Mini Bar', 'Lounge', 'King Bed'] },
    ],
    'Luxury Suites': [
      { id: 7, name: 'Junior Suite', price: 9000, capacity: 3, amenities: ['Wi-Fi', 'Smart TV', 'AC', 'Mini Bar', 'Lounge', 'King Bed', 'Jacuzzi'] },
      { id: 8, name: 'Presidential Suite', price: 15000, capacity: 4, amenities: ['Wi-Fi', 'Smart TV', 'AC', 'Mini Bar', 'Lounge', 'King Bed', 'Jacuzzi', 'Butler Service', 'Kitchen'] },
      { id: 9, name: 'Royal Suite', price: 25000, capacity: 6, amenities: ['Wi-Fi', 'Smart TV', 'AC', 'Mini Bar', 'Lounge', 'King Bed', 'Jacuzzi', 'Butler Service', 'Kitchen', 'Dining Room', 'Private Terrace'] },
    ],
  };

  // Sample restaurant menu (in a real app, this would come from the restaurant API)
  const restaurantMenu = {
    'Appetizers': [
      { id: 1, name: 'Paneer Tikka', price: 250, veg: true },
      { id: 2, name: 'Chicken Wings', price: 300, veg: false },
      { id: 3, name: 'Spring Rolls', price: 180, veg: true },
      { id: 4, name: 'Fish Fingers', price: 320, veg: false },
      { id: 101, name: 'Veg Samosa', price: 80, veg: true },
      { id: 102, name: 'Chicken Tikka', price: 280, veg: false },
      { id: 103, name: 'Hara Bhara Kabab', price: 200, veg: true },
      { id: 104, name: 'Prawn Tempura', price: 450, veg: false },
      { id: 105, name: 'Mushroom Stuffed', price: 240, veg: true },
      { id: 106, name: 'Tandoori Chicken', price: 320, veg: false },
      { id: 154, name: 'Paneer 65', price: 260, veg: true },
      { id: 155, name: 'Chicken 65', price: 300, veg: false },
      { id: 156, name: 'Mutton Seekh Kabab', price: 380, veg: false },
      { id: 157, name: 'Fish Amritsari', price: 350, veg: false },
      { id: 158, name: 'Prawn Koliwada', price: 420, veg: false },
      { id: 159, name: 'Mushroom Tikka', price: 220, veg: true },
      { id: 160, name: 'Paneer Malai Tikka', price: 280, veg: true },
      { id: 161, name: 'Chicken Malai Tikka', price: 320, veg: false },
      { id: 162, name: 'Fish Tikka', price: 380, veg: false },
      { id: 163, name: 'Mushroom 65', price: 240, veg: true },
    ],
    'Soups & Salads': [
      { id: 107, name: 'Tomato Soup', price: 120, veg: true },
      { id: 108, name: 'Hot & Sour Soup', price: 140, veg: true },
      { id: 109, name: 'Chicken Noodle Soup', price: 180, veg: false },
      { id: 110, name: 'Caesar Salad', price: 220, veg: false },
      { id: 111, name: 'Greek Salad', price: 200, veg: true },
      { id: 112, name: 'Garden Fresh Salad', price: 150, veg: true },
      { id: 164, name: 'Mushroom Soup', price: 150, veg: true },
      { id: 165, name: 'Chicken Corn Soup', price: 160, veg: false },
      { id: 166, name: 'Seafood Soup', price: 220, veg: false },
      { id: 167, name: 'Mutton Bone Soup', price: 200, veg: false },
    ],
    'Main Course - Indian Chicken': [
      { id: 5, name: 'Butter Chicken', price: 380, veg: false },
      { id: 7, name: 'Chicken Biryani', price: 350, veg: false },
      { id: 118, name: 'Chicken Tikka Masala', price: 380, veg: false },
      { id: 168, name: 'Chicken Korma', price: 360, veg: false },
      { id: 169, name: 'Chicken Chettinad', price: 390, veg: false },
      { id: 170, name: 'Chicken Kadai', price: 370, veg: false },
      { id: 171, name: 'Chicken Do Pyaza', price: 350, veg: false },
      { id: 172, name: 'Chicken Handi', price: 380, veg: false },
      { id: 173, name: 'Chicken Curry', price: 320, veg: false },
      { id: 174, name: 'Hyderabadi Chicken', price: 400, veg: false },
      { id: 175, name: 'Tandoori Chicken (Full)', price: 450, veg: false },
      { id: 176, name: 'Chicken Lollipop', price: 340, veg: false },
    ],
    'Main Course - Indian Mutton': [
      { id: 114, name: 'Mutton Rogan Josh', price: 450, veg: false },
      { id: 177, name: 'Mutton Biryani', price: 420, veg: false },
      { id: 178, name: 'Mutton Korma', price: 440, veg: false },
      { id: 179, name: 'Mutton Kadai', price: 460, veg: false },
      { id: 180, name: 'Mutton Keema', price: 380, veg: false },
      { id: 181, name: 'Mutton Do Pyaza', price: 430, veg: false },
      { id: 182, name: 'Mutton Masala', price: 450, veg: false },
      { id: 183, name: 'Mutton Curry', price: 420, veg: false },
      { id: 184, name: 'Mutton Nihari', price: 480, veg: false },
    ],
    'Main Course - Indian Fish & Seafood': [
      { id: 116, name: 'Fish Curry', price: 420, veg: false },
      { id: 185, name: 'Fish Fry', price: 380, veg: false },
      { id: 186, name: 'Fish Masala', price: 400, veg: false },
      { id: 187, name: 'Prawn Curry', price: 480, veg: false },
      { id: 188, name: 'Prawn Masala', price: 500, veg: false },
      { id: 189, name: 'Prawn Biryani', price: 450, veg: false },
      { id: 190, name: 'Prawn Butter Garlic', price: 520, veg: false },
      { id: 191, name: 'Fish Tikka Masala', price: 440, veg: false },
      { id: 192, name: 'Goan Fish Curry', price: 460, veg: false },
      { id: 193, name: 'Crab Masala', price: 550, veg: false },
    ],
    'Main Course - Indian Paneer': [
      { id: 6, name: 'Palak Paneer', price: 280, veg: true },
      { id: 9, name: 'Kadai Paneer', price: 300, veg: true },
      { id: 117, name: 'Paneer Butter Masala', price: 320, veg: true },
      { id: 194, name: 'Shahi Paneer', price: 330, veg: true },
      { id: 195, name: 'Paneer Do Pyaza', price: 290, veg: true },
      { id: 196, name: 'Paneer Tikka Masala', price: 310, veg: true },
      { id: 197, name: 'Paneer Korma', price: 300, veg: true },
      { id: 198, name: 'Paneer Bhurji', price: 280, veg: true },
      { id: 199, name: 'Matar Paneer', price: 270, veg: true },
      { id: 200, name: 'Paneer Lababdar', price: 340, veg: true },
    ],
    'Main Course - Indian Mushroom & Veg': [
      { id: 8, name: 'Dal Makhani', price: 220, veg: true },
      { id: 113, name: 'Veg Biryani', price: 280, veg: true },
      { id: 115, name: 'Chole Bhature', price: 180, veg: true },
      { id: 119, name: 'Veg Korma', price: 260, veg: true },
      { id: 201, name: 'Mushroom Masala', price: 280, veg: true },
      { id: 202, name: 'Mushroom Do Pyaza', price: 270, veg: true },
      { id: 203, name: 'Mushroom Kadai', price: 290, veg: true },
      { id: 204, name: 'Mushroom Tikka Masala', price: 300, veg: true },
      { id: 205, name: 'Mushroom Biryani', price: 260, veg: true },
      { id: 206, name: 'Mix Veg Curry', price: 240, veg: true },
    ],
    'Main Course - Chinese': [
      { id: 120, name: 'Veg Fried Rice', price: 200, veg: true },
      { id: 121, name: 'Chicken Fried Rice', price: 250, veg: false },
      { id: 122, name: 'Veg Hakka Noodles', price: 180, veg: true },
      { id: 123, name: 'Chicken Noodles', price: 230, veg: false },
      { id: 124, name: 'Manchurian (Veg)', price: 220, veg: true },
      { id: 125, name: 'Manchurian (Chicken)', price: 270, veg: false },
      { id: 126, name: 'Chilli Paneer', price: 280, veg: true },
      { id: 127, name: 'Chilli Chicken', price: 320, veg: false },
      { id: 207, name: 'Mushroom Fried Rice', price: 220, veg: true },
      { id: 208, name: 'Paneer Fried Rice', price: 230, veg: true },
      { id: 209, name: 'Prawn Fried Rice', price: 320, veg: false },
      { id: 210, name: 'Fish Fried Rice', price: 300, veg: false },
      { id: 211, name: 'Mutton Fried Rice', price: 280, veg: false },
      { id: 212, name: 'Mushroom Noodles', price: 200, veg: true },
      { id: 213, name: 'Prawn Noodles', price: 300, veg: false },
      { id: 214, name: 'Chilli Mushroom', price: 260, veg: true },
      { id: 215, name: 'Chilli Fish', price: 380, veg: false },
      { id: 216, name: 'Chilli Prawns', price: 420, veg: false },
      { id: 217, name: 'Szechuan Chicken', price: 340, veg: false },
      { id: 218, name: 'Szechuan Paneer', price: 300, veg: true },
    ],
    'Main Course - Continental': [
      { id: 128, name: 'Grilled Chicken Steak', price: 450, veg: false },
      { id: 129, name: 'Veg Burger', price: 180, veg: true },
      { id: 130, name: 'Chicken Burger', price: 220, veg: false },
      { id: 131, name: 'Cheese Pizza', price: 320, veg: true },
      { id: 132, name: 'Chicken Pizza', price: 380, veg: false },
      { id: 133, name: 'Pasta Alfredo', price: 280, veg: true },
      { id: 134, name: 'Pasta Bolognese', price: 320, veg: false },
      { id: 135, name: 'Fish & Chips', price: 380, veg: false },
      { id: 219, name: 'Mushroom Pizza', price: 340, veg: true },
      { id: 220, name: 'Paneer Pizza', price: 360, veg: true },
      { id: 221, name: 'Prawn Pizza', price: 450, veg: false },
      { id: 222, name: 'Mushroom Burger', price: 200, veg: true },
      { id: 223, name: 'Fish Burger', price: 260, veg: false },
      { id: 224, name: 'Grilled Fish Steak', price: 480, veg: false },
      { id: 225, name: 'Prawn Grilled', price: 520, veg: false },
      { id: 226, name: 'Mushroom Pasta', price: 300, veg: true },
      { id: 227, name: 'Chicken Pasta', price: 340, veg: false },
      { id: 228, name: 'Seafood Pasta', price: 420, veg: false },
    ],
    'Breads & Rice': [
      { id: 10, name: 'Butter Naan', price: 50, veg: true },
      { id: 11, name: 'Garlic Naan', price: 60, veg: true },
      { id: 12, name: 'Tandoori Roti', price: 25, veg: true },
      { id: 136, name: 'Cheese Naan', price: 80, veg: true },
      { id: 137, name: 'Kulcha', price: 45, veg: true },
      { id: 138, name: 'Paratha', price: 50, veg: true },
      { id: 139, name: 'Jeera Rice', price: 150, veg: true },
      { id: 140, name: 'Plain Rice', price: 100, veg: true },
      { id: 229, name: 'Stuffed Naan', price: 75, veg: true },
      { id: 230, name: 'Keema Naan', price: 120, veg: false },
      { id: 231, name: 'Paneer Paratha', price: 80, veg: true },
      { id: 232, name: 'Mushroom Naan', price: 85, veg: true },
    ],
    'Desserts': [
      { id: 13, name: 'Gulab Jamun', price: 120, veg: true },
      { id: 14, name: 'Ice Cream', price: 100, veg: true },
      { id: 15, name: 'Brownie with Ice Cream', price: 150, veg: true },
      { id: 141, name: 'Rasmalai', price: 140, veg: true },
      { id: 142, name: 'Gajar Halwa', price: 130, veg: true },
      { id: 143, name: 'Chocolate Lava Cake', price: 180, veg: true },
      { id: 144, name: 'Tiramisu', price: 200, veg: true },
      { id: 145, name: 'Fruit Salad', price: 120, veg: true },
      { id: 146, name: 'Cheesecake', price: 220, veg: true },
      { id: 233, name: 'Kheer', price: 90, veg: true },
      { id: 234, name: 'Kulfi', price: 80, veg: true },
      { id: 235, name: 'Jalebi', price: 70, veg: true },
    ],
    'Beverages': [
      { id: 16, name: 'Soft Drink', price: 60, veg: true },
      { id: 17, name: 'Sweet Lassi', price: 80, veg: true },
      { id: 18, name: 'Fresh Juice', price: 120, veg: true },
      { id: 147, name: 'Masala Chai', price: 40, veg: true },
      { id: 148, name: 'Coffee', price: 60, veg: true },
      { id: 149, name: 'Cold Coffee', price: 100, veg: true },
      { id: 150, name: 'Mineral Water', price: 30, veg: true },
      { id: 151, name: 'Mocktail', price: 150, veg: true },
      { id: 152, name: 'Buttermilk', price: 50, veg: true },
      { id: 153, name: 'Filter Coffee', price: 70, veg: true },
      { id: 236, name: 'Fresh Lime Soda', price: 60, veg: true },
      { id: 237, name: 'Virgin Mojito', price: 140, veg: true },
    ],
  };

  // Cafe menu with lighter items - beverages, snacks, and quick bites
  const cafeMenu = {
    'Cold Beverages': [
      { id: 301, name: 'Chocolate Milkshake', price: 120, veg: true },
      { id: 302, name: 'Vanilla Milkshake', price: 110, veg: true },
      { id: 303, name: 'Strawberry Milkshake', price: 130, veg: true },
      { id: 304, name: 'Mango Shake', price: 120, veg: true },
      { id: 305, name: 'Oreo Shake', price: 140, veg: true },
      { id: 306, name: 'Fresh Orange Juice', price: 100, veg: true },
      { id: 307, name: 'Watermelon Juice', price: 90, veg: true },
      { id: 308, name: 'Pineapple Juice', price: 100, veg: true },
      { id: 309, name: 'Mixed Fruit Juice', price: 120, veg: true },
      { id: 310, name: 'Iced Coffee', price: 110, veg: true },
      { id: 311, name: 'Iced Latte', price: 130, veg: true },
      { id: 312, name: 'Cold Coffee', price: 100, veg: true },
      { id: 313, name: 'Iced Tea (Lemon)', price: 80, veg: true },
      { id: 314, name: 'Iced Tea (Peach)', price: 80, veg: true },
    ],
    'Hot Beverages': [
      { id: 315, name: 'Espresso', price: 70, veg: true },
      { id: 316, name: 'Cappuccino', price: 90, veg: true },
      { id: 317, name: 'Latte', price: 100, veg: true },
      { id: 318, name: 'Americano', price: 80, veg: true },
      { id: 319, name: 'Flat White', price: 110, veg: true },
      { id: 320, name: 'Mocha', price: 120, veg: true },
      { id: 321, name: 'Hot Chocolate', price: 100, veg: true },
      { id: 322, name: 'Masala Chai', price: 50, veg: true },
      { id: 323, name: 'Green Tea', price: 60, veg: true },
      { id: 324, name: 'Lemon Tea', price: 50, veg: true },
      { id: 325, name: 'Herbal Tea', price: 70, veg: true },
    ],
    'Mocktails': [
      { id: 326, name: 'Virgin Mojito', price: 140, veg: true },
      { id: 327, name: 'Blue Lagoon', price: 150, veg: true },
      { id: 328, name: 'Fruit Punch', price: 130, veg: true },
      { id: 329, name: 'Pina Colada', price: 160, veg: true },
      { id: 330, name: 'Strawberry Daiquiri', price: 150, veg: true },
      { id: 331, name: 'Mango Tango', price: 140, veg: true },
      { id: 332, name: 'Sunset Orange', price: 130, veg: true },
    ],
    'Sandwiches & Wraps': [
      { id: 333, name: 'Veg Grilled Sandwich', price: 100, veg: true },
      { id: 334, name: 'Cheese Grilled Sandwich', price: 120, veg: true },
      { id: 335, name: 'Paneer Tikka Sandwich', price: 140, veg: true },
      { id: 336, name: 'Chicken Grilled Sandwich', price: 150, veg: false },
      { id: 337, name: 'Chicken Tikka Wrap', price: 160, veg: false },
      { id: 338, name: 'Egg Sandwich', price: 90, veg: false },
      { id: 339, name: 'Club Sandwich (Veg)', price: 130, veg: true },
      { id: 340, name: 'Club Sandwich (Chicken)', price: 170, veg: false },
    ],
    'Snacks': [
      { id: 341, name: 'French Fries', price: 80, veg: true },
      { id: 342, name: 'Peri Peri Fries', price: 100, veg: true },
      { id: 343, name: 'Cheese Fries', price: 120, veg: true },
      { id: 344, name: 'Veg Nuggets', price: 110, veg: true },
      { id: 345, name: 'Chicken Nuggets', price: 140, veg: false },
      { id: 346, name: 'Chicken Popcorn', price: 150, veg: false },
      { id: 347, name: 'Nachos with Salsa', price: 120, veg: true },
      { id: 348, name: 'Loaded Nachos', price: 160, veg: true },
      { id: 349, name: 'Chicken Wings (6 pcs)', price: 180, veg: false },
      { id: 350, name: 'Crispy Veg Fingers', price: 100, veg: true },
    ],
    'Pizzas': [
      { id: 351, name: 'Margherita Pizza (Personal)', price: 150, veg: true },
      { id: 352, name: 'Cheese Burst Pizza (Personal)', price: 180, veg: true },
      { id: 353, name: 'Veggie Supreme (Personal)', price: 170, veg: true },
      { id: 354, name: 'Paneer Tikka Pizza (Personal)', price: 190, veg: true },
      { id: 355, name: 'Chicken Tikka Pizza (Personal)', price: 200, veg: false },
      { id: 356, name: 'Pepperoni Pizza (Personal)', price: 210, veg: false },
      { id: 357, name: 'BBQ Chicken Pizza (Personal)', price: 220, veg: false },
    ],
    'Burgers': [
      { id: 358, name: 'Veg Cheese Burger', price: 120, veg: true },
      { id: 359, name: 'Paneer Burger', price: 130, veg: true },
      { id: 360, name: 'Crispy Veg Burger', price: 140, veg: true },
      { id: 361, name: 'Chicken Burger', price: 150, veg: false },
      { id: 362, name: 'Chicken Cheese Burger', price: 170, veg: false },
      { id: 363, name: 'Zinger Burger', price: 180, veg: false },
      { id: 364, name: 'Double Patty Burger', price: 200, veg: false },
    ],
    'Desserts': [
      { id: 365, name: 'Vanilla Ice Cream', price: 60, veg: true },
      { id: 366, name: 'Chocolate Ice Cream', price: 60, veg: true },
      { id: 367, name: 'Strawberry Ice Cream', price: 60, veg: true },
      { id: 368, name: 'Butterscotch Ice Cream', price: 70, veg: true },
      { id: 369, name: 'Ice Cream Sundae', price: 120, veg: true },
      { id: 370, name: 'Chocolate Brownie', price: 100, veg: true },
      { id: 371, name: 'Brownie with Ice Cream', price: 150, veg: true },
      { id: 372, name: 'Red Velvet Pastry', price: 110, veg: true },
      { id: 373, name: 'Chocolate Pastry', price: 100, veg: true },
      { id: 374, name: 'Black Forest Pastry', price: 110, veg: true },
      { id: 375, name: 'Cheesecake', price: 130, veg: true },
      { id: 376, name: 'Tiramisu', price: 140, veg: true },
    ],
  };

  const bookingIcons = {
    hotel: FaHotel,
    resort: FaHotel,
    restaurant: FaUtensils,
    cafe: FaCoffee,
    car: FaCar,
    bike: FaMotorcycle,
    bus: FaBus,
    train: FaTrain,
    flight: FaPlane,
    ship: FaShip,
    package: FaSuitcase,
  };

  const Icon = bookingIcons[bookingType] || FaHotel;

  // Reset selected items when modal closes or booking type changes
  useEffect(() => {
    if (!isOpen) {
      setSelectedMenuItems([]);
      setSelectedRoomType(null);
      setSelectedTransportType(null);
      setStep(1);
      setPaymentMethod('');
      setFormData({
        numberOfGuests: 1,
        adults: 1,
        children: 0,
        infants: 0,
        checkInDate: '',
        checkOutDate: '',
        bookingDate: '',
        bookingTime: '',
        departureDate: '',
        returnDate: '',
        roomType: '',
        numberOfRooms: 1,
        vehicleType: '',
        from: '',
        to: '',
        specialRequests: '',
      });
    }
  }, [isOpen, bookingType]);

  // Populate form with default data when provided
  useEffect(() => {
    if (isOpen && defaultFormData && Object.keys(defaultFormData).length > 0) {
      setFormData(prev => ({
        ...prev,
        ...defaultFormData,
      }));
    }
  }, [isOpen, defaultFormData]);

  const handleMenuItemChange = (item, quantity) => {
    setSelectedMenuItems(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (quantity === 0) {
        return prev.filter(i => i.id !== item.id);
      }
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...item, quantity } : i);
      }
      return [...prev, { ...item, quantity }];
    });
  };

  const getMenuItemQuantity = (itemId) => {
    const item = selectedMenuItems.find(i => i.id === itemId);
    return item ? item.quantity : 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Calculate distance between from and to locations
  const calculateDistance = async () => {
    if (!formData.from || !formData.to || !['car', 'bike', 'bus', 'train', 'flight', 'ship'].includes(bookingType)) {
      setRouteDistance(null);
      return;
    }

    setCalculatingDistance(true);
    try {
      const response = await fetch(
        `/api/maps/distance?from=${encodeURIComponent(formData.from)}&to=${encodeURIComponent(formData.to)}`
      );
      const result = await response.json();
      
      if (result.success && result.data) {
        setRouteDistance(result.data);
      } else {
        setRouteDistance(null);
        // Show server error message or default
        toast.error(result.message || 'Unable to calculate distance. Please check location names.');
      }
    } catch (error) {
      console.error('Distance calculation error:', error);
      setRouteDistance(null);
      toast.error('Failed to calculate distance. Please try again.');
    } finally {
      setCalculatingDistance(false);
    }
  };

  // Trigger distance calculation when from/to locations change
  useEffect(() => {
    // Debounce the distance calculation
    const timer = setTimeout(() => {
      if (formData.from && formData.to && ['car', 'bike', 'bus', 'train', 'flight', 'ship'].includes(bookingType)) {
        calculateDistance();
      }
    }, 1000); // Wait 1 second after user stops typing

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.from, formData.to, bookingType]);

  const calculatePrice = () => {
    let basePrice = placeDetails.basePrice || 1000;
    
    // Calculate total number of guests (adults + children, infants usually free)
    const totalGuests = parseInt(formData.adults) + parseInt(formData.children);
    
    // Price calculation based on booking type
    if (['hotel', 'resort', 'package'].includes(bookingType)) {
      // Use selected room type price if available
      if (selectedRoomType) {
        basePrice = selectedRoomType.price;
      }
      const checkIn = new Date(formData.checkInDate);
      const checkOut = new Date(formData.checkOutDate);
      const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
      // Multiply by nights, rooms, and number of adults (charge per adult)
      basePrice = nights > 0 ? basePrice * nights * formData.numberOfRooms * parseInt(formData.adults) : basePrice;
    } else if (['restaurant', 'cafe'].includes(bookingType)) {
      // Calculate from selected menu items if any, otherwise use base price × guests
      if (selectedMenuItems.length > 0) {
        basePrice = selectedMenuItems.reduce((total, item) => {
          return total + (item.price * item.quantity);
        }, 0);
      } else {
        basePrice = basePrice * totalGuests;
      }
    } else if (['car', 'bike'].includes(bookingType)) {
      // Use selected transport type price if available
      if (selectedTransportType) {
        // Check if distance is available for distance-based pricing
        if (routeDistance && routeDistance.distance) {
          const distanceKm = parseFloat(routeDistance.distance.kilometers);
          const pricePerKm = selectedTransportType.pricePerKm || 10;
          
          // Calculate price based on distance
          basePrice = distanceKm * pricePerKm;
          
          // Add base rental fee
          const departure = new Date(formData.departureDate);
          const returnDate = new Date(formData.returnDate);
          const days = Math.ceil((returnDate - departure) / (1000 * 60 * 60 * 24));
          
          // Add daily rental charges (base price per day)
          if (days > 0) {
            basePrice = (distanceKm * pricePerKm) + (selectedTransportType.price * days / 10); // 10% of daily rate as base
          }
        } else {
          // Fallback to day-based pricing when distance not available
          basePrice = selectedTransportType.price;
          const departure = new Date(formData.departureDate);
          const returnDate = new Date(formData.returnDate);
          const days = Math.ceil((returnDate - departure) / (1000 * 60 * 60 * 24));
          basePrice = days > 0 ? basePrice * days : basePrice;
        }
      }
      // Car/bike rentals don't multiply by passengers (one rental for all)
    } else if (['bus', 'train', 'flight', 'ship'].includes(bookingType)) {
      // Use selected transport type price if available (ticket price)
      if (selectedTransportType) {
        // Check if distance is available for distance-based pricing
        if (routeDistance && routeDistance.distance) {
          const distanceKm = parseFloat(routeDistance.distance.kilometers);
          const pricePerKm = selectedTransportType.pricePerKm || 2;
          
          // Calculate fare based on distance
          basePrice = distanceKm * pricePerKm;
          
          // If return date is provided, double the price for round trip
          if (formData.returnDate && formData.returnDate > formData.departureDate) {
            basePrice = basePrice * 2;
          }
        } else {
          // Fallback to fixed pricing when distance not available
          basePrice = selectedTransportType.price;
          
          // If return date is provided, double the price for round trip
          if (formData.returnDate && formData.returnDate > formData.departureDate) {
            basePrice = basePrice * 2;
          }
        }
      }
      // Multiply by number of passengers for tickets (adults + children)
      basePrice = basePrice * totalGuests;
    }
    
    const taxes = basePrice * 0.18; // 18% GST
    const serviceFee = basePrice * 0.05; // 5% service fee
    const totalPrice = basePrice + taxes + serviceFee;
    
    return { basePrice, taxes, serviceFee, totalPrice };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate required fields based on booking type
    if (['hotel', 'resort', 'package'].includes(bookingType)) {
      if (!formData.checkInDate || !formData.checkOutDate) {
        toast.error('Please select check-in and check-out dates');
        return;
      }
      if (new Date(formData.checkOutDate) <= new Date(formData.checkInDate)) {
        toast.error('Check-out date must be after check-in date');
        return;
      }
    } else if (['restaurant', 'cafe'].includes(bookingType)) {
      if (!formData.bookingDate || !formData.bookingTime) {
        toast.error('Please select booking date and time');
        return;
      }
    } else if (['car', 'bike', 'bus', 'train', 'flight', 'ship'].includes(bookingType)) {
      if (!formData.departureDate) {
        toast.error('Please select departure date');
        return;
      }
      if (['car', 'bike'].includes(bookingType)) {
        // Return date is required for car and bike rentals
        if (!formData.returnDate) {
          toast.error('Please select return date');
          return;
        }
        if (new Date(formData.returnDate) <= new Date(formData.departureDate)) {
          toast.error('Return date must be after departure date');
          return;
        }
      } else if (formData.returnDate) {
        // Return date is optional for bus, train, flight, ship (one-way or round-trip)
        if (new Date(formData.returnDate) <= new Date(formData.departureDate)) {
          toast.error('Return date must be after departure date');
          return;
        }
      }
      if (!formData.from || !formData.to) {
        toast.error('Please enter from and to locations');
        return;
      }
    }

    // Proceed to payment step
    setStep(2);
  };

  const handlePayment = async () => {
    if (!paymentMethod) {
      toast.error('Please select a payment method');
      return;
    }

    setProcessingPayment(true);
    setLoading(true);

    try {
      const pricing = calculatePrice();
      
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Calculate total number of guests from adults + children
      const totalGuests = parseInt(formData.adults) + parseInt(formData.children);
      
      const bookingData = {
        bookingType,
        bookingDetails: {
          name: placeDetails.name || 'Booking',
          description: placeDetails.description || '',
          location: {
            address: placeDetails.address || '',
            city: placeDetails.city || '',
            country: placeDetails.country || 'India',
            coordinates: placeDetails.coordinates || { lat: 0, lng: 0 },
          },
          rating: placeDetails.rating || 0,
          contactInfo: {
            phone: placeDetails.phone || '',
            email: placeDetails.email || '',
          },
        },
        numberOfGuests: totalGuests,
        guestDetails: {
          adults: parseInt(formData.adults),
          children: parseInt(formData.children),
          infants: parseInt(formData.infants),
        },
        pricing: {
          basePrice: pricing.basePrice,
          taxes: pricing.taxes,
          serviceFee: pricing.serviceFee,
          totalPrice: pricing.totalPrice,
          currency: 'INR',
        },
        paymentStatus: 'paid',
        paymentMethod: paymentMethod,
        paymentDetails: {
          gateway: 'razorpay',
          orderId: `order_${Date.now()}`,
          paymentId: `pay_${Math.random().toString(36).substring(7)}`,
          paidAt: new Date(),
        },
        specialRequests: formData.specialRequests,
      };

      // Add type-specific fields
      if (['hotel', 'resort'].includes(bookingType)) {
        bookingData.checkInDate = formData.checkInDate;
        bookingData.checkOutDate = formData.checkOutDate;
        bookingData.roomDetails = {
          roomType: selectedRoomType ? selectedRoomType.name : (formData.roomType || 'Standard'),
          numberOfRooms: parseInt(formData.numberOfRooms),
          pricePerNight: selectedRoomType ? selectedRoomType.price : (placeDetails.basePrice || 1000),
          amenities: selectedRoomType ? selectedRoomType.amenities : [],
          capacity: selectedRoomType ? selectedRoomType.capacity : 2,
        };
      } else if (bookingType === 'package') {
        bookingData.checkInDate = formData.checkInDate;
        bookingData.checkOutDate = formData.checkOutDate;
      } else if (['restaurant', 'cafe'].includes(bookingType)) {
        bookingData.bookingDate = formData.bookingDate;
        bookingData.bookingTime = formData.bookingTime;
        if (selectedMenuItems.length > 0) {
          bookingData.restaurantDetails = {
            orderedItems: selectedMenuItems.map(item => ({
              itemName: item.name,
              quantity: item.quantity,
              price: item.price,
              category: Object.keys(restaurantMenu).find(cat => 
                restaurantMenu[cat].some(menuItem => menuItem.id === item.id)
              ),
            })),
            totalItems: selectedMenuItems.reduce((sum, item) => sum + item.quantity, 0),
          };
        }
      } else if (['car', 'bike', 'bus', 'train', 'flight', 'ship'].includes(bookingType)) {
        bookingData.departureDate = formData.departureDate;
        // Include return date if provided (required for car/bike, optional for others)
        if (formData.returnDate) {
          bookingData.returnDate = formData.returnDate;
        }
        bookingData.transportDetails = {
          from: { location: formData.from },
          to: { location: formData.to },
          vehicleType: selectedTransportType ? selectedTransportType.name : (formData.vehicleType || bookingType),
          pricePerUnit: selectedTransportType ? selectedTransportType.price : (placeDetails.basePrice || 1000),
          features: selectedTransportType ? selectedTransportType.features : [],
          capacity: selectedTransportType ? selectedTransportType.capacity : 4,
        };
      }

      console.log('Sending booking data:', bookingData);
      const response = await bookingAPI.createBooking(bookingData);
      console.log('Booking response:', response);

      if (response.data.success) {
        // Show detailed confirmation message
        const bookingRef = response.data.data.bookingReference;
        const bookingTypeName = bookingType.charAt(0).toUpperCase() + bookingType.slice(1);
        
        toast.success(
          (t) => (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <FaCheckCircle className="text-green-500 text-xl" />
                <span className="font-bold text-lg">Booking Confirmed!</span>
              </div>
              <div className="text-sm space-y-1">
                <p>✅ Your {bookingTypeName} booking is confirmed</p>
                <p>📧 Confirmation email sent to your registered email</p>
                <p className="font-semibold text-blue-600">Ref: {bookingRef}</p>
                <p className="text-xs text-gray-600 mt-2">Check your email for complete booking details</p>
              </div>
            </div>
          ),
          { 
            duration: 8000,
            style: {
              minWidth: '300px',
            },
          }
        );
        
        // Small delay before closing to let user see the success state
        setTimeout(() => {
          onClose();
        }, 1000);
      }
    } catch (error) {
      console.error('Booking error:', error);
      console.error('Error response:', error.response);
      console.error('Error data:', error.response?.data);
      
      let errorMessage = 'Payment failed. Please try again.';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.errors) {
        errorMessage = error.response.data.errors.map(e => e.msg).join(', ');
      } else if (error.response?.data?.error) {
        if (typeof error.response.data.error === 'object') {
          errorMessage = JSON.stringify(error.response.data.error);
        } else {
          errorMessage = error.response.data.error;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage, { duration: 6000 });
    } finally {
      setLoading(false);
      setProcessingPayment(false);
    }
  };

  if (!isOpen) return null;

  const pricing = calculatePrice();

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Icon className="text-3xl text-white" />
              <div>
                <h2 className="text-2xl font-bold text-white">
                  Book {bookingType.charAt(0).toUpperCase() + bookingType.slice(1)}
                </h2>
                <p className="text-blue-100 text-sm">{placeDetails.name || 'Complete your booking'}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
            >
              <FaTimes className="text-xl" />
            </button>
          </div>

          {/* Step Indicator */}
          <div className="px-6 pt-4 pb-2 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`flex items-center gap-2 ${step === 1 ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 1 ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'}`}>
                    1
                  </div>
                  <span className="font-medium">Booking Details</span>
                </div>
                <div className="w-12 h-0.5 bg-gray-300 dark:bg-gray-600"></div>
                <div className={`flex items-center gap-2 ${step === 2 ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 2 ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'}`}>
                    2
                  </div>
                  <span className="font-medium">Payment</span>
                </div>
              </div>
            </div>
          </div>

          {/* Step 1: Booking Form */}
          {step === 1 && (
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1">
            <div className="space-y-4">
              {/* Guest Details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    <FaUsers className="inline mr-2" />
                    Adults
                  </label>
                  <input
                    type="number"
                    name="adults"
                    min="1"
                    value={formData.adults}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Children
                  </label>
                  <input
                    type="number"
                    name="children"
                    min="0"
                    value={formData.children}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>

              {/* Date fields based on booking type */}
              {['hotel', 'resort', 'package'].includes(bookingType) && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        <FaCalendar className="inline mr-2" />
                        Check-in Date
                      </label>
                      <input
                        type="date"
                        name="checkInDate"
                        value={formData.checkInDate}
                        onChange={handleChange}
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Check-out Date
                      </label>
                      <input
                        type="date"
                        name="checkOutDate"
                        value={formData.checkOutDate}
                        onChange={handleChange}
                        min={formData.checkInDate || new Date().toISOString().split('T')[0]}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                        required
                      />
                    </div>
                  </div>
                  
                  {/* Room-specific fields only for hotels/resorts */}
                  {['hotel', 'resort'].includes(bookingType) && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Number of Rooms
                        </label>
                        <input
                          type="number"
                          name="numberOfRooms"
                          min="1"
                          value={formData.numberOfRooms}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                          required
                        />
                      </div>
                  
                      {/* Room Type Selection */}
                      <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <FaHotel className="inline mr-2" />
                      Select Room Type
                    </label>
                    <div className="max-h-80 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-lg p-3 bg-gray-50 dark:bg-gray-800">
                      {Object.keys(hotelRoomTypes).map((category) => (
                        <div key={category} className="mb-4 last:mb-0">
                          <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-2 sticky top-0 bg-gray-50 dark:bg-gray-800 py-1">
                            {category}
                          </h4>
                          <div className="space-y-2">
                            {hotelRoomTypes[category].map((room) => (
                              <div
                                key={room.id}
                                onClick={() => setSelectedRoomType(room)}
                                className={`p-3 border rounded-lg cursor-pointer transition-all ${
                                  selectedRoomType?.id === room.id
                                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 ring-2 ring-blue-500'
                                    : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500'
                                }`}
                              >
                                <div className="flex justify-between items-start mb-1">
                                  <div>
                                    <span className="font-semibold text-gray-900 dark:text-white">
                                      {room.name}
                                    </span>
                                    <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                                      (up to {room.capacity} guests)
                                    </span>
                                  </div>
                                  <span className="font-bold text-blue-600 dark:text-blue-400 flex items-center">
                                    <FaRupeeSign className="text-sm" />
                                    {room.price}
                                    <span className="text-xs text-gray-500 ml-1">/night</span>
                                  </span>
                                </div>
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {room.amenities.map((amenity, idx) => (
                                    <span
                                      key={idx}
                                      className="text-xs px-2 py-0.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full"
                                    >
                                      {amenity}
                                    </span>
                                  ))}
                                </div>
                                {selectedRoomType?.id === room.id && (
                                  <div className="mt-2 flex items-center text-sm text-blue-600 dark:text-blue-400">
                                    <FaCheckCircle className="mr-1" />
                                    Selected
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                    {selectedRoomType && (
                      <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <div className="text-sm font-semibold text-blue-800 dark:text-blue-200">
                          Selected: {selectedRoomType.name} - ₹{selectedRoomType.price}/night × {formData.numberOfRooms} room(s) × {formData.adults} adult(s)
                        </div>
                      </div>
                    )}
                  </div>
                    </>
                  )}
                </>
              )}

              {['restaurant', 'cafe'].includes(bookingType) && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        <FaCalendar className="inline mr-2" />
                        Booking Date
                      </label>
                      <input
                        type="date"
                        name="bookingDate"
                        value={formData.bookingDate}
                        onChange={handleChange}
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        <FaClock className="inline mr-2" />
                        Booking Time
                      </label>
                      <input
                        type="time"
                        name="bookingTime"
                        value={formData.bookingTime}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                        required
                      />
                    </div>
                  </div>

                  {/* Menu Selection */}
                  <div className="mt-4">
                    <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                      <FaUtensils className="text-orange-500" />
                      {bookingType === 'cafe' ? 'Select Cafe Items (Optional)' : 'Select Food Items (Optional)'}
                    </h4>
                    <div className="max-h-96 overflow-y-auto border border-gray-200 dark:border-gray-600 rounded-lg p-3 bg-gray-50 dark:bg-gray-700/50">
                      {Object.entries(bookingType === 'cafe' ? cafeMenu : restaurantMenu).map(([category, items]) => (
                        <div key={category} className="mb-4 last:mb-0">
                          <h5 className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">
                            {category}
                          </h5>
                          <div className="space-y-2">
                            {items.map((item) => (
                              <div
                                key={item.id}
                                className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded-lg hover:shadow-md transition-shadow"
                              >
                                <div className="flex-1">
                                  <div className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                    {item.name}
                                    {item.veg && <span className="text-xs px-1 py-0.5 bg-green-100 text-green-800 rounded">VEG</span>}
                                  </div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400">
                                    ₹{item.price}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => handleMenuItemChange(item, Math.max(0, getMenuItemQuantity(item.id) - 1))}
                                    className="w-7 h-7 rounded-full bg-red-500 text-white hover:bg-red-600 flex items-center justify-center text-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                                    disabled={getMenuItemQuantity(item.id) === 0}
                                  >
                                    −
                                  </button>
                                  <span className="w-8 text-center font-bold text-gray-900 dark:text-white">
                                    {getMenuItemQuantity(item.id)}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleMenuItemChange(item, getMenuItemQuantity(item.id) + 1)}
                                    className="w-7 h-7 rounded-full bg-green-500 text-white hover:bg-green-600 flex items-center justify-center text-lg font-bold"
                                  >
                                    +
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                    {selectedMenuItems.length > 0 && (
                      <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <p className="text-sm font-semibold text-blue-900 dark:text-blue-200">
                          {selectedMenuItems.reduce((sum, item) => sum + item.quantity, 0)} items selected
                        </p>
                        <div className="mt-1 text-xs text-blue-700 dark:text-blue-300 space-y-0.5">
                          {selectedMenuItems.map(item => (
                            <div key={item.id}>
                              {item.name} × {item.quantity} = ₹{item.price * item.quantity}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}

              {['car', 'bike', 'bus', 'train', 'flight', 'ship'].includes(bookingType) && (
                <>
                  {/* Transport Type Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {bookingType === 'car' && <FaCar className="inline mr-2" />}
                      {bookingType === 'bike' && <FaMotorcycle className="inline mr-2" />}
                      {bookingType === 'bus' && <FaBus className="inline mr-2" />}
                      {bookingType === 'train' && <FaTrain className="inline mr-2" />}
                      {bookingType === 'flight' && <FaPlane className="inline mr-2" />}
                      {bookingType === 'ship' && <FaShip className="inline mr-2" />}
                      Select {bookingType.charAt(0).toUpperCase() + bookingType.slice(1)} Type
                    </label>
                    <div className="max-h-80 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-lg p-3 bg-gray-50 dark:bg-gray-800">
                      {Object.keys(transportTypes[bookingType] || {}).map((category) => (
                        <div key={category} className="mb-4 last:mb-0">
                          <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-2 sticky top-0 bg-gray-50 dark:bg-gray-800 py-1">
                            {category}
                          </h4>
                          <div className="space-y-2">
                            {transportTypes[bookingType][category].map((transport) => (
                              <div
                                key={transport.id}
                                onClick={() => setSelectedTransportType(transport)}
                                className={`p-3 border rounded-lg cursor-pointer transition-all ${
                                  selectedTransportType?.id === transport.id
                                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 ring-2 ring-blue-500'
                                    : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500'
                                }`}
                              >
                                <div className="flex justify-between items-start mb-1">
                                  <div>
                                    <span className="font-semibold text-gray-900 dark:text-white">
                                      {transport.name}
                                    </span>
                                    <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                                      (capacity: {transport.capacity})
                                    </span>
                                  </div>
                                  <span className="font-bold text-blue-600 dark:text-blue-400 flex items-center">
                                    <FaRupeeSign className="text-sm" />
                                    {transport.price}
                                    <span className="text-xs text-gray-500 ml-1">
                                      /{['car', 'bike'].includes(bookingType) ? 'day' : 'ticket'}
                                    </span>
                                  </span>
                                </div>
                                <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                  Distance rate: ₹{transport.pricePerKm}/km
                                </div>
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {transport.features.map((feature, idx) => (
                                    <span
                                      key={idx}
                                      className="text-xs px-2 py-0.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full"
                                    >
                                      {feature}
                                    </span>
                                  ))}
                                </div>
                                {selectedTransportType?.id === transport.id && (
                                  <div className="mt-2 flex items-center text-sm text-blue-600 dark:text-blue-400">
                                    <FaCheckCircle className="mr-1" />
                                    Selected
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                    {selectedTransportType && (
                      <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <div className="text-sm font-semibold text-blue-800 dark:text-blue-200">
                          Selected: {selectedTransportType.name} - ₹{selectedTransportType.price}/{['car', 'bike'].includes(bookingType) ? 'day' : 'ticket'}
                          {['bus', 'train', 'flight', 'ship'].includes(bookingType) && (
                            <>
                              {formData.returnDate && formData.returnDate > formData.departureDate && ' × 2 (round trip)'}
                              {` × ${parseInt(formData.adults) + parseInt(formData.children)} passenger(s)`}
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        From
                      </label>
                      <input
                        type="text"
                        name="from"
                        value={formData.from}
                        onChange={handleChange}
                        placeholder="Starting location"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        To
                      </label>
                      <input
                        type="text"
                        name="to"
                        value={formData.to}
                        onChange={handleChange}
                        placeholder="Destination"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                        required
                      />
                    </div>
                  </div>
                  
                  {/* Distance Information */}
                  {(['car', 'bike', 'bus', 'train', 'flight', 'ship'].includes(bookingType)) && (formData.from || formData.to) && (
                    <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
                      {calculatingDistance ? (
                        <div className="flex items-center justify-center space-x-2 text-blue-600 dark:text-blue-400">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 dark:border-blue-400"></div>
                          <span className="text-sm font-medium">Calculating distance...</span>
                        </div>
                      ) : routeDistance ? (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <div className="p-2 bg-blue-500 rounded-lg">
                                <FaCar className="text-white" />
                              </div>
                              <div>
                                <div className="text-xs text-gray-600 dark:text-gray-400">Route Distance</div>
                                <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
                                  {routeDistance.distance.kilometers} km
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-xs text-gray-600 dark:text-gray-400">Estimated Time</div>
                              <div className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                                {routeDistance.duration.text}
                              </div>
                            </div>
                          </div>
                          {selectedTransportType && selectedTransportType.pricePerKm && (
                            <div className="pt-2 mt-2 border-t border-blue-200 dark:border-blue-700">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-700 dark:text-gray-300">Rate per km:</span>
                                <span className="font-semibold text-gray-900 dark:text-white">
                                  ₹{selectedTransportType.pricePerKm}/km
                                </span>
                              </div>
                              <div className="flex items-center justify-between text-sm mt-1">
                                <span className="text-gray-700 dark:text-gray-300">Distance charge:</span>
                                <span className="font-semibold text-green-600 dark:text-green-400">
                                  ₹{(parseFloat(routeDistance.distance.kilometers) * selectedTransportType.pricePerKm).toFixed(2)}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (formData.from && formData.to) ? (
                        <div className="text-center text-sm text-gray-600 dark:text-gray-400">
                          <p>Enter valid locations to calculate distance</p>
                        </div>
                      ) : (
                        <div className="text-center text-sm text-gray-600 dark:text-gray-400">
                          <p>Enter departure and destination to see route details</p>
                        </div>
                      )}
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        <FaCalendar className="inline mr-2" />
                        Departure Date
                      </label>
                      <input
                        type="date"
                        name="departureDate"
                        value={formData.departureDate}
                        onChange={handleChange}
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Return Date {['bus', 'train', 'flight', 'ship'].includes(bookingType) && <span className="text-xs text-gray-500">(Optional - for round trip)</span>}
                      </label>
                      <input
                        type="date"
                        name="returnDate"
                        value={formData.returnDate}
                        onChange={handleChange}
                        min={formData.departureDate || new Date().toISOString().split('T')[0]}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                        required={['car', 'bike'].includes(bookingType)}
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Special Requests */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Special Requests (Optional)
                </label>
                <textarea
                  name="specialRequests"
                  value={formData.specialRequests}
                  onChange={handleChange}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Any special requirements or preferences..."
                />
              </div>

              {/* Price Breakdown */}
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg space-y-2">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Price Breakdown</h3>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Base Price:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    <FaRupeeSign className="inline" />{pricing.basePrice.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Taxes (18%):</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    <FaRupeeSign className="inline" />{pricing.taxes.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Service Fee (5%):</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    <FaRupeeSign className="inline" />{pricing.serviceFee.toLocaleString()}
                  </span>
                </div>
                <div className="border-t border-gray-300 dark:border-gray-600 pt-2 mt-2 flex justify-between">
                  <span className="font-bold text-gray-900 dark:text-white">Total Price:</span>
                  <span className="font-bold text-blue-600 dark:text-blue-400 text-lg">
                    <FaRupeeSign className="inline" />{pricing.totalPrice.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </form>
          )}

          {/* Step 2: Payment Selection */}
          {step === 2 && (
            <div className="p-6 overflow-y-auto flex-1">
              <div className="space-y-6">
                {/* Total Amount Display */}
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 rounded-xl text-white">
                  <div className="text-sm opacity-90 mb-1">Total Amount</div>
                  <div className="text-4xl font-bold flex items-center gap-2">
                    <FaRupeeSign className="text-3xl" />
                    {pricing.totalPrice.toLocaleString()}
                  </div>
                  <div className="text-sm opacity-75 mt-2">
                    Including taxes and service fees
                  </div>
                </div>

                {/* Payment Methods */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <FaLock className="text-green-500" />
                    Select Payment Method
                  </h3>
                  <div className="grid grid-cols-1 gap-3">
                    {/* Credit/Debit Card */}
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('card')}
                      className={`p-4 border-2 rounded-xl transition-all ${
                        paymentMethod === 'card'
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <FaCreditCard className={`text-3xl ${paymentMethod === 'card' ? 'text-blue-600' : 'text-gray-400'}`} />
                        <div className="text-left flex-1">
                          <div className="font-semibold text-gray-900 dark:text-white">Credit / Debit Card</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">Visa, Mastercard, RuPay, Amex</div>
                        </div>
                        {paymentMethod === 'card' && (
                          <FaCheckCircle className="text-blue-600 text-xl" />
                        )}
                      </div>
                    </button>

                    {/* UPI */}
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('upi')}
                      className={`p-4 border-2 rounded-xl transition-all ${
                        paymentMethod === 'upi'
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <FaMobileAlt className={`text-3xl ${paymentMethod === 'upi' ? 'text-blue-600' : 'text-gray-400'}`} />
                        <div className="text-left flex-1">
                          <div className="font-semibold text-gray-900 dark:text-white">UPI</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">Google Pay, PhonePe, Paytm</div>
                        </div>
                        {paymentMethod === 'upi' && (
                          <FaCheckCircle className="text-blue-600 text-xl" />
                        )}
                      </div>
                    </button>

                    {/* UPI Payment Section */}
                    {paymentMethod === 'upi' && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="p-6 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl border-2 border-blue-200 dark:border-blue-700"
                      >
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-2 mb-4">
                            <FaMobileAlt className="text-2xl text-blue-600" />
                            <h4 className="text-lg font-bold text-gray-900 dark:text-white">Pay with UPI</h4>
                          </div>

                          {/* Amount Display */}
                          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg mb-4">
                            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Amount to Pay</div>
                            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 flex items-center justify-center gap-1">
                              <FaRupeeSign className="text-2xl" />
                              {calculatePrice().totalPrice.toLocaleString()}
                            </div>
                          </div>

                          {/* Instructions */}
                          <div className="text-left space-y-2 bg-white dark:bg-gray-800 p-4 rounded-lg">
                            <p className="font-semibold text-gray-900 dark:text-white mb-2">Payment Instructions:</p>
                            <ol className="text-sm text-gray-700 dark:text-gray-300 space-y-1 list-decimal list-inside">
                              <li>Open any UPI app (Google Pay, PhonePe, Paytm, etc.)</li>
                              <li>Enter the amount ₹{calculatePrice().totalPrice.toLocaleString()}</li>
                              <li>Complete the payment</li>
                            </ol>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* Net Banking */}
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('netbanking')}
                      className={`p-4 border-2 rounded-xl transition-all ${
                        paymentMethod === 'netbanking'
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <FaUniversity className={`text-3xl ${paymentMethod === 'netbanking' ? 'text-blue-600' : 'text-gray-400'}`} />
                        <div className="text-left flex-1">
                          <div className="font-semibold text-gray-900 dark:text-white">Net Banking</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">All major banks supported</div>
                        </div>
                        {paymentMethod === 'netbanking' && (
                          <FaCheckCircle className="text-blue-600 text-xl" />
                        )}
                      </div>
                    </button>

                    {/* Wallet */}
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('wallet')}
                      className={`p-4 border-2 rounded-xl transition-all ${
                        paymentMethod === 'wallet'
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <FaWallet className={`text-3xl ${paymentMethod === 'wallet' ? 'text-blue-600' : 'text-gray-400'}`} />
                        <div className="text-left flex-1">
                          <div className="font-semibold text-gray-900 dark:text-white">Wallet</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">Paytm, PhonePe, Amazon Pay</div>
                        </div>
                        {paymentMethod === 'wallet' && (
                          <FaCheckCircle className="text-blue-600 text-xl" />
                        )}
                      </div>
                    </button>

                    {/* Cash on Arrival */}
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('cash')}
                      className={`p-4 border-2 rounded-xl transition-all ${
                        paymentMethod === 'cash'
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <FaMoneyBillWave className={`text-3xl ${paymentMethod === 'cash' ? 'text-blue-600' : 'text-gray-400'}`} />
                        <div className="text-left flex-1">
                          <div className="font-semibold text-gray-900 dark:text-white">Cash on Arrival</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">Pay when you reach</div>
                        </div>
                        {paymentMethod === 'cash' && (
                          <FaCheckCircle className="text-blue-600 text-xl" />
                        )}
                      </div>
                    </button>
                  </div>
                </div>

                {/* Security Note */}
                <div className="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <FaLock className="text-green-600 dark:text-green-400 mt-1" />
                  <div className="text-sm text-green-800 dark:text-green-200">
                    <div className="font-semibold mb-1">Secure Payment</div>
                    <div className="opacity-90">Your payment information is encrypted and secure. We never store your card details.</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="p-6 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
            {step === 1 ? (
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg font-semibold hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <FaCheckCircle />
                      Continue to Payment
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  disabled={processingPayment}
                  className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg font-semibold hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <FaArrowLeft />
                  Back to Details
                </button>
                <button
                  onClick={handlePayment}
                  disabled={processingPayment || !paymentMethod}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {processingPayment ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Processing Payment...
                    </>
                  ) : (
                    <>
                      <FaLock />
                      Pay ₹{pricing.totalPrice.toLocaleString()}
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default BookingModal;
