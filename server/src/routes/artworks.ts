import express from 'express';
import { runQuery, getQuery, allQuery } from '../database';

const router = express.Router();

// GET /api/artworks - Get all artworks
router.get('/', async (req, res) => {
  try {
    const artworks = await allQuery(`
      SELECT * FROM artworks 
      ORDER BY created_at DESC
    `);
    res.json(artworks);
  } catch (error) {
    console.error('Error fetching artworks:', error);
    res.status(500).json({ error: 'アートワークの取得に失敗しました' });
  }
});

// GET /api/artworks/:id - Get artwork by id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const artwork = await getQuery('SELECT * FROM artworks WHERE id = ?', [id]);
    
    if (!artwork) {
      return res.status(404).json({ error: 'アートワークが見つかりません' });
    }
    
    res.json(artwork);
  } catch (error) {
    console.error('Error fetching artwork:', error);
    res.status(500).json({ error: 'アートワークの取得に失敗しました' });
  }
});

// POST /api/artworks - Create new artwork
router.post('/', async (req, res) => {
  try {
    const { title, artist, detail_url } = req.body;
    
    // Validation
    if (!title || !artist) {
      return res.status(400).json({ 
        error: 'タイトルと作者名は必須です' 
      });
    }
    
    const result = await runQuery(`
      INSERT INTO artworks (title, artist, detail_url) 
      VALUES (?, ?, ?)
    `, [title.trim(), artist.trim(), detail_url?.trim() || null]);
    
    const newArtwork = await getQuery('SELECT * FROM artworks WHERE id = ?', [result.id]);
    
    res.status(201).json(newArtwork);
  } catch (error) {
    console.error('Error creating artwork:', error);
    res.status(500).json({ error: 'アートワークの作成に失敗しました' });
  }
});

// PUT /api/artworks/:id - Update artwork
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, artist, detail_url, updated_at } = req.body;
    
    // Check if artwork exists
    const existingArtwork = await getQuery('SELECT * FROM artworks WHERE id = ?', [id]);
    if (!existingArtwork) {
      return res.status(404).json({ error: 'アートワークが見つかりません' });
    }
    
    // Optimistic locking check
    if (updated_at && existingArtwork.updated_at !== updated_at) {
      return res.status(409).json({ 
        error: '他のユーザーによってデータが更新されています。画面を更新してから再試行してください。' 
      });
    }
    
    // Validation
    if (!title || !artist) {
      return res.status(400).json({ 
        error: 'タイトルと作者名は必須です' 
      });
    }
    
    await runQuery(`
      UPDATE artworks 
      SET title = ?, artist = ?, detail_url = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `, [title.trim(), artist.trim(), detail_url?.trim() || null, id]);
    
    const updatedArtwork = await getQuery('SELECT * FROM artworks WHERE id = ?', [id]);
    
    res.json(updatedArtwork);
  } catch (error) {
    console.error('Error updating artwork:', error);
    res.status(500).json({ error: 'アートワークの更新に失敗しました' });
  }
});

// DELETE /api/artworks/:id - Delete artwork
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if artwork exists
    const existingArtwork = await getQuery('SELECT * FROM artworks WHERE id = ?', [id]);
    if (!existingArtwork) {
      return res.status(404).json({ error: 'アートワークが見つかりません' });
    }
    
    // Check if artwork is being used in exhibitions
    const exhibitionCount = await getQuery(`
      SELECT COUNT(*) as count FROM exhibitions 
      WHERE artwork_id = ? AND status IN ('scheduled', 'active')
    `, [id]);
    
    if (exhibitionCount.count > 0) {
      return res.status(400).json({ 
        error: 'このアートワークは展示予定または展示中のため削除できません' 
      });
    }
    
    await runQuery('DELETE FROM artworks WHERE id = ?', [id]);
    
    res.json({ message: 'アートワークを削除しました' });
  } catch (error) {
    console.error('Error deleting artwork:', error);
    res.status(500).json({ error: 'アートワークの削除に失敗しました' });
  }
});

export default router;