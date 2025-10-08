if not exists (select 1 from sys.schemas where name = 'dbo')
    exec('create schema dbo');
go

create table dbo.buildings (
  id uniqueidentifier not null constraint df_buildings_id default newsequentialid(),

  name              nvarchar(200) not null,

  -- address
  address_street    nvarchar(200) not null,
  address_city      nvarchar(100) not null,
  address_state     nvarchar(50) not null,
  address_zip_code  nvarchar(20) not null,
  address_country   nvarchar(100) not null,

  -- contact info
  contact_primarycontact nvarchar(100) null,
  contact_email     nvarchar(254) not null,
  contact_phone     nvarchar(50) not null,
  contact_website   nvarchar(255) null,

  type              nvarchar(20) not null constraint ck_buildings_type check (type in ('office','warehouse','retail','residential','industrial')),
  status            nvarchar(20) not null constraint ck_buildings_status check (status in ('active','inactive','maintenance')) default 'active',
  totalfloors       int null constraint ck_buildings_totalfloors check (totalfloors is null or totalfloors >= 1),
  totalunits        int null constraint ck_buildings_totalunits check (totalunits is null or totalunits >= 0),
  yearbuilt         int null constraint ck_buildings_yearbuilt check (yearbuilt is null or (yearbuilt >= 1800 and yearbuilt <= year(getutcdate()))),
  squarefootage     int null constraint ck_buildings_squarefootage check (squarefootage is null or squarefootage >= 1),
  description       nvarchar(1000) null,
  notes             nvarchar(2000) null,
  equipmentcount    int not null default 0 constraint ck_buildings_equipmentcount check (equipmentcount >= 0),
  metercount        int not null default 0 constraint ck_buildings_metercount check (metercount >= 0),

  createdat         datetime2(3) not null constraint df_buildings_createdat default sysutcdatetime(),
  updatedat         datetime2(3) not null constraint df_buildings_updatedat default sysutcdatetime(),

  constraint pk_buildings primary key (id)
);
go

create index ix_buildings_name on dbo.buildings(name);
create index ix_buildings_type on dbo.buildings(type);
create index ix_buildings_status on dbo.buildings(status);
create index ix_buildings_city on dbo.buildings(address_city);
create index ix_buildings_state on dbo.buildings(address_state);
go

create or alter trigger dbo.tr_buildings_setupdatedat
on dbo.buildings
after update
as
begin
  set nocount on;
  update b set updatedat = sysutcdatetime()
  from dbo.buildings b
  join inserted i on b.id = i.id;
end;
go