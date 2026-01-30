// import React from 'react';
// import { render, screen, fireEvent, waitFor } from '@testing-library/react';
// import userEvent from '@testing-library/user-event';
// import HistoryTab from './HistoryTab';
// import * as reportingService from '../../services/reportingService';

// jest.mock('../../services/reportingService');

// describe('HistoryTab', () => {
//   const mockHistory = [
//     {
//       id: 'history-1',
//       report_id: 'report-1',
//       executed_at: new Date('2024-01-15T09:00:00Z').toISOString(),
//       status: 'success' as const,
//       error_message: null,
//       created_at: new Date('2024-01-15T09:00:00Z').toISOString()
//     },
//     {
//       id: 'history-2',
//       report_id: 'report-1',
//       executed_at: new Date('2024-01-14T09:00:00Z').toISOString(),
//       status: 'failed' as const,
//       error_message: 'Database connection timeout',
//       created_at: new Date('2024-01-14T09:00:00Z').toISOString()
//     }
//   ];

//   const mockEmailLogs = [
//     {
//       id: 'email-1',
//       report_id: 'report-1',
//       history_id: 'history-1',
//       recipient: 'user1@example.com',
//       sent_at: new Date('2024-01-15T09:00:00Z').toISOString(),
//       status: 'delivered' as const,
//       error_details: null,
//       created_at: new Date('2024-01-15T09:00:00Z').toISOString()
//     },
//     {
//       id: 'email-2',
//       report_id: 'report-1',
//       history_id: 'history-1',
//       recipient: 'user2@example.com',
//       sent_at: new Date('2024-01-15T09:00:01Z').toISOString(),
//       status: 'failed' as const,
//       error_details: 'Invalid email address',
//       created_at: new Date('2024-01-15T09:00:01Z').toISOString()
//     }
//   ];

//   beforeEach(() => {
//     jest.clearAllMocks();
//     (reportingService.getReportHistory as jest.Mock).mockResolvedValue({
//       data: mockHistory,
//       pagination: {
//         page: 1,
//         limit: 10,
//         total: 2,
//         totalPages: 1
//       }
//     });
//     (reportingService.getEmailLogs as jest.Mock).mockResolvedValue({
//       emails: mockEmailLogs
//     });
//   });

//   test('should render history table', async () => {
//     render(<HistoryTab reportId="report-1" />);

//     await waitFor(() => {
//       expect(screen.getByText('Executed At')).toBeInTheDocument();
//       expect(screen.getByText('Status')).toBeInTheDocument();
//     });
//   });

//   test('should display history entries', async () => {
//     render(<HistoryTab reportId="report-1" />);

//     await waitFor(() => {
//       expect(screen.getByText('Success')).toBeInTheDocument();
//       expect(screen.getByText('Failed')).toBeInTheDocument();
//     });
//   });

//   test('should display error messages for failed executions', async () => {
//     render(<HistoryTab reportId="report-1" />);

//     await waitFor(() => {
//       expect(screen.getByText('Database connection timeout')).toBeInTheDocument();
//     });
//   });

//   test('should open email logs dialog', async () => {
//     render(<HistoryTab reportId="report-1" />);

//     await waitFor(() => {
//       expect(screen.getByText('Success')).toBeInTheDocument();
//     });

//     const viewEmailsButtons = screen.getAllByRole('button', { name: /view emails/i });
//     fireEvent.click(viewEmailsButtons[0]);

//     await waitFor(() => {
//       expect(screen.getByText(/Email Logs/)).toBeInTheDocument();
//     });
//   });

//   test('should display email logs in dialog', async () => {
//     render(<HistoryTab reportId="report-1" />);

//     await waitFor(() => {
//       expect(screen.getByText('Success')).toBeInTheDocument();
//     });

//     const viewEmailsButtons = screen.getAllByRole('button', { name: /view emails/i });
//     fireEvent.click(viewEmailsButtons[0]);

//     await waitFor(() => {
//       expect(screen.getByText('user1@example.com')).toBeInTheDocument();
//       expect(screen.getByText('user2@example.com')).toBeInTheDocument();
//     });
//   });

//   test('should filter history by date range', async () => {
//     render(<HistoryTab reportId="report-1" />);

