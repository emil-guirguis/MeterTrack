if not exists (select 1 from sys.schemas where name = 'dbo')
    exec('create schema dbo');
go

create table dbo.users (
  id uniqueidentifier not null constraint df_users_id default newsequentialid(),

  email         nvarchar(254) not null unique,
  name          nvarchar(100) not null,
  passwordhash  nvarchar(200) not null,
  role          nvarchar(20) not null check (role in ('admin','manager','technician','viewer')) default 'viewer',
  permissions   nvarchar(max) null, -- json array of strings
  status        nvarchar(20) not null check (status in ('active','inactive')) default 'active',
  lastlogin     datetime2(3) null,

  createdat     datetime2(3) not null constraint df_users_createdat default sysutcdatetime(),
  updatedat     datetime2(3) not null constraint df_users_updatedat default sysutcdatetime(),

  constraint pk_users primary key (id)
);
go

create index ix_users_email on dbo.users(email);
create index ix_users_role on dbo.users(role);
create index ix_users_status on dbo.users(status);
go

create or alter trigger dbo.tr_users_setupdatedat
on dbo.users
after update
as
begin
  set nocount on;
  update u set updatedat = sysutcdatetime()
  from dbo.users u
  join inserted i on u.id = i.id;
end;
go