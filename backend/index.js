// index.js
require('dotenv').config();
const express = require('express');
const sql = require('mssql');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

/* --------------------------
   DB config
   -------------------------- */
const config = {
    user: process.env.DB_USER || 'sa',
    password: process.env.DB_PASS || 'Shajag123!',
    server: process.env.DB_SERVER || 'localhost',
    port: parseInt(process.env.DB_PORT || '1433', 10),
    database: process.env.DB_NAME || 'clinicdb',
    options: {
        encrypt: false,
        enableArithAbort: true
    },
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    }
};

const poolPromise = new sql.ConnectionPool(config).connect().then(pool => {
    console.log('Connected to MSSQL');
    return pool;
}).catch(err => {
    console.error('Database Connection Failed! Bad Config: ', err);
    process.exit(1);
});

/* --------------------------
   Helper functions
   -------------------------- */
function sendDbError(res, err) {
    console.error(err);
    if (err && err.originalError && err.originalError.info) {
        return res.status(500).json({ error: 'DB error', details: err.originalError.info });
    }
    return res.status(500).json({ error: 'DB error' });
}

/* --------------------------
   Health & meta
   -------------------------- */
app.get('/api/health', (req, res) => res.json({ ok: true }));

app.get('/api/meta/designations', async (req, res) => {
    try {
        const pool = await poolPromise;
        const r = await pool.request().query('SELECT DesignationID, Designation FROM dbo.DesignationMst ORDER BY Designation');
        res.json(r.recordset);
    } catch (err) { sendDbError(res, err); }
});

app.get('/api/meta/departments', async (req, res) => {
    try {
        const pool = await poolPromise;
        const r = await pool.request().query('SELECT DepartmentID, Department FROM dbo.DepartmentMst ORDER BY Department');
        res.json(r.recordset);
    } catch (err) { sendDbError(res, err); }
});

// NEW: Blood groups
app.get('/api/meta/bloodgroups', async (req, res) => {
    try {
        const pool = await poolPromise;
        const r = await pool.request().query('SELECT BloodGroupID, BloodGroupName FROM dbo.BloodGroupMst ORDER BY BloodGroupID');
        res.json(r.recordset);
    } catch (err) { sendDbError(res, err); }
});

// NEW: States
app.get('/api/meta/states', async (req, res) => {
    try {
        const pool = await poolPromise;
        const r = await pool.request().query('SELECT StateID, StateName FROM dbo.StatesMst ORDER BY StateName');
        res.json(r.recordset);
    } catch (err) { sendDbError(res, err); }
});

// NEW: Cities (optional ?stateId=)
app.get('/api/meta/cities', async (req, res) => {
    try {
        const stateId = req.query.stateId ? parseInt(req.query.stateId, 10) : null;
        const pool = await poolPromise;
        const requestQ = pool.request();
        let sqlText = 'SELECT CityID, CityName, StateID FROM dbo.CitiesMst';
        if (stateId) {
            sqlText += ' WHERE StateID = @stateId';
            requestQ.input('stateId', sql.Int, stateId);
        }
        sqlText += ' ORDER BY CityName';
        const r = await requestQ.query(sqlText);
        res.json(r.recordset);
    } catch (err) { sendDbError(res, err); }
});

// NEW: Constitution types (if present in DB)
app.get('/api/meta/constitutiontypes', async (req, res) => {
    try {
        const pool = await poolPromise;
        const r = await pool.request().query('SELECT ConstitutionTypeID, ConstitutionType FROM dbo.ConstitutionTypeMst ORDER BY ConstitutionTypeID');
        res.json(r.recordset);
    } catch (err) { sendDbError(res, err); }
});

/* --------------------------
   Patients
   -------------------------- */

// List patients (includes BloodGroupName via LEFT JOIN and returns City/State/Postal IDs)
app.get('/api/patients', async (req, res) => {
    try {
        const pool = await poolPromise;
        const r = await pool.request().query(`
      SELECT
        p.PatientID,
        p.FirstName,
        p.MiddleName,
        p.LastName,
        p.DateOfBirth,
        p.Age,
        p.GenderID,
        p.PhoneNumber,
        p.Email,
        p.IsActive,
        p.CityID,
        p.StateID,
        p.PostalID,
        p.Country,
        p.BloodGroupID,
        bg.BloodGroupName
      FROM dbo.PatientMaster p
      LEFT JOIN dbo.BloodGroupMst bg ON p.BloodGroupID = bg.BloodGroupID
      ORDER BY p.PatientID DESC
    `);
        res.json(r.recordset);
    } catch (err) { sendDbError(res, err); }
});

// Search patients by q (name / phone / email)
app.get('/api/patients/search', async (req, res) => {
    try {
        const q = (req.query.q || '').trim();
        if (!q) return res.status(400).json({ error: 'q query required' });

        const pool = await poolPromise;
        const like = `%${q}%`;
        const r = await pool.request()
            .input('q', sql.NVarChar, like)
            .query(`
                SELECT TOP 100 PatientID, FirstName, MiddleName, LastName, PhoneNumber, Email
                FROM dbo.PatientMaster
                WHERE FirstName + ' ' + ISNULL(MiddleName,'') + ' ' + ISNULL(LastName,'') LIKE @q
                   OR PhoneNumber LIKE @q
                   OR Email LIKE @q
                ORDER BY PatientID DESC
            `);
        res.json(r.recordset);
    } catch (err) { sendDbError(res, err); }
});

