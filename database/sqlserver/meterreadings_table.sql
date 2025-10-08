if not exists (select 1 from sys.schemas where name = 'dbo')
    exec('create schema dbo');
go

create table dbo.meterreadings (
  id uniqueidentifier not null constraint df_meterreadings_id default newsequentialid(),

  -- identity and device
  meterid            nvarchar(100) null,
  deviceip           varchar(45) null,
  ip                 varchar(45) null,
  port               int null constraint ck_meterreadings_port check (port between 1 and 65535),
  slaveid            int null,
  source             nvarchar(100) null,

  -- timestamps and quality
  [timestamp]        datetime2(3) null,
  quality            nvarchar(20) null constraint ck_meterreadings_quality check (quality in ('good','estimated','questionable')),

  -- core electrical measurements
  voltage            decimal(18,3) null,
  current            decimal(18,3) null,
  power              decimal(18,3) null,
  energy             decimal(18,3) null,
  frequency          decimal(7,3) null,
  powerfactor        decimal(5,4) null constraint ck_meterreadings_powerfactor check (powerfactor between 0 and 1),

  -- frontend essentials (legacy/calculated)
  kwh                decimal(18,3) null,
  kw                 decimal(18,3) null,
  v                  decimal(18,3) null,
  a                  decimal(18,3) null,
  dpf                decimal(5,4) null constraint ck_meterreadings_dpf check (dpf between 0 and 1),
  dpfchannel         int null,
  kwpeak             decimal(18,3) null,

  -- required legacy fields from mongo model
  kvarh              decimal(18,3) null,
  kvah               decimal(18,3) null,

  -- per-phase voltages/currents/powers
  phaseavoltage      decimal(18,3) null,
  phasebvoltage      decimal(18,3) null,
  phasecvoltage      decimal(18,3) null,
  phaseacurrent      decimal(18,3) null,
  phasebcurrent      decimal(18,3) null,
  phaseccurrent      decimal(18,3) null,
  phaseapower        decimal(18,3) null,
  phasebpower        decimal(18,3) null,
  phasecpower        decimal(18,3) null,

  -- line-to-line voltages
  linetolinevoltageab decimal(18,3) null,
  linetolinevoltagebc decimal(18,3) null,
  linetolinevoltageca decimal(18,3) null,

  -- totals and energy registers
  totalactivepower          decimal(18,3) null,
  totalreactivepower        decimal(18,3) null,
  totalapparentpower        decimal(18,3) null,
  totalactiveenergywh       decimal(18,3) null,
  totalreactiveenergyvarh   decimal(18,3) null,
  totalapparentenergyvah    decimal(18,3) null,
  importactiveenergywh      decimal(18,3) null,
  exportactiveenergywh      decimal(18,3) null,
  importreactiveenergyvarh  decimal(18,3) null,
  exportreactiveenergyvarh  decimal(18,3) null,

  -- additional measurements
  frequencyhz        decimal(7,3) null,
  temperaturec       decimal(9,3) null,
  humidity           decimal(9,3) null,
  neutralcurrent     decimal(18,3) null,
  groundcurrent      decimal(18,3) null,

  -- per-phase power factors
  phaseapowerfactor  decimal(5,4) null constraint ck_meterreadings_phaseapf check (phaseapowerfactor between 0 and 1),
  phasebpowerfactor  decimal(5,4) null constraint ck_meterreadings_phasebpf check (phasebpowerfactor between 0 and 1),
  phasecpowerfactor  decimal(5,4) null constraint ck_meterreadings_phasecpf check (phasecpowerfactor between 0 and 1),

  -- harmonic distortion (thd)
  voltagethd         decimal(9,3) null,
  currentthd         decimal(9,3) null,
  voltagethdphasea   decimal(9,3) null,
  voltagethdphaseb   decimal(9,3) null,
  voltagethdphasec   decimal(9,3) null,
  currentthdphasea   decimal(9,3) null,
  currentthdphaseb   decimal(9,3) null,
  currentthdphasec   decimal(9,3) null,

  -- selected harmonic components
  voltageharmonic3   decimal(18,3) null,
  voltageharmonic5   decimal(18,3) null,
  voltageharmonic7   decimal(18,3) null,
  currentharmonic3   decimal(18,3) null,
  currentharmonic5   decimal(18,3) null,
  currentharmonic7   decimal(18,3) null,

  -- demand metrics
  maxdemandkw        decimal(18,3) null,
  maxdemandkvar      decimal(18,3) null,
  maxdemandkva       decimal(18,3) null,
  currentdemandkw    decimal(18,3) null,
  currentdemandkvar  decimal(18,3) null,
  currentdemandkva   decimal(18,3) null,
  predicteddemandkw  decimal(18,3) null,

  -- power quality and advanced
  voltageunbalance   decimal(9,3) null,
  currentunbalance   decimal(9,3) null,
  voltageflicker     decimal(9,3) null,
  frequencydeviation decimal(9,3) null,

  -- phasing/direction
  phasesequence      nvarchar(10) null constraint ck_meterreadings_phasesequence check (phasesequence in ('abc','acb','bac','bca','cab','cba')),
  phaserotation      nvarchar(10) null constraint ck_meterreadings_phaserotation check (phaserotation in ('positive','negative')),
  powerdirection     nvarchar(10) null constraint ck_meterreadings_powerdirection check (powerdirection in ('import','export')),
  reactivedirection  nvarchar(12) null constraint ck_meterreadings_reactivedirection check (reactivedirection in ('inductive','capacitive')),

  -- communication and data quality
  communicationstatus nvarchar(10) null constraint ck_meterreadings_commstatus check (communicationstatus in ('ok','error','timeout','offline')),
  lastcommunication  datetime2(3) null,
  dataquality        nvarchar(20) null constraint ck_meterreadings_dataquality check (dataquality in ('good','estimated','questionable','bad')),

  -- register snapshots (json arrays)
  rawbasic           nvarchar(max) null,
  rawextended        nvarchar(max) null,

  -- device/model info
  devicemodel        nvarchar(100) null,
  firmwareversion    nvarchar(100) null,
  serialnumber       nvarchar(100) null,
  manufacturercode   int null,

  -- meter configuration
  currenttransformerratio decimal(18,6) null,
  voltagetransformerratio decimal(18,6) null,
  pulseconstant          decimal(18,6) null,

  -- time/sync
  devicetime         datetime2(3) null,
  syncstatus         nvarchar(20) null constraint ck_meterreadings_syncstatus check (syncstatus in ('synchronized','unsynchronized')),
  timesource         nvarchar(20) null constraint ck_meterreadings_timesource check (timesource in ('internal','ntp','gps')),

  -- alarms/events
  alarmstatus        nvarchar(10) null constraint ck_meterreadings_alarmstatus check (alarmstatus in ('active','inactive')),
  eventcounter       int null,
  lastevent          nvarchar(255) null,

  -- auditing
  createdat          datetime2(3) not null constraint df_meterreadings_createdat default sysutcdatetime(),
  updatedat          datetime2(3) not null constraint df_meterreadings_updatedat default sysutcdatetime(),

  constraint pk_meterreadings primary key (id)
);
go

create index ix_meterreadings_meterid_timestamp on dbo.meterreadings (meterid, [timestamp] desc);
create index ix_meterreadings_ip on dbo.meterreadings (ip);
create index ix_meterreadings_deviceip on dbo.meterreadings (deviceip);
create index ix_meterreadings_quality on dbo.meterreadings (quality);
go

create or alter trigger dbo.tr_meterreadings_setupdatedat
on dbo.meterreadings
after update
as
begin
  set nocount on;
  update mr
    set updatedat = sysutcdatetime()
  from dbo.meterreadings mr
  join inserted i on mr.id = i.id;
end;
go