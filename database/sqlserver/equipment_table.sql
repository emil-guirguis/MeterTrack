if not exists (select 1 from sys.schemas where name = 'dbo')
    exec('create schema dbo');
go

create table dbo.equipment (
  id uniqueidentifier not null constraint df_equipment_id default newsequentialid(),

  name            nvarchar(200) not null,
  type            nvarchar(100) not null,

  locationid      uniqueidentifier not null,
  locationname    nvarchar(200) null,

  specifications  nvarchar(max) null, -- json blob
  status          nvarchar(20) not null constraint ck_equipment_status check (status in ('operational','maintenance','offline')) default 'operational',
  installdate     datetime2(3) not null,
  lastmaintenance datetime2(3) null,
  nextmaintenance datetime2(3) null,
  serialnumber    nvarchar(200) null unique,
  manufacturer    nvarchar(200) null,
  model           nvarchar(200) null,
  location        nvarchar(500) null,
  notes           nvarchar(2000) null,

  createdat       datetime2(3) not null constraint df_equipment_createdat default sysutcdatetime(),
  updatedat       datetime2(3) not null constraint df_equipment_updatedat default sysutcdatetime(),

  constraint pk_equipment primary key (id)
);
go

create index ix_equipment_name on dbo.equipment(name);
create index ix_equipment_type on dbo.equipment(type);
create index ix_equipment_status on dbo.equipment(status);
create index ix_equipment_locationid on dbo.equipment(locationid);
create index ix_equipment_serialnumber on dbo.equipment(serialnumber);
create index ix_equipment_nextmaintenance on dbo.equipment(nextmaintenance);
go

create or alter trigger dbo.tr_equipment_setupdatedat
on dbo.equipment
after update
as
begin
  set nocount on;
  update e set updatedat = sysutcdatetime()
  from dbo.equipment e
  join inserted i on e.id = i.id;
end;
go