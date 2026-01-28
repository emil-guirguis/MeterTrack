SELECT 
    TO_CHAR(created_at, 'YYYY-MM-DD HH24:MI') as created_at_minute, 
    sync_status, count(*)
FROM 
    public.meter_reading
GROUP BY 
    TO_CHAR(created_at, 'YYYY-MM-DD HH24:MI') ,
    sync_status
ORDER BY 
    created_at_minute DESC;
