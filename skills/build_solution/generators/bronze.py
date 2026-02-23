"""
Bronze layer data generator.

Generates raw data with realistic quality issues:
- NULL values at configurable rates
- Duplicate records
- Format inconsistencies (dates, numbers)
- Varied timestamp formats
- Source system markers
"""

import random
from datetime import datetime, date, timedelta
from typing import Any, Optional
from dataclasses import dataclass

# Varied timestamp formats for bronze layer
TIMESTAMP_FORMATS = {
    "ISO8601": "%Y-%m-%dT%H:%M:%S.%fZ",
    "ISO8601_NO_MS": "%Y-%m-%dT%H:%M:%SZ",
    "US_DATE": "%m/%d/%Y %I:%M:%S %p",
    "US_DATE_SHORT": "%m/%d/%y %H:%M",
    "EU_DATE": "%d/%m/%Y %H:%M:%S",
    "EPOCH": "epoch",  # Special handling
    "EPOCH_MS": "epoch_ms",
    "SLASH_DATE": "%Y/%m/%d %H:%M:%S",
    "DASH_DATE": "%Y-%m-%d %H:%M:%S",
}

# Common source system patterns
SOURCE_SYSTEMS = [
    "SAP_ERP",
    "SALESFORCE",
    "ORACLE_DB",
    "LEGACY_MAINFRAME",
    "MANUAL_ENTRY",
    "API_IMPORT",
    "CSV_UPLOAD",
    "ETL_BATCH",
]


@dataclass
class BronzeConfig:
    """Configuration for bronze layer generation."""
    null_rate: float = 0.05
    duplicate_rate: float = 0.02
    format_errors: bool = True
    raw_timestamps: bool = True
    source_systems: list[str] = None
    
    def __post_init__(self):
        if self.source_systems is None:
            self.source_systems = SOURCE_SYSTEMS[:3]


