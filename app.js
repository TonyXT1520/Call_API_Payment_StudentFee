const express = require('express');
const bodyParser = require('body-parser');
const db = require('./db');

const app = express();
app.use(bodyParser.json());

const users = [
    { username: '5100001', password: '5100001' },
    { username: '5100002', password: '5100002' },
];
//Endpoint đăng nhap
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    const user = users.find(u => u.username == username && u.password == password);
    if (user) {
        res.json({ message: 'Login successful', user });
    } else {
        res.status(401).json({ message: 'Invalid username or password' });
    }
});

// Endpoint để lấy danh sách tất cả sinh viên
app.get('/api/students', async(req, res) => {
    try {
        const [students] = await db.query(`
            SELECT s.StudentID, s.FullName, s.Email, s.PhoneNumber, t.AmountDue, t.AmountPaid, a.AccountNumber, a.Balance
            FROM Student s
            JOIN TuitionFee t ON s.StudentID = t.StudentID
            JOIN Account a ON s.StudentID = a.StudentID
        `);
        res.json(students);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Endpoint để lấy thông tin chi tiết của một sinh viên
app.get('/api/students/:id', async(req, res) => {
    try {
        const [students] = await db.query(`
            SELECT s.StudentID, s.FullName, s.PhoneNumber, s.Email, t.AmountDue, t.AmountPaid, a.AccountNumber, a.Balance
            FROM Student s
            JOIN TuitionFee t ON s.StudentID = t.StudentID
            JOIN Account a ON s.StudentID = a.StudentID
            WHERE s.StudentID = ?
        `, [req.params.id]);

        if (students.length === 0) {
            return res.status(404).json({ error: 'Student not found' });
        }

        res.json(students[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//Endpoint để lấy thông tin chi tiết học phí của sinh viên
app.get('/api/tuition/:id', async(req, res) => {
    try {
        const [tuition] = await db.query(`
        SELECT t.StudentID, t.AmountDue, t.AmountPaid
        FROM TuitionFee t
        WHERE t.StudentID = ?
      `, [req.params.id]);

        if (tuition.length === 0) {
            return res.status(404).json({ error: 'Tuition fee not found for the student' });
        }

        res.json(tuition[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Endpoint để lấy thông tin tài khoản của một sinh viên
app.get('/api/account/:id', async(req, res) => {
    try {
        const [account] = await db.query(`
        SELECT a.AccountNumber, a.Balance, a.StudentID
        FROM Account a
        WHERE a.StudentID = ?
      `, [req.params.id]);

        if (account.length === 0) {
            return res.status(404).json({ error: 'Account not found for the student' });
        }

        res.json(account[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//Endpoint để cập nhật học phí của sinh viên
app.put('/api/tuition/:id', async(req, res) => {
    const { AmountDue, AmountPaid } = req.body;
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        await connection.query('UPDATE TuitionFee SET AmountDue = ?, AmountPaid = ? WHERE StudentID = ?', [AmountDue, AmountPaid, req.params.id]);

        await connection.commit();
        res.send();
    } catch (err) {
        await connection.rollback();
        res.status(500).json({ error: err.message });
    } finally {
        connection.release();
    }
});

// Endpoint để thêm mới một sinh viên
app.post('/api/students', async(req, res) => {
    const { StudentID, FullName, PhoneNumber, Email, TuitionFee, Account } = req.body;
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        await connection.query('INSERT INTO Student (StudentID, FullName, PhoneNumber, Email) VALUES (?, ?, ?, ?)', [StudentID, FullName, PhoneNumber, Email]);
        await connection.query('INSERT INTO TuitionFee (StudentID, AmountDue, AmountPaid) VALUES (?, ?, ?)', [StudentID, TuitionFee.AmountDue, TuitionFee.AmountPaid]);
        await connection.query('INSERT INTO Account (AccountNumber, Balance, StudentID) VALUES (?, ?, ?)', [Account.AccountNumber, Account.Balance, StudentID]);

        await connection.commit();
        res.status(201).send();
    } catch (err) {
        await connection.rollback();
        res.status(500).json({ error: err.message });
    } finally {
        connection.release();
    }
});

// Endpoint để cập nhật thông tin của một sinh viên
app.put('/api/students/:id', async(req, res) => {
    const { FullName, PhoneNumber, TuitionFee, Account } = req.body;
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        await connection.query('UPDATE Student SET FullName = ?, PhoneNumber = ? Email = ? WHERE StudentID = ?', [FullName, PhoneNumber, Email, req.params.id]);
        await connection.query('UPDATE TuitionFee SET AmountDue = ?, AmountPaid = ? WHERE StudentID = ?', [TuitionFee.AmountDue, TuitionFee.AmountPaid, req.params.id]);
        await connection.query('UPDATE Account SET Balance = ? WHERE StudentID = ?', [Account.Balance, req.params.id]);

        await connection.commit();
        res.send();
    } catch (err) {
        await connection.rollback();
        res.status(500).json({ error: err.message });
    } finally {
        connection.release();
    }
});


// Endpoint để thanh toán học phí của một sinh viên
app.post('/api/payment/:id', async(req, res) => {
    const { paymentAmount } = req.body;
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        // Lấy thông tin tài khoản và học phí hiện tại
        const [studentAccount] = await connection.query('SELECT Balance FROM Account WHERE StudentID = ?', [req.params.id]);
        const [tuitionFee] = await connection.query('SELECT AmountDue, AmountPaid FROM TuitionFee WHERE StudentID = ?', [req.params.id]);

        if (studentAccount.length === 0 || tuitionFee.length === 0) {
            return res.status(404).json({ error: 'Student not found' });
        }

        const accountBalance = studentAccount[0].Balance;
        const amountDue = tuitionFee[0].AmountDue;
        const amountPaid = tuitionFee[0].AmountPaid;

        if (accountBalance < paymentAmount) {
            return res.status(400).json({ error: 'Insufficient balance in account' });
        }

        // Tính toán số tiền còn lại sau thanh toán
        const newBalance = accountBalance - paymentAmount;
        const newAmountPaid = amountPaid + paymentAmount;

        if (newAmountPaid > amountDue) {
            return res.status(400).json({ error: 'Payment amount exceeds amount due' });
        }

        // Cập nhật thông tin tài khoản và học phí
        await connection.query('UPDATE Account SET Balance = ? WHERE StudentID = ?', [newBalance, req.params.id]);
        await connection.query('UPDATE TuitionFee SET AmountPaid = ? WHERE StudentID = ?', [newAmountPaid, req.params.id]);

        // Thêm lịch sử giao dịch
        await connection.query('INSERT INTO TransactionHistory (AccountNumber, Amount) VALUES (?, ?)', [req.params.id, paymentAmount]);

        await connection.commit();
        res.json({ message: 'Payment successful', newBalance, newAmountPaid });
    } catch (err) {
        await connection.rollback();
        res.status(500).json({ error: err.message });
    } finally {
        connection.release();
    }
});

// Endpoint để lấy lịch sử giao dịch của một sinh viên
app.get('/api/transaction-history/:id', async(req, res) => {
    try {
        const [transactions] = await db.query(`
        SELECT TransactionID, Amount, TransactionDate
        FROM TransactionHistory
        WHERE AccountNumber = ?
      `, [req.params.id]);

        res.json(transactions);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

const port = process.env.PORT || 3301;
app.listen(port, () => console.log(`Listening on port ${port}...`));