// Get patient by id (returns all fields)
app.get('/api/patients/:id', async (req, res) => {
    try {
        const pool = await poolPromise;
        const r = await pool.request()
            .input('id', sql.BigInt, req.params.id)
            .query('SELECT * FROM dbo.PatientMaster WHERE PatientID = @id');
        if (!r.recordset.length) return res.status(404).json({ error: 'Not found' });
        res.json(r.recordset[0]);
    } catch (err) { sendDbError(res, err); }
});

// Create patient (now accepts IDs for CityID/StateID/PostalID/BloodGroupID)
app.post('/api/patients', async (req, res) => {
    try {
        const body = req.body || {};
        const FirstName = body.FirstName;
        if (!FirstName) return res.status(400).json({ error: 'FirstName required' });

        // reuse your existing insertion with new fields
        const MiddleName = body.MiddleName || null;
        const LastName = body.LastName || null;
        let DateOfBirth = body.DateOfBirth || null;
        const PhoneNumber = body.PhoneNumber || null;
        const Email = body.Email || null;
        const AddressLine1 = body.AddressLine1 || null;
        const AddressLine2 = body.AddressLine2 || null;
        const CityID = (typeof body.CityID !== 'undefined' && body.CityID !== null) ? parseInt(body.CityID, 10) : null;
        const StateID = (typeof body.StateID !== 'undefined' && body.StateID !== null) ? parseInt(body.StateID, 10) : null;
        const PostalID = (typeof body.PostalID !== 'undefined' && body.PostalID !== null) ? parseInt(body.PostalID, 10) : null;
        const Country = body.Country || null;
        const BloodGroupID = (typeof body.BloodGroupID !== 'undefined' && body.BloodGroupID !== null) ? parseInt(body.BloodGroupID, 10) : null;
        const ConstitutionTypeID = (typeof body.ConstitutionTypeID !== 'undefined' && body.ConstitutionTypeID !== null) ? parseInt(body.ConstitutionTypeID, 10) : null;
        const Age = (typeof body.Age !== 'undefined' && body.Age !== null && body.Age !== '') ? parseInt(body.Age, 10) : null;

        // Gender handling
        let GenderID = null;
        if (typeof body.GenderID !== 'undefined' && body.GenderID !== null) {
            GenderID = parseInt(body.GenderID, 10);
        } else if (body.Gender) {
            const g = String(body.Gender).toLowerCase();
            if (g === 'male' || g === 'm') GenderID = 1;
            else if (g === 'female' || g === 'f') GenderID = 2;
            else GenderID = 3;
        } else {
            GenderID = 3;
        }

        if (!DateOfBirth && Age && !isNaN(Age)) {
            const year = (new Date()).getFullYear() - Age;
            DateOfBirth = `${year}-01-01`;
        }

        const pool = await poolPromise;
        const request = pool.request();
        request.input('FirstName', sql.NVarChar(200), FirstName);
        request.input('MiddleName', sql.NVarChar(100), MiddleName);
        request.input('LastName', sql.NVarChar(100), LastName);
        request.input('DateOfBirth', sql.Date, DateOfBirth || null);
        request.input('Age', sql.Int, Age || null);
        request.input('GenderID', sql.Int, GenderID);
        request.input('PhoneNumber', sql.NVarChar(15), PhoneNumber);
        request.input('Email', sql.NVarChar(250), Email);
        request.input('AddressLine1', sql.NVarChar(255), AddressLine1);
        request.input('AddressLine2', sql.NVarChar(255), AddressLine2);
        request.input('CityID', sql.Int, CityID);
        request.input('StateID', sql.Int, StateID);
        request.input('PostalID', sql.Int, PostalID);
        request.input('Country', sql.NVarChar(100), Country);
        request.input('BloodGroupID', sql.Int, BloodGroupID);
        request.input('ConstitutionTypeID', sql.Int, ConstitutionTypeID);

        const insertSql = `
            INSERT INTO dbo.PatientMaster (
                FirstName, MiddleName, LastName,
                DateOfBirth, Age, GenderID,
                PhoneNumber, Email,
                AddressLine1, AddressLine2,
                CityID, StateID, PostalID,
                Country, BloodGroupID, ConstitutionTypeID,
                IsActive, CreatedAt
            )
                OUTPUT INSERTED.PatientID
            VALUES (
                @FirstName, @MiddleName, @LastName,
                @DateOfBirth, @Age, @GenderID,
                @PhoneNumber, @Email,
                @AddressLine1, @AddressLine2,
                @CityID, @StateID, @PostalID,
                @Country, @BloodGroupID, @ConstitutionTypeID,
                1, SYSDATETIME()
                )`;
        const result = await request.query(insertSql);
        res.status(201).json({ PatientID: result.recordset[0].PatientID });
    } catch (err) { sendDbError(res, err); }
});

