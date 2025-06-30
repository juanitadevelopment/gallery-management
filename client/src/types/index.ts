export interface Artwork {
  id: number;
  title: string;
  artist: string;
  detail_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Location {
  id: number;
  width: number;
  height: number;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface Exhibition {
  id: number;
  artwork_id: number;
  location_id: number;
  start_date: string;
  end_date: string;
  status: 'scheduled' | 'active' | 'completed';
  notes?: string;
  created_at: string;
  updated_at: string;
  artwork?: Artwork;
  location?: Location;
}

export interface DatabaseTable {
  table_name: string;
  schema: DatabaseColumn[];
  row_count: number;
  data: any[];
}

export interface DatabaseColumn {
  name: string;
  type: string;
  not_null: boolean;
  primary_key: boolean;
  default_value: any;
}

export interface DatabaseStats {
  tables: {
    artworks: number;
    locations: number;
    exhibitions: number;
  };
  exhibitions: {
    total: number;
    active: number;
    scheduled: number;
  };
  database: {
    size_bytes: number;
    size_mb: number;
  };
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface SortConfig {
  key: string;
  direction: 'asc' | 'desc' | null;
}

export interface FormValidation {
  field: string;
  message: string;
}

export interface LocationAvailability {
  available: boolean;
  conflicting_exhibitions: number;
}

export interface CreateArtworkRequest {
  title: string;
  artist: string;
  detail_url?: string;
}

export interface UpdateArtworkRequest {
  title: string;
  artist: string;
  detail_url?: string;
  updated_at: string;
}

export interface UpdateLocationRequest {
  width: number;
  height: number;
  description?: string;
  updated_at: string;
}

export interface CreateExhibitionRequest {
  artwork_id: number;
  location_id: number;
  start_date: string;
  end_date: string;
  status?: 'scheduled' | 'active' | 'completed';
  notes?: string;
}

export interface UpdateExhibitionRequest {
  artwork_id: number;
  location_id: number;
  start_date: string;
  end_date: string;
  status: 'scheduled' | 'active' | 'completed';
  notes?: string;
  updated_at: string;
}