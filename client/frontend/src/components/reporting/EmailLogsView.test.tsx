// import React from 'react';
// import { render, screen, fireEvent, waitFor } from '@testing-library/react';
// import userEvent from '@testing-library/user-event';
// import EmailLogsView from './EmailLogsView';
// import * as reportingService from '../../services/reportingService';

// jest.mock('../../services/reportingService');

// describe('EmailLogsView', () => {
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
//     },
//     {
//       id: 'email-3',
//       report_id: 'report-1',
//       history_id: 'history-1',
//       recipient: 'user3@example.com',
//       sent_at: new Date('2024-01-15T09:00:02Z').toISOString(),
//       status: 'sent' as const,
//       error_details: null,
//       created_at: new Date('2024-01-15T09:00:02Z').toISOString()
//     }
//   ];

//   beforeEach(() => {
//     jest.clearAllMocks();
//   });

//   test('should render email logs table', () => {
//     render(
//       <EmailLogsView
//         emailLogs={mockEmailLogs}
//         reportId="report-1"
//         historyId="history-1"
//       />
//     );

//     expect(screen.getByText('Recipient')).toBeInTheDocument();
//     expect(screen.getByText('Sent At')).toBeInTheDocument();
//     expect(screen.getByText('Status')).toBeInTheDocument();
//   });

//   test('should display all email logs', () => {
//     render(
//       <EmailLogsView
//         emailLogs={mockEmailLogs}
//         reportId="report-1"
//         historyId="history-1"
//       />
//     );

//     expect(screen.getByText('user1@example.com')).toBeInTheDocument();
//     expect(screen.getByText('user2@example.com')).toBeInTheDocument();
//     expect(screen.getByText('user3@example.com')).toBeInTheDocument();
//   });

//   test('should display status chips with correct colors', () => {
//     render(
//       <EmailLogsView
//         emailLogs={mockEmailLogs}
//         reportId="report-1"
//         historyId="history-1"
//       />
//     );

//     expect(screen.getByText('Delivered')).toBeInTheDocument();
//     expect(screen.getByText('Failed')).toBeInTheDocument();
//     expect(screen.getByText('Sent')).toBeInTheDocument();
//   });

//   test('should display error details for failed emails', () => {
//     render(
//       <EmailLogsView
//         emailLogs={mockEmailLogs}
//         reportId="report-1"
//         historyId="history-1"
//       />
//     );

//     expect(screen.getByText('Invalid email address')).toBeInTheDocument();
//   });

//   test('should search email logs by recipient', async () => {
//     render(
//       <EmailLogsView
//         emailLogs={mockEmailLogs}
//         reportId="report-1"
//         historyId="history-1"
//       />
//     );

//     const searchInput = screen.getByLabelText('Search by Recipient');
//     await userEvent.type(searchInput, 'user1');

//     expect(screen.getByText('user1@example.com')).toBeInTheDocument();
//     expect(screen.queryByText('user2@example.com')).not.toBeInTheDocument();
//     expect(screen.queryByText('user3@example.com')).not.toBeInTheDocument();
//   });

//   test('should perform case-insensitive search', async () => {
//     render(
//       <EmailLogsView
//         emailLogs={mockEmailLogs}
//         reportId="report-1"
//         historyId="history-1"
//       />
//     );

//     const searchInput = screen.getByLabelText('Search by Recipient');
//     await userEvent.type(searchInput, 'USER1');

//     expect(screen.getByText('user1@example.com')).toBeInTheDocument();
//   });

//   test('should export as CSV', async () => {
//     const mockCSVData = 'ID,Report ID,History ID,Recipient,Sent At,Status,Error Details,Created At\nemail-1,report-1,history-1,user1@example.com,...';
//     (reportingService.exportEmailLogs as jest.Mock).mockResolvedValue(mockCSVData);

//     // Mock URL.createObjectURL and URL.revokeObjectURL
//     global.URL.createObjectURL = jest.fn(() => 'blob:mock-url');
//     global.URL.revokeObjectURL = jest.fn();

//     render(
//       <EmailLogsView
//         emailLogs={mockEmailLogs}
//         reportId="report-1"
//         historyId="history-1"
//       />
//     );

//     const csvButton = screen.getByRole('button', { name: /csv/i });
//     fireEvent.click(csvButton);

//     await waitFor(() => {
//       expect(reportingService.exportEmailLogs).toHaveBeenCalledWith('csv', 'report-1');
//     });
//   });