// Update patient
app.put('/api/patients/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const body = req.body || {};
        if (!id) return res.status(400).json({ error: 'id required' });

        const pool = await poolPromise;
        const request = pool.request();
        // Bind inputs (only update common fields - extend as needed)
        request.input('id', sql.BigInt, id);
        request.input('FirstName', sql.NVarChar(200), body.FirstName || null);
        request.input('MiddleName', sql.NVarChar(100), body.MiddleName || null);
        request.input('LastName', sql.NVarChar(100), body.LastName || null);
        request.input('PhoneNumber', sql.NVarChar(15), body.PhoneNumber || null);
        request.input('Email', sql.NVarChar(250), body.Email || null);
        request.input('AddressLine1', sql.NVarChar(255), body.AddressLine1 || null);
        request.input('AddressLine2', sql.NVarChar(255), body.AddressLine2 || null);
        request.input('CityID', sql.Int, body.CityID || null);
        request.input('StateID', sql.Int, body.StateID || null);
        request.input('PostalID', sql.Int, body.PostalID || null);
        request.input('Country', sql.NVarChar(100), body.Country || null);
        request.input('BloodGroupID', sql.Int, body.BloodGroupID || null);
        request.input('ConstitutionTypeID', sql.Int, body.ConstitutionTypeID || null);
        request.input('Age', sql.Int, typeof body.Age !== 'undefined' ? body.Age : null);
        request.input('GenderID', sql.Int, typeof body.GenderID !== 'undefined' ? body.GenderID : null);

        const updateSql = `
            UPDATE dbo.PatientMaster
            SET FirstName = COALESCE(@FirstName, FirstName),
                MiddleName = COALESCE(@MiddleName, MiddleName),
                LastName = COALESCE(@LastName, LastName),
                PhoneNumber = COALESCE(@PhoneNumber, PhoneNumber),
                Email = COALESCE(@Email, Email),
                AddressLine1 = COALESCE(@AddressLine1, AddressLine1),
                AddressLine2 = COALESCE(@AddressLine2, AddressLine2),
                CityID = COALESCE(@CityID, CityID),
                StateID = COALESCE(@StateID, StateID),
                PostalID = COALESCE(@PostalID, PostalID),
                Country = COALESCE(@Country, Country),
                BloodGroupID = COALESCE(@BloodGroupID, BloodGroupID),
                ConstitutionTypeID = COALESCE(@ConstitutionTypeID, ConstitutionTypeID),
                Age = COALESCE(@Age, Age),
                GenderID = COALESCE(@GenderID, GenderID),
                UpdatedAt = SYSDATETIME()
            WHERE PatientID = @id;
            SELECT @@ROWCOUNT AS Affected;
        `;
        const r = await request.query(updateSql);
        const affected = r.recordset && r.recordset[0] ? r.recordset[0].Affected : 0;
        if (!affected) return res.status(404).json({ error: 'Not found or nothing changed' });
        res.json({ updated: affected });
    } catch (err) { sendDbError(res, err); }
});

// Delete patient (soft delete)
app.delete('/api/patients/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const pool = await poolPromise;
        const r = await pool.request()
            .input('id', sql.BigInt, id)
            .query("UPDATE dbo.PatientMaster SET IsActive = 0, UpdatedAt = SYSDATETIME() WHERE PatientID = @id; SELECT @@ROWCOUNT AS Affected;");
        const affected = r.recordset && r.recordset[0] ? r.recordset[0].Affected : 0;
        if (!affected) return res.status(404).json({ error: 'Not found' });
        res.json({ deleted: affected });
    } catch (err) { sendDbError(res, err); }
});

/* --------------------------
   Staff
   -------------------------- */

// List staff with optional filters: department, designation
app.get('/api/staff', async (req, res) => {
    try {
        const { department, designation } = req.query;
        const pool = await poolPromise;
        const request = pool.request();
        let where = ' WHERE 1=1 ';
        if (department) { where += ' AND DepartmentID = @department '; request.input('department', sql.Int, parseInt(department, 10)); }
        if (designation) { where += ' AND DesignationID = @designation '; request.input('designation', sql.Int, parseInt(designation, 10)); }

        const sqlText = `SELECT StaffID, PrefixID, FirstName, MiddleName, LastName, Mobile, Email, DepartmentID, DesignationID, StaffCategoryID, WorkingStatus FROM dbo.StaffMaster ${where} ORDER BY StaffID DESC`;
        const r = await request.query(sqlText);
        res.json(r.recordset);
    } catch (err) { sendDbError(res, err); }
});

// Get staff by id
app.get('/api/staff/:id', async (req, res) => {
    try {
        const pool = await poolPromise;
        const r = await pool.request().input('id', sql.Int, req.params.id).query('SELECT * FROM dbo.StaffMaster WHERE StaffID = @id');
        if (!r.recordset.length) return res.status(404).json({ error: 'Not found' });
        res.json(r.recordset[0]);
    } catch (err) { sendDbError(res, err); }
});

// Create staff
app.post('/api/staff', async (req, res) => {
    try {
        const b = req.body || {};
        if (!b.FirstName || !b.Mobile) return res.status(400).json({ error: 'FirstName and Mobile required' });

        const pool = await poolPromise;
        const r = await pool.request()
            .input('PrefixID', sql.Int, b.PrefixID || null)
            .input('FirstName', sql.NVarChar(200), b.FirstName)
            .input('MiddleName', sql.NVarChar(100), b.MiddleName || null)
            .input('LastName', sql.NVarChar(100), b.LastName || null)
            .input('GenderID', sql.Int, b.GenderID || null)
            .input('DOB', sql.Date, b.DOB || null)
            .input('Mobile', sql.NVarChar(15), b.Mobile)
            .input('Email', sql.NVarChar(250), b.Email || null)
            .input('DepartmentID', sql.Int, b.DepartmentID || null)
            .input('DesignationID', sql.Int, b.DesignationID || null)
            .input('StaffCategoryID', sql.Int, b.StaffCategoryID || null)
            .input('UserRoleID', sql.Int, b.UserRoleID || null)
            .query(`
                INSERT INTO dbo.StaffMaster (PrefixID, FirstName, MiddleName, LastName, GenderID, DOB, Mobile, Email, DepartmentID, DesignationID, StaffCategoryID, UserRoleID, CreatedAt)
                    OUTPUT INSERTED.StaffID
                VALUES (@PrefixID, @FirstName, @MiddleName, @LastName, @GenderID, @DOB, @Mobile, @Email, @DepartmentID, @DesignationID, @StaffCategoryID, @UserRoleID, SYSDATETIME());
            `);
        res.status(201).json({ StaffID: r.recordset[0].StaffID });
    } catch (err) { sendDbError(res, err); }
});

