const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const sql = require('mssql');
const jwt = require('jsonwebtoken'); // นำเข้า JWT
const bcrypt = require('bcryptjs');  // For password hashing

const app = express();
const port = 3000;

app.use(cors());
app.use(bodyParser.json());

const config = {
    user: 'sa',
    password: '1234',
    server: '127.0.0.1',
    database: 'ShineandDrive',
    synchronize: true,
    options: {
        encrypt: false,
        trustServerCertificate: true,
        enableArithAbort: true
    },
    port: 1433,
};

require('dotenv').config();
const secretKey = process.env.SECRET_KEY;

if (!secretKey) {
    console.error('SECRET_KEY is not defined in the environment variables');
    process.exit(1);
}

// Middleware สำหรับยืนยัน JWT Token
const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(403).json({ message: 'No token provided' });
    }

    jwt.verify(token, secretKey, (err, decoded) => {
        if (err) {
            return res.status(401).json({ message: 'Failed to authenticate token' });
        }

        req.user = decoded;
        next();
    });
};

// Login route
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required' });
    }

    try {
        const pool = await sql.connect(config);
        const result = await pool.request()
            .input('username', sql.VarChar, username)
            .query('SELECT * FROM User_Account WHERE username = @username');

        if (result.recordset.length > 0) {
            const user = result.recordset[0];

            // Compare hashed password
            const isValidPassword = await bcrypt.compare(password, user.password);

            if (isValidPassword) {
                const token = jwt.sign(
                    { userId: user.userId, username: user.username, role: user.role },
                    secretKey,
                    { expiresIn: '1h' }
                );

                return res.status(200).json({
                    message: 'Login successful',
                    token: token,
                    user: {
                        id: user.userId, // Make sure the user ID is sent
                        role: user.role,
                        username: user.username
                    }
                });
            } else {
                return res.status(401).json({ message: 'Invalid username or password' });
            }
        } else {
            return res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        console.error('Database error:', error);
        return res.status(500).json({ message: 'Server error' });
    }
});


// Signup route
// Signup route with role validation
app.post('/signup', async (req, res) => {
    const { firstname, lastname, username, password, email, phonenumber, confirmpassword, role } = req.body;

    // Set 'customer' as the default role if no role is provided
    const userRole = role || 'customer';

    if (password !== confirmpassword) {
        return res.status(400).send({ message: 'Passwords do not match' });
    }

    try {
        const pool = await sql.connect(config);

        // Check if username or email already exists
        const checkUser = await pool.request()
            .input('username', sql.VarChar(100), username)
            .input('email', sql.VarChar(50), email)
            .query('SELECT * FROM User_Account WHERE username = @username OR email = @email');

        if (checkUser.recordset.length > 0) {
            return res.status(400).send({ message: 'Username or Email already exists' });
        }

        // Hash the password before storing it
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert new user into the database
        const result = await pool.request()
            .input('firstname', sql.NVarChar(50), firstname)
            .input('lastname', sql.NVarChar(100), lastname)
            .input('username', sql.VarChar(100), username)
            .input('password', sql.VarChar(100), hashedPassword) // Save hashed password
            .input('email', sql.VarChar(50), email)
            .input('phonenumber', sql.NVarChar(10), phonenumber)
            .input('role', sql.NVarChar(10), userRole) // Use the default or provided role
            .query('INSERT INTO User_Account (firstname, lastname, username, password, email, phonenumber, role) VALUES (@firstname, @lastname, @username, @password, @email, @phonenumber, @role)');

        if (result.rowsAffected[0] > 0) {
            res.status(201).send({ message: 'User registered successfully', rowsAffected: result.rowsAffected[0] });
        } else {
            res.status(400).send({ message: 'User registration failed' });
        }
    } catch (err) {
        console.error('Database query failed:', err);
        res.status(500).send('An error occurred while registering the user.');
    }
});

