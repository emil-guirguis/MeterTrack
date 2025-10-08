if not exists (select 1 from sys.schemas where name = 'dbo')
    exec('create schema dbo');
go

create table dbo.meters (
  id uniqueidentifier not null constraint df_meters_id default newsequentialid(),

  serialnumber     nvarchar(200) not null unique,
  type             nvarchar(20) not null constraint ck_meters_type check (type in ('electric','gas','water','steam','other')),

  buildingid       uniqueidentifier null,
  buildingname     nvarchar(200) null,
  equipmentid      uniqueidentifier null,
  equipmentname    nvarchar(200) null,

  -- configuration (flattened)
  config_readinginterval int not null check (config_readinginterval >= 1),
  config_units       nvarchar(50) not null,
  config_multiplier  decimal(18,6) not null default 1,
  config_registers   nvarchar(max) null, -- json array of numbers
  config_communicationprotocol nvarchar(50) null,
  config_baudrate    int null,
  config_slaveid     int null,
  config_ipaddress   nvarchar(100) null,
  config_port        int null,

  -- last reading (flattened)
  lastreading_value     decimal(18,6) null,
  lastreading_timestamp datetime2(3) null,
  lastreading_unit      nvarchar(50) null,
  lastreading_quality   nvarchar(20) null check (lastreading_quality in ('good','estimated','questionable')),

  status           nvarchar(20) not null check (status in ('active','inactive','maintenance')) default 'active',
  installdate      datetime2(3) not null,
  manufacturer     nvarchar(200) null,
  model            nvarchar(200) null,
  location         nvarchar(500) null,
  notes            nvarchar(2000) null,

  createdat        datetime2(3) not null constraint df_meters_createdat default sysutcdatetime(),
  updatedat        datetime2(3) not null constraint df_meters_updatedat default sysutcdatetime(),

  constraint pk_meters primary key (id)
);
go

create index ix_meters_serialnumber on dbo.meters(serialnumber);
create index ix_meters_type on dbo.meters(type);
create index ix_meters_status on dbo.meters(status);
create index ix_meters_buildingid on dbo.meters(buildingid);
create index ix_meters_equipmentid on dbo.meters(equipmentid);
go

create or alter trigger dbo.tr_meters_setupdatedat
on dbo.meters
after update
as
begin
  set nocount on;
  update m set updatedat = sysutcdatetime()
  from dbo.meters m
  join inserted i on m.id = i.id;
end;
go