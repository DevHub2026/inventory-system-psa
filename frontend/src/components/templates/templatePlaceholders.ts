const SAMPLE_DATA: Record<string, string> = {
  employee_name: 'Juan Dela Cruz',
  employee_number: '20250012',
  department: 'Information Technology Division',
  office: 'PSA Regional Office VII',
  asset_name: 'Dell Latitude 5420 Laptop',
  asset_code: 'PSA-LAP-2026-0042',
  serial_number: 'SN-994810234',
  manufacturer: 'Dell Technologies',
  category: 'IT Equipment',
  condition: 'Good',
  borrow_date: '2026-07-28',
  due_date: '2026-08-11',
  returned_date: '2026-08-05',
  requested_extension: '2026-08-25',
  approved_extension: '2026-08-25',
  issued_date: '2026-07-28',
  current_date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
  current_time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  prepared_by: 'Maria Santos',
  generated_by: 'System Administrator',
}

export function resolvePlaceholders(text: string | null | undefined): string {
  if (!text) return ''
  let result = text
  Object.entries(SAMPLE_DATA).forEach(([key, val]) => {
    result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), val)
  })
  return result
}
