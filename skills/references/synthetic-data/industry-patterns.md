# Industry Data Patterns

> Column naming conventions and data distributions per vertical

## Universal Columns (All Industries)

Every customer table includes:

| Column | Type | Description |
|--------|------|-------------|
| CUSTOMER_ID | VARCHAR(36) | UUID primary key |
| CREATED_AT | TIMESTAMP | Account creation date |
| UPDATED_AT | TIMESTAMP | Last modification |
| CHURN_FLAG | INTEGER | 0=active, 1=churned |
| CHURN_DATE | DATE | NULL if active |

Every ML features table includes:

| Column | Type | Description |
|--------|------|-------------|
| CUSTOMER_ID | VARCHAR(36) | Foreign key |
| *_ENCODED | INTEGER | Encoded categoricals (UPPERCASE) |
| *_FLAG | INTEGER | Binary indicators |
| *_SCORE | FLOAT | Computed scores |
| FEATURES_CREATED_AT | TIMESTAMP | Feature generation time |

---

## Betting Industry

### CUSTOMERS_BETTING

| Column | Type | Distribution |
|--------|------|--------------|
| CUSTOMER_ID | VARCHAR(36) | UUID |
| USERNAME | VARCHAR | Unique handle |
| EMAIL | VARCHAR | {username}@domain |
| RISK_LEVEL | VARCHAR | LOW (60%), MEDIUM (30%), HIGH (10%) |
| ACCOUNT_STATUS | VARCHAR | ACTIVE (85%), SUSPENDED (10%), CLOSED (5%) |
| VIP_FLAG | INTEGER | 1=VIP (5% of customers) |
| DEPOSIT_LIMIT | DECIMAL | $100-$10000 |
| CREATED_AT | TIMESTAMP | Random in date range |

### TRANSACTIONS_BETTING (Wagers)

| Column | Type | Distribution |
|--------|------|--------------|
| WAGER_ID | VARCHAR(36) | UUID |
| CUSTOMER_ID | VARCHAR(36) | FK |
| WAGER_AMOUNT | DECIMAL | $1-$500, right-skewed |
| WAGER_TYPE | VARCHAR | SINGLE (70%), PARLAY (20%), TEASER (10%) |
| SPORT | VARCHAR | NFL (40%), NBA (25%), MLB (20%), NHL (15%) |
| OUTCOME | VARCHAR | WIN (48%), LOSS (50%), PUSH (2%) |
| WAGER_DATE | TIMESTAMP | Higher on weekends |

### CUSTOMER_ML_FEATURES_BETTING

| Column | Type | Derivation |
|--------|------|------------|
| CUSTOMER_ID | VARCHAR(36) | PK |
| TOTAL_WAGERS | INTEGER | COUNT(wagers) |
| TOTAL_WAGERED | DECIMAL | SUM(wager_amount) |
| WIN_RATE | FLOAT | wins / total |
| AVG_WAGER_SIZE | FLOAT | mean(wager_amount) |
| DAYS_SINCE_LAST_WAGER | INTEGER | date diff |
| RISK_LEVEL_ENCODED | INTEGER | LOW=0, MEDIUM=1, HIGH=2 |
| VIP_FLAG | INTEGER | from customer |
| CHURN_FLAG | INTEGER | target variable |

---

## Streaming Industry

### CUSTOMERS_STREAMING

| Column | Type | Distribution |
|--------|------|--------------|
| CUSTOMER_ID | VARCHAR(36) | UUID |
| SUBSCRIPTION_TIER | VARCHAR | FREE (40%), BASIC (35%), PREMIUM (25%) |
| DEVICE_TYPE | VARCHAR | MOBILE (45%), TV (35%), WEB (20%) |
| SIGNUP_SOURCE | VARCHAR | ORGANIC (50%), PAID (30%), REFERRAL (20%) |
| PARENTAL_CONTROLS | INTEGER | 0 (80%), 1 (20%) |

### TRANSACTIONS_STREAMING (Watch Sessions)

