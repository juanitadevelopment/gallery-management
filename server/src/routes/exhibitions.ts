import express from 'express';
import { runQuery, getQuery, allQuery } from '../database';

const router = express.Router();

// GET /api/exhibitions - Get all exhibitions
router.get('/', async (req, res) => {
  try {
    const { status, current } = req.query;
    
    let sql = `
      SELECT 
        e.*,
        a.title as artwork_title,
        a.artist as artwork_artist,
        a.detail_url as artwork_detail_url,
        l.width as location_width,
        l.height as location_height,
        l.description as location_description
      FROM exhibitions e
      JOIN artworks a ON e.artwork_id = a.id
      JOIN locations l ON e.location_id = l.id
    `;
    
    const params: any[] = [];
    
    if (status) {
      sql += ' WHERE e.status = ?';
      params.push(status);
    }
    
    if (current === 'true') {
      const whereClause = status ? ' AND' : ' WHERE';
      sql += `${whereClause} date('now') BETWEEN e.start_date AND e.end_date`;
    }
    
    sql += ' ORDER BY e.start_date DESC, e.created_at DESC';
    
    const exhibitions = await allQuery(sql, params);
    
    // Format the response
    const formattedExhibitions = exhibitions.map(exhibition => ({
      id: exhibition.id,
      artwork_id: exhibition.artwork_id,
      location_id: exhibition.location_id,
      start_date: exhibition.start_date,
      end_date: exhibition.end_date,
      status: exhibition.status,
      notes: exhibition.notes,
      created_at: exhibition.created_at,
      updated_at: exhibition.updated_at,
      artwork: {
        id: exhibition.artwork_id,
        title: exhibition.artwork_title,
        artist: exhibition.artwork_artist,
        detail_url: exhibition.artwork_detail_url
      },
      location: {
        id: exhibition.location_id,
        width: exhibition.location_width,
        height: exhibition.location_height,
        description: exhibition.location_description
      }
    }));
    
    res.json(formattedExhibitions);
  } catch (error) {
    console.error('Error fetching exhibitions:', error);
    res.status(500).json({ error: '展示の取得に失敗しました' });
  }
});

// GET /api/exhibitions/current - Get current exhibitions
router.get('/current', async (req, res) => {
  try {
    const currentExhibitions = await allQuery(`
      SELECT 
        e.*,
        a.title as artwork_title,
        a.artist as artwork_artist,
        a.detail_url as artwork_detail_url,
        l.width as location_width,
        l.height as location_height,
        l.description as location_description
      FROM exhibitions e
      JOIN artworks a ON e.artwork_id = a.id
      JOIN locations l ON e.location_id = l.id
      WHERE date('now') BETWEEN e.start_date AND e.end_date
      ORDER BY e.location_id ASC
    `);
    
    const formattedExhibitions = currentExhibitions.map(exhibition => ({
      id: exhibition.id,
      artwork_id: exhibition.artwork_id,
      location_id: exhibition.location_id,
      start_date: exhibition.start_date,
      end_date: exhibition.end_date,
      status: exhibition.status,
      notes: exhibition.notes,
      created_at: exhibition.created_at,
      updated_at: exhibition.updated_at,
      artwork: {
        id: exhibition.artwork_id,
        title: exhibition.artwork_title,
        artist: exhibition.artwork_artist,
        detail_url: exhibition.artwork_detail_url
      },
      location: {
        id: exhibition.location_id,
        width: exhibition.location_width,
        height: exhibition.location_height,
        description: exhibition.location_description
      }
    }));
    
    res.json(formattedExhibitions);
  } catch (error) {
    console.error('Error fetching current exhibitions:', error);
    res.status(500).json({ error: '現在の展示の取得に失敗しました' });
  }
});

