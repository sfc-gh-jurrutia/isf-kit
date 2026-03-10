# Implementation Recipes

End-to-end Snowflake patterns for common dimensional modeling pipelines. Adapted from DataExpert.io bootcamp materials, translated from PostgreSQL to Snowflake SQL. Loaded from SKILL.md when building pipelines.

---

## Recipe 1: Cumulative Table Pipeline

Builds a history-accumulating table where each entity carries an ever-growing array of records. Each daily run merges yesterday's snapshot with today's events via FULL OUTER JOIN.

**Source pattern**: DataExpert `pipeline_query.sql` (player cumulative stats)

### DDL

```sql
CREATE TABLE dim_player_cumulative (
  player_name     VARCHAR NOT NULL,
  height          VARCHAR,
  college         VARCHAR,
  country         VARCHAR,
  draft_year      VARCHAR,
  draft_round     VARCHAR,
  draft_number    VARCHAR,
  seasons         ARRAY,              -- array of OBJECT per season
  scoring_class   VARCHAR(10),        -- 'star', 'good', 'average', 'bad'
  is_active       BOOLEAN,
  current_season  INTEGER,
  PRIMARY KEY (player_name, current_season)
);
```

### Incremental Load (one season at a time)

```sql
INSERT INTO dim_player_cumulative
WITH last_season AS (
  SELECT * FROM dim_player_cumulative
  WHERE current_season = :current_year - 1
),
this_season AS (
  SELECT * FROM stg_player_seasons
  WHERE season = :current_year
)
SELECT
  COALESCE(ls.player_name, ts.player_name)    AS player_name,
  COALESCE(ls.height, ts.height)              AS height,
  COALESCE(ls.college, ts.college)            AS college,
  COALESCE(ls.country, ts.country)            AS country,
  COALESCE(ls.draft_year, ts.draft_year)      AS draft_year,
  COALESCE(ls.draft_round, ts.draft_round)    AS draft_round,
  COALESCE(ls.draft_number, ts.draft_number)  AS draft_number,
  ARRAY_CAT(
    COALESCE(ls.seasons, ARRAY_CONSTRUCT()),
    CASE
      WHEN ts.season IS NOT NULL THEN
        ARRAY_CONSTRUCT(OBJECT_CONSTRUCT(
          'season', ts.season,
          'pts', ts.pts,
          'ast', ts.ast,
          'reb', ts.reb,
          'weight', ts.weight
        ))
      ELSE ARRAY_CONSTRUCT()
    END
  )                                            AS seasons,
  CASE
    WHEN ts.season IS NOT NULL THEN
      CASE
        WHEN ts.pts > 20 THEN 'star'
        WHEN ts.pts > 15 THEN 'good'
        WHEN ts.pts > 10 THEN 'average'
        ELSE 'bad'
      END
    ELSE ls.scoring_class
  END                                          AS scoring_class,
  ts.season IS NOT NULL                        AS is_active,
  :current_year                                AS current_season
FROM last_season ls
FULL OUTER JOIN this_season ts
  ON ls.player_name = ts.player_name;
```

### Analytical Query (latest vs first season ratio)

```sql
SELECT
  player_name,
  seasons[ARRAY_SIZE(seasons) - 1]:pts::FLOAT /
    NULLIF(seasons[0]:pts::FLOAT, 0) AS ratio_latest_to_first
FROM dim_player_cumulative
WHERE current_season = :current_year;
```

### Unnesting Array History

```sql
SELECT
  player_name,
  f.value:season::INTEGER  AS season,
  f.value:pts::FLOAT       AS pts,
  f.value:ast::FLOAT       AS ast,
  f.value:reb::FLOAT       AS reb
FROM dim_player_cumulative,
  LATERAL FLATTEN(input => seasons) f
WHERE current_season = :current_year
  AND player_name = 'Michael Jordan';
```

---

## Recipe 2: SCD Type 2 Backfill (Full History)

Generates the complete SCD history from a series of snapshots in a single query using streak detection. Adapted from DataExpert `scd_generation_query.sql`.

### Pattern

