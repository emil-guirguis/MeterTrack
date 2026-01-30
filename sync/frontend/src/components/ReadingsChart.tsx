import { Card, CardContent, Typography, Box } from '@mui/material';
import { Meter, MeterReading } from '../types';

interface ReadingsChartProps {
  readings: MeterReading[];
  meters: Meter[];
}

export default function ReadingsChart({ readings, meters }: ReadingsChartProps) {
  // Group readings by meter and data point
  const groupedReadings = readings.reduce((acc, reading) => {
    const key = `${reading.meter_id}-${reading.data_point}`;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(reading);
    return acc;
  }, {} as Record<string, MeterReading[]>);

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Recent Readings by Meter
        </Typography>

        {Object.entries(groupedReadings).map(([key, meterReadings]) => {
          const [meterId, dataPoint] = key.split('-');
          const meter = meters.find((m) => String(m.meter_id) === meterId);
          const sortedReadings = [...meterReadings]
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
            .slice(0, 10);

          return (
            <Box key={key} mb={3}>
              <Typography variant="subtitle1" gutterBottom>
                {meter?.name || meterId} - {dataPoint}
              </Typography>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                  gap: 1,
                }}
              >
                {sortedReadings.map((reading) => (
                  <Box
                    key={reading.id}
                    sx={{
                      p: 1,
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 1,
                    }}
                  >
                    <Typography variant="body2" fontWeight="bold">
                      {reading.value} {reading.unit || ''}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(reading.timestamp).toLocaleString()}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          );
        })}

        {Object.keys(groupedReadings).length === 0 && (
          <Typography variant="body2" color="text.secondary">
            No readings available
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}
