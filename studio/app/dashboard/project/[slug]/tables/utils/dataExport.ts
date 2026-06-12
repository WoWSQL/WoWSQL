export function convertToJSON(rows: any[]): string {
  return JSON.stringify(rows, null, 2)
}

export function convertToSQL(rows: any[], tableName: string, columns: any[]): string {
  const statements: string[] = []
  const colNames: string[] = columns.map((col: any) => col.name)

  rows.forEach(row => {
    const values = colNames.map(col => {
      const value = row[col]
      if (value === null || value === undefined) return 'NULL'
      if (typeof value === 'string') return `'${value.replace(/'/g, "''")}' `
      return String(value)
    })
    const columnsStr = colNames.map(c => `\`${c}\``).join(', ')
    const valuesStr = values.join(', ')
    statements.push(`INSERT INTO \`${tableName}\` (${columnsStr}) VALUES (${valuesStr});`)
  })

  return statements.join('\n')
}

export function convertToCSV(rows: any[], columns: any[]): string {
  const colNames: string[] = columns.map((col: any) => col.name)
  const headerRow = colNames.map(col => `"${col}"`).join(',')

  const dataRows = rows.map(row => {
    return colNames.map(col => {
      const value = row[col]
      if (value === null || value === undefined) return ''
      const strValue = String(value)
      if (strValue.includes(',') || strValue.includes('"') || strValue.includes('\n')) {
        return `"${strValue.replace(/"/g, '""')}"`
      }
      return `"${strValue}"`
    }).join(',')
  })

  return [headerRow, ...dataRows].join('\n')
}

export function downloadFile(content: string, filename: string) {
  const element = document.createElement('a')
  const file = new Blob([content], { type: 'text/plain' })
  element.href = URL.createObjectURL(file)
  element.download = filename
  document.body.appendChild(element)
  element.click()
  document.body.removeChild(element)
}