```sql
INSERT INTO dim_entity_scd
  (entity_id, tracked_attr, start_date, end_date, is_current)
WITH streak_started AS (
  SELECT
    entity_id,
    tracked_attr,
    snapshot_date,
    (LAG(tracked_attr) OVER (PARTITION BY entity_id ORDER BY snapshot_date) != tracked_attr)
      OR (LAG(tracked_attr) OVER (PARTITION BY entity_id ORDER BY snapshot_date) IS NULL)
      AS did_change
  FROM source_snapshots
),
streak_identified AS (
  SELECT *,
    SUM(CASE WHEN did_change THEN 1 ELSE 0 END)
      OVER (PARTITION BY entity_id ORDER BY snapshot_date) AS streak_id
  FROM streak_started
),
aggregated AS (
  SELECT
    entity_id,
    tracked_attr,
    MIN(snapshot_date) AS start_date,
    MAX(snapshot_date) AS end_date
  FROM streak_identified
  GROUP BY entity_id, tracked_attr, streak_id
)
SELECT
  entity_id,
  tracked_attr,
  start_date,
  CASE
    WHEN end_date = (SELECT MAX(snapshot_date) FROM source_snapshots)
    THEN '9999-12-31'::DATE
    ELSE end_date
  END AS end_date,
  end_date = (SELECT MAX(snapshot_date) FROM source_snapshots) AS is_current
FROM aggregated;
```

---

## Recipe 3: SCD Type 2 Incremental (Day-Over-Day)

Merges one day of new data into an existing SCD table. Handles unchanged records, changed records, and new records. Adapted from DataExpert `incremental_scd_query.sql`.

### Pattern

```sql
-- Produce a complete new snapshot by combining historical, unchanged, changed, and new records
INSERT INTO dim_entity_scd
  (entity_id, tracked_attr, is_active, start_date, end_date, as_of_season)
WITH last_period_scd AS (
  SELECT * FROM dim_entity_scd
  WHERE as_of_season = :prev_period
    AND end_date = :prev_period
),
historical_scd AS (
  SELECT entity_id, tracked_attr, is_active, start_date, end_date
  FROM dim_entity_scd
  WHERE as_of_season = :prev_period
    AND end_date < :prev_period
),
current_data AS (
  SELECT * FROM source_current
  WHERE period = :current_period
),

-- Records where nothing changed: extend end_date
unchanged AS (
  SELECT
    c.entity_id,
    c.tracked_attr,
    c.is_active,
    l.start_date,
    :current_period AS end_date
  FROM current_data c
  JOIN last_period_scd l ON c.entity_id = l.entity_id
  WHERE c.tracked_attr = l.tracked_attr
    AND c.is_active = l.is_active
),

-- Records where something changed: close old row + open new row
changed AS (
  SELECT
    c.entity_id,
    val.tracked_attr,
    val.is_active,
    val.start_date,
    val.end_date
  FROM current_data c
  JOIN last_period_scd l ON c.entity_id = l.entity_id
  CROSS JOIN LATERAL (
    SELECT l.tracked_attr, l.is_active, l.start_date, l.end_date
    UNION ALL
    SELECT c.tracked_attr, c.is_active, :current_period, :current_period
  ) val
  WHERE c.tracked_attr != l.tracked_attr
     OR c.is_active != l.is_active
),

-- Brand new entities
new_records AS (
  SELECT
    c.entity_id,
    c.tracked_attr,
    c.is_active,
    :current_period AS start_date,
    :current_period AS end_date
  FROM current_data c
  LEFT JOIN last_period_scd l ON c.entity_id = l.entity_id
  WHERE l.entity_id IS NULL
)

SELECT *, :current_period AS as_of_season FROM historical_scd
UNION ALL
SELECT *, :current_period FROM unchanged
UNION ALL
SELECT *, :current_period FROM changed
UNION ALL
SELECT *, :current_period FROM new_records;
```

---

## Recipe 4: User Activity Date List with Bitmask

