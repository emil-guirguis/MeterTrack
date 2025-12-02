// // @ts-nocheck
// /**
//  * MeterReading Model for PostgreSQL
//  * PostgreSQL-based MeterReading model
//  */

// const db = require('../config/database');

// class MeterReading {
//     constructor(readingData = {}) {
//         // Preserve ALL columns from the database row (including newly added ones)
//         Object.assign(this, readingData);
//         // Ensure some defaults for core fields
//         this.reading_type = this.reading_type || 'manual';
//         this.multiplier = this.multiplier ?? 1;
//         this.status = this.status || 'active';
//     }

//     /**
//      * Create new meter reading
//      */
//     static async create(readingData) {
//         const {
//             meterid, reading_date, reading_value, reading_type, multiplier,
//             final_value, unit_of_measurement, status, notes, read_by,
//             verified_by, verified_date
//         } = readingData;

//         const calculatedFinalValue = final_value || (reading_value * (multiplier || 1));

//         const query = `
//             INSERT INTO meterreadings (
//                 meterid, reading_date, reading_value, reading_type, multiplier,
//                 final_value, unit_of_measurement, status, notes, read_by,
//                 verified_by, verified_date, createdat, updatedat
//             ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
//             RETURNING *
//         `;

//         const values = [
//             meterid, reading_date, reading_value, reading_type || 'manual', multiplier || 1,
//             calculatedFinalValue, unit_of_measurement, status || 'active', notes, read_by,
//             verified_by, verified_date
//         ];

//         const result = await db.query(query, values);
//         const reading = new MeterReading(result.rows[0]);

//         // Update the meter's last reading date
//         try {
//             await db.query(
//                 'UPDATE meters SET last_reading_date = $1 WHERE meterid = $2',
//                 [reading_date, meterid]
//             );
//         } catch (error) {
//             console.warn('Could not update meter last reading date:', error.message);
//         }

//         return reading;
//     }

//     /**
//      * Find reading by ID
//      */
//     static async findById(id) {
//         const query = 'SELECT * FROM meter_reading WHERE id = $1';
//         const result = await db.query(query, [id]);
        
//         if (result.rows.length === 0) {
//             return null;
//         }
        
//         return new MeterReading(result.rows[0]);
//     }

//     /**
//      * Find all readings with optional filters
//      */
//     static async findAll(filters = {}) {
//         let query = 'SELECT * FROM meterreadings WHERE 1=1';
//         const values = [];
//         let paramCount = 0;

//         if (filters.meterid) {
//             paramCount++;
//             query += ` AND meterid = $${paramCount}`;
//             values.push(filters.meterid);
//         }

//         if (filters.reading_type) {
//             paramCount++;
//             query += ` AND reading_type = $${paramCount}`;
//             values.push(filters.reading_type);
//         }

//         if (filters.status) {
//             paramCount++;
//             query += ` AND status = $${paramCount}`;
//             values.push(filters.status);
//         }

//         if (filters.start_date) {
//             paramCount++;
//             query += ` AND createdat >= $${paramCount}`;
//             values.push(filters.start_date);
//         }

//         if (filters.end_date) {
//             paramCount++;
//             query += ` AND createdat <= $${paramCount}`;
//             values.push(filters.end_date);
//         }

//         // Order by created timestamp to support environments without reading_date
//         query += ' ORDER BY createdat DESC';

//         if (filters.limit) {
//             paramCount++;
//             query += ` LIMIT $${paramCount}`;
//             values.push(filters.limit);
//         }

//         if (filters.offset) {
//             paramCount++;
//             query += ` OFFSET $${paramCount}`;
//             values.push(filters.offset);
//         }

//         if (process.env.NODE_ENV !== 'production') {
//             try { console.log('[MeterReading.findAll] SQL:', query, 'params:', values); } catch {}
//         }
//         const result = await db.query(query, values);
//         return result.rows.map(data => new MeterReading(data));
//     }

//     /**
//      * Find readings by meter ID
//      */
//     static async findByMeterId(meterid, options = {}) {
//         let query = 'SELECT * FROM meterreadings WHERE meterid = $1';
//         const values = [meterid];
//         let paramCount = 1;

//         if (options.start_date) {
//             paramCount++;
//             query += ` AND createdat >= $${paramCount}`;
//             values.push(options.start_date);
//         }

//         if (options.end_date) {
//             paramCount++;
//             query += ` AND createdat <= $${paramCount}`;
//             values.push(options.end_date);
//         }

//         // Order by created timestamp to support environments without reading_date
//         query += ' ORDER BY createdat DESC';

//         if (options.limit) {
//             paramCount++;
//             query += ` LIMIT $${paramCount}`;
//             values.push(options.limit);
//         }

//         const result = await db.query(query, values);
//         return result.rows.map(data => new MeterReading(data));
//     }

//     /**
//      * Update reading
//      */
//     async update(updateData) {
//         const allowedFields = [
//             'reading_date', 'reading_value', 'reading_type', 'multiplier',
//             'final_value', 'unit_of_measurement', 'status', 'notes',
//             'read_by', 'verified_by', 'verified_date'
//         ];
        
