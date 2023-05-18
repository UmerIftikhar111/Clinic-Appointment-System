const express = require("express")
const app = express()
const port = 3005

const mysql = require('mysql');


const connection = mysql.createConnection({
    host: 'localhost',    // Your MySQL server host
    user: 'root',    // Your MySQL username
    password: 'root_password',    // Your MySQL password
    database: 'surgeryDB'    // Your MySQL database name
  });
  
  // Establish the connection
  connection.connect((err) => {
    if (err) {
      console.error('Error connecting to MySQL server: ' + err.stack);
      return;
    }
    console.log('Connected to MySQL server as ID ' + connection.threadId);
  });


const cors = require('cors');
app.use(cors({
    origin: '*'
}))

app.use(express.json())

app.get('/', (req, res) => {
    res.send('Hello World!')
})


app.post('/login', (req, res) => {
    const { username, password } = req.body;
    const query = 'SELECT PatientID, NHS_number FROM Patient WHERE Username = ? AND Password = ?';
  
    connection.query(query, [username, password], (error, results) => {
      if (error) {
        console.error('Error executing query: ' + error.stack);
        res.status(500).json({ error: 'An error occurred' });
        return;
      }
  
      if (results.length > 0) {
        const patientID = results[0].PatientID;
        const nhsnumber = results[0].NHS_number;
        res.json({ patientID,nhsnumber  });
      } else {
        res.status(404).json({ error: 'Invalid username or password' });
      }
    });
  });
  
  // Route 2: Book Appointment
  app.post('/book', (req, res) => {
    const { date, time, patientID } = req.body;
    const querySize = 'SELECT COUNT(*) as total FROM GP_Appointment';
    const queryDoctors = 'SELECT Staff_ID FROM Doctor';
  
    connection.query(querySize, (error, results) => {
      if (error) {
        console.error('Error executing query: ' + error.stack);
        res.status(500).json({ error: 'An error occurred' });
        return;
      }
  
      connection.query(queryDoctors, (error, doctorResults) => {
        if (error) {
          console.error('Error executing query: ' + error.stack);
          res.status(500).json({ error: 'An error occurred' });
          return;
        }
  
        const appointmentID = 'A' + (results[0].total + 1).toString().padStart(3, '0');
        const randomDoctorID = doctorResults[Math.floor(Math.random() * doctorResults.length)].Staff_ID;
        const appointmentStatus = 'Valid';
  
        const queryInsert = 'INSERT INTO GP_Appointment (Appointment_ID, Staff_ID, Patient_ID, Appointment_Date, Appointment_Time, `Appointment Status`) VALUES (?, ?, ?, ?, ?, ?)';
  
        connection.query(queryInsert, [appointmentID, randomDoctorID, patientID, date, time, appointmentStatus], (error, results) => {
          if (error) {
            console.error('Error executing query: ' + error.stack);
            res.status(500).json({ error: 'An error occurred' });
            return;
          }
  
          res.json({ success: true, appointmentID });
        });
      });
    });
  });
  
  // Route 3: View Appointment
  app.get('/view', (req, res) => {
    const query = 'SELECT * FROM GP_Appointment';
  
    connection.query(query, (error, results) => {
      if (error) {
        console.error('Error executing query: ' + error.stack);
        res.status(500).json({ error: 'An error occurred' });
        return;
      }
  
      res.json(results);
    });
  });
  
  
  // Route 4: Delete Appointment
app.post('/delete', (req, res) => {
    const appointmentID = req.body.Appointment_ID;
    const queryUpdate = 'UPDATE GP_Appointment SET `Appointment Status` = "Deleted" WHERE Appointment_ID = ?';
  
    connection.query(queryUpdate, [appointmentID], (error, results) => {
      if (error) {
        console.error('Error executing query: ' + error.stack);
        res.status(500).json({ error: 'An error occurred' });
        return;
      } 
      res.json({ success: true });
    });
  });
  

  // Route 5: Express route for saving medical records
app.post('/medical-record', (req, res) => {
  const { NHSNumber, PatientID, DoseNo, Vaccination_Date} = req.body;
  var Vaccination_Time="";
  var Notes="Patient is vaccinated";
  var Record_Status="Valid";
  // Insert the medical record into the Medical_Record table
  const insertRecordQuery = `INSERT INTO Medical_Record (PatientID, DoseNo, Vaccination_Date, Vaccination_Time, Notes, Record_Status) VALUES (?, ?, ?, ?, ?, ?)`;
  const values = [PatientID, DoseNo, Vaccination_Date, Vaccination_Time, Notes, Record_Status];

  connection.query(insertRecordQuery, values, (err, results) => {
    if (err) {
      console.error('Error inserting record into the database:', err);
      res.status(500).json({ error: 'Error inserting record into the database' });
    } else {
      res.status(200).json({ message: 'Medical record saved successfully' });
    }
  });
});

// Route 6: Add a new patient

app.post('/signup', async (req, res) => {
  try {
    // Get the input values from the request body
    const { username, password, nhsNumber } = req.body;
    var count=-1;
    
    // Create a promise-based version of the query
    const getCount = () => {
      return new Promise((resolve, reject) => {
        const queryCount = 'SELECT COUNT(*) AS count FROM Patient;';
        connection.query(queryCount, (error, results) => {
          if (error) {
            reject(error);
          } else {
            resolve(results[0].count);
          }
        });
      });
    };

    // Get the count value
    count = await getCount();

   const paddedCount = String(count + 1).padStart(3, '0');
   const patientID = `P${paddedCount}`;

   //Insert the new patient into the database
    await connection.query('INSERT INTO Patient (PatientID, Username, Password, NHS_number, Forename, Surname, PersonDOB, Gender, Postcode, Telephone, Email) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [patientID, username, password, nhsNumber, 'forename', 'surname', '2023-01-01', 'Male', patientID, '1312343', 'sample@example.com']);

    res.status(200).json({ message: 'Patient created successfully', patientID });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error creating patient' });
  }
});

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})
