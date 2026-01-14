import { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Box,
} from '@mui/material';
import SyncIcon from '@mui/icons-material/Sync';
import { meterReadingApi } from '../api/services';

export default function BACnetDebugCard() {
  const [isTriggering, setIsTriggering] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleTriggerCollection = async () => {
    try {
      setIsTriggering(true);
      setMessage(null);
      await meterReadingApi.triggerCollection();
      setMessage('BACnet meter reading triggered successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to trigger meter reading';
      setMessage(`Error: ${errorMessage}`);
      console.error('Error triggering meter reading:', err);
    } finally {
      setIsTriggering(false);
    }
  };

  return (
    <>
      {message && (
        <Alert
          severity={message.startsWith('Error') ? 'error' : 'success'}
          sx={{ mb: 3 }}
          onClose={() => setMessage(null)}
        >
          {message}
        </Alert>
      )}

      <Card>
        <CardContent>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box>
              <Typography variant="h6">BACnet Manual Trigger</Typography>
              <Typography variant="body2" color="text.secondary">
                Manually execute meter reading collection
              </Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={isTriggering ? <CircularProgress size={20} /> : <SyncIcon />}
              onClick={handleTriggerCollection}
              disabled={isTriggering}
              size="small"
            >
              {isTriggering ? 'Reading...' : 'Read Meters'}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </>
  );
}