//         const updates = [];
//         const values = [];
//         let paramCount = 0;

//         for (const [key, value] of Object.entries(updateData)) {
//             if (allowedFields.includes(key) && value !== undefined) {
//                 paramCount++;
//                 updates.push(`${key} = $${paramCount}`);
//                 values.push(value);
//             }
//         }

//         // Recalculate final_value if reading_value or multiplier changed
//         if (updateData.reading_value !== undefined || updateData.multiplier !== undefined) {
//             const newReadingValue = updateData.reading_value !== undefined ? updateData.reading_value : this.reading_value;
//             const newMultiplier = updateData.multiplier !== undefined ? updateData.multiplier : this.multiplier;
            
//             if (!updateData.final_value) {
//                 paramCount++;
//                 updates.push(`final_value = $${paramCount}`);
//                 values.push(newReadingValue * newMultiplier);
//             }
//         }

//         if (updates.length === 0) {
//             throw new Error('No valid fields to update');
//         }

//         paramCount++;
//         updates.push(`updatedat = CURRENT_TIMESTAMP`);
//         values.push(this.id);

//         const query = `
//             UPDATE meterreadings 
//             SET ${updates.join(', ')}
//             WHERE id = $${paramCount}
//             RETURNING *
//         `;

//         const result = await db.query(query, values);
        
//         if (result.rows.length === 0) {
//             throw new Error('Reading not found');
//         }

//         // Update current instance
//         Object.assign(this, result.rows[0]);
//         return this;
//     }

//     /**
//      * Verify reading
//      */
//     async verify(verifiedBy) {
//         const query = `
//             UPDATE meterreadings 
//             SET verified_by = $1, verified_date = CURRENT_TIMESTAMP, updatedat = CURRENT_TIMESTAMP
//             WHERE id = $2
//             RETURNING *
//         `;

//         const result = await db.query(query, [verifiedBy, this.id]);
        
//         if (result.rows.length === 0) {
//             throw new Error('Reading not found');
//         }

//         this.verified_by = result.rows[0].verified_by;
//         this.verified_date = result.rows[0].verified_date;
//         this.updated_at = result.rows[0].updated_at;
//         return this;
//     }

//     /**
//      * Delete reading (soft delete)
//      */
//     async delete() {
//         const query = `
//             UPDATE meterreadings 
//             SET status = 'deleted', updatedat = CURRENT_TIMESTAMP
//             WHERE id = $1
//             RETURNING *
//         `;

//         const result = await db.query(query, [this.id]);
        
//         if (result.rows.length === 0) {
//             throw new Error('Reading not found');
//         }

//         this.status = 'deleted';
//         this.updated_at = result.rows[0].updated_at;
//         return this;
//     }

//     /**
//      * Get reading statistics for a meter
//      */
//     static async getStatsByMeter(meterid, period = '30 days') {
//         const query = `
//             SELECT 
//                 COUNT(*) as total_readings,
//                 AVG(final_value) as average_value,
//                 MIN(final_value) as min_value,
//                 MAX(final_value) as max_value,
//                 SUM(final_value) as total_consumption,
//                 COUNT(CASE WHEN verified_by IS NOT NULL THEN 1 END) as verified_readings,
//                 COUNT(CASE WHEN reading_type = 'automatic' THEN 1 END) as automatic_readings,
//                 COUNT(CASE WHEN reading_type = 'manual' THEN 1 END) as manual_readings
//             FROM meterreadings 
//             WHERE meterid = $1 
//             AND createdat >= NOW() - INTERVAL '${period}'
//             AND status = 'active'
//         `;

//         const result = await db.query(query, [meterid]);
//         return result.rows[0];
//     }

//     /**
//      * Get latest reading for a meter
//      */
//     static async getLatestByMeter(meterid) {
//         const query = `
//             SELECT * FROM meterreadings 
//             WHERE meterid = $1 AND (status IS NULL OR status = 'active')
//             ORDER BY createdat DESC 
//             LIMIT 1
//         `;

//         const result = await db.query(query, [meterid]);
        
//         if (result.rows.length === 0) {
//             return null;
//         }
        
//         return new MeterReading(result.rows[0]);
//     }

//     /**
//      * Get consumption between two dates
//      */
//     static async getConsumption(meterid, startDate, endDate) {
//         const query = `
//             SELECT 
//                 SUM(final_value) as total_consumption,
//                 COUNT(*) as reading_count,
//                 AVG(final_value) as average_reading,
//                 MIN(createdat) as first_reading,
//                 MAX(createdat) as last_reading
//             FROM meterreadings 
//             WHERE meterid = $1 
//             AND createdat BETWEEN $2 AND $3
//             AND (status IS NULL OR status = 'active')
//         `;

//         const result = await db.query(query, [meterid, startDate, endDate]);
//         return result.rows[0];
//     }

//     /**
//      * Convert to JSON
//      */
//     toJSON() {
//         return {
//             ...this,
//             isVerified: !!this.verified_by
//         };
//     }
// }

// module.exports = MeterReading;