// GET /api/exhibitions/:id - Get exhibition by id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const exhibition = await getQuery(`
      SELECT 
        e.*,
        a.title as artwork_title,
        a.artist as artwork_artist,
        a.detail_url as artwork_detail_url,
        l.width as location_width,
        l.height as location_height,
        l.description as location_description
      FROM exhibitions e
      JOIN artworks a ON e.artwork_id = a.id
      JOIN locations l ON e.location_id = l.id
      WHERE e.id = ?
    `, [id]);
    
    if (!exhibition) {
      return res.status(404).json({ error: '展示が見つかりません' });
    }
    
    const formattedExhibition = {
      id: exhibition.id,
      artwork_id: exhibition.artwork_id,
      location_id: exhibition.location_id,
      start_date: exhibition.start_date,
      end_date: exhibition.end_date,
      status: exhibition.status,
      notes: exhibition.notes,
      created_at: exhibition.created_at,
      updated_at: exhibition.updated_at,
      artwork: {
        id: exhibition.artwork_id,
        title: exhibition.artwork_title,
        artist: exhibition.artwork_artist,
        detail_url: exhibition.artwork_detail_url
      },
      location: {
        id: exhibition.location_id,
        width: exhibition.location_width,
        height: exhibition.location_height,
        description: exhibition.location_description
      }
    };
    
    res.json(formattedExhibition);
  } catch (error) {
    console.error('Error fetching exhibition:', error);
    res.status(500).json({ error: '展示の取得に失敗しました' });
  }
});

// POST /api/exhibitions - Create new exhibition
router.post('/', async (req, res) => {
  try {
    const { artwork_id, location_id, start_date, end_date, status = 'scheduled', notes } = req.body;
    
    // Validation
    if (!artwork_id || !location_id || !start_date || !end_date) {
      return res.status(400).json({ 
        error: 'アートワーク、場所、開始日、終了日は必須です' 
      });
    }
    
    if (new Date(start_date) >= new Date(end_date)) {
      return res.status(400).json({ 
        error: '開始日は終了日より前である必要があります' 
      });
    }
    
    if (!['scheduled', 'active', 'completed'].includes(status)) {
      return res.status(400).json({ 
        error: 'ステータスは scheduled, active, completed のいずれかである必要があります' 
      });
    }
    
    // Check if artwork exists
    const artwork = await getQuery('SELECT id FROM artworks WHERE id = ?', [artwork_id]);
    if (!artwork) {
      return res.status(400).json({ error: 'アートワークが存在しません' });
    }
    
    // Check if location exists
    const location = await getQuery('SELECT id FROM locations WHERE id = ?', [location_id]);
    if (!location) {
      return res.status(400).json({ error: '場所が存在しません' });
    }
    
    // Check for conflicts with existing exhibitions (using transaction)
    await runQuery('BEGIN TRANSACTION');
    
    try {
      const conflictCheck = await getQuery(`
        SELECT COUNT(*) as count FROM exhibitions 
        WHERE location_id = ? 
        AND status IN ('scheduled', 'active')
        AND (
          (start_date <= ? AND end_date >= ?) OR 
          (start_date <= ? AND end_date >= ?) OR
          (start_date >= ? AND end_date <= ?)
        )
      `, [location_id, start_date, start_date, end_date, end_date, start_date, end_date]);
      
      if (conflictCheck.count > 0) {
        await runQuery('ROLLBACK');
        return res.status(409).json({ 
          error: '指定された期間・場所で既に展示が予定されています' 
        });
      }
      
      const result = await runQuery(`
        INSERT INTO exhibitions (artwork_id, location_id, start_date, end_date, status, notes) 
        VALUES (?, ?, ?, ?, ?, ?)
      `, [artwork_id, location_id, start_date, end_date, status, notes?.trim() || null]);
      
      await runQuery('COMMIT');
      
      const newExhibition = await getQuery(`
        SELECT 
          e.*,
          a.title as artwork_title,
          a.artist as artwork_artist,
          a.detail_url as artwork_detail_url,
          l.width as location_width,
          l.height as location_height,
          l.description as location_description
        FROM exhibitions e
        JOIN artworks a ON e.artwork_id = a.id
        JOIN locations l ON e.location_id = l.id
        WHERE e.id = ?
      `, [result.id]);
      
      const formattedExhibition = {
        id: newExhibition.id,
        artwork_id: newExhibition.artwork_id,
        location_id: newExhibition.location_id,
        start_date: newExhibition.start_date,
        end_date: newExhibition.end_date,
        status: newExhibition.status,
        notes: newExhibition.notes,
        created_at: newExhibition.created_at,
        updated_at: newExhibition.updated_at,
        artwork: {
          id: newExhibition.artwork_id,
          title: newExhibition.artwork_title,
          artist: newExhibition.artwork_artist,
          detail_url: newExhibition.artwork_detail_url
        },
        location: {
          id: newExhibition.location_id,
          width: newExhibition.location_width,
          height: newExhibition.location_height,
          description: newExhibition.location_description
        }
      };
      
      res.status(201).json(formattedExhibition);
    } catch (error) {
      await runQuery('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Error creating exhibition:', error);
    res.status(500).json({ error: '展示の作成に失敗しました' });
  }
});

// PUT /api/exhibitions/:id - Update exhibition
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { artwork_id, location_id, start_date, end_date, status, notes, updated_at } = req.body;
    
    // Check if exhibition exists
    const existingExhibition = await getQuery('SELECT * FROM exhibitions WHERE id = ?', [id]);
    if (!existingExhibition) {
      return res.status(404).json({ error: '展示が見つかりません' });
    }
    
    // Optimistic locking check
    if (updated_at && existingExhibition.updated_at !== updated_at) {
      return res.status(409).json({ 
        error: '他のユーザーによってデータが更新されています。画面を更新してから再試行してください。' 
      });
    }
    
    // Validation
    if (!artwork_id || !location_id || !start_date || !end_date) {
      return res.status(400).json({ 
        error: 'アートワーク、場所、開始日、終了日は必須です' 
      });
    }
    
    if (new Date(start_date) >= new Date(end_date)) {
      return res.status(400).json({ 
        error: '開始日は終了日より前である必要があります' 
      });
    }
    
    if (status && !['scheduled', 'active', 'completed'].includes(status)) {
      return res.status(400).json({ 
        error: 'ステータスは scheduled, active, completed のいずれかである必要があります' 
      });
    }
    
    // Check for conflicts (excluding current exhibition)
    await runQuery('BEGIN TRANSACTION');
    
    try {
      const conflictCheck = await getQuery(`
        SELECT COUNT(*) as count FROM exhibitions 
        WHERE location_id = ? 
        AND status IN ('scheduled', 'active')
        AND id != ?
        AND (
          (start_date <= ? AND end_date >= ?) OR 
          (start_date <= ? AND end_date >= ?) OR
          (start_date >= ? AND end_date <= ?)
        )
      `, [location_id, id, start_date, start_date, end_date, end_date, start_date, end_date]);
      
      if (conflictCheck.count > 0) {
        await runQuery('ROLLBACK');
        return res.status(409).json({ 
          error: '指定された期間・場所で既に展示が予定されています' 
        });
      }
      
      await runQuery(`
        UPDATE exhibitions 
        SET artwork_id = ?, location_id = ?, start_date = ?, end_date = ?, 
            status = ?, notes = ?, updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `, [artwork_id, location_id, start_date, end_date, status || existingExhibition.status, notes?.trim() || null, id]);
      
      await runQuery('COMMIT');
      
      const updatedExhibition = await getQuery(`
        SELECT 
          e.*,
          a.title as artwork_title,
          a.artist as artwork_artist,
          a.detail_url as artwork_detail_url,
          l.width as location_width,
          l.height as location_height,
          l.description as location_description
        FROM exhibitions e
        JOIN artworks a ON e.artwork_id = a.id
        JOIN locations l ON e.location_id = l.id
        WHERE e.id = ?
      `, [id]);
      
      const formattedExhibition = {
        id: updatedExhibition.id,
        artwork_id: updatedExhibition.artwork_id,
        location_id: updatedExhibition.location_id,
        start_date: updatedExhibition.start_date,
        end_date: updatedExhibition.end_date,
        status: updatedExhibition.status,
        notes: updatedExhibition.notes,
        created_at: updatedExhibition.created_at,
        updated_at: updatedExhibition.updated_at,
        artwork: {
          id: updatedExhibition.artwork_id,
          title: updatedExhibition.artwork_title,
          artist: updatedExhibition.artwork_artist,
          detail_url: updatedExhibition.artwork_detail_url
        },
        location: {
          id: updatedExhibition.location_id,
          width: updatedExhibition.location_width,
          height: updatedExhibition.location_height,
          description: updatedExhibition.location_description
        }
      };
      
      res.json(formattedExhibition);
    } catch (error) {
      await runQuery('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Error updating exhibition:', error);
    res.status(500).json({ error: '展示の更新に失敗しました' });
  }
});

// DELETE /api/exhibitions/:id - Delete exhibition
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if exhibition exists
    const existingExhibition = await getQuery('SELECT * FROM exhibitions WHERE id = ?', [id]);
    if (!existingExhibition) {
      return res.status(404).json({ error: '展示が見つかりません' });
    }
    
    await runQuery('DELETE FROM exhibitions WHERE id = ?', [id]);
    
    res.json({ message: '展示を削除しました' });
  } catch (error) {
    console.error('Error deleting exhibition:', error);
    res.status(500).json({ error: '展示の削除に失敗しました' });
  }
});

export default router;