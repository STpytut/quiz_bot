import { Box, Dialog, DialogTitle, DialogContent, Typography, TextField, IconButton } from '@mui/material'
import QRCode from 'react-qr-code'
import { ContentCopy as CopyIcon } from '@mui/icons-material'

interface ShareDialogProps {
  open: boolean
  onClose: () => void
  quizId: string
}

export default function ShareDialog({ open, onClose, quizId }: ShareDialogProps) {
  const quizUrl = `${window.location.origin}/quiz/${quizId}`

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(quizUrl)
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Поделиться викториной</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
          <Box sx={{ bgcolor: 'white', p: 3, borderRadius: 2 }}>
            <QRCode value={quizUrl} size={200} />
          </Box>
          <Typography variant="body2" color="text.secondary">
            Отсканируйте QR-код или скопируйте ссылку ниже
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, width: '100%' }}>
            <TextField
              fullWidth
              value={quizUrl}
              InputProps={{
                readOnly: true,
              }}
              size="small"
            />
            <IconButton onClick={handleCopyUrl} color="primary">
              <CopyIcon />
            </IconButton>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  )
}