// Update staff
app.put('/api/staff/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const b = req.body || {};
        const pool = await poolPromise;
        const request = pool.request();
        request.input('id', sql.Int, id);
        request.input('FirstName', sql.NVarChar(200), b.FirstName || null);
        request.input('MiddleName', sql.NVarChar(100), b.MiddleName || null);
        request.input('LastName', sql.NVarChar(100), b.LastName || null);
        request.input('Mobile', sql.NVarChar(15), b.Mobile || null);
        request.input('Email', sql.NVarChar(250), b.Email || null);
        request.input('DepartmentID', sql.Int, b.DepartmentID || null);
        request.input('DesignationID', sql.Int, b.DesignationID || null);
        request.input('WorkingStatus', sql.NVarChar(20), b.WorkingStatus || null);

        const updateSql = `
            UPDATE dbo.StaffMaster
            SET FirstName = COALESCE(@FirstName, FirstName),
                MiddleName = COALESCE(@MiddleName, MiddleName),
                LastName = COALESCE(@LastName, LastName),
                Mobile = COALESCE(@Mobile, Mobile),
                Email = COALESCE(@Email, Email),
                DepartmentID = COALESCE(@DepartmentID, DepartmentID),
                DesignationID = COALESCE(@DesignationID, DesignationID),
                WorkingStatus = COALESCE(@WorkingStatus, WorkingStatus),
                UpdatedAt = SYSDATETIME()
            WHERE StaffID = @id;
            SELECT @@ROWCOUNT AS Affected;
        `;
        const r = await request.query(updateSql);
        const affected = r.recordset && r.recordset[0] ? r.recordset[0].Affected : 0;
        if (!affected) return res.status(404).json({ error: 'Not found or nothing changed' });
        res.json({ updated: affected });
    } catch (err) { sendDbError(res, err); }
});

// Delete staff (soft delete -> set WorkingStatus = 'Left')
app.delete('/api/staff/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const r = await (await poolPromise).request().input('id', sql.Int, id)
            .query("UPDATE dbo.StaffMaster SET WorkingStatus = 'Left', UpdatedAt = SYSDATETIME() WHERE StaffID = @id; SELECT @@ROWCOUNT AS Affected;");
        const affected = r.recordset && r.recordset[0] ? r.recordset[0].Affected : 0;
        if (!affected) return res.status(404).json({ error: 'Not found' });
        res.json({ deleted: affected });
    } catch (err) { sendDbError(res, err); }
});

/* --------------------------
   Appointments
   -------------------------- */

// List appointments (optional filters: date, status)
// List appointments (with patient name + appointment type)
// List appointments (FULL DATA for UI)
app.get('/api/appointments', async (req, res) => {
    try {
        const { date, status } = req.query;
        const pool = await poolPromise;
        const request = pool.request();

        let where = ' WHERE s.IsCancelled = 0 ';
        if (date) {
            where += ' AND s.AppointmentDate = @date ';
            request.input('date', sql.Date, date);
        }
        if (status) {
            where += ' AND s.AppointmentStatus = @status ';
            request.input('status', sql.NVarChar(50), status);
        }

        const sqlText = `
            SELECT
                s.ScheduleID,
                s.PatientID,
                p.FirstName + ' ' + ISNULL(p.LastName, '') AS PatientName,
                s.Mobile,
                s.AppointmentDate,
                s.AppointmentStartTime,   -- 🔥 KEEP AS TIME
                s.AppointmentEndTime,
                at.AppointmentType,
                s.AppointmentStatus,
                s.Note
            FROM dbo.PatientSchedule s
                     LEFT JOIN dbo.PatientMaster p
                               ON s.PatientID = p.PatientID
                     LEFT JOIN dbo.AppointmentTypeMst at
            ON s.AppointmentTypeID = at.AppointmentTypeID
                ${where}
            ORDER BY s.AppointmentDate DESC, s.AppointmentStartTime ASC
        `;

        const r = await request.query(sqlText);
        res.json(r.recordset);

    } catch (err) {
        sendDbError(res, err);
    }
});




// Get appointment by id
app.get('/api/appointments/:id', async (req, res) => {
    try {
        const r = await (await poolPromise).request().input('id', sql.Int, req.params.id)
            .query('SELECT * FROM dbo.PatientSchedule WHERE ScheduleID = @id');
        if (!r.recordset.length) return res.status(404).json({ error: 'Not found' });
        res.json(r.recordset[0]);
    } catch (err) { sendDbError(res, err); }
});


