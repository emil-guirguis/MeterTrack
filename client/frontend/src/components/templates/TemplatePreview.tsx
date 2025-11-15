import React, { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Grid from '@mui/material/Grid';
import Alert from '@mui/material/Alert';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import RefreshIcon from '@mui/icons-material/Refresh';
import SendIcon from '@mui/icons-material/Send';
import CloseIcon from '@mui/icons-material/Close';
import { LoadingSpinner } from '../common/LoadingSpinner';
import Toast from '../common/Toast';
import { templateService } from '../../services/templateService';
import type { EmailTemplate } from '../../types/entities';
import './TemplatePreview.css';

interface TemplatePreviewProps {
  template: EmailTemplate;
  open: boolean;
  onClose: () => void;
  onSendTest?: (template: EmailTemplate, variables: Record<string, any>) => void;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index, ...other }) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`preview-tabpanel-${index}`}
      aria-labelledby={`preview-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
};

export const TemplatePreview: React.FC<TemplatePreviewProps> = ({
  template,
  open,
  onClose,
  onSendTest
}) => {
  const [loading, setLoading] = useState(false);
  const [availableVariables, setAvailableVariables] = useState<Record<string, any>>({});
  const [variableValues, setVariableValues] = useState<Record<string, any>>({});
  const [previewData, setPreviewData] = useState<{
    subject: string;
    htmlContent: string;
    textContent?: string;
  } | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [toast, setToast] = useState<{ message: string; severity: 'success' | 'error' | 'info' | 'warning' } | null>(null);

  // Load available variables and generate preview when template changes
  useEffect(() => {
    if (template && open) {
      loadAvailableVariables();
    }
  }, [template, open]);

  // Generate preview when variable values change
  useEffect(() => {
    if (template && Object.keys(variableValues).length > 0) {
      generatePreview();
    }
  }, [variableValues, template]);

  const loadAvailableVariables = async () => {
    try {
      setLoading(true);
      const variables = await templateService.getAvailableVariables(template.category);
      setAvailableVariables(variables);
      
      // Initialize variable values with backend-provided sample data only
      const initialValues: Record<string, any> = {};
      Object.entries(variables).forEach(([key, info]: [string, any]) => {
        if (info && Object.prototype.hasOwnProperty.call(info, 'sample')) {
          initialValues[key] = info.sample;
        }
      });
      
      setVariableValues(initialValues);
    } catch (err) {
      console.warn('Failed to load available variables:', err);
      setAvailableVariables({});
      // Generate preview with empty variables
      generatePreview();
    } finally {
      setLoading(false);
    }
  };

  const generatePreview = async () => {
    try {
      const preview = await templateService.previewTemplate({
        templateId: template.id,
        variables: variableValues
      });
      
      setPreviewData(preview);
    } catch (err) {
      setToast({ 
        message: err instanceof Error ? err.message : 'Failed to generate preview', 
        severity: 'error' 
      });
    }
  };

  const handleVariableChange = (variableName: string, value: any) => {
    setVariableValues(prev => ({
      ...prev,
      [variableName]: value
    }));
  };

  const handleRefreshPreview = () => {
    generatePreview();
  };

  const handleSendTest = () => {
    if (onSendTest) {
      onSendTest(template, variableValues);
    }
  };

  const renderVariableInput = (variableName: string, variableInfo: any) => {
    const value = variableValues[variableName] || '';
    
    switch (variableInfo.type) {
      case 'number':
        return (
          <TextField
            fullWidth
            type="number"
            label={variableName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
            value={value}
            onChange={(e) => handleVariableChange(variableName, parseFloat(e.target.value) || 0)}
            helperText={variableInfo.description}
            size="small"
          />
        );
      
      case 'date':
        return (
          <TextField
            fullWidth
            type="date"
            label={variableName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
            value={value}
            onChange={(e) => handleVariableChange(variableName, e.target.value)}
            helperText={variableInfo.description}
            size="small"
            InputLabelProps={{ shrink: true }}
          />
        );
      
      case 'boolean':
        return (
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" sx={{ mb: 1 }}>
              {variableName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </Typography>
            <Select
              fullWidth
              value={value.toString()}
              onChange={(e) => handleVariableChange(variableName, e.target.value === 'true')}
              aria-label={`${variableName.replace(/_/g, ' ')} boolean value`}
              title={`${variableName.replace(/_/g, ' ')} boolean value`}
              size="small"
            >
              <MenuItem value="true">True</MenuItem>
              <MenuItem value="false">False</MenuItem>
            </Select>
            <Typography variant="caption" color="text.secondary">
              {variableInfo.description}
            </Typography>
          </Box>
        );
      
      default:
        return (
          <TextField
            fullWidth
            label={variableName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
            value={value}
            onChange={(e) => handleVariableChange(variableName, e.target.value)}
            helperText={variableInfo.description}
            size="small"
            multiline={variableInfo.multiline}
            rows={variableInfo.multiline ? 3 : 1}
          />
        );
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      className="template-preview-dialog"
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">
            Preview: {template.name}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              size="small"
              startIcon={<RefreshIcon />}
              onClick={handleRefreshPreview}
              disabled={loading}
            >
              Refresh
            </Button>
            {onSendTest && (
              <Button
                size="small"
                variant="outlined"
                startIcon={<SendIcon />}
                onClick={handleSendTest}
                disabled={loading}
              >
                Send Test
              </Button>
            )}
          </Box>
        </Box>
      </DialogTitle>
      
      <DialogContent className="template-preview-content">
        {loading && <LoadingSpinner />}
        
        <Grid container spacing={3}>
          {/* Variable Controls */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2, height: 'fit-content', position: 'sticky', top: 0 }}>
              <Typography variant="h6" gutterBottom>
                Variable Values
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Adjust these values to see how they appear in the template
              </Typography>
              
              {Object.keys(availableVariables).length > 0 ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {Object.entries(availableVariables).map(([key, info]: [string, any]) => (
                    <Box key={key}>
                      {renderVariableInput(key, info)}
                    </Box>
                  ))}
                </Box>
              ) : (
                <Alert severity="info">
                  No variables available for this template category
                </Alert>
              )}
            </Paper>
          </Grid>

          {/* Preview Content */}
          <Grid item xs={12} md={8}>
            <Paper sx={{ height: '600px', display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
                  <Tab label="HTML Preview" />
                  <Tab label="Raw HTML" />
                  <Tab label="Template Info" />
                </Tabs>
              </Box>

              <TabPanel value={tabValue} index={0}>
                {previewData ? (
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      Subject:
                    </Typography>
                    <Paper 
                      variant="outlined" 
                      sx={{ p: 2, mb: 2, bgcolor: 'grey.50' }}
                    >
                      <Typography variant="body1" fontWeight="medium">
                        {previewData.subject}
                      </Typography>
                    </Paper>
                    
                    <Typography variant="subtitle2" gutterBottom>
                      Content:
                    </Typography>
                    <Paper 
                      variant="outlined" 
                      sx={{ 
                        p: 2, 
                        maxHeight: 400, 
                        overflow: 'auto',
                        bgcolor: 'white'
                      }}
                    >
                      <div 
                        dangerouslySetInnerHTML={{ __html: previewData.htmlContent }}
                        className="template-preview-rendered-content"
                      />
                    </Paper>
                  </Box>
                ) : (
                  <Alert severity="info">
                    Preview will appear here once variables are loaded
                  </Alert>
                )}
              </TabPanel>

              <TabPanel value={tabValue} index={1}>
                {previewData ? (
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      Subject:
                    </Typography>
                    <Paper 
                      variant="outlined" 
                      sx={{ p: 2, mb: 2, bgcolor: 'grey.50' }}
                    >
                      <Typography 
                        variant="body2" 
                        component="pre"
                        sx={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}
                      >
                        {previewData.subject}
                      </Typography>
                    </Paper>
                    
                    <Typography variant="subtitle2" gutterBottom>
                      HTML Content:
                    </Typography>
                    <Paper 
                      variant="outlined" 
                      sx={{ 
                        p: 2, 
                        maxHeight: 400, 
                        overflow: 'auto',
                        bgcolor: 'grey.50'
                      }}
                    >
                      <Typography 
                        variant="body2" 
                        component="pre"
                        sx={{ 
                          fontFamily: 'monospace', 
                          whiteSpace: 'pre-wrap',
                          fontSize: '12px'
                        }}
                      >
                        {previewData.htmlContent}
                      </Typography>
                    </Paper>
                  </Box>
                ) : (
                  <Alert severity="info">
                    Raw HTML will appear here once preview is generated
                  </Alert>
                )}
              </TabPanel>

              <TabPanel value={tabValue} index={2}>
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Template Information
                  </Typography>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Name:
                      </Typography>
                      <Typography variant="body1">
                        {template.name}
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Category:
                      </Typography>
                      <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>
                        {template.category.replace(/_/g, ' ')}
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Status:
                      </Typography>
                      <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>
                        {template.status}
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Usage Count:
                      </Typography>
                      <Typography variant="body1">
                        {template.usageCount}
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Created:
                      </Typography>
                      <Typography variant="body1">
                        {new Date(template.createdAt).toLocaleDateString()}
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Last Updated:
                      </Typography>
                      <Typography variant="body1">
                        {new Date(template.updatedAt).toLocaleDateString()}
                      </Typography>
                    </Grid>
                  </Grid>
                  
                  {template.variables && template.variables.length > 0 && (
                    <Box sx={{ mt: 3 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Template Variables
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {template.variables.map((variable, index) => (
                          <Paper 
                            key={index}
                            variant="outlined" 
                            sx={{ p: 1, bgcolor: 'grey.50' }}
                          >
                            <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                              {`{{${variable.name}}}`}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {variable.type}
                            </Typography>
                          </Paper>
                        ))}
                      </Box>
                    </Box>
                  )}
                </Box>
              </TabPanel>
            </Paper>
          </Grid>
        </Grid>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose} startIcon={<CloseIcon />}>
          Close
        </Button>
      </DialogActions>

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.severity === 'error' ? 'error' : toast.severity === 'success' ? 'success' : 'info'}
          onClose={() => setToast(null)}
        />
      )}
    </Dialog>
  );
};