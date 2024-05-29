CREATE TABLE Student (
    StudentID INT PRIMARY KEY,
    FullName VARCHAR(100),
    PhoneNumber VARCHAR(15),
    Email VARCHAR(100)
);

CREATE TABLE Account (
    AccountNumber INT PRIMARY KEY,
    Balance DECIMAL(10, 2),
    StudentID INT,
    FOREIGN KEY (StudentID) REFERENCES Student(StudentID)
);

CREATE TABLE TuitionFee (
    StudentID INT PRIMARY KEY,
    AmountDue DECIMAL(10, 2),
    AmountPaid DECIMAL(10, 2),
    FOREIGN KEY (StudentID) REFERENCES Student(StudentID)
);


CREATE TABLE TransactionHistory (
    TransactionID INT PRIMARY KEY,
    AccountNumber INT,
    Amount DECIMAL(10, 2),
    TransactionDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (AccountNumber) REFERENCES Account(AccountNumber)
);

INSERT INTO Student (StudentID, FullName, PhoneNumber, Email) VALUES
(5100001, 'Nguyen Van A', '0901234567', '5100001@student.tdtu.edu.vn'),
(5100002, 'Le Thi B', '0912345678', '5100002@student.tdtu.edu.vn'),
(5100003, 'Tran Van C', '0923456789', '5100003@student.tdtu.edu.vn'),
(5100004, 'Pham Thi D', '0934567890', '5100004@student.tdtu.edu.vn'),
(5100005, 'Hoang Van E', '0945678901', '5100005@student.tdtu.edu.vn');

INSERT INTO Account (AccountNumber, Balance, StudentID) VALUES
(1001, 1500000.00, 5100001),
(1002, 2000000.00, 5100002),
(1003, 2500000.00, 5100003),
(1004, 1800000.00, 5100004),
(1005, 3000000.00, 5100005);

INSERT INTO TuitionFee (StudentID, AmountDue, AmountPaid) VALUES
(5100001, 1200000.00, 0.00),
(5100002, 1500000.00, 1500000.00),
(5100003, 2000000.00, 2000000.00),
(5100004, 1300000.00, 1300000.00),
(5100005, 2500000.00, 2500000.00);

INSERT INTO TransactionHistory (TransactionID, AccountNumber,Amount) VALUES 
(1, 1001,500.00),
(2, 1002,300.00),
(3, 1003,700.00),
(4, 1004,1500.00),
(5, 1005,-500.00);