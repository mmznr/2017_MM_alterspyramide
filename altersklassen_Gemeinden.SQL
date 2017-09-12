/* Formatted on 09.05.2017 16:24:54 (QP5 v5.265.14096.37972) */
WITH klassen
     AS (SELECT DISTINCT bfs,
                         jahr,
                         gemeinde,
                         altersklassen
           FROM datashop.EINW_GDE_AK1_MV
                cross JOIN (    SELECT ROWNUM - 1 AS altersklassen
                                 FROM DUAL
                           CONNECT BY LEVEL <= 111)
                   )
  SELECT 
         bfs,
         gemeinde,
         jahr,
         altersklassen,
         NVL (CH_FRAUEN, 0) AS CH_FRAUEN,
         NVL (CH_Männer, 0) AS CH_Männer,
         NVL (ausl_frauen, 0) AS ausl_frauen,
         NVL (ausl_männer, 0) AS ausl_männer
    FROM (SELECT *
            FROM klassen
                 LEFT JOIN (SELECT jahr AS jahr_org,
                                   jahr - jahrgang AS altersklassen_org,
                                   bfs AS bfs_org,
                                   gemeinde AS gemeinde_org,
                                   CH_FRAUEN,
                                   CH_Männer,
                                   ausl_frauen,
                                   ausl_männer
                              FROM datashop.EINW_GDE_AK1_MV)
                    ON     altersklassen = altersklassen_org
                       AND bfs = bfs_org
                       AND gemeinde = gemeinde_org
                       AND jahr = jahr_org)
ORDER BY bfs, jahr, altersklassen DESC