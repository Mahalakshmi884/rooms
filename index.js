const express = require('express');
const app = express();
app.use(express.json());

const PORT = 3000;

// In-memory data storage
let rooms = [];
let bookings = [];
let customers = [];
let bookingIdCounter = 1;

/**
 * Endpoint to create a new room
 * Request body should include:
 * - numberOfSeats: Number of seats available in the room
 * - amenities: List of amenities available in the room
 * - pricePerHour: Price for 1 hour of booking
 * - roomName: Name of the room
 */
app.post('/rooms', (req, res) => {
    const { numberOfSeats, amenities, pricePerHour, roomName } = req.body;
    const room = {
        id: rooms.length + 1,
        numberOfSeats,
        amenities,
        pricePerHour,
        roomName
    };
    rooms.push(room);
    res.status(201).send(room);
});

/**
 * Endpoint to book a room
 * Request body should include:
 * - customerName: Name of the customer
 * - date: Date of the booking
 * - startTime: Start time of the booking
 * - endTime: End time of the booking
 * - roomId: ID of the room to be booked
 */
app.post('/bookings', (req, res) => {
    const { customerName, date, startTime, endTime, roomId } = req.body;

    // Check if the room is already booked for the given date and time
    const isRoomBooked = bookings.some(booking =>
        booking.roomId === roomId && booking.date === date &&
        ((startTime >= booking.startTime && startTime < booking.endTime) ||
        (endTime > booking.startTime && endTime <= booking.endTime))
    );

    if (isRoomBooked) {
        return res.status(400).send({ message: 'Room is already booked for the given date and time' });
    }

    const booking = {
        id: bookingIdCounter++,
        customerName,
        date,
        startTime,
        endTime,
        roomId,
        bookingDate: new Date(),
        bookingStatus: 'confirmed'
    };

    bookings.push(booking);
    customers.push({ name: customerName, bookingId: booking.id });

    res.status(201).send(booking);
});

/**
 * Endpoint to list all rooms with their booking data
 */
app.get('/rooms', (req, res) => {
    const roomsWithBookingData = rooms.map(room => {
        const roomBookings = bookings.filter(booking => booking.roomId === room.id);
        return {
            ...room,
            bookings: roomBookings.map(booking => ({
                customerName: booking.customerName,
                date: booking.date,
                startTime: booking.startTime,
                endTime: booking.endTime
            }))
        };
    });

    res.send(roomsWithBookingData);
});

/**
 * Endpoint to list all customers with their booking data
 */
app.get('/customers', (req, res) => {
    const customersWithBookingData = customers.map(customer => {
        const customerBookings = bookings.filter(booking => booking.customerName === customer.name);
        return {
            customerName: customer.name,
            bookings: customerBookings.map(booking => ({
                roomName: rooms.find(room => room.id === booking.roomId).roomName,
                date: booking.date,
                startTime: booking.startTime,
                endTime: booking.endTime
            }))
        };
    });

    res.send(customersWithBookingData);
});

/**
 * Endpoint to list the booking history of a specific customer
 * URL parameter should include:
 * - name: Name of the customer
 */
app.get('/customers/:name/bookings', (req, res) => {
    const customerName = req.params.name;
    const customerBookings = bookings.filter(booking => booking.customerName === customerName);

    const bookingDetails = customerBookings.map(booking => ({
        roomName: rooms.find(room => room.id === booking.roomId).roomName,
        date: booking.date,
        startTime: booking.startTime,
        endTime: booking.endTime,
        bookingId: booking.id,
        bookingDate: booking.bookingDate,
        bookingStatus: booking.bookingStatus
    }));

    res.send({ customerName, bookings: bookingDetails });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