Tracks user activity in a cumulative date array, then converts to a bitmask integer for efficient window-based activity analysis. Adapted from DataExpert `user_cumulated_populate.sql` and `generate_datelist.sql`.

### DDL

```sql
CREATE TABLE users_cumulated (
  user_id       BIGINT NOT NULL,
  dates_active  ARRAY NOT NULL,       -- array of DATE values
  as_of_date    DATE NOT NULL,
  PRIMARY KEY (user_id, as_of_date)
);
```

### Daily Cumulative Load

```sql
MERGE INTO users_cumulated t
USING (
  WITH yesterday AS (
    SELECT * FROM users_cumulated
    WHERE as_of_date = :current_date - 1
  ),
  today AS (
    SELECT
      user_id,
      :current_date AS today_date
    FROM events
    WHERE DATE_TRUNC('DAY', event_time) = :current_date
      AND user_id IS NOT NULL
    GROUP BY user_id
  )
  SELECT
    COALESCE(t.user_id, y.user_id)    AS user_id,
    ARRAY_CAT(
      COALESCE(y.dates_active, ARRAY_CONSTRUCT()),
      CASE
        WHEN t.user_id IS NOT NULL THEN ARRAY_CONSTRUCT(t.today_date)
        ELSE ARRAY_CONSTRUCT()
      END
    )                                   AS dates_active,
    :current_date                       AS as_of_date
  FROM yesterday y
  FULL OUTER JOIN today t ON y.user_id = t.user_id
) src
ON t.user_id = src.user_id AND t.as_of_date = src.as_of_date
WHEN MATCHED THEN UPDATE SET dates_active = src.dates_active
WHEN NOT MATCHED THEN INSERT (user_id, dates_active, as_of_date)
  VALUES (src.user_id, src.dates_active, src.as_of_date);
```

### Activity Analysis via Array Containment

```sql
WITH date_range AS (
  SELECT DATEADD(DAY, SEQ4(), :period_start) AS check_date
  FROM TABLE(GENERATOR(ROWCOUNT => 32))
  WHERE DATEADD(DAY, SEQ4(), :period_start) <= :period_end
),
activity_check AS (
  SELECT
    uc.user_id,
    dr.check_date,
    ARRAY_CONTAINS(dr.check_date::VARIANT, uc.dates_active) AS was_active,
    DATEDIFF(DAY, dr.check_date, :period_end) AS days_ago
  FROM users_cumulated uc
  CROSS JOIN date_range dr
  WHERE uc.as_of_date = :period_end
)
SELECT
  user_id,
  COUNT_IF(was_active) AS total_active_days,
  COUNT_IF(was_active AND days_ago < 7) > 0  AS weekly_active,
  COUNT_IF(was_active AND days_ago < 30) > 0 AS monthly_active,
  COUNT_IF(was_active AND days_ago < 7) AS l7_active_days,
  COUNT_IF(was_active AND days_ago < 30) AS l30_active_days
FROM activity_check
GROUP BY user_id;
```

---

## Recipe 5: Monthly Array Metrics Aggregation

Stores daily metric values in an array column indexed by day-of-month. Enables efficient rollups without joining to a date spine. Adapted from DataExpert `array_metrics_analysis.sql`.

### DDL

```sql
CREATE TABLE fct_user_metrics_monthly (
  user_id       BIGINT NOT NULL,
  month_start   DATE NOT NULL,
  metric_name   VARCHAR(50) NOT NULL,
  metric_array  ARRAY NOT NULL,
  PRIMARY KEY (user_id, month_start, metric_name)
);
```

### Daily Incremental Append

