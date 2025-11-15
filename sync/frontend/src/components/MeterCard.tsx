import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import { Meter, MeterReading } from '../types';

interface MeterCardProps {
  meter: Meter;
  isConnected: boolean;
  lastReading: MeterReading | undefined;
  readingCount: number;
}

export default function MeterCard({
  meter,
  isConnected,
  lastReading,
  readingCount,
}: MeterCardProps) {
  return (
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="start" mb={2}>
          <Typography variant="h6" component="div">
            {meter.name}
          </Typography>
          <Chip
            icon={isConnected ? <CheckCircleIcon /> : <ErrorIcon />}
            label={isConnected ? 'Connected' : 'Disconnected'}
            color={isConnected ? 'success' : 'error'}
            size="small"
          />
        </Box>

        <Typography variant="body2" color="text.secondary" gutterBottom>
          ID: {meter.external_id}
        </Typography>

        {meter.bacnet_ip && (
          <Typography variant="body2" color="text.secondary" gutterBottom>
            BACnet IP: {meter.bacnet_ip}
          </Typography>
        )}

        {lastReading && (
          <Box mt={2}>
            <Typography variant="body2" color="text.secondary">
              Last Reading:
            </Typography>
            <Typography variant="body1">
              {lastReading.value} {lastReading.unit || ''}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {new Date(lastReading.timestamp).toLocaleString()}
            </Typography>
          </Box>
        )}

        <Box mt={2}>
          <Typography variant="body2" color="text.secondary">
            Readings (24h): {readingCount}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}
