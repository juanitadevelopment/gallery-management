import sqlite3 from 'sqlite3';
import { Database } from 'sqlite3';
import path from 'path';

const dbPath = path.join(__dirname, '..', 'database.db');

export const db: Database = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err);
  } else {
    console.log('Connected to SQLite database');
    initializeDatabase();
  }
});

function initializeDatabase() {
  // Enable WAL mode for better concurrency
  db.run('PRAGMA journal_mode = WAL;');
  db.run('PRAGMA foreign_keys = ON;');
  db.run('PRAGMA busy_timeout = 3000;');

  // Create tables first, then insert data
  createTables(() => {
    insertInitialData();
  });
}

function createTables(callback: () => void) {
  let tablesCreated = 0;
  const totalTables = 6; // 3 tables + 3 indexes

  const checkComplete = () => {
    tablesCreated++;
    if (tablesCreated === totalTables) {
      console.log('All tables and indexes created');
      callback();
    }
  };

  // Create artworks table
  db.run(`
    CREATE TABLE IF NOT EXISTS artworks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      artist TEXT NOT NULL,
      detail_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, checkComplete);

  // Create locations table
  db.run(`
    CREATE TABLE IF NOT EXISTS locations (
      id INTEGER PRIMARY KEY,
      width INTEGER NOT NULL,
      height INTEGER NOT NULL,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, checkComplete);

  // Create exhibitions table
  db.run(`
    CREATE TABLE IF NOT EXISTS exhibitions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      artwork_id INTEGER NOT NULL,
      location_id INTEGER NOT NULL,
      start_date DATE NOT NULL,
      end_date DATE NOT NULL,
      status TEXT DEFAULT 'scheduled',
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (artwork_id) REFERENCES artworks(id),
      FOREIGN KEY (location_id) REFERENCES locations(id),
      UNIQUE(location_id, start_date, end_date)
    )
  `, checkComplete);

  // Create indexes for better performance
  db.run(`
    CREATE INDEX IF NOT EXISTS idx_exhibitions_location_dates 
    ON exhibitions(location_id, start_date, end_date)
  `, checkComplete);
  
  db.run(`
    CREATE INDEX IF NOT EXISTS idx_exhibitions_artwork 
    ON exhibitions(artwork_id)
  `, checkComplete);
  
  db.run(`
    CREATE INDEX IF NOT EXISTS idx_exhibitions_status 
    ON exhibitions(status)
  `, checkComplete);
}

function insertInitialData() {
  // Insert initial locations first
  insertLocations(() => {
    // Then insert artworks
    insertArtworks(() => {
      // Finally insert exhibitions
      insertExhibitions();
    });
  });
}

function insertLocations(callback: () => void) {
  const locations = [
    { id: 1, width: 100, height: 80, description: 'エントランス正面' },
    { id: 2, width: 120, height: 90, description: 'メインホール左側' },
    { id: 3, width: 80, height: 100, description: 'メインホール右側' },
    { id: 4, width: 150, height: 120, description: '展示室A 中央' },
    { id: 5, width: 90, height: 70, description: '展示室A 左壁' },
    { id: 6, width: 90, height: 70, description: '展示室A 右壁' },
    { id: 7, width: 200, height: 150, description: '展示室B 大型作品用' },
    { id: 8, width: 100, height: 80, description: '展示室B 小型作品用' },
    { id: 9, width: 110, height: 85, description: '廊下展示スペース' },
    { id: 10, width: 60, height: 80, description: 'カフェ展示コーナー' }
  ];

  db.get('SELECT COUNT(*) as count FROM locations', (err, row: any) => {
    if (err) {
      console.error('Error checking locations:', err);
      callback();
      return;
    }
    
    if (row?.count === 0) {
      const stmt = db.prepare(`
        INSERT INTO locations (id, width, height, description) 
        VALUES (?, ?, ?, ?)
      `);
      
      let insertedCount = 0;
      locations.forEach(location => {
        stmt.run(location.id, location.width, location.height, location.description, (err: any) => {
          if (err) {
            console.error('Error inserting location:', err);
          } else {
            insertedCount++;
            if (insertedCount === locations.length) {
              stmt.finalize(() => {
                console.log(`Initial locations inserted: ${insertedCount} locations`);
                callback();
              });
            }
          }
        });
      });
    } else {
      callback();
    }
  });
}

function insertArtworks(callback: () => void) {
  const artworks = [
    { title: '夕暮れの街角', artist: '田中一郎', detail_url: 'https://example.com/artwork1' },
    { title: '静寂の森', artist: '佐藤花子', detail_url: 'https://example.com/artwork2' },
    { title: '都市の鼓動', artist: '山田太郎', detail_url: 'https://example.com/artwork3' },
    { title: '海の記憶', artist: '鈴木美咲', detail_url: 'https://example.com/artwork4' },
    { title: '光と影の対話', artist: '高橋健二', detail_url: 'https://example.com/artwork5' }
  ];

  db.get('SELECT COUNT(*) as count FROM artworks', (err, row: any) => {
    if (err) {
      console.error('Error checking artworks:', err);
      callback();
      return;
    }
    
    if (row?.count === 0) {
      const stmt = db.prepare(`
        INSERT INTO artworks (title, artist, detail_url) 
        VALUES (?, ?, ?)
      `);
      
      let insertedCount = 0;
      artworks.forEach(artwork => {
        stmt.run(artwork.title, artwork.artist, artwork.detail_url, (err: any) => {
          if (err) {
            console.error('Error inserting artwork:', err);
          } else {
            insertedCount++;
            if (insertedCount === artworks.length) {
              stmt.finalize(() => {
                console.log(`Initial artworks inserted: ${insertedCount} artworks`);
                callback();
              });
            }
          }
        });
      });
    } else {
      callback();
    }
  });
}

function insertExhibitions() {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  
  const exhibitions = [
    { artwork_id: 1, location_id: 1, start_date: `${currentYear}-01-01`, end_date: `${currentYear}-01-31`, status: 'completed', notes: '新春特別展示' },
    { artwork_id: 2, location_id: 2, start_date: `${currentYear}-02-01`, end_date: `${currentYear}-02-28`, status: 'completed', notes: '冬季企画展' },
    { artwork_id: 3, location_id: 1, start_date: `${currentYear}-06-01`, end_date: `${currentYear}-07-31`, status: 'active', notes: '夏季特別展示' },
    { artwork_id: 4, location_id: 3, start_date: `${currentYear}-08-01`, end_date: `${currentYear}-08-31`, status: 'scheduled', notes: '夏季企画展' },
    { artwork_id: 5, location_id: 4, start_date: `${currentYear}-09-01`, end_date: `${currentYear}-09-30`, status: 'scheduled', notes: '秋季企画展' }
  ];

  db.get('SELECT COUNT(*) as count FROM exhibitions', (err, row: any) => {
    if (err) {
      console.error('Error checking exhibitions:', err);
      return;
    }
    
    if (row?.count === 0) {
      const stmt = db.prepare(`
        INSERT INTO exhibitions (artwork_id, location_id, start_date, end_date, status, notes) 
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      
      let insertedCount = 0;
      exhibitions.forEach(exhibition => {
        stmt.run(
          exhibition.artwork_id,
          exhibition.location_id,
          exhibition.start_date,
          exhibition.end_date,
          exhibition.status,
          exhibition.notes,
          (err: any) => {
            if (err) {
              console.error('Error inserting exhibition:', err);
            } else {
              insertedCount++;
              if (insertedCount === exhibitions.length) {
                stmt.finalize(() => {
                  console.log(`Initial exhibitions inserted: ${insertedCount} exhibitions`);
                });
              }
            }
          }
        );
      });
    }
  });
}

// Helper function to run queries with promises
export function runQuery(sql: string, params: any[] = []): Promise<any> {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) {
        reject(err);
      } else {
        resolve({ id: this.lastID, changes: this.changes });
      }
    });
  });
}

export function getQuery(sql: string, params: any[] = []): Promise<any> {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
}

export function allQuery(sql: string, params: any[] = []): Promise<any[]> {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

// Graceful shutdown
process.on('SIGINT', () => {
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err);
    } else {
      console.log('Database connection closed');
    }
    process.exit(0);
  });
});