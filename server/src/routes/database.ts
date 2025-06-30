import express from 'express';
import { allQuery } from '../database';

const router = express.Router();

// GET /api/database/tables - Get list of all tables
router.get('/tables', async (req, res) => {
  try {
    const tables = await allQuery(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name NOT LIKE 'sqlite_%'
      ORDER BY name
    `);
    
    res.json(tables.map(table => table.name));
  } catch (error) {
    console.error('Error fetching tables:', error);
    res.status(500).json({ error: 'テーブル一覧の取得に失敗しました' });
  }
});

// GET /api/database/stats/summary - Get database statistics
router.get('/stats/summary', async (req, res) => {
  try {
    const artworkCount = await allQuery('SELECT COUNT(*) as count FROM artworks');
    const locationCount = await allQuery('SELECT COUNT(*) as count FROM locations');
    const exhibitionCount = await allQuery('SELECT COUNT(*) as count FROM exhibitions');
    const activeExhibitionCount = await allQuery(`
      SELECT COUNT(*) as count FROM exhibitions 
      WHERE date('now') BETWEEN start_date AND end_date
    `);
    const scheduledExhibitionCount = await allQuery(`
      SELECT COUNT(*) as count FROM exhibitions 
      WHERE status = 'scheduled'
    `);
    
    // Get database file size (if accessible)
    const dbSize = await allQuery("SELECT page_count * page_size as size FROM pragma_page_count(), pragma_page_size()");
    
    res.json({
      tables: {
        artworks: artworkCount[0]?.count || 0,
        locations: locationCount[0]?.count || 0,
        exhibitions: exhibitionCount[0]?.count || 0
      },
      exhibitions: {
        total: exhibitionCount[0]?.count || 0,
        active: activeExhibitionCount[0]?.count || 0,
        scheduled: scheduledExhibitionCount[0]?.count || 0
      },
      database: {
        size_bytes: dbSize[0]?.size || 0,
        size_mb: Math.round((dbSize[0]?.size || 0) / (1024 * 1024) * 100) / 100
      }
    });
  } catch (error) {
    console.error('Error fetching database stats:', error);
    res.status(500).json({ error: 'データベース統計の取得に失敗しました' });
  }
});

// GET /api/database/health - Database health check
router.get('/health', async (req, res) => {
  try {
    // Test basic database connectivity
    const result = await allQuery('SELECT 1 as test');
    
    // Check WAL mode
    const walMode = await allQuery('PRAGMA journal_mode');
    
    // Check foreign keys
    const foreignKeys = await allQuery('PRAGMA foreign_keys');
    
    // Check integrity
    const integrity = await allQuery('PRAGMA integrity_check(10)');
    const integrityResult = integrity[0]?.integrity_check;
    const isHealthy = integrityResult === 'ok';
    
    res.json({
      status: 'healthy',
      connectivity: result.length > 0,
      configuration: {
        journal_mode: walMode[0]?.journal_mode || 'unknown',
        foreign_keys: foreignKeys[0]?.foreign_keys === 1,
      },
      integrity: isHealthy ? 'ok' : 'issues_detected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Database health check failed:', error);
    res.status(500).json({ 
      status: 'unhealthy',
      error: 'データベースヘルスチェックに失敗しました',
      timestamp: new Date().toISOString()
    });
  }
});

// GET /api/database/:table - Get all data from specific table
// IMPORTANT: This route must be last because it's a parameter route
router.get('/:table', async (req, res) => {
  try {
    const { table } = req.params;
    
    // Validate table name to prevent SQL injection
    const validTables = ['artworks', 'locations', 'exhibitions'];
    if (!validTables.includes(table)) {
      return res.status(400).json({ error: '無効なテーブル名です' });
    }
    
    // Get table schema
    const schema = await allQuery(`PRAGMA table_info(${table})`);
    
    // Get table data
    const data = await allQuery(`SELECT * FROM ${table} ORDER BY id`);
    
    // Get row count
    const countResult = await allQuery(`SELECT COUNT(*) as count FROM ${table}`);
    const rowCount = countResult[0]?.count || 0;
    
    res.json({
      table_name: table,
      schema: schema.map(column => ({
        name: column.name,
        type: column.type,
        not_null: column.notnull === 1,
        primary_key: column.pk === 1,
        default_value: column.dflt_value
      })),
      row_count: rowCount,
      data: data
    });
  } catch (error) {
    console.error('Error fetching table data:', error);
    res.status(500).json({ error: 'テーブルデータの取得に失敗しました' });
  }
});

export default router;