//   test('should export as JSON', async () => {
//     const mockJSONData = {
//       success: true,
//       data: {
//         emails: mockEmailLogs,
//         exportedAt: new Date().toISOString(),
//         count: 3
//       }
//     };
//     (reportingService.exportEmailLogs as jest.Mock).mockResolvedValue(mockJSONData);

//     // Mock URL.createObjectURL and URL.revokeObjectURL
//     global.URL.createObjectURL = jest.fn(() => 'blob:mock-url');
//     global.URL.revokeObjectURL = jest.fn();

//     render(
//       <EmailLogsView
//         emailLogs={mockEmailLogs}
//         reportId="report-1"
//         historyId="history-1"
//       />
//     );

//     const jsonButton = screen.getByRole('button', { name: /json/i });
//     fireEvent.click(jsonButton);

//     await waitFor(() => {
//       expect(reportingService.exportEmailLogs).toHaveBeenCalledWith('json', 'report-1');
//     });
//   });

//   test('should handle export error', async () => {
//     (reportingService.exportEmailLogs as jest.Mock).mockRejectedValue(
//       new Error('Export failed')
//     );

//     render(
//       <EmailLogsView
//         emailLogs={mockEmailLogs}
//         reportId="report-1"
//         historyId="history-1"
//       />
//     );

//     const csvButton = screen.getByRole('button', { name: /csv/i });
//     fireEvent.click(csvButton);

//     await waitFor(() => {
//       expect(screen.getByText('Export failed')).toBeInTheDocument();
//     });
//   });

//   test('should disable export buttons when no logs', () => {
//     render(
//       <EmailLogsView
//         emailLogs={[]}
//         reportId="report-1"
//         historyId="history-1"
//       />
//     );

//     const csvButton = screen.getByRole('button', { name: /csv/i });
//     const jsonButton = screen.getByRole('button', { name: /json/i });

//     expect(csvButton).toHaveAttribute('disabled');
//     expect(jsonButton).toHaveAttribute('disabled');
//   });

//   test('should display empty state', () => {
//     render(
//       <EmailLogsView
//         emailLogs={[]}
//         reportId="report-1"
//         historyId="history-1"
//       />
//     );

//     expect(screen.getByText('No email logs found.')).toBeInTheDocument();
//   });

//   test('should display no matching recipients message', async () => {
//     render(
//       <EmailLogsView
//         emailLogs={mockEmailLogs}
//         reportId="report-1"
//         historyId="history-1"
//       />
//     );

//     const searchInput = screen.getByLabelText('Search by Recipient');
//     await userEvent.type(searchInput, 'nonexistent@example.com');

//     expect(screen.getByText('No matching recipients found.')).toBeInTheDocument();
//   });

//   test('should display log count summary', () => {
//     render(
//       <EmailLogsView
//         emailLogs={mockEmailLogs}
//         reportId="report-1"
//         historyId="history-1"
//       />
//     );

//     expect(screen.getByText('Showing 3 of 3 email logs')).toBeInTheDocument();
//   });

//   test('should update log count when filtering', async () => {
//     render(
//       <EmailLogsView
//         emailLogs={mockEmailLogs}
//         reportId="report-1"
//         historyId="history-1"
//       />
//     );

//     const searchInput = screen.getByLabelText('Search by Recipient');
//     await userEvent.type(searchInput, 'user1');

//     expect(screen.getByText('Showing 1 of 3 email logs')).toBeInTheDocument();
//   });

//   test('should format dates correctly', () => {
//     render(
//       <EmailLogsView
//         emailLogs={mockEmailLogs}
//         reportId="report-1"
//         historyId="history-1"
//       />
//     );

//     // Check that dates are formatted (not just raw ISO strings)
//     const dateElements = screen.getAllByText(/\d{1,2}\/\d{1,2}\/\d{4}/);
//     expect(dateElements.length).toBeGreaterThan(0);
//   });

//   test('should disable export buttons during export', async () => {
//     (reportingService.exportEmailLogs as jest.Mock).mockImplementation(
//       () => new Promise(resolve => setTimeout(() => resolve('data'), 100))
//     );

//     // Mock URL.createObjectURL and URL.revokeObjectURL
//     global.URL.createObjectURL = jest.fn(() => 'blob:mock-url');
//     global.URL.revokeObjectURL = jest.fn();

//     render(
//       <EmailLogsView
//         emailLogs={mockEmailLogs}
//         reportId="report-1"
//         historyId="history-1"
//       />
//     );

//     const csvButton = screen.getByRole('button', { name: /csv/i });
//     fireEvent.click(csvButton);

//     expect(csvButton).toHaveAttribute('disabled');
//   });
// });
