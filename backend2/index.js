const express = require("express")
const app = express()
const port = 3006

const mysql = require('mysql');


const connection = mysql.createConnection({
    host: 'localhost',    // Your MySQL server host
    user: 'root',    // Your MySQL username
    password: 'root_password',    // Your MySQL password
    database: 'centralDB'    // Your MySQL database name
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


// Express route for fetching patient vaccination information
app.get('/patient/:id', (req, res) => {
  const patientID = req.params.id;
  // Check if patient is present in the patients table
  const checkPatientQuery = `SELECT * FROM patients WHERE NHSNumber = ${patientID}`;
  connection.query(checkPatientQuery, (err, results) => {
    if (err) {
      console.error('Error querying the database:', err);
      res.status(500).json({ error: 'Error querying the database' });
    } else if (results.length === 0) {
      res.status(404).json({ error: 'Patient not found' });
    } else {
      // Fetch patient's vaccination information from the vaccines table
      const fetchVaccinationQuery = `SELECT DoseNo, VaccinationDate FROM vaccines WHERE NHSNumber = ${patientID}`;
      connection.query(fetchVaccinationQuery, (err, results) => {
        if (err) {
          console.error('Error querying the database:', err);
          res.status(500).json({ error: 'Error querying the database' });
        } else if (results.length === 0) {
          res.status(404).json({ error: 'Vaccination information not found for the patient' });
        } else {
          const vaccinationInfo = {
            NHSNumber: patientID,
            DoseNo: results[0].DoseNo,
            Vaccination_Date: results[0].VaccinationDate
           };
          res.json(vaccinationInfo);
        }
      });
    }
  });
});

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})