// Create appointment (FINAL FIXED VERSION)
// Create appointment (FINAL FIXED VERSION — STABLE)
app.post('/api/appointments', async (req, res) => {
    try {
        console.log("APPOINTMENT PAYLOAD RECEIVED:", req.body);

        const {
            PatientID,
            Mobile,
            DepartmentID = 1,
            DoctorID = 1,
            AppointmentDate,
            AppointmentStartTime,
            AppointmentEndTime = null,
            AppointmentTypeID,
            Note = null
        } = req.body || {};

        // ✅ HARD VALIDATION
        if (!PatientID || isNaN(PatientID)) {
            return res.status(400).json({ error: 'Valid PatientID is required' });
        }
        if (!Mobile) return res.status(400).json({ error: 'Mobile is required' });
        if (!AppointmentDate) return res.status(400).json({ error: 'AppointmentDate required' });
        if (!AppointmentStartTime) return res.status(400).json({ error: 'AppointmentStartTime required' });
        if (!AppointmentTypeID) return res.status(400).json({ error: 'AppointmentTypeID required' });

        const pool = await poolPromise;
        const reqq = pool.request();

        // ✅ IMPORTANT FIX
        reqq.input("PatientID", sql.Int, PatientID);
        reqq.input("Mobile", sql.NVarChar(15), Mobile);
        reqq.input("DepartmentID", sql.Int, DepartmentID);
        reqq.input("DoctorID", sql.Int, DoctorID);
        reqq.input("AppointmentDate", sql.Date, AppointmentDate);
        reqq.input("AppointmentStartTime", sql.VarChar(8), AppointmentStartTime);

        reqq.input("AppointmentEndTime", sql.VarChar(8), AppointmentEndTime);

        reqq.input("AppointmentTypeID", sql.Int, AppointmentTypeID);
        reqq.input("Note", sql.NVarChar(500), Note);

        const result = await reqq.query(`
            INSERT INTO dbo.PatientSchedule (
                PatientID, Mobile, DepartmentID, DoctorID,
                AppointmentDate, AppointmentStartTime, AppointmentEndTime,
                AppointmentTypeID, Note,
                AppointmentStatus, IsCancelled, CreatedAt
            )
            OUTPUT INSERTED.ScheduleID
            VALUES (
                @PatientID, @Mobile, @DepartmentID, @DoctorID,
                @AppointmentDate, @AppointmentStartTime, @AppointmentEndTime,
                @AppointmentTypeID, @Note,
                'Scheduled', 0, SYSDATETIME()
            )
        `);

        res.status(201).json({
            ScheduleID: result.recordset[0].ScheduleID
        });

    } catch (err) {
        console.error("APPOINTMENT INSERT ERROR:", err);
        res.status(500).json({ error: err.message });
    }
});








// Update appointment (e.g., change time/status)
app.put('/api/appointments/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const b = req.body || {};
        const pool = await poolPromise;
        const reqq = pool.request();
        reqq.input('id', sql.BigInt, id);


        reqq.input('AppointmentDate', sql.Date, b.AppointmentDate || null);

// 🔥 THIS is the critical one
        reqq.input('AppointmentStartTime', sql.Time, b.AppointmentStartTime);

// Optional (same rule applies)
        reqq.input('AppointmentEndTime', sql.Time, b.AppointmentEndTime || null);

        reqq.input('AppointmentStatus', sql.NVarChar(50), b.AppointmentStatus || null);
        reqq.input('Note', sql.NVarChar(500), b.Note || null);


        const updateSql = `
            UPDATE dbo.PatientSchedule
            SET AppointmentDate = COALESCE(@AppointmentDate, AppointmentDate),
                AppointmentStartTime = COALESCE(@AppointmentStartTime, AppointmentStartTime),
                AppointmentEndTime = COALESCE(@AppointmentEndTime, AppointmentEndTime),
                AppointmentStatus = COALESCE(@AppointmentStatus, AppointmentStatus),
                Note = COALESCE(@Note, Note),
                UpdatedAt = SYSDATETIME()
            WHERE ScheduleID = @id;
            SELECT @@ROWCOUNT AS Affected;
        `;
        const r = await reqq.query(updateSql);
        const affected = r.recordset && r.recordset[0] ? r.recordset[0].Affected : 0;
        if (!affected) return res.status(404).json({ error: 'Not found or nothing changed' });
        res.json({ updated: affected });
    } catch (err) { sendDbError(res, err); }
});

// Cancel / Delete appointment (soft)
app.delete('/api/appointments/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const r = await (await poolPromise).request().input('id', sql.Int, id)
            .query("UPDATE dbo.PatientSchedule SET IsCancelled = 1, AppointmentStatus = 'Cancelled', UpdatedAt = SYSDATETIME() WHERE ScheduleID = @id; SELECT @@ROWCOUNT AS Affected;");
        const affected = r.recordset && r.recordset[0] ? r.recordset[0].Affected : 0;
        if (!affected) return res.status(404).json({ error: 'Not found' });
        res.json({ cancelled: affected });
    } catch (err) { sendDbError(res, err); }
});

/* --------------------------
   Postal lookup
   -------------------------- */
app.get('/api/postal/:pincode', async (req, res) => {
    try {
        const p = req.params.pincode;
        const r = await (await poolPromise).request().input('p', sql.NVarChar(20), p)
            .query('SELECT PostalID, Pincode, AreaName, CityID, StateID FROM dbo.PostalCodesMst WHERE Pincode = @p');
        res.json(r.recordset);
    } catch (err) { sendDbError(res, err); }
});

