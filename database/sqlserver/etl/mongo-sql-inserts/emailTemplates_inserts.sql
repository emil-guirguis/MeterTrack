INSERT INTO [emailTemplates] ([_id], [name], [subject], [content], [variables], [category], [usageCount], [status], [lastUsed], [createdAt], [updatedAt]) VALUES (N'"68de6c9370d390a9fb480790"', N'Maintenance Reminder', N'Scheduled Maintenance Reminder - {{equipmentName}}', N'<h2>Maintenance Reminder</h2>
<p>Dear {{contactName}},</p>
<p>This is a reminder that scheduled maintenance is due for the following equipment:</p>
<ul>
  <li><strong>Equipment:</strong> {{equipmentName}}</li>
  <li><strong>Location:</strong> {{buildingName}} - {{equipmentLocation}}</li>
  <li><strong>Due Date:</strong> {{maintenanceDate}}</li>
</ul>
<p>Please schedule the maintenance at your earliest convenience.</p>
<p>Best regards,<br>Facility Management Team</p>', N'[{"name":"contactName","description":"Recipient name","type":"text","required":true},{"name":"equipmentName","description":"Equipment name","type":"text","required":true},{"name":"buildingName","description":"Building name","type":"text","required":true},{"name":"equipmentLocation","description":"Equipment location","type":"text","required":false},{"name":"maintenanceDate","description":"Maintenance due date","type":"date","required":true}]', N'Maintenance', 0, N'active', NULL, N'"2025-10-02T12:14:11.321Z"', N'"2025-10-02T12:14:11.321Z"');