// Route to get user profile data
app.get('/profile/:username', async (req, res) => {
    try {
        const { username } = req.params;
        const pool = await sql.connect(config);
        const result = await pool.request()
            .input('username', sql.VarChar, username)
            .query('SELECT userId, username, firstname, lastname, phonenumber, email, role FROM User_Account WHERE username = @username');

        if (result.recordset.length > 0) {
            res.json(result.recordset[0]); // Now includes userId in the response
        } else {
            res.status(404).send('User not found');
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

app.put('/profile/update-profile', async (req, res) => {
    const { username, userProfile } = req.body;
    try {
        const pool = await sql.connect(config);
        await pool.request()
            .input('username', sql.VarChar, username)
            .input('firstname', sql.VarChar, userProfile.firstname)
            .input('lastname', sql.VarChar, userProfile.lastname)
            .input('phonenumber', sql.VarChar, userProfile.phonenumber)
            .input('email', sql.VarChar, userProfile.email)
            .query(`UPDATE User_Account
                     SET firstname = @firstname, lastname = @lastname,
                         phonenumber = @phonenumber, email = @email
                     WHERE username = @username`);
        res.status(200).json({ message: 'Profile updated successfully' }); // Ensure this is correct
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});


app.post('/api/servicetypes', async (req, res) => {
    try {
        const pool = await sql.connect(config);
        const { name, price, size } = req.body; // Assuming you're sending JSON with name, price, and size
        await pool.request()
            .input('name', sql.VarChar, name)
            .input('price', sql.Decimal(10, 2), price)
            .input('size', sql.VarChar, size)
            .query('INSERT INTO ServiceType (name, price, size) VALUES (@name, @price, @size)');
        res.status(201).send({ message: 'Service type created successfully' });
    } catch (error) {
        console.error('Error creating service type:', error);
        res.status(500).json({ message: 'Server error' });
    }
});



// Delete a service type
app.delete('/api/servicetypes/:serviceid', async (req, res) => {
    try {
        const pool = await sql.connect(config);
        const { serviceid } = req.params;
        await pool.request().input('serviceid', sql.Int, serviceid).query('DELETE FROM ServiceType WHERE serviceid = @serviceid');
        res.status(204).send();
    } catch (error) {
        console.error('Error deleting service type:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

app.put('/api/servicetypes/:serviceid', async (req, res) => {
    const { serviceid } = req.params; // Get service type ID from the URL parameters
    const { name, price, size } = req.body; // Destructure the request body

    try {
        const pool = await sql.connect(config); // Ensure you connect to the pool here
        const result = await pool.request()
            .input('name', sql.VarChar, name)
            .input('price', sql.Decimal(10, 2), price)
            .input('size', sql.VarChar, size)
            .input('serviceid', sql.Int, serviceid)
            .query('UPDATE ServiceType SET name = @name, price = @price, size = @size WHERE serviceid = @serviceid');

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ message: 'Service type not found' });
        }

        res.status(200).json({ message: 'Service type updated successfully' });
    } catch (error) {
        console.error('Error updating service type:', error);
        res.status(500).json({ message: 'Server error' });
    } finally {
        // Optionally handle pool release here if necessary
    }
});

//get servicetype
app.get('/api/servicetypes', async (req, res) => {
    try {
      const pool = await sql.connect(config); // Ensure you connect to the pool here
      const result = await pool.request().query('SELECT name, price, size, serviceid FROM ServiceType');
      res.json(result.recordset);
    } catch (error) {
      console.error('Error fetching service types:', error);
      res.status(500).json({ message: 'Server error' });
    } finally {

    }
  });

    app.get('/api/availability', async (req, res) => {
    try {
        const { date } = req.query; // เช่น '2025-04-14'
        if (!date) return res.status(400).send({ message: 'Missing date parameter' });

        const pool = await sql.connect(config);

        // กำหนดขอบเขตวัน (local) แล้วชิฟต์เป็น UTC ตามวิธีที่คุณใช้อยู่ (บวก 7 ชม.)
        const startOfDay = new Date(date);                 // 2025-04-14T00:00 (local)
        const endOfDay = new Date(startOfDay);
        endOfDay.setDate(endOfDay.getDate() + 1);         // 2025-04-15T00:00 (local)

        const startUtc = new Date(startOfDay.getTime() + 7 * 60 * 60 * 1000).toISOString();
        const endUtc   = new Date(endOfDay.getTime()   + 7 * 60 * 60 * 1000).toISOString();

        // ดึง "slot เริ่มต้น" ของการจอง (ซึ่งคุณบันทึกเป็นต้นชั่วโมงอยู่แล้ว)
        // แปลงกลับเป็นเวลาท้องถิ่น แล้วฟอร์แมตให้เป็น 'YYYY-MM-DDTHH:mm'
        const result = await pool.request()
        .input('start', sql.DateTime, startUtc)
        .input('end',   sql.DateTime, endUtc)
        .query(`
            SELECT FORMAT(DATEADD(HOUR, -7, datetime), 'yyyy-MM-ddTHH:mm') AS slotLocal
            FROM bookings
            WHERE datetime >= @start
            AND datetime <  @end
            AND status IN ('pending','in-progress','complete')
            GROUP BY FORMAT(DATEADD(HOUR, -7, datetime), 'yyyy-MM-ddTHH:mm')
            ORDER BY MIN(datetime)
        `);

        // คืนเฉพาะรายการวัน–เวลาที่ถูกจอง (local)
        const bookedDateTimes = result.recordset.map(r => r.slotLocal);
        return res.json({ bookedDateTimes });
    } catch (err) {
        console.error('Error checking availability:', err);
        return res.status(500).send({ message: 'Server error checking availability' });
    }
    });



  app.post('/api/bookings', async (req, res) => {
        try {
            const { firstname, lastname, phonenumber, services, datetime, licenseplate, size, userId, totalPrice } = req.body; // Include totalPrice

            const pool = await sql.connect(config);

            // 1) ตรวจสอบ userId เดิม
            const userValidation = await pool.request()
            .input('userId', sql.Int, userId)
            .query('SELECT * FROM User_Account WHERE userId = @userId');

            if (userValidation.recordset.length === 0) {
            return res.status(400).send({ message: 'Invalid user ID. Please check and try again.' });
            }

            // 2) คำนวณรอบชั่วโมง: นาที > 31 ปัดขึ้น, นาที ≤ 31 ปัดลง (ยึดตามเวลาที่ client ส่งมาเป็น local)
            const localDateTime = new Date(datetime);
            const minutes = localDateTime.getMinutes();

            let slotStartLocal = new Date(localDateTime);
            if (minutes > 31) {
            // ปัดขึ้นชั่วโมงถัดไป
            slotStartLocal.setHours(slotStartLocal.getHours() + 1, 0, 0, 0);
            } else {
            // ปัดลงต้นชั่วโมง
            slotStartLocal.setMinutes(0, 0, 0);
            }
            const slotEndLocal = new Date(slotStartLocal.getTime() + 60 * 60 * 1000); // +1 ชม.

            // 3) แปลงเป็น UTC ตามแนวทางเดิม (บวก 7 ชั่วโมง)
            const slotStartUtc = new Date(slotStartLocal.getTime() + (7 * 60 * 60 * 1000)).toISOString();
            const slotEndUtc   = new Date(slotEndLocal.getTime()   + (7 * 60 * 60 * 1000)).toISOString();

            // 4) เช็คการจองทับในช่วง [slotStartUtc, slotEndUtc)
            //    นับเฉพาะสถานะที่ถือว่าคิวถูกใช้ (pending, in-progress, complete) — ตัด rejected ออก
            const conflict = await pool.request()
            .input('slotStart', sql.DateTime, slotStartUtc)
            .input('slotEnd',   sql.DateTime, slotEndUtc)
            .query(`
                SELECT COUNT(*) AS cnt
                FROM bookings
                WHERE datetime >= @slotStart
                AND datetime <  @slotEnd
                AND status IN ('pending','in-progress','complete')
            `);

            if (conflict.recordset[0].cnt > 0) {
            return res.status(409).send({
                message: 'This time slot is already booked. Please choose another time (slots are every 1 hour).'
            });
            }

            // 5) รวมชื่อบริการเป็นสตริง (ของเดิม)
            const serviceNames = services ? services.map(service => service.name).join(', ') : '';

            // 6) เวลาเพื่อบันทึก (ใช้ต้นชั่วโมงที่คำนวณแล้ว) → แปลง UTC ตามแนวทางเดิม
            const utcDateTime = slotStartUtc;

            // 7) INSERT (ของเดิม)
            await pool.request()
            .input('firstname',   sql.NVarChar(100), firstname || null)
            .input('lastname',    sql.NVarChar(100), lastname || null)
            .input('phonenumber', sql.NVarChar(10),  phonenumber || null)
            .input('servicetype', sql.NVarChar(255), serviceNames)
            .input('datetime',    sql.DateTime,      utcDateTime)
            .input('licenseplate',sql.NVarChar(20),  licenseplate || null)
            .input('size',        sql.NVarChar(50),  size || null)
            .input('userId',      sql.Int,           userId)
            .input('totalPrice',  sql.Decimal,       totalPrice) // Add totalPrice here (ชนิดเดิม)
            .input('status',      sql.NVarChar(50),  'pending')
            .query(`
                INSERT INTO bookings (firstname, lastname, phonenumber, servicetype, datetime, licenseplate, size, userId, totalPrice, status) 
                VALUES (@firstname, @lastname, @phonenumber, @servicetype, @datetime, @licenseplate, @size, @userId, @totalPrice, @status)
            `);

            return res.status(200).send({ message: 'Booking successful' });
        } catch (err) {
            console.error('Database insert error:', err);
            return res.status(500).send({ message: 'Booking failed. Please try again later.' });
        }
        });

  

  app.get('/api/bookings/report', async (req, res) => {
    let pool;
    try {
        pool = await sql.connect(config);
        
        // Query to get daily sales report
        const dailyReport = await pool.request().query(`
            SELECT 
                CONVERT(VARCHAR(10), datetime, 120) AS reportDate, 
                SUM(totalPrice) AS totalSales 
            FROM bookings 
            GROUP BY CONVERT(VARCHAR(10), datetime, 120)
            ORDER BY reportDate;
        `);

        // Query to get monthly sales report
        const monthlyReport = await pool.request().query(`
            SELECT 
                FORMAT(datetime, 'yyyy-MM') AS reportMonth, 
                SUM(totalPrice) AS totalSales 
            FROM bookings 
            GROUP BY FORMAT(datetime, 'yyyy-MM')
            ORDER BY reportMonth;
        `);

        // Query to get yearly sales report
        const yearlyReport = await pool.request().query(`
            SELECT 
                YEAR(datetime) AS reportYear, 
                SUM(totalPrice) AS totalSales 
            FROM bookings 
            GROUP BY YEAR(datetime)
            ORDER BY reportYear;
        `);

        // Send back the complete report data
        res.status(200).json({
            dailyReport: dailyReport.recordset,
            monthlyReport: monthlyReport.recordset,
            yearlyReport: yearlyReport.recordset
        });
    } catch (err) {
        console.error('Database retrieval error:', err);
        res.status(500).json({ message: 'Failed to retrieve bookings report.', error: err.message });
    } finally {
        if (pool) {
            pool.close(); 
        }
    }
});

app.get('/api/bookings/', async (req, res) => {
    let pool;
    try {
        pool = await sql.connect(config);
        const result = await pool.request().query('SELECT * FROM bookings'); 
        res.status(200).send(result.recordset);
    } catch (err) {
        console.error('Database retrieval error:', err);
        res.status(500).send({ message: 'Failed to retrieve bookings.' });
    } finally {
        if (pool) {
            pool.close(); 
        }
    }
});

app.get('/api/bookings/:id', async (req, res) => {
    const reportId = req.params.id;
    try {
      const report = await getReportById(reportId); // Fetch from your DB
      res.status(200).json(report);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch report' });
    }
  });  


app.patch('/api/bookings/:id/status', async (req, res) => {
    const { status } = req.body;
    const bookingId = Number(req.params.id);
    
    // Validate bookingId
    if (isNaN(bookingId)) {
        return res.status(400).send({ message: 'Invalid booking ID.' });
    }

    // Validate status
    const validStatuses = ['pending', 'in-progress', 'complete', 'rejected'];
    const normalizedStatus = status ? status.toLowerCase() : null; // Normalize status

    if (!normalizedStatus || !validStatuses.includes(normalizedStatus)) {
        return res.status(400).send({ message: `Status is required and must be one of: ${validStatuses.join(', ')}` });
    }

    try {
        const pool = await sql.connect(config);
        const result = await pool.request()
            .input('bookingid', sql.Int, bookingId)
            .input('status', sql.NVarChar(50), normalizedStatus) // Use normalized status
            .query(`UPDATE bookings SET status = @status WHERE bookingid = @bookingid`);

        if (result.rowsAffected[0] === 0) {
            return res.status(404).send({ message: 'Booking not found.' });
        }

        res.status(200).send({ message: 'Booking status updated successfully.' });
    } catch (err) {
        console.error('Database update error:', err.message); // Log error message
        res.status(500).send({ message: 'Failed to update booking status.' });
    }
});

app.get('/bookings/user/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const pool = await sql.connect(config);
        
        // Corrected SQL query syntax: added a comma before u.firstname
        const result = await pool.request()
            .input('userId', sql.Int, userId)
            .query(`
                SELECT b.bookingId, b.servicetype, b.datetime, b.licenseplate, b.status, b.totalPrice, 
                       u.firstname, u.lastname
                FROM bookings AS b
                JOIN User_Account AS u ON b.userId = u.userId
                WHERE b.userId = @userId
            `);

        res.json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});


// เส้นทางที่ป้องกันด้วย JWT
app.get('/api/protected', verifyToken, (req, res) => {
    res.json({ message: 'This is a protected route', user: req.user });
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
