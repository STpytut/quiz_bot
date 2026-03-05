import mammoth from 'mammoth'

export async function parseDocx(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer()
  const result = await mammoth.extractRawText({ arrayBuffer })
  return result.value
}

export async function parseTxt(file: File): Promise<string> {
  return await file.text()
}

export async function parseFile(file: File): Promise<string> {
  const extension = file.name.split('.').pop()?.toLowerCase()
  
  switch (extension) {
    case 'docx':
      return parseDocx(file)
    case 'txt':
      return parseTxt(file)
    default:
      throw new Error('Неподдерживаемый формат файла. Используйте .docx или .txt')
  }
}

export function validateFileSize(file: File, maxSizeMB: number = 5): boolean {
  const maxSizeBytes = maxSizeMB * 1024 * 1024
  return file.size <= maxSizeBytes
}

export function truncateText(text: string, maxLength: number = 10000): string {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}