```sql
MERGE INTO fct_user_metrics_monthly t
USING (
  WITH daily_agg AS (
    SELECT
      user_id,
      COUNT(*) AS num_hits
    FROM events
    WHERE DATE_TRUNC('DAY', event_time) = :current_date
      AND user_id IS NOT NULL
    GROUP BY user_id
  ),
  existing AS (
    SELECT *
    FROM fct_user_metrics_monthly
    WHERE month_start = DATE_TRUNC('MONTH', :current_date)::DATE
      AND metric_name = 'site_hits'
  )
  SELECT
    COALESCE(d.user_id, e.user_id)              AS user_id,
    DATE_TRUNC('MONTH', :current_date)::DATE     AS month_start,
    'site_hits'                                   AS metric_name,
    CASE
      WHEN e.metric_array IS NOT NULL THEN
        ARRAY_APPEND(e.metric_array, COALESCE(d.num_hits, 0)::VARIANT)
      ELSE
        ARRAY_CONSTRUCT(COALESCE(d.num_hits, 0)::VARIANT)
    END                                           AS metric_array
  FROM daily_agg d
  FULL OUTER JOIN existing e ON d.user_id = e.user_id
) src
ON t.user_id = src.user_id
  AND t.month_start = src.month_start
  AND t.metric_name = src.metric_name
WHEN MATCHED THEN UPDATE SET metric_array = src.metric_array
WHEN NOT MATCHED THEN INSERT (user_id, month_start, metric_name, metric_array)
  VALUES (src.user_id, src.month_start, src.metric_name, src.metric_array);
```

### Cross-Day Aggregation via FLATTEN

```sql
WITH unnested AS (
  SELECT
    metric_name,
    month_start,
    f.index AS day_index,
    f.value::NUMBER AS daily_value
  FROM fct_user_metrics_monthly,
    LATERAL FLATTEN(input => metric_array) f
)
SELECT
  metric_name,
  DATEADD(DAY, day_index, month_start) AS metric_date,
  SUM(daily_value) AS total_value,
  COUNT(*) AS user_count
FROM unnested
GROUP BY metric_name, month_start, day_index
ORDER BY metric_date;
```

---

## Recipe 6: Graph-Style Edge/Vertex Modeling

Models entities and relationships as vertices and edges using Snowflake VARIANT for flexible properties. Adapted from DataExpert `graph_ddls.sql`.

### DDL

```sql
CREATE TABLE vertices (
  identifier  VARCHAR NOT NULL,
  type        VARCHAR NOT NULL,           -- 'player', 'team', 'game'
  properties  VARIANT,
  PRIMARY KEY (identifier, type)
);

CREATE TABLE edges (
  subject_identifier  VARCHAR NOT NULL,
  subject_type        VARCHAR NOT NULL,
  object_identifier   VARCHAR NOT NULL,
  object_type         VARCHAR NOT NULL,
  edge_type           VARCHAR NOT NULL,   -- 'plays_in', 'plays_on', 'shares_team', 'plays_against'
  properties          VARIANT,
  PRIMARY KEY (subject_identifier, subject_type, object_identifier, object_type, edge_type)
);
```

### Load Vertices

```sql
INSERT INTO vertices (identifier, type, properties)
SELECT
  team_id::VARCHAR                      AS identifier,
  'team'                                AS type,
  OBJECT_CONSTRUCT(
    'abbreviation', abbreviation,
    'nickname', nickname,
    'city', city,
    'arena', arena,
    'year_founded', year_founded
  )                                     AS properties
FROM stg_teams
QUALIFY ROW_NUMBER() OVER (PARTITION BY team_id ORDER BY loaded_at DESC) = 1;
```

### Load Edges

```sql
INSERT INTO edges
WITH deduped AS (
  SELECT *
  FROM stg_game_details
  QUALIFY ROW_NUMBER() OVER (PARTITION BY player_id, game_id ORDER BY loaded_at DESC) = 1
)
SELECT
  player_id::VARCHAR   AS subject_identifier,
  'player'             AS subject_type,
  game_id::VARCHAR     AS object_identifier,
  'game'               AS object_type,
  'plays_in'           AS edge_type,
  OBJECT_CONSTRUCT(
    'start_position', start_position,
    'pts', pts,
    'team_id', team_id,
    'team_abbreviation', team_abbreviation
  )                    AS properties
FROM deduped;
```

### Query: Player-to-Player Relationships