/* ---------------------------------------------------
   MEDICINE META (Categories + Types)
--------------------------------------------------- */

app.get("/api/medicine-categories", async (req, res) => {
    try {
        const r = await (await poolPromise).request()
            .query("SELECT CategoryID, Category FROM MedicinesCategoryMst ORDER BY Category");
        res.json(r.recordset);
    } catch (err) { sendDbError(res, err); }
});

app.get("/api/medicine-types", async (req, res) => {
    try {
        const r = await (await poolPromise).request()
            .query("SELECT MedicinesTypeID, MedicinesType FROM MedicinesTypeMst ORDER BY MedicinesType");
        res.json(r.recordset);
    } catch (err) { sendDbError(res, err); }
});


/* ---------------------------------------------------
   GET ALL MEDICINES WITH TOTAL STOCK + LATEST EXPIRY
--------------------------------------------------- */

app.get("/api/medicines", async (req, res) => {
    try {
        const sqlQuery = `
            SELECT 
                m.medicine_id AS MedicineID,
                m.medicine_name AS MedicineName,
                m.Sanskrit_name,
                m.brand_name,
                m.CategoryID,
                c.Category,
                m.MedicinesTypeID,
                t.MedicinesType,
                m.dosage_strength,
                m.manufacturer,
                m.Timing,

                /* STOCK = SUM of all batches */
                SUM(b.quantity_in_stock) AS TotalStock,

                /* LATEST EXPIRY = MAX expiry_date */
                MAX(b.expiry_date) AS LatestExpiry

            FROM Medicines m
            LEFT JOIN MedicinesCategoryMst c ON m.CategoryID = c.CategoryID
            LEFT JOIN MedicinesTypeMst t ON m.MedicinesTypeID = t.MedicinesTypeID
            LEFT JOIN Medicine_Batches b ON m.medicine_id = b.medicine_id

            GROUP BY 
                m.medicine_id, m.medicine_name, m.Sanskrit_name,
                m.brand_name, m.CategoryID, c.Category,
                m.MedicinesTypeID, t.MedicinesType,
                m.dosage_strength, m.manufacturer, m.Timing

            ORDER BY m.medicine_id DESC;
        `;

        const result = await (await poolPromise).request().query(sqlQuery);
        res.json(result.recordset);

    } catch (err) { sendDbError(res, err); }
});

/* ---------------------------------------------------
   ADD STOCK (NEW BATCH ENTRY)
--------------------------------------------------- */
app.post("/api/medicines/:id/add-stock", async (req, res) => {
    try {
        const medicineId = parseInt(req.params.id, 10);
        const { quantity } = req.body || {};

        if (!medicineId || quantity == null || quantity < 0) {
            return res.status(400).json({ error: "Invalid medicineId or quantity" });
        }

        await (await poolPromise).request()
            .input("medicine_id", sql.Int, medicineId)
            .input("batch_number", sql.NVarChar(100), `AUTO-${Date.now()}`)
            .input("quantity_in_stock", sql.Int, quantity)
            .query(`
                INSERT INTO Medicine_Batches
                (medicine_id, batch_number, quantity_in_stock, CreatedAt)
                VALUES
                (@medicine_id, @batch_number, @quantity_in_stock, SYSDATETIME());
            `);

        res.json({ success: true });

    } catch (err) {
        sendDbError(res, err);
    }
});

/* ---------------------------------------------------
   CREATE MEDICINE + FIRST BATCH (FULL INSERT)
--------------------------------------------------- */

app.post("/api/medicines/full", async (req, res) => {
    const body = req.body || {};

    const {
        // medicine fields
        medicine_name,
        Sanskrit_name,
        brand_name,
        CategoryID,
        MedicinesTypeID,
        dosage_strength,
        manufacturer,
        Timing,

        // batch fields
        batch_number,
        mfg_date,
        expiry_date,
        purchase_rate,
        mrp_rate,
        selling_rate,
        quantity_in_stock,
        location_rack
    } = body;

    if (!medicine_name) return res.status(400).json({ error: "medicine_name required" });

    const pool = await poolPromise;
    const tx = new sql.Transaction(pool);

    try {
        await tx.begin();

        /* ------------ INSERT MEDICINE ------------ */
        const r1 = await tx.request()
            .input("medicine_name", sql.NVarChar(150), medicine_name)
            .input("Sanskrit_name", sql.NVarChar(150), Sanskrit_name || null)
            .input("brand_name", sql.NVarChar(150), brand_name || null)
            .input("CategoryID", sql.Int, CategoryID || null)
            .input("MedicinesTypeID", sql.Int, MedicinesTypeID || null)
            .input("dosage_strength", sql.NVarChar(50), dosage_strength || null)
            .input("manufacturer", sql.NVarChar(150), manufacturer || null)
            .input("Timing", sql.NVarChar(50), Timing || null)
            .query(`
                INSERT INTO Medicines (
                    medicine_name, Sanskrit_name, brand_name,
                    CategoryID, MedicinesTypeID,
                    dosage_strength, manufacturer, Timing, CreatedAt
                )
                OUTPUT INSERTED.medicine_id
                VALUES (
                    @medicine_name, @Sanskrit_name, @brand_name,
                    @CategoryID, @MedicinesTypeID,
                    @dosage_strength, @manufacturer, @Timing, SYSDATETIME()
                )
            `);

        const newMedicineId = r1.recordset[0].medicine_id;

        /* ------------ INSERT FIRST BATCH ------------ */
        const r2 = await tx.request()
            .input("medicine_id", sql.Int, newMedicineId)
            .input("batch_number", sql.NVarChar(100), batch_number)
            .input("mfg_date", sql.Date, mfg_date || null)
            .input("expiry_date", sql.Date, expiry_date || null)
            .input("purchase_rate", sql.Decimal(10,2), purchase_rate || 0)
            .input("mrp_rate", sql.Decimal(10,2), mrp_rate || 0)
            .input("selling_rate", sql.Decimal(10,2), selling_rate || 0)
            .input("quantity_in_stock", sql.Int, quantity_in_stock || 0)
            .input("location_rack", sql.NVarChar(50), location_rack || null)
            .query(`
                INSERT INTO Medicine_Batches (
                    medicine_id, batch_number, mfg_date, expiry_date,
                    purchase_rate, mrp_rate, selling_rate,
                    quantity_in_stock, location_rack, CreatedAt
                )
                OUTPUT INSERTED.batch_id
                VALUES (
                    @medicine_id, @batch_number, @mfg_date, @expiry_date,
                    @purchase_rate, @mrp_rate, @selling_rate,
                    @quantity_in_stock, @location_rack, SYSDATETIME()
                )
            `);

        await tx.commit();

        res.status(201).json({
            success: true,
            MedicineID: newMedicineId,
            BatchID: r2.recordset[0].batch_id
        });

    } catch (err) {
        await tx.rollback();
        sendDbError(res, err);
    }
});