| Column | Type | Distribution |
|--------|------|--------------|
| SESSION_ID | VARCHAR(36) | UUID |
| CUSTOMER_ID | VARCHAR(36) | FK |
| CONTENT_ID | VARCHAR | Foreign key to content |
| WATCH_DURATION_MINS | INTEGER | 5-180, bimodal (short browse vs full watch) |
| CONTENT_TYPE | VARCHAR | MOVIE (30%), SERIES (50%), LIVE (20%) |
| COMPLETION_RATE | FLOAT | 0.0-1.0 |
| DEVICE | VARCHAR | Same dist as customer |
| SESSION_DATE | TIMESTAMP | Higher on evenings/weekends |

### CUSTOMER_ML_FEATURES_STREAMING

| Column | Type | Derivation |
|--------|------|------------|
| TOTAL_WATCH_TIME_HRS | FLOAT | SUM(duration) / 60 |
| AVG_SESSION_LENGTH | FLOAT | mean(duration) |
| SESSIONS_PER_WEEK | FLOAT | count / weeks active |
| CONTENT_DIVERSITY | FLOAT | unique content / total sessions |
| BINGE_SCORE | FLOAT | consecutive episode watches |
| TIER_ENCODED | INTEGER | FREE=0, BASIC=1, PREMIUM=2 |
| DAYS_SINCE_LAST_WATCH | INTEGER | date diff |

---

## Music Industry

### CUSTOMERS_MUSIC

| Column | Type | Distribution |
|--------|------|--------------|
| CUSTOMER_ID | VARCHAR(36) | UUID |
| SUBSCRIPTION_TYPE | VARCHAR | FREE (50%), INDIVIDUAL (35%), FAMILY (15%) |
| PREFERRED_GENRE | VARCHAR | POP (25%), ROCK (20%), HIPHOP (20%), OTHER (35%) |
| PLAYLIST_COUNT | INTEGER | 0-50, right-skewed |
| SOCIAL_CONNECTIONS | INTEGER | 0-500 |

### TRANSACTIONS_MUSIC (Listening Sessions)

| Column | Type | Distribution |
|--------|------|--------------|
| LISTEN_ID | VARCHAR(36) | UUID |
| CUSTOMER_ID | VARCHAR(36) | FK |
| TRACK_ID | VARCHAR | FK |
| LISTEN_DURATION_SECS | INTEGER | 30-300 |
| SKIP_FLAG | INTEGER | 1 if skipped before 30s |
| SOURCE | VARCHAR | PLAYLIST (40%), ALBUM (30%), RADIO (20%), SEARCH (10%) |
| LISTEN_DATE | TIMESTAMP | Higher during commute hours |

### CUSTOMER_ML_FEATURES_MUSIC

| Column | Type | Derivation |
|--------|------|------------|
| TOTAL_LISTEN_HRS | FLOAT | total listening time |
| SKIP_RATE | FLOAT | skips / total plays |
| UNIQUE_ARTISTS | INTEGER | distinct artists |
| PLAYLIST_ENGAGEMENT | FLOAT | playlist plays / total |
| GENRE_ENCODED | INTEGER | Encoded preferred genre |
| SUBSCRIPTION_ENCODED | INTEGER | FREE=0, INDIVIDUAL=1, FAMILY=2 |

---

## Healthcare Industry

### CUSTOMERS_HEALTHCARE (Patients)

| Column | Type | Distribution |
|--------|------|--------------|
| CUSTOMER_ID | VARCHAR(36) | UUID (Patient ID) |
| AGE_GROUP | VARCHAR | 18-30 (20%), 31-50 (35%), 51-70 (30%), 71+ (15%) |
| GENDER | VARCHAR | M (48%), F (50%), OTHER (2%) |
| INSURANCE_TYPE | VARCHAR | PRIVATE (45%), MEDICARE (30%), MEDICAID (20%), NONE (5%) |
| PRIMARY_CONDITION | VARCHAR | DIABETES (15%), HYPERTENSION (20%), NONE (40%), OTHER (25%) |
| RISK_SCORE | INTEGER | 1-10 |