```sql
WITH deduped AS (
  SELECT *
  FROM stg_game_details
  QUALIFY ROW_NUMBER() OVER (PARTITION BY player_id, game_id ORDER BY loaded_at DESC) = 1
)
SELECT
  f1.player_name AS player_1,
  f2.player_name AS player_2,
  CASE
    WHEN f1.team_abbreviation = f2.team_abbreviation THEN 'shares_team'
    ELSE 'plays_against'
  END AS relationship,
  COUNT(*) AS num_games,
  SUM(f1.pts) AS p1_total_pts,
  SUM(f2.pts) AS p2_total_pts
FROM deduped f1
JOIN deduped f2
  ON f1.game_id = f2.game_id
  AND f1.player_id > f2.player_id
GROUP BY ALL;
```

---

## Recipe 7: Deduplication Patterns

Snowflake's QUALIFY clause makes deduplication cleaner than the standard subquery approach.

### Keep Latest Record per Key

```sql
SELECT *
FROM raw_events
QUALIFY ROW_NUMBER() OVER (
  PARTITION BY event_id
  ORDER BY loaded_at DESC
) = 1;
```

### Deduplicate During MERGE

```sql
MERGE INTO target_table t
USING (
  SELECT *
  FROM staging_table
  QUALIFY ROW_NUMBER() OVER (
    PARTITION BY business_key
    ORDER BY updated_at DESC
  ) = 1
) s
ON t.business_key = s.business_key
WHEN MATCHED THEN UPDATE SET ...
WHEN NOT MATCHED THEN INSERT ...;
```

### Detect and Flag Duplicates

```sql
SELECT
  event_id,
  COUNT(*) AS duplicate_count,
  MIN(loaded_at) AS first_seen,
  MAX(loaded_at) AS last_seen
FROM raw_events
GROUP BY event_id
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC;
```

---

## Recipe 8: Reduced Fact Table (Host Activity)

A monthly rollup table storing daily metrics as arrays for compact time-series storage. Adapted from DataExpert homework pattern.

### DDL

```sql
CREATE TABLE fct_host_activity_reduced (
  host              VARCHAR NOT NULL,
  month_start       DATE NOT NULL,
  hit_array         ARRAY NOT NULL,           -- daily COUNT(1)
  unique_visitors   ARRAY NOT NULL,           -- daily COUNT(DISTINCT user_id)
  PRIMARY KEY (host, month_start)
);
```

### Daily Incremental Load

```sql
MERGE INTO fct_host_activity_reduced t
USING (
  WITH daily_agg AS (
    SELECT
      host,
      COUNT(*)                AS hits,
      COUNT(DISTINCT user_id) AS visitors
    FROM events
    WHERE DATE_TRUNC('DAY', event_time) = :current_date
      AND host IS NOT NULL
    GROUP BY host
  ),
  existing AS (
    SELECT *
    FROM fct_host_activity_reduced
    WHERE month_start = DATE_TRUNC('MONTH', :current_date)::DATE
  )
  SELECT
    COALESCE(d.host, e.host)                     AS host,
    DATE_TRUNC('MONTH', :current_date)::DATE      AS month_start,
    CASE
      WHEN e.hit_array IS NOT NULL THEN
        ARRAY_APPEND(e.hit_array, COALESCE(d.hits, 0)::VARIANT)
      ELSE ARRAY_CONSTRUCT(COALESCE(d.hits, 0)::VARIANT)
    END                                            AS hit_array,
    CASE
      WHEN e.unique_visitors IS NOT NULL THEN
        ARRAY_APPEND(e.unique_visitors, COALESCE(d.visitors, 0)::VARIANT)
      ELSE ARRAY_CONSTRUCT(COALESCE(d.visitors, 0)::VARIANT)
    END                                            AS unique_visitors
  FROM daily_agg d
  FULL OUTER JOIN existing e ON d.host = e.host
) src
ON t.host = src.host AND t.month_start = src.month_start
WHEN MATCHED THEN UPDATE SET
  hit_array = src.hit_array,
  unique_visitors = src.unique_visitors
WHEN NOT MATCHED THEN INSERT (host, month_start, hit_array, unique_visitors)
  VALUES (src.host, src.month_start, src.hit_array, src.unique_visitors);
```