//     await waitFor(() => {
//       expect(screen.getByText('Success')).toBeInTheDocument();
//     });

//     const startDateInput = screen.getByLabelText('Start Date');
//     const endDateInput = screen.getByLabelText('End Date');
//     const applyButton = screen.getByRole('button', { name: /apply/i });

//     await userEvent.type(startDateInput, '2024-01-14');
//     await userEvent.type(endDateInput, '2024-01-16');
//     fireEvent.click(applyButton);

//     await waitFor(() => {
//       expect(reportingService.getReportHistory).toHaveBeenCalledWith(
//         'report-1',
//         1,
//         10,
//         expect.any(String),
//         expect.any(String)
//       );
//     });
//   });

//   test('should clear date filters', async () => {
//     render(<HistoryTab reportId="report-1" />);

//     await waitFor(() => {
//       expect(screen.getByText('Success')).toBeInTheDocument();
//     });

//     const startDateInput = screen.getByLabelText('Start Date') as HTMLInputElement;
//     const clearButton = screen.getByRole('button', { name: /clear/i });

//     await userEvent.type(startDateInput, '2024-01-14');
//     fireEvent.click(clearButton);

//     expect(startDateInput.value).toBe('');
//   });

//   test('should handle loading state', () => {
//     (reportingService.getReportHistory as jest.Mock).mockImplementation(
//       () => new Promise(resolve => setTimeout(() => resolve({
//         data: mockHistory,
//         pagination: { page: 1, limit: 10, total: 2, totalPages: 1 }
//       }), 100))
//     );

//     render(<HistoryTab reportId="report-1" />);

//     expect(screen.getByRole('progressbar')).toBeInTheDocument();
//   });

//   test('should handle error state', async () => {
//     (reportingService.getReportHistory as jest.Mock).mockRejectedValue(
//       new Error('Failed to load history')
//     );

//     render(<HistoryTab reportId="report-1" />);

//     await waitFor(() => {
//       expect(screen.getByText('Failed to load history')).toBeInTheDocument();
//     });
//   });

//   test('should display empty state', async () => {
//     (reportingService.getReportHistory as jest.Mock).mockResolvedValue({
//       data: [],
//       pagination: { page: 1, limit: 10, total: 0, totalPages: 0 }
//     });

//     render(<HistoryTab reportId="report-1" />);

//     await waitFor(() => {
//       expect(screen.getByText('No execution history found.')).toBeInTheDocument();
//     });
//   });

//   test('should support pagination', async () => {
//     render(<HistoryTab reportId="report-1" />);

//     await waitFor(() => {
//       expect(screen.getByText('Success')).toBeInTheDocument();
//     });

//     const nextPageButton = screen.getByRole('button', { name: /next page/i });
//     expect(nextPageButton).toBeInTheDocument();
//   });

//   test('should close email logs dialog', async () => {
//     render(<HistoryTab reportId="report-1" />);

//     await waitFor(() => {
//       expect(screen.getByText('Success')).toBeInTheDocument();
//     });

//     const viewEmailsButtons = screen.getAllByRole('button', { name: /view emails/i });
//     fireEvent.click(viewEmailsButtons[0]);

//     await waitFor(() => {
//       expect(screen.getByText(/Email Logs/)).toBeInTheDocument();
//     });

//     const closeButton = screen.getByRole('button', { name: /close/i });
//     fireEvent.click(closeButton);

//     await waitFor(() => {
//       expect(screen.queryByText(/Email Logs/)).not.toBeInTheDocument();
//     });
//   });

//   test('should format dates correctly', async () => {
//     render(<HistoryTab reportId="report-1" />);

//     await waitFor(() => {
//       // Check that dates are formatted (not just raw ISO strings)
//       const dateElements = screen.getAllByText(/\d{1,2}\/\d{1,2}\/\d{4}/);
//       expect(dateElements.length).toBeGreaterThan(0);
//     });
//   });

//   test('should display status chips with correct colors', async () => {
//     render(<HistoryTab reportId="report-1" />);

//     await waitFor(() => {
//       const successChip = screen.getByText('Success');
//       const failedChip = screen.getByText('Failed');

//       expect(successChip).toBeInTheDocument();
//       expect(failedChip).toBeInTheDocument();
//     });
//   });
// });