/* ---------------------------------------------------
   UPDATE EXISTING MEDICINE
--------------------------------------------------- */

app.put('/api/medicines/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        const b = req.body || {};

        const r = await (await poolPromise).request()
            .input('id', sql.Int, id)
            .input('medicine_name', sql.NVarChar(200), b.medicine_name || null)
            .input('CategoryID', sql.Int, b.CategoryID || null)
            .input('MedicinesTypeID', sql.Int, b.MedicinesTypeID || null)
            .input('manufacturer', sql.NVarChar(150), b.manufacturer || null)
            .input('dosage_strength', sql.NVarChar(50), b.dosage_strength || null)
            .query(`
                UPDATE Medicines SET
                    medicine_name = COALESCE(@medicine_name, medicine_name),
                    CategoryID = COALESCE(@CategoryID, CategoryID),
                    MedicinesTypeID = COALESCE(@MedicinesTypeID, MedicinesTypeID),
                    manufacturer = COALESCE(@manufacturer, manufacturer),
                    dosage_strength = COALESCE(@dosage_strength, dosage_strength),
                    UpdatedAt = SYSDATETIME()
                WHERE medicine_id = @id;

                SELECT @@ROWCOUNT AS Affected;
            `);

        if (!r.recordset[0].Affected)
            return res.status(404).json({ error: "Not found or unchanged" });

        res.json({ updated: r.recordset[0].Affected });

    } catch (err) { sendDbError(res, err); }
});


/* ---------------------------------------------------
   DELETE MEDICINE
--------------------------------------------------- */

app.delete('/api/medicines/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);

        const r = await (await poolPromise).request()
            .input('id', sql.Int, id)
            .query(`
                DELETE FROM Medicines WHERE medicine_id = @id;
                SELECT @@ROWCOUNT AS Affected;
            `);

        if (!r.recordset[0].Affected)
            return res.status(404).json({ error: "Not found" });

        res.json({ deleted: r.recordset[0].Affected });

    } catch (err) { sendDbError(res, err); }
});


/* --------------------------
   Prescriptions (Prescription + PrescriptionMedicine)
   -------------------------- */

// List prescriptions (optionally by patient)
app.get('/api/prescriptions', async (req, res) => {
    try {
        const { patientId } = req.query;
        const pool = await poolPromise;
        const request = pool.request();
        let where = '';
        if (patientId) { where = ' WHERE p.PatientID = @patientId '; request.input('patientId', sql.BigInt, patientId); }
        const r = await request.query(`
            SELECT p.PrescriptionID, p.PrescriptionNumber, p.PatientID, p.DoctorID, p.VisitDate, p.Notes
            FROM dbo.Prescription p
                ${where}
            ORDER BY p.PrescriptionID DESC
        `);
        res.json(r.recordset);
    } catch (err) { sendDbError(res, err); }
});

// Get prescription by id (with medicines)
app.get('/api/prescriptions/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        const pool = await poolPromise;
        const p = await pool.request().input('id', sql.Int, id)
            .query('SELECT * FROM dbo.Prescription WHERE PrescriptionID = @id');
        if (!p.recordset.length) return res.status(404).json({ error: 'Not found' });
        const meds = await pool.request().input('id', sql.Int, id)
            .query('SELECT * FROM dbo.PrescriptionMedicine WHERE PrescriptionID = @id');
        res.json({ prescription: p.recordset[0], medicines: meds.recordset });
    } catch (err) { sendDbError(res, err); }
});

