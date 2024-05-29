const mysql = require('mysql2');

// Tạo kết nối đến cơ sở dữ liệu
const pool = mysql.createPool({
    host: 'localhost', // Địa chỉ server MySQL của bạn
    user: 'root', // Tên đăng nhập MySQL của bạn

    database: 'studentfee' // Tên cơ sở dữ liệu của bạn
});

module.exports = pool.promise();