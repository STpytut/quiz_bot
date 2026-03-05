import { useCallback } from 'react'
import {
  Box,
  Typography,
  Paper,
  Alert,
} from '@mui/material'
import { CloudUpload as UploadIcon } from '@mui/icons-material'
import { validateFileSize } from '../../utils/fileParser'

interface FileUploaderProps {
  onFileUpload: (file: File) => void
  disabled?: boolean
}

export default function FileUploader({ onFileUpload, disabled }: FileUploaderProps) {
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) {
      handleFile(file)
    }
  }, [])

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFile(file)
    }
  }, [])

  const handleFile = (file: File) => {
    if (!validateFileSize(file, 5)) {
      alert('Размер файла не должен превышать 5 МБ')
      return
    }

    const extension = file.name.split('.').pop()?.toLowerCase()
    if (extension !== 'docx' && extension !== 'txt') {
      alert('Поддерживаются только файлы .docx и .txt')
      return
    }

    onFileUpload(file)
  }

  return (
    <Box>
      <Paper
        sx={{
          p: 4,
          border: '2px dashed',
          borderColor: 'primary.main',
          textAlign: 'center',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.6 : 1,
          transition: 'all 0.3s',
          '&:hover': {
            backgroundColor: disabled ? 'background.paper' : 'action.hover',
          },
        }}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => {
          if (!disabled) {
            document.getElementById('file-input')?.click()
          }
        }}
      >
        <input
          id="file-input"
          type="file"
          accept=".docx,.txt"
          onChange={handleFileInput}
          style={{ display: 'none' }}
          disabled={disabled}
        />
        <UploadIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
        <Typography variant="h6" gutterBottom>
          Перетащите файл сюда или нажмите для выбора
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Поддерживаемые форматы: .docx, .txt (до 5 МБ)
        </Typography>
      </Paper>

      <Alert severity="info" sx={{ mt: 2 }}>
        Файл будет обработан локально. Для лучшего результата используйте текст объемом 500-5000 символов.
      </Alert>
    </Box>
  )
}