class BronzeGenerator:
    """
    Generator for bronze layer data with realistic quality issues.
    
    Usage:
        bronze = BronzeGenerator(config=BronzeConfig(null_rate=0.05))
        
        # Apply noise to a clean value
        noisy_value = bronze.add_noise("clean_string", "STRING")
        
        # Generate raw timestamp
        raw_ts = bronze.raw_timestamp(datetime.now())
        
        # Generate duplicate rows
        rows_with_dupes = bronze.add_duplicates(clean_rows)
    """
    
    def __init__(self, config: Optional[BronzeConfig] = None, seed: int = 42):
        self.config = config or BronzeConfig()
        self.random = random.Random(seed)
    
    # =========================================================================
    # NULL Injection
    # =========================================================================
    
    def maybe_null(self, value: Any, field_nullable: bool = True) -> Any:
        """
        Randomly return NULL based on null_rate.
        
        Args:
            value: The clean value
            field_nullable: If False, never return NULL
            
        Returns:
            Original value or None
        """
        if not field_nullable:
            return value
        
        if self.random.random() < self.config.null_rate:
            return None
        return value
    
    def inject_nulls(self, row: dict, nullable_fields: list[str]) -> dict:
        """Inject NULLs into a row for specified fields."""
        result = row.copy()
        for field in nullable_fields:
            if field in result:
                result[field] = self.maybe_null(result[field])
        return result
    
    # =========================================================================
    # Duplicate Generation
    # =========================================================================
    
    def add_duplicates(self, rows: list[dict]) -> list[dict]:
        """
        Add duplicate rows based on duplicate_rate.
        
        Args:
            rows: List of clean rows
            
        Returns:
            List with duplicates inserted (not at end, scattered throughout)
        """
        if self.config.duplicate_rate <= 0:
            return rows
        
        num_dupes = int(len(rows) * self.config.duplicate_rate)
        if num_dupes == 0:
            return rows
        
        result = rows.copy()
        
        # Select random rows to duplicate
        dupe_indices = self.random.sample(range(len(rows)), min(num_dupes, len(rows)))
        
        for idx in dupe_indices:
            dupe_row = rows[idx].copy()
            # Optionally modify slightly (e.g., different load timestamp)
            if "_load_timestamp" in dupe_row:
                dupe_row["_load_timestamp"] = self.raw_timestamp(
                    datetime.now() + timedelta(seconds=self.random.randint(1, 3600))
                )
            # Insert at random position
            insert_pos = self.random.randint(0, len(result))
            result.insert(insert_pos, dupe_row)
        
        return result
    
    def is_duplicate(self) -> bool:
        """Check if current row should be a duplicate (for streaming generation)."""
        return self.random.random() < self.config.duplicate_rate
    
    # =========================================================================
    # Format Variations
    # =========================================================================
    
    def raw_timestamp(self, dt: datetime) -> str:
        """
        Convert datetime to a random raw format.
        
        Args:
            dt: Clean datetime object
            
        Returns:
            String in random format (ISO, US, epoch, etc.)
        """
        if not self.config.raw_timestamps:
            return dt.isoformat()
        
        format_name = self.random.choice(list(TIMESTAMP_FORMATS.keys()))
        format_str = TIMESTAMP_FORMATS[format_name]
        
        if format_str == "epoch":
            return str(int(dt.timestamp()))
        elif format_str == "epoch_ms":
            return str(int(dt.timestamp() * 1000))
        else:
            return dt.strftime(format_str)
    
    def raw_date(self, d: date) -> str:
        """Convert date to random format."""
        formats = [
            "%Y-%m-%d",
            "%m/%d/%Y",
            "%d/%m/%Y",
            "%Y/%m/%d",
            "%m-%d-%Y",
            "%d-%m-%Y",
        ]
        return d.strftime(self.random.choice(formats))
    
    def raw_number(self, value: float, precision: int = 2) -> str:
        """
        Convert number to string with format variations.
        
        Variations include:
        - With/without thousands separator
        - Different decimal separators
        - Scientific notation
        - Leading/trailing spaces
        """
        if not self.config.format_errors:
            return str(round(value, precision))
        
        variation = self.random.choice([
            "plain",
            "comma_thousands",
            "space_thousands",
            "eu_format",
            "scientific",
            "padded",
        ])
        
        if variation == "plain":
            return f"{value:.{precision}f}"
        elif variation == "comma_thousands":
            return f"{value:,.{precision}f}"
        elif variation == "space_thousands":
            return f"{value:,.{precision}f}".replace(",", " ")
        elif variation == "eu_format":
            # European: 1.234,56
            return f"{value:,.{precision}f}".replace(",", "X").replace(".", ",").replace("X", ".")
        elif variation == "scientific":
            return f"{value:.{precision}e}"
        elif variation == "padded":
            return f"  {value:.{precision}f}  "
        
        return str(value)
    
    def raw_boolean(self, value: bool) -> str:
        """Convert boolean to various string representations."""
        if not self.config.format_errors:
            return str(value)
        
        true_values = ["true", "True", "TRUE", "1", "yes", "Yes", "YES", "Y", "y", "T"]
        false_values = ["false", "False", "FALSE", "0", "no", "No", "NO", "N", "n", "F"]
        
        return self.random.choice(true_values if value else false_values)
    
    def raw_string(self, value: str) -> str:
        """
        Add string quality issues.
        
        Issues include:
        - Leading/trailing whitespace
        - Mixed case
        - Unicode variations
        """
        if not self.config.format_errors or not value:
            return value
        
        variation = self.random.choice([
            "clean",
            "leading_space",
            "trailing_space",
            "both_spaces",
            "uppercase",
            "lowercase",
        ])
        
        if variation == "clean":
            return value
        elif variation == "leading_space":
            return "  " + value
        elif variation == "trailing_space":
            return value + "  "
        elif variation == "both_spaces":
            return "  " + value + "  "
        elif variation == "uppercase":
            return value.upper()
        elif variation == "lowercase":
            return value.lower()
        
        return value
    
    # =========================================================================
    # Type-aware Noise
    # =========================================================================
    
    def add_noise(self, value: Any, field_type: str) -> Any:
        """
        Add type-appropriate noise to a value.
        
        Args:
            value: Clean value
            field_type: Data type (STRING, NUMBER, DATE, TIMESTAMP, BOOLEAN)
            
        Returns:
            Value with noise applied
        """
        if value is None:
            return None
        
        if field_type == "TIMESTAMP" and isinstance(value, datetime):
            return self.raw_timestamp(value)
        elif field_type == "DATE" and isinstance(value, date):
            return self.raw_date(value)
        elif field_type in ("NUMBER", "DECIMAL") and isinstance(value, (int, float)):
            return self.raw_number(value)
        elif field_type == "BOOLEAN" and isinstance(value, bool):
            return self.raw_boolean(value)
        elif field_type == "STRING" and isinstance(value, str):
            return self.raw_string(value)
        
        return value
    
    # =========================================================================
    # Source System Metadata
    # =========================================================================
    
    def source_system(self) -> str:
        """Generate a random source system identifier."""
        return self.random.choice(self.config.source_systems)
    
    def load_timestamp(self, base_time: Optional[datetime] = None) -> str:
        """Generate a load timestamp with some jitter."""
        if base_time is None:
            base_time = datetime.now()
        
        # Add random jitter (within last hour)
        jitter = timedelta(seconds=self.random.randint(0, 3600))
        return self.raw_timestamp(base_time - jitter)
    
    # =========================================================================
    # Row-level Processing
    # =========================================================================
    
    def bronze_row(
        self,
        clean_row: dict,
        field_types: dict[str, str],
        nullable_fields: list[str],
    ) -> dict:
        """
        Convert a clean row to bronze format with all noise applied.
        
        Args:
            clean_row: Dictionary with clean values
            field_types: Map of field name to type
            nullable_fields: Fields that can have NULLs injected
            
        Returns:
            Row with noise, NULLs, and metadata
        """
        result = {}
        
        for field, value in clean_row.items():
            # Maybe inject NULL
            if field in nullable_fields:
                value = self.maybe_null(value)
            
            # Add type-specific noise if not NULL
            if value is not None and field in field_types:
                value = self.add_noise(value, field_types[field])
            
            result[field] = value
        
        # Add bronze metadata
        result["_source_system"] = self.source_system()
        result["_load_timestamp"] = self.load_timestamp()
        
        return result
    
    # =========================================================================
    # SQL Generation for Bronze
    # =========================================================================
    
    def sql_null_injection(self, column: str, base_expr: str) -> str:
        """
        Generate SQL expression that randomly injects NULLs.
        
        Args:
            column: Column name
            base_expr: Base SQL expression
            
        Returns:
            SQL CASE expression with NULL injection
        """
        pct = int(self.config.null_rate * 100)
        return f"""
        CASE 
            WHEN UNIFORM(0, 100, RANDOM()) < {pct} THEN NULL
            ELSE {base_expr}
        END AS {column}"""
    
    def sql_timestamp_variation(self, column: str, base_expr: str) -> str:
        """
        Generate SQL for varied timestamp formats.
        
        Args:
            column: Column name
            base_expr: Base timestamp expression
            
        Returns:
            SQL that outputs timestamps in random formats
        """
        return f"""
        CASE MOD(SEQ4(), 5)
            WHEN 0 THEN TO_VARCHAR({base_expr}, 'YYYY-MM-DD"T"HH24:MI:SS.FF3"Z"')
            WHEN 1 THEN TO_VARCHAR({base_expr}, 'MM/DD/YYYY HH12:MI:SS AM')
            WHEN 2 THEN TO_VARCHAR(DATE_PART(EPOCH_SECOND, {base_expr}))
            WHEN 3 THEN TO_VARCHAR({base_expr}, 'DD/MM/YYYY HH24:MI:SS')
            ELSE TO_VARCHAR({base_expr}, 'YYYY-MM-DD HH24:MI:SS')
        END AS {column}"""
    
    def sql_source_system(self) -> str:
        """Generate SQL for random source system selection."""
        systems = ", ".join(f"'{s}'" for s in self.config.source_systems)
        return f"ARRAY_CONSTRUCT({systems})[MOD(SEQ4(), {len(self.config.source_systems)})]::STRING"
    
    def sql_duplicate_rows(self, base_query: str, key_column: str) -> str:
        """
        Wrap a query to add duplicate rows.
        
        Args:
            base_query: The base SELECT query
            key_column: Primary key column for duplicate selection
            
        Returns:
            SQL that unions original rows with duplicates
        """
        pct = int(self.config.duplicate_rate * 100)
        return f"""
        WITH base AS (
            {base_query}
        ),
        duplicates AS (
            SELECT * FROM base
            WHERE UNIFORM(0, 100, RANDOM()) < {pct}
        )
        SELECT * FROM base
        UNION ALL
        SELECT * FROM duplicates"""
