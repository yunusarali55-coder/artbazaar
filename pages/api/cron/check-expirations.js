import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export default async function handler(req, res) {
  try {
    const result = await pool.query(
      `UPDATE listings 
       SET status = 'expired' 
       WHERE expires_at < NOW() AND status = 'active'
       RETURNING id, artist_id;`
    );
    res.status(200).json({ success: true, expiredListings: result.rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
