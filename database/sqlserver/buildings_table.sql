if not exists (select 1 from sys.schemas where name = 'dbo')
    exec('create schema dbo');
go

create table dbo.locations (
  id uniqueidentifier not null constraint df_locations_id default newsequentialid(),

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

  type              nvarchar(20) not null constraint ck_locations_type check (type in ('office','warehouse','retail','residential','industrial')),
  status            nvarchar(20) not null constraint ck_locations_status check (status in ('active','inactive','maintenance')) default 'active',
  totalfloors       int null constraint ck_locations_totalfloors check (totalfloors is null or totalfloors >= 1),
  totalunits        int null constraint ck_locations_totalunits check (totalunits is null or totalunits >= 0),
  yearbuilt         int null constraint ck_locations_yearbuilt check (yearbuilt is null or (yearbuilt >= 1800 and yearbuilt <= year(getutcdate()))),
  squarefootage     int null constraint ck_locations_squarefootage check (squarefootage is null or squarefootage >= 1),
  description       nvarchar(1000) null,
  notes             nvarchar(2000) null,
  equipmentcount    int not null default 0 constraint ck_locations_equipmentcount check (equipmentcount >= 0),
  metercount        int not null default 0 constraint ck_locations_metercount check (metercount >= 0),

  createdat         datetime2(3) not null constraint df_locations_createdat default sysutcdatetime(),
  updatedat         datetime2(3) not null constraint df_locations_updatedat default sysutcdatetime(),

  constraint pk_locations primary key (id)
);
go

create index ix_locations_name on dbo.locations(name);
create index ix_locations_type on dbo.locations(type);
create index ix_locations_status on dbo.locations(status);
create index ix_locations_city on dbo.locations(address_city);
create index ix_locations_state on dbo.locations(address_state);
go

create or alter trigger dbo.tr_locations_setupdatedat
on dbo.locations
after update
as
begin
  set nocount on;
  update b set updatedat = sysutcdatetime()
  from dbo.locations b
  join inserted i on b.id = i.id;
end;
go