// Create prescription (transactional) expected body: { PrescriptionNumber, PatientID, DoctorID, VisitDate, Notes, Medicines: [...] }
app.post('/api/prescriptions', async (req, res) => {
    const body = req.body || {};
    if (!body.PatientID || !Array.isArray(body.Medicines) || body.Medicines.length === 0) {
        return res.status(400).json({ error: 'PatientID and Medicines array required' });
    }

    const pool = await poolPromise;
    const tx = new sql.Transaction(pool);
    try {
        await tx.begin();
        const treq = tx.request();

        // Ensure PrescriptionNumber exists: generate if missing
        let presNum = body.PrescriptionNumber;
        if (!presNum) {
            const stamp = new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0,14);
            const rnd = Math.floor(Math.random()*9000)+1000;
            presNum = `RX-${stamp}-${rnd}`;
        }

        treq.input('PrescriptionNumber', sql.NVarChar(50), presNum);
        treq.input('PatientID', sql.BigInt, body.PatientID);
        treq.input('DoctorID', sql.Int, body.DoctorID || null);
        treq.input('VisitDate', sql.Date, body.VisitDate || new Date());
        treq.input('Notes', sql.NVarChar(1000), body.Notes || null);

        const presRes = await treq.query(`
            INSERT INTO dbo.Prescription (PrescriptionNumber, PatientID, DoctorID, VisitDate, Notes, CreatedAt)
                OUTPUT INSERTED.PrescriptionID
            VALUES (@PrescriptionNumber, @PatientID, @DoctorID, @VisitDate, @Notes, SYSDATETIME())
        `);
        const prescriptionId = presRes.recordset[0].PrescriptionID;

        // insert medicines
        for (const m of body.Medicines) {
            const r = tx.request();
            r.input('PrescriptionID', sql.Int, prescriptionId);
            r.input('MedicineID', sql.Int, m.MedicineID);
            r.input('Dosage', sql.NVarChar(100), m.Dosage || null);
            r.input('Frequency', sql.NVarChar(50), m.Frequency || null);
            r.input('DurationDays', sql.Int, m.DurationDays || null);
            r.input('QuantityPrescribed', sql.Int, m.QuantityPrescribed || null);
            r.input('Instructions', sql.NVarChar(500), m.Instructions || null);

            await r.query(`
                INSERT INTO dbo.PrescriptionMedicine
                (PrescriptionID, MedicineID, Dosage, Frequency, DurationDays, QuantityPrescribed, Instructions, CreatedAt)
                VALUES
                    (@PrescriptionID, @MedicineID, @Dosage, @Frequency, @DurationDays, @QuantityPrescribed, @Instructions, SYSDATETIME())
            `);
        }

        await tx.commit();
        res.status(201).json({ PrescriptionID: prescriptionId, PrescriptionNumber: presNum });
    } catch (err) {
        try { await tx.rollback(); } catch (e) { console.error('rollback failed', e); }
        sendDbError(res, err);
    }
});

/* --------------------------
   Dashboard & utility
   -------------------------- */

app.get('/api/dashboard', async (req, res) => {
    try {
        const pool = await poolPromise;
        // simple counts: patients, staff, appointments today, prescriptions
        const r = await pool.request().query(`
            SELECT (SELECT COUNT(*) FROM dbo.PatientMaster) AS TotalPatients,
                   (SELECT COUNT(*) FROM dbo.StaffMaster WHERE WorkingStatus <> 'Left') AS ActiveStaff,
                   (SELECT COUNT(*) FROM dbo.PatientSchedule WHERE AppointmentDate = CAST(SYSDATETIME() AS DATE) AND IsCancelled = 0) AS AppointmentsToday,
                   (SELECT COUNT(*) FROM dbo.Prescription) AS TotalPrescriptions
        `);
        res.json(r.recordset[0] || {});
    } catch (err) { sendDbError(res, err); }
});



/* --------------------------
   Therapy Sessions (NEW)
   -------------------------- */

app.post('/api/therapysessions', async (req, res) => {
    try {
        const b = req.body || {};

        // Validate required fields
        if (!b.TherapyDate) {
            return res.status(400).json({ error: "TherapyDate is required" });
        }

        const pool = await poolPromise;
        const r = await pool.request()
            .input("BookingID", sql.Int, b.BookingID || null)
            .input("SessionNumber", sql.Int, b.SessionNumber || 1)
            .input("TherapyDate", sql.Date, b.TherapyDate)
            .input("TherapistID", sql.Int, b.TherapistID || null)
            .input("DurationMinutes", sql.Int, b.DurationMinutes || null)
            .input("BP_Start", sql.NVarChar(50), b.BP_Start || null)
            .input("Notes", sql.NVarChar(500), b.Notes || null)
            .query(`
                INSERT INTO dbo.TherapySession
                (
                    BookingID, SessionNumber, TherapyDate,
                    TherapistID, DurationMinutes,
                    BP_Start, Notes, CreatedAt
                )
                OUTPUT INSERTED.SessionID
                VALUES
                (
                    @BookingID, @SessionNumber, @TherapyDate,
                    @TherapistID, @DurationMinutes,
                    @BP_Start, @Notes, SYSDATETIME()
                )
            `);

        res.status(201).json({
            success: true,
            SessionID: r.recordset[0].SessionID
        });

    } catch (err) {
        console.error("THERAPY SESSION INSERT ERROR:", err);
        sendDbError(res, err);
    }
});



/* --------------------------
   Finalize
   -------------------------- */
const PORT = 4001;

app.listen(PORT, () => {
    console.log(`Clinic API listening on ${PORT}`);
});