### TRANSACTIONS_HEALTHCARE (Visits)

| Column | Type | Distribution |
|--------|------|--------------|
| VISIT_ID | VARCHAR(36) | UUID |
| CUSTOMER_ID | VARCHAR(36) | FK |
| VISIT_TYPE | VARCHAR | ROUTINE (50%), URGENT (30%), EMERGENCY (10%), SPECIALIST (10%) |
| PROVIDER_ID | VARCHAR | FK |
| DIAGNOSIS_CODE | VARCHAR | ICD-10 code |
| VISIT_COST | DECIMAL | $50-$5000 |
| VISIT_DATE | TIMESTAMP | Weekdays higher |

### CUSTOMER_ML_FEATURES_HEALTHCARE

| Column | Type | Derivation |
|--------|------|------------|
| VISIT_COUNT_12M | INTEGER | visits in last 12 months |
| AVG_VISIT_COST | FLOAT | mean cost |
| EMERGENCY_RATE | FLOAT | emergency / total visits |
| DAYS_SINCE_LAST_VISIT | INTEGER | date diff |
| AGE_GROUP_ENCODED | INTEGER | Encoded age group |
| GENDER_ENCODED | INTEGER | M=0, F=1, OTHER=2 |
| INSURANCE_ENCODED | INTEGER | Encoded insurance type |
| CONDITION_ENCODED | INTEGER | Encoded primary condition |

---

## Retail Industry

### CUSTOMERS_RETAIL

| Column | Type | Distribution |
|--------|------|--------------|
| CUSTOMER_ID | VARCHAR(36) | UUID |
| LOYALTY_TIER | VARCHAR | BRONZE (50%), SILVER (30%), GOLD (15%), PLATINUM (5%) |
| PREFERRED_CATEGORY | VARCHAR | ELECTRONICS (25%), CLOTHING (30%), HOME (25%), OTHER (20%) |
| CHANNEL_PREFERENCE | VARCHAR | ONLINE (40%), STORE (35%), BOTH (25%) |
| EMAIL_OPT_IN | INTEGER | 0 (30%), 1 (70%) |

### TRANSACTIONS_RETAIL (Purchases)

| Column | Type | Distribution |
|--------|------|--------------|
| ORDER_ID | VARCHAR(36) | UUID |
| CUSTOMER_ID | VARCHAR(36) | FK |
| ORDER_TOTAL | DECIMAL | $10-$500, right-skewed |
| ITEM_COUNT | INTEGER | 1-20 |
| CATEGORY | VARCHAR | Same as customer preference, with variance |
| CHANNEL | VARCHAR | ONLINE (55%), STORE (45%) |
| DISCOUNT_APPLIED | FLOAT | 0-0.5 |
| ORDER_DATE | TIMESTAMP | Holiday spikes |

### CUSTOMER_ML_FEATURES_RETAIL

| Column | Type | Derivation |
|--------|------|------------|
| TOTAL_SPEND | DECIMAL | lifetime spend |
| ORDER_COUNT | INTEGER | total orders |
| AVG_ORDER_VALUE | FLOAT | mean order total |
| DAYS_SINCE_LAST_ORDER | INTEGER | date diff |
| RETURN_RATE | FLOAT | returns / orders |
| LOYALTY_ENCODED | INTEGER | BRONZE=0, SILVER=1, GOLD=2, PLATINUM=3 |
| CHANNEL_ENCODED | INTEGER | Encoded preference |
| CATEGORY_ENCODED | INTEGER | Encoded preference |

---

## Generation Tips

**Churn correlation:** Higher churn correlates with:
- Lower engagement metrics (fewer transactions)
- Longer gaps since last activity
- Lower tier subscriptions

**Realistic distributions:**
- Use `numpy.random.choice` with weights for categorical
- Use `numpy.random.exponential` for right-skewed amounts
- Add seasonal patterns with date-based weights
