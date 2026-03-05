import { TextField, Typography, Box } from '@mui/material'

interface TextInputProps {
  value: string
  onChange: (text: string) => void
  disabled?: boolean
}

export default function TextInput({ value, onChange, disabled }: TextInputProps) {
  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Вставьте текст для генерации викторины
      </Typography>
      <TextField
        fullWidth
        multiline
        rows={12}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Вставьте сюда текст статьи, учебного материала или любой контент, на основе которого хотите создать викторину..."
        disabled={disabled}
        helperText={`${value.length} / 10000 символов (рекомендуется 500-5000)`}
        inputProps={{
          maxLength: 10000,
        }}
      />
    </Box>
  )
}
