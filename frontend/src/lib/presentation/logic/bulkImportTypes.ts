export type BulkImportStep = "download" | "upload" | "processing" | "results";

export interface BulkImportResult {
  error_message: string;
  original_data: Record<string, string>;
  row_number: number;
  success: boolean;
}

export interface BulkImportNameColumn {
  entity_type: string;
  id_column: string;
  name_column: string;
}

export interface BulkImportNameResolutionError {
  column_name: string;
  error_message: string;
}
