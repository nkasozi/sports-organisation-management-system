export interface FieldChange<TFieldName extends string = string> {
  field_name: TFieldName;
  old_value: string;
  new_value: string;
}
