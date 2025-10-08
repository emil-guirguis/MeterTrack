-- migration: add mongo_id columns to preserve source MongoDB identifiers

-- buildings
if col_length('dbo.buildings', 'mongo_id') is null
  alter table dbo.buildings add mongo_id nvarchar(48) null;

-- equipment
if col_length('dbo.equipment', 'mongo_id') is null
  alter table dbo.equipment add mongo_id nvarchar(48) null;

-- meters
if col_length('dbo.meters', 'mongo_id') is null
  alter table dbo.meters add mongo_id nvarchar(48) null;

-- contacts
if col_length('dbo.contacts', 'mongo_id') is null
  alter table dbo.contacts add mongo_id nvarchar(48) null;

-- users
if col_length('dbo.users', 'mongo_id') is null
  alter table dbo.users add mongo_id nvarchar(48) null;

-- companysettings
if col_length('dbo.companysettings', 'mongo_id') is null
  alter table dbo.companysettings add mongo_id nvarchar(48) null;

-- meterdata
if col_length('dbo.meterdata', 'mongo_id') is null
  alter table dbo.meterdata add mongo_id nvarchar(48) null;

-- meterreadings
if col_length('dbo.meterreadings', 'mongo_id') is null
  alter table dbo.meterreadings add mongo_id nvarchar(48) null;
