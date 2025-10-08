if not exists (select 1 from sys.schemas where name = 'dbo')
    exec('create schema dbo');
go

create table dbo.meterdata (
  id uniqueidentifier not null constraint df_meterdata_id default newsequentialid(),

  meterid         nvarchar(100) not null,
  ip              nvarchar(100) null,
  port            int null,

  kvarh           decimal(18,3) null,
  kvah            decimal(18,3) null,
  a               decimal(18,3) null,
  kwh             decimal(18,3) null,
  dpf             decimal(5,4) null,
  dpfchannel      nvarchar(20) null,
  v               decimal(18,3) null,
  kw              decimal(18,3) null,
  kwpeak          decimal(18,3) null,

  createdat       datetime2(3) not null constraint df_meterdata_createdat default sysutcdatetime(),
  updatedat       datetime2(3) not null constraint df_meterdata_updatedat default sysutcdatetime(),

  constraint pk_meterdata primary key (id)
);
go

create index ix_meterdata_meterid on dbo.meterdata(meterid);
go

create or alter trigger dbo.tr_meterdata_setupdatedat
on dbo.meterdata
after update
as
begin
  set nocount on;
  update md set updatedat = sysutcdatetime()
  from dbo.meterdata md
  join inserted i on md.id = i.id;
end;
go