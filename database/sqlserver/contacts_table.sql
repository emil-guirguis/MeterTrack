if not exists (select 1 from sys.schemas where name = 'dbo')
    exec('create schema dbo');
go

create table dbo.contacts (
  id uniqueidentifier not null constraint df_contacts_id default newsequentialid(),

  type             nvarchar(20) not null check (type in ('customer','vendor')),
  name             nvarchar(200) not null,
  contactperson    nvarchar(100) not null,
  email            nvarchar(254) not null,
  phone            nvarchar(50) not null,

  -- address
  address_street   nvarchar(200) not null,
  address_city     nvarchar(100) not null,
  address_state    nvarchar(50) not null,
  address_zip_code nvarchar(20) not null,
  address_country  nvarchar(100) not null,

  status           nvarchar(20) not null check (status in ('active','inactive')) default 'active',
  businesstype     nvarchar(100) null,
  industry         nvarchar(100) null,
  website          nvarchar(255) null,
  notes            nvarchar(2000) null,
  tags             nvarchar(max) null, -- json array of strings

  createdat        datetime2(3) not null constraint df_contacts_createdat default sysutcdatetime(),
  updatedat        datetime2(3) not null constraint df_contacts_updatedat default sysutcdatetime(),

  constraint pk_contacts primary key (id)
);
go

create index ix_contacts_name on dbo.contacts(name);
create index ix_contacts_type on dbo.contacts(type);
create index ix_contacts_status on dbo.contacts(status);
create index ix_contacts_email on dbo.contacts(email);
-- For tags search, consider full-text or JSON querying patterns

go

create or alter trigger dbo.tr_contacts_setupdatedat
on dbo.contacts
after update
as
begin
  set nocount on;
  update c set updatedat = sysutcdatetime()
  from dbo.contacts c
  join inserted i on c.id = i.id;
end;
go