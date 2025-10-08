if not exists (select 1 from sys.schemas where name = 'dbo')
    exec('create schema dbo');
go

create table dbo.companysettings (
  id uniqueidentifier not null constraint df_companysettings_id default newsequentialid(),

  name            nvarchar(200) not null,
  logo            nvarchar(max) null,

  -- address
  address_street  nvarchar(200) not null,
  address_city    nvarchar(100) not null,
  address_state   nvarchar(50) not null,
  address_zip_code nvarchar(20) not null,
  address_country nvarchar(100) not null,

  -- contact info
  contact_phone   nvarchar(50) not null,
  contact_email   nvarchar(254) not null,
  contact_website nvarchar(255) null,

  -- branding
  branding_primarycolor   nvarchar(7) not null,
  branding_secondarycolor nvarchar(7) not null,
  branding_accentcolor    nvarchar(7) not null,
  branding_logourl        nvarchar(255) null,
  branding_faviconurl     nvarchar(255) null,
  branding_customcss      nvarchar(max) null,
  branding_emailsignature nvarchar(max) null,

  -- system config
  cfg_timezone        nvarchar(100) not null,
  cfg_dateformat      nvarchar(20) not null,
  cfg_timeformat      nvarchar(5)  not null check (cfg_timeformat in ('12h','24h')),
  cfg_currency        nvarchar(3)  not null,
  cfg_language        nvarchar(5)  not null,
  cfg_defaultpagesize int not null check (cfg_defaultpagesize between 10 and 100),
  cfg_sessiontimeout  int not null check (cfg_sessiontimeout between 5 and 480),
  cfg_enablenotifications bit not null default 1,
  cfg_enableemailalerts bit not null default 1,
  cfg_enablesmsalerts bit not null default 0,
  cfg_maintenancemode bit not null default 0,
  cfg_allowuserregistration bit not null default 0,
  cfg_requireemailverification bit not null default 1,

  -- nested objects stored as json blobs for flexibility
  passwordpolicy    nvarchar(max) null,
  backupsettings    nvarchar(max) null,
  features          nvarchar(max) null,
  integrations      nvarchar(max) null,

  createdat         datetime2(3) not null constraint df_companysettings_createdat default sysutcdatetime(),
  updatedat         datetime2(3) not null constraint df_companysettings_updatedat default sysutcdatetime(),

  constraint pk_companysettings primary key (id)
);
go

create index ix_companysettings_name on dbo.companysettings(name);
create index ix_companysettings_email on dbo.companysettings(contact_email);
go

create or alter trigger dbo.tr_companysettings_setupdatedat
on dbo.companysettings
after update
as
begin
  set nocount on;
  update cs set updatedat = sysutcdatetime()
  from dbo.companysettings cs
  join inserted i on cs.id = i.id;
end;
go