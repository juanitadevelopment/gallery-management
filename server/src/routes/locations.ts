import express from 'express';
import { runQuery, getQuery, allQuery } from '../database';

const router = express.Router();

// GET /api/locations - Get all locations
router.get('/', async (req, res) => {
  try {
    const locations = await allQuery(`
      SELECT * FROM locations 
      ORDER BY id ASC
    `);
    res.json(locations);
  } catch (error) {
    console.error('Error fetching locations:', error);
    res.status(500).json({ error: '場所の取得に失敗しました' });
  }
});

// GET /api/locations/:id - Get location by id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const location = await getQuery('SELECT * FROM locations WHERE id = ?', [id]);
    
    if (!location) {
      return res.status(404).json({ error: '場所が見つかりません' });
    }
    
    res.json(location);
  } catch (error) {
    console.error('Error fetching location:', error);
    res.status(500).json({ error: '場所の取得に失敗しました' });
  }
});

// PUT /api/locations/:id - Update location
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { width, height, description, updated_at } = req.body;
    
    // Check if location exists
    const existingLocation = await getQuery('SELECT * FROM locations WHERE id = ?', [id]);
    if (!existingLocation) {
      return res.status(404).json({ error: '場所が見つかりません' });
    }
    
    // Optimistic locking check
    if (updated_at && existingLocation.updated_at !== updated_at) {
      return res.status(409).json({ 
        error: '他のユーザーによってデータが更新されています。画面を更新してから再試行してください。' 
      });
    }
    
    // Validation
    if (!width || !height || width <= 0 || height <= 0) {
      return res.status(400).json({ 
        error: '幅と高さは正の数値である必要があります' 
      });
    }
    
    if (width > 1000 || height > 1000) {
      return res.status(400).json({ 
        error: '幅と高さは1000以下である必要があります' 
      });
    }
    
    await runQuery(`
      UPDATE locations 
      SET width = ?, height = ?, description = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `, [width, height, description?.trim() || null, id]);
    
    const updatedLocation = await getQuery('SELECT * FROM locations WHERE id = ?', [id]);
    
    res.json(updatedLocation);
  } catch (error) {
    console.error('Error updating location:', error);
    res.status(500).json({ error: '場所の更新に失敗しました' });
  }
});

// GET /api/locations/:id/availability - Check location availability
router.get('/:id/availability', async (req, res) => {
  try {
    const { id } = req.params;
    const { start_date, end_date, exclude_exhibition_id } = req.query;
    
    if (!start_date || !end_date) {
      return res.status(400).json({ error: '開始日と終了日は必須です' });
    }
    
    let sql = `
      SELECT COUNT(*) as count FROM exhibitions 
      WHERE location_id = ? 
      AND status IN ('scheduled', 'active')
      AND (
        (start_date <= ? AND end_date >= ?) OR 
        (start_date <= ? AND end_date >= ?) OR
        (start_date >= ? AND end_date <= ?)
      )
    `;
    
    const params = [id, start_date, start_date, end_date, end_date, start_date, end_date];
    
    // Exclude specific exhibition if editing
    if (exclude_exhibition_id) {
      sql += ' AND id != ?';
      params.push(exclude_exhibition_id as string);
    }
    
    const result = await getQuery(sql, params);
    
    res.json({ 
      available: result.count === 0,
      conflicting_exhibitions: result.count 
    });
  } catch (error) {
    console.error('Error checking availability:', error);
    res.status(500).json({ error: '空き状況の確認に失敗しました' });
  }
});

// GET /api/locations/:id/schedule - Get location schedule
router.get('/:id/schedule', async (req, res) => {
  try {
    const { id } = req.params;
    const { year, month } = req.query;
    
    let sql = `
      SELECT e.*, a.title as artwork_title, a.artist as artwork_artist
      FROM exhibitions e
      JOIN artworks a ON e.artwork_id = a.id
      WHERE e.location_id = ?
      ORDER BY e.start_date ASC
    `;
    
    const params = [id];
    
    if (year && month) {
      sql = `
        SELECT e.*, a.title as artwork_title, a.artist as artwork_artist
        FROM exhibitions e
        JOIN artworks a ON e.artwork_id = a.id
        WHERE e.location_id = ?
        AND (
          strftime('%Y-%m', e.start_date) = ? OR
          strftime('%Y-%m', e.end_date) = ? OR
          (e.start_date <= ? AND e.end_date >= ?)
        )
        ORDER BY e.start_date ASC
      `;
      const yearMonth = `${year}-${String(month).padStart(2, '0')}`;
      const monthStart = `${yearMonth}-01`;
      const monthEnd = `${yearMonth}-31`;
      params.push(yearMonth, yearMonth, monthEnd, monthStart);
    }
    
    const schedule = await allQuery(sql, params);
    
    res.json(schedule);
  } catch (error) {
    console.error('Error fetching schedule:', error);
    res.status(500).json({ error: 'スケジュールの取得に失敗しました' });
  }
});

export default router;