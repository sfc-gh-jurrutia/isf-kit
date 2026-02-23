"""
Main data generator class.

Generates synthetic data based on a domain model using either:
- Python/Faker for smaller datasets (< 1M rows)
- Snowflake SQL for larger datasets (>= 1M rows)

Supports medallion architecture (bronze, silver, gold layers).
"""

from dataclasses import dataclass, field
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any, Callable, Optional
import random

try:
    from faker import Faker
    HAS_FAKER = True
except ImportError:
    HAS_FAKER = False

try:
    import pandas as pd
    HAS_PANDAS = True
except ImportError:
    HAS_PANDAS = False

from .base import DomainModel, EntityDefinition, FieldDefinition, MedallionLayer, LayerConfig
from .bronze import BronzeGenerator, BronzeConfig


@dataclass
class GeneratorConfig:
    """Configuration for data generation."""
    seed: int = 42
    batch_size: int = 10000  # For large datasets
    sql_threshold: int = 1_000_000  # Use SQL generation above this
    database: str = "DEMO_DB"
    schema: str = "PUBLIC"
    include_ddl: bool = True  # Include CREATE TABLE statements
    include_anomalies: bool = True
    date_format: str = "%Y-%m-%d"
    timestamp_format: str = "%Y-%m-%d %H:%M:%S"
    
    # Medallion architecture settings
    medallion_enabled: bool = True
    bronze_schema: str = "BRONZE"
    silver_schema: str = "SILVER"
    gold_schema: str = "GOLD"


class DataGenerator:
    """
    Main data generator that produces synthetic data from a domain model.
    
    Supports two generation strategies:
    - Python/Faker: For datasets < 1M rows, generates DataFrames + files
    - Snowflake SQL: For datasets >= 1M rows, generates SQL scripts
    
    Usage:
        model = DomainModel.from_yaml("domain-model.yaml")
        generator = DataGenerator(model)
        
        # Check recommended strategy
        if generator.should_use_sql():
            sql = generator.generate_sql()
            generator.write_sql("output.sql")
        else:
            data = generator.generate_python()
            generator.write_parquet("output/")
    """
    
    def __init__(
        self,
        model: DomainModel,
        config: Optional[GeneratorConfig] = None,
        industry_generator: Optional["IndustryGenerator"] = None,
    ):
        self.model = model
        self.config = config or GeneratorConfig(seed=model.seed)
        self.industry = industry_generator
        
        # Initialize Faker if available
        if HAS_FAKER:
            self.fake = Faker()
            Faker.seed(self.config.seed)
            self.fake.seed_instance(self.config.seed)
        else:
            self.fake = None
        
        # Set random seed for reproducibility
        random.seed(self.config.seed)
        
        # Initialize bronze generator for medallion architecture
        self.bronze_gen = BronzeGenerator(seed=self.config.seed)
        
        # Storage for generated data (Python strategy)
        self._generated_data: dict[str, Any] = {}
        
        # Storage for generated data by layer
        self._generated_by_layer: dict[MedallionLayer, dict[str, Any]] = {
            MedallionLayer.BRONZE: {},
            MedallionLayer.SILVER: {},
            MedallionLayer.GOLD: {},
        }
        
        # Storage for generated SQL (SQL strategy)
        self._generated_sql: dict[str, str] = {}
    
    def should_use_sql(self) -> bool:
        """Determine if SQL generation is recommended."""
        return self.model.total_rows() >= self.config.sql_threshold
    
    def get_schema_for_layer(self, layer: MedallionLayer) -> str:
        """Get the schema name for a medallion layer."""
        if layer == MedallionLayer.BRONZE:
            return self.config.bronze_schema
        elif layer == MedallionLayer.SILVER:
            return self.config.silver_schema
        else:
            return self.config.gold_schema
    
    # =========================================================================
    # Python/Faker Generation
    # =========================================================================
    
    def generate_python(self) -> dict[str, "pd.DataFrame"]:
        """
        Generate all entities using Python/Faker.
        
        Returns dict of entity_name -> DataFrame.
        For medallion architecture, generates all layers in order.
        """
        if not HAS_FAKER:
            raise ImportError("Faker is required for Python generation. Install with: pip install faker")
        if not HAS_PANDAS:
            raise ImportError("Pandas is required for Python generation. Install with: pip install pandas")
        
        self._generated_data = {}
        
        # Check if using medallion architecture
        layers_used = self.model.get_layers_used()
        
        if len(layers_used) > 1 or MedallionLayer.BRONZE in layers_used:
            # Generate by layer: bronze → silver → gold
            return self.generate_python_medallion()
        
        # Legacy: generate in simple dependency order
        for entity_name in self.model.get_generation_order():
            entity = self.model.get_entity(entity_name)
            if entity:
                df = self._generate_entity_python(entity)
                self._generated_data[entity_name] = df
        
        return self._generated_data
    
    def generate_python_medallion(self) -> dict[str, "pd.DataFrame"]:
        """
        Generate data using medallion architecture.
        
        Flow:
        1. Generate bronze (raw data with noise)
        2. Generate silver (cleansed from bronze or fresh)
        3. Generate gold (aggregates/dimensional from silver)
        
        Returns dict with schema-prefixed keys: {schema}.{table}
        """
        import pandas as pd
        
        result = {}
        order_by_layer = self.model.get_generation_order_by_layer()
        
        # Phase 1: Bronze layer
        if MedallionLayer.BRONZE in order_by_layer:
            for entity_name in order_by_layer[MedallionLayer.BRONZE]:
                entity = self.model.get_entity(entity_name)
                if entity:
                    df = self._generate_bronze_entity(entity)
                    schema = self.get_schema_for_layer(MedallionLayer.BRONZE)
                    key = f"{schema}.{entity_name}"
                    result[key] = df
                    self._generated_by_layer[MedallionLayer.BRONZE][entity_name] = df
        
        # Phase 2: Silver layer
        if MedallionLayer.SILVER in order_by_layer:
            for entity_name in order_by_layer[MedallionLayer.SILVER]:
                entity = self.model.get_entity(entity_name)
                if entity:
                    df = self._generate_silver_entity(entity)
                    schema = self.get_schema_for_layer(MedallionLayer.SILVER)
                    key = f"{schema}.{entity_name}"
                    result[key] = df
                    self._generated_by_layer[MedallionLayer.SILVER][entity_name] = df
        
        # Phase 3: Gold layer
        if MedallionLayer.GOLD in order_by_layer:
            for entity_name in order_by_layer[MedallionLayer.GOLD]:
                entity = self.model.get_entity(entity_name)
                if entity:
                    df = self._generate_gold_entity(entity)
                    schema = self.get_schema_for_layer(MedallionLayer.GOLD)
                    key = f"{schema}.{entity_name}"
                    result[key] = df
                    self._generated_by_layer[MedallionLayer.GOLD][entity_name] = df
        
        self._generated_data = result
        return result
    
    def _generate_bronze_entity(self, entity: EntityDefinition) -> "pd.DataFrame":
        """Generate bronze layer entity with noise and quality issues."""
        import pandas as pd
        
        # Configure bronze generator from entity's layer config
        if entity.layer_config:
            self.bronze_gen.config.null_rate = entity.layer_config.null_rate
            self.bronze_gen.config.duplicate_rate = entity.layer_config.duplicate_rate
            self.bronze_gen.config.format_errors = entity.layer_config.format_errors
            self.bronze_gen.config.raw_timestamps = entity.layer_config.raw_timestamps
        
        # Generate clean data first
        rows = []
        for i in range(entity.row_count):
            row = {}
            for field in entity.fields:
                row[field.name] = self._generate_field_value_python(field, entity, i)
            rows.append(row)
        
        # Build field type map for bronze noise
        field_types = {f.name: f.type for f in entity.fields}
        nullable_fields = [f.name for f in entity.fields if f.nullable]
        
        # Apply bronze noise to each row
        bronze_rows = []
        for row in rows:
            bronze_row = self.bronze_gen.bronze_row(row, field_types, nullable_fields)
            bronze_rows.append(bronze_row)
        
        # Add duplicates
        bronze_rows = self.bronze_gen.add_duplicates(bronze_rows)
        
        return pd.DataFrame(bronze_rows)
    
    def _generate_silver_entity(self, entity: EntityDefinition) -> "pd.DataFrame":
        """
        Generate silver layer entity (cleansed).
        
        If a source_entity is specified in layer_config, derives from bronze.
        Otherwise generates clean data directly.
        """
        import pandas as pd
        
        source_entity = None
        if entity.layer_config and hasattr(entity.layer_config, 'source_entity'):
            source_entity = getattr(entity.layer_config, 'source_entity', None)
        
        # Check if we can derive from bronze
        if source_entity and source_entity in self._generated_by_layer[MedallionLayer.BRONZE]:
            return self._cleanse_bronze_to_silver(
                self._generated_by_layer[MedallionLayer.BRONZE][source_entity],
                entity
            )
        
        # Generate clean silver data directly
        rows = []
        for i in range(entity.row_count):
            row = {}
            for field in entity.fields:
                row[field.name] = self._generate_field_value_python(field, entity, i)
            rows.append(row)
        
        df = pd.DataFrame(rows)
        
        # Apply characteristics (anomalies, trends) - but cleaner than bronze
        df = self._apply_characteristics_python(df, entity)
        
        return df
    
    def _cleanse_bronze_to_silver(
        self,
        bronze_df: "pd.DataFrame",
        entity: EntityDefinition
    ) -> "pd.DataFrame":
        """Transform bronze data to silver by cleansing."""
        import pandas as pd
        
        df = bronze_df.copy()
        
        # Remove bronze metadata columns
        bronze_cols = ["_source_system", "_load_timestamp"]
        df = df.drop(columns=[c for c in bronze_cols if c in df.columns], errors='ignore')
        
        # Deduplicate if configured
        if entity.layer_config and entity.layer_config.deduplicate:
            pk = entity.get_primary_key()
            if pk:
                df = df.drop_duplicates(subset=[pk.name], keep='first')
        
        # Standardize nulls (empty strings to None)
        if entity.layer_config and entity.layer_config.standardize_nulls:
            for col in df.columns:
                if df[col].dtype == 'object':
                    df[col] = df[col].replace('', None)
                    df[col] = df[col].str.strip() if hasattr(df[col], 'str') else df[col]
        
        # Cast types back to proper types
        if entity.layer_config and entity.layer_config.cast_types:
            for field in entity.fields:
                if field.name in df.columns:
                    df = self._cast_field_type(df, field)
        
        return df
    
    def _cast_field_type(self, df: "pd.DataFrame", field: FieldDefinition) -> "pd.DataFrame":
        """Cast a field to its proper type."""
        import pandas as pd
        
        col = field.name
        if col not in df.columns:
            return df
        
        try:
            if field.type.upper() in ("NUMBER", "INTEGER", "INT"):
                df[col] = pd.to_numeric(df[col], errors='coerce')
            elif field.type.upper() in ("DECIMAL", "FLOAT", "DOUBLE"):
                df[col] = pd.to_numeric(df[col], errors='coerce')
            elif field.type.upper() == "BOOLEAN":
                # Handle various boolean string representations
                bool_map = {
                    'true': True, 'false': False,
                    'True': True, 'False': False,
                    'TRUE': True, 'FALSE': False,
                    '1': True, '0': False,
                    'yes': True, 'no': False,
                    'Yes': True, 'No': False,
                    'Y': True, 'N': False,
                    'y': True, 'n': False,
                }
                df[col] = df[col].map(lambda x: bool_map.get(str(x), x) if pd.notna(x) else None)
            elif field.type.upper() == "DATE":
                df[col] = pd.to_datetime(df[col], errors='coerce').dt.date
            elif field.type.upper() == "TIMESTAMP":
                df[col] = pd.to_datetime(df[col], errors='coerce')
        except Exception:
            pass  # Keep original if casting fails
        
        return df
    
    def _generate_gold_entity(self, entity: EntityDefinition) -> "pd.DataFrame":
        """
        Generate gold layer entity (business-ready).
        
        For aggregate entities, derives from silver.
        For dimension tables, generates clean data.
        """
        import pandas as pd
        
        if entity.layer_config and entity.layer_config.is_aggregate:
            return self._generate_aggregate_entity(entity)
        
        # Non-aggregate gold entity (dimensions, etc.)
        rows = []
        for i in range(entity.row_count):
            row = {}
            for field in entity.fields:
                row[field.name] = self._generate_field_value_python(field, entity, i)
            rows.append(row)
        
        return pd.DataFrame(rows)
    
    def _generate_aggregate_entity(self, entity: EntityDefinition) -> "pd.DataFrame":
        """Generate an aggregate/fact entity from silver sources."""
        import pandas as pd
        
        # For now, generate synthetic aggregate data
        # In a full implementation, this would aggregate from silver entities
        rows = []
        for i in range(entity.row_count):
            row = {}
            for field in entity.fields:
                if field.generator and field.generator.get("type") == "aggregate":
                    # Generate aggregate-appropriate values
                    func = field.generator.get("function", "SUM")
                    if func in ("SUM", "COUNT"):
                        row[field.name] = random.randint(100, 100000)
                    elif func == "AVG":
                        row[field.name] = round(random.uniform(10, 1000), 2)
                    else:
                        row[field.name] = random.randint(1, 10000)
                else:
                    row[field.name] = self._generate_field_value_python(field, entity, i)
            rows.append(row)
        
        return pd.DataFrame(rows)
    
    def _generate_entity_python(self, entity: EntityDefinition) -> "pd.DataFrame":
        """Generate a single entity's data using Python."""
        import pandas as pd
        
        rows = []
        for i in range(entity.row_count):
            row = {}
            for field in entity.fields:
                row[field.name] = self._generate_field_value_python(field, entity, i)
            rows.append(row)
        
        df = pd.DataFrame(rows)
        
        # Apply characteristics (anomalies, etc.)
        df = self._apply_characteristics_python(df, entity)
        
        return df
    
    def _generate_field_value_python(
        self,
        field: FieldDefinition,
        entity: EntityDefinition,
        row_index: int,
    ) -> Any:
        """Generate a single field value using Python/Faker."""
        
        # Check for nullable
        if field.nullable and random.random() < self.model.characteristics.missing_rate:
            if self.model.characteristics.missing_data:
                return None
        
        # Check for foreign key - reference existing data
        if field.foreign_key:
            ref_entity, ref_field = field.foreign_key.split(".")
            if ref_entity in self._generated_data:
                ref_df = self._generated_data[ref_entity]
                if len(ref_df) > 0:
                    return random.choice(ref_df[ref_field].tolist())
            return None
        
        # Check for custom generator hints
        if field.generator:
            return self._generate_from_hints(field.generator, field.type)
        
        # Check if industry generator has a custom generator for this field
        if self.industry:
            value = self.industry.generate_field(entity.name, field.name, field.type)
            if value is not None:
                return value
        
        # Default generation by type
        return self._generate_default_value(field, row_index)
    
    def _generate_from_hints(self, hints: dict, field_type: str) -> Any:
        """Generate value based on generator hints."""
        hint_type = hints.get("type", "default")
        
        if hint_type == "enum":
            values = hints.get("values", [])
            weights = hints.get("weights")
            if weights:
                return random.choices(values, weights=weights)[0]
            return random.choice(values) if values else None
        
        elif hint_type == "range":
            min_val = hints.get("min", 0)
            max_val = hints.get("max", 100)
            precision = hints.get("precision", 2)
            if field_type in ("NUMBER", "DECIMAL"):
                return round(random.uniform(min_val, max_val), precision)
            return random.randint(int(min_val), int(max_val))
        
        elif hint_type == "datetime":
            # Generate datetime within model's time range
            return self._generate_datetime_in_range()
        
        elif hint_type == "sequence":
            prefix = hints.get("prefix", "")
            padding = hints.get("padding", 8)
            # Note: row_index would need to be passed in for true sequences
            return f"{prefix}{random.randint(1, 10**padding):0{padding}d}"
        
        return None
    
    def _generate_default_value(self, field: FieldDefinition, row_index: int) -> Any:
        """Generate a default value based on field type."""
        if not self.fake:
            return self._generate_without_faker(field, row_index)
        
        field_type = field.type.upper()
        field_name = field.name.lower()
        
        # Primary key
        if field.primary_key:
            prefix = field_name.replace("_id", "").upper()[:3]
            return f"{prefix}-{row_index + 1:08d}"
        
        # Infer from field name
        if "email" in field_name:
            return self.fake.email()
        elif "name" in field_name and "first" in field_name:
            return self.fake.first_name()
        elif "name" in field_name and "last" in field_name:
            return self.fake.last_name()
        elif "name" in field_name:
            return self.fake.name()
        elif "phone" in field_name:
            return self.fake.phone_number()
        elif "address" in field_name:
            return self.fake.address().replace("\n", ", ")
        elif "city" in field_name:
            return self.fake.city()
        elif "state" in field_name:
            return self.fake.state_abbr()
        elif "zip" in field_name or "postal" in field_name:
            return self.fake.zipcode()
        elif "country" in field_name:
            return self.fake.country_code()
        elif "company" in field_name:
            return self.fake.company()
        elif "description" in field_name:
            return self.fake.sentence()
        elif "url" in field_name or "website" in field_name:
            return self.fake.url()
        
        # Fall back to type-based generation
        if field_type == "STRING":
            return self.fake.word()
        elif field_type in ("NUMBER", "INTEGER", "INT"):
            return random.randint(1, 10000)
        elif field_type in ("DECIMAL", "FLOAT", "DOUBLE"):
            return round(random.uniform(0, 10000), 2)
        elif field_type == "BOOLEAN":
            return random.choice([True, False])
        elif field_type == "DATE":
            return self.fake.date_between(start_date="-2y", end_date="today")
        elif field_type == "TIMESTAMP":
            return self.fake.date_time_between(start_date="-2y", end_date="now")
        elif field_type == "VARIANT":
            return {"key": self.fake.word(), "value": random.randint(1, 100)}
        
        return None
    
    def _generate_without_faker(self, field: FieldDefinition, row_index: int) -> Any:
        """Generate values without Faker (fallback)."""
        field_type = field.type.upper()
        
        if field.primary_key:
            return f"ID-{row_index + 1:08d}"
        
        if field_type == "STRING":
            return f"value_{random.randint(1, 1000)}"
        elif field_type in ("NUMBER", "INTEGER"):
            return random.randint(1, 10000)
        elif field_type in ("DECIMAL", "FLOAT"):
            return round(random.uniform(0, 10000), 2)
        elif field_type == "BOOLEAN":
            return random.choice([True, False])
        elif field_type == "DATE":
            days_ago = random.randint(0, 730)
            return (datetime.now() - timedelta(days=days_ago)).strftime("%Y-%m-%d")
        elif field_type == "TIMESTAMP":
            days_ago = random.randint(0, 730)
            return (datetime.now() - timedelta(days=days_ago)).strftime("%Y-%m-%d %H:%M:%S")
        
        return None
    
    def _generate_datetime_in_range(self) -> datetime:
        """Generate a datetime within the model's configured time range."""
        # Parse time range (simplified - assumes relative dates like "-1y")
        end_date = datetime.now()
        start_date = end_date - timedelta(days=365)  # Default to 1 year
        
        time_range = self.model.time_range
        if isinstance(time_range, dict):
            # Could parse "start": "-2y", "end": "today" etc.
            pass
        
        delta = end_date - start_date
        random_days = random.randint(0, delta.days)
        return start_date + timedelta(days=random_days)
    
    def _apply_characteristics_python(
        self,
        df: "pd.DataFrame",
        entity: EntityDefinition,
    ) -> "pd.DataFrame":
        """Apply data characteristics (anomalies, trends, etc.) to DataFrame."""
        chars = self.model.characteristics
        
        # Apply anomalies
        if chars.anomalies:
            df = self._inject_anomalies_python(df, chars.anomaly_rate)
        
        # Apply trends (for numeric columns)
        if chars.trends and chars.trend_direction != "flat":
            df = self._apply_trend_python(df, chars.trend_direction, chars.trend_strength)
        
        return df
    
    def _inject_anomalies_python(
        self,
        df: "pd.DataFrame",
        rate: float,
    ) -> "pd.DataFrame":
        """Inject anomalies into numeric columns."""
        import pandas as pd
        
        numeric_cols = df.select_dtypes(include=["number"]).columns
        
        for col in numeric_cols:
            mask = pd.Series([random.random() < rate for _ in range(len(df))])
            multiplier = pd.Series([random.uniform(3, 10) for _ in range(len(df))])
            df.loc[mask, col] = df.loc[mask, col] * multiplier[mask]
        
        return df
    
    def _apply_trend_python(
        self,
        df: "pd.DataFrame",
        direction: str,
        strength: float,
    ) -> "pd.DataFrame":
        """Apply trend to numeric columns (requires a date/time column for ordering)."""
        # Find date column
        date_cols = [c for c in df.columns if "date" in c.lower() or "time" in c.lower()]
        if not date_cols:
            return df
        
        # Sort by date and apply trend
        df = df.sort_values(date_cols[0])
        numeric_cols = df.select_dtypes(include=["number"]).columns
        
        n = len(df)
        for col in numeric_cols:
            if direction == "up":
                trend_factor = [1 + (i / n) * strength for i in range(n)]
            elif direction == "down":
                trend_factor = [1 - (i / n) * strength for i in range(n)]
            else:
                trend_factor = [1] * n
            
            df[col] = df[col] * trend_factor
        
        return df
    
    # =========================================================================
    # Snowflake SQL Generation
    # =========================================================================
    
    def generate_sql(self) -> dict[str, str]:
        """
        Generate Snowflake SQL statements for all entities.
        
        Returns dict of entity_name -> SQL string.
        For medallion architecture, generates DDL and data for each layer.
        """
        self._generated_sql = {}
        
        # Check if using medallion architecture
        layers_used = self.model.get_layers_used()
        
        if len(layers_used) > 1 or MedallionLayer.BRONZE in layers_used:
            return self.generate_sql_medallion()
        
        # Generate DDL first if requested
        if self.config.include_ddl:
            self._generated_sql["_ddl"] = self._generate_ddl_sql()
        
        # Generate data in dependency order
        for entity_name in self.model.get_generation_order():
            entity = self.model.get_entity(entity_name)
            if entity:
                sql = self._generate_entity_sql(entity)
                self._generated_sql[entity_name] = sql
        
        return self._generated_sql
    
    def generate_sql_medallion(self) -> dict[str, str]:
        """
        Generate SQL for medallion architecture.
        
        Creates schemas and tables for each layer, then generates data.
        """
        result = {}
        order_by_layer = self.model.get_generation_order_by_layer()
        
        # Generate DDL for all layers
        if self.config.include_ddl:
            result["_ddl"] = self._generate_medallion_ddl_sql()
        
        # Generate data for each layer in order
        for layer in [MedallionLayer.BRONZE, MedallionLayer.SILVER, MedallionLayer.GOLD]:
            if layer not in order_by_layer:
                continue
            
            schema = self.get_schema_for_layer(layer)
            
            for entity_name in order_by_layer[layer]:
                entity = self.model.get_entity(entity_name)
                if entity:
                    if layer == MedallionLayer.BRONZE:
                        sql = self._generate_bronze_entity_sql(entity)
                    elif layer == MedallionLayer.SILVER:
                        sql = self._generate_silver_entity_sql(entity)
                    else:
                        sql = self._generate_gold_entity_sql(entity)
                    
                    key = f"{schema}.{entity_name}"
                    result[key] = sql
        
        self._generated_sql = result
        return result
    
    def _generate_medallion_ddl_sql(self) -> str:
        """Generate DDL for medallion architecture (schemas + tables)."""
        lines = [
            f"-- Medallion Architecture DDL for {self.model.name}",
            f"-- Generated: {datetime.now().isoformat()}",
            f"-- Industry: {self.model.industry}",
            "",
            f"USE DATABASE {self.config.database};",
            "",
            "-- Create schemas for each layer",
            f"CREATE SCHEMA IF NOT EXISTS {self.config.bronze_schema};",
            f"CREATE SCHEMA IF NOT EXISTS {self.config.silver_schema};",
            f"CREATE SCHEMA IF NOT EXISTS {self.config.gold_schema};",
            "",
        ]
        
        # Group entities by layer
        for layer in [MedallionLayer.BRONZE, MedallionLayer.SILVER, MedallionLayer.GOLD]:
            entities = self.model.get_entities_by_layer(layer)
            if not entities:
                continue
            
            schema = self.get_schema_for_layer(layer)
            lines.append(f"-- {layer.value.upper()} LAYER")
            lines.append(f"USE SCHEMA {schema};")
            lines.append("")
            
            for entity in entities:
                lines.append(self._generate_create_table(entity, include_bronze_cols=(layer == MedallionLayer.BRONZE)))
                lines.append("")
        
        return "\n".join(lines)
    
    def _generate_bronze_entity_sql(self, entity: EntityDefinition) -> str:
        """Generate SQL for bronze entity with noise injection."""
        schema = self.get_schema_for_layer(MedallionLayer.BRONZE)
        null_pct = int((entity.layer_config.null_rate if entity.layer_config else 0.05) * 100)
        dupe_pct = int((entity.layer_config.duplicate_rate if entity.layer_config else 0.02) * 100)
        
        lines = [
            f"-- Bronze data generation for {entity.name}",
            f"-- Row count: {entity.row_count:,} (+ ~{dupe_pct}% duplicates)",
            f"-- NULL injection: {null_pct}%",
            "",
            f"USE SCHEMA {schema};",
            "",
        ]
        
        # Build SELECT expressions with bronze noise
        select_exprs = []
        for field in entity.fields:
            base_expr = self._generate_field_sql(field, entity)
            
            # Apply NULL injection for nullable fields
            if field.nullable and null_pct > 0:
                expr = f"""CASE WHEN UNIFORM(0, 100, RANDOM()) < {null_pct} THEN NULL ELSE {base_expr} END"""
            else:
                expr = base_expr
            
            # Apply format variations for timestamps
            if field.type.upper() == "TIMESTAMP" and entity.layer_config and entity.layer_config.raw_timestamps:
                expr = self._sql_timestamp_variation(expr)
            
            select_exprs.append(f"    {expr} AS {field.name}")
        
        # Add bronze metadata columns
        source_systems = ", ".join(f"'{s}'" for s in self.bronze_gen.config.source_systems[:3])
        select_exprs.append(f"    ARRAY_CONSTRUCT({source_systems})[MOD(SEQ4(), 3)]::STRING AS _source_system")
        select_exprs.append("    CURRENT_TIMESTAMP() AS _load_timestamp")
        
        # Build the insert with optional duplicates
        base_query = f"""SELECT
{chr(10).join(select_exprs)}
FROM TABLE(GENERATOR(ROWCOUNT => {entity.row_count}))"""
        
        if dupe_pct > 0:
            # Add duplicates using UNION ALL
            lines.append(f"INSERT INTO {entity.name}")
            lines.append(f"WITH base AS (")
            lines.append(base_query)
            lines.append(f"),")
            lines.append(f"duplicates AS (")
            lines.append(f"    SELECT * FROM base WHERE UNIFORM(0, 100, RANDOM()) < {dupe_pct}")
            lines.append(f")")
            lines.append(f"SELECT * FROM base")
            lines.append(f"UNION ALL")
            lines.append(f"SELECT * FROM duplicates;")
        else:
            lines.append(f"INSERT INTO {entity.name}")
            lines.append(base_query + ";")
        
        return "\n".join(lines)
    
    def _sql_timestamp_variation(self, base_expr: str) -> str:
        """SQL expression for varied timestamp formats."""
        return f"""CASE MOD(SEQ4(), 5)
            WHEN 0 THEN TO_VARCHAR({base_expr}, 'YYYY-MM-DD"T"HH24:MI:SS.FF3"Z"')
            WHEN 1 THEN TO_VARCHAR({base_expr}, 'MM/DD/YYYY HH12:MI:SS AM')
            WHEN 2 THEN TO_VARCHAR(DATE_PART(EPOCH_SECOND, {base_expr}))
            WHEN 3 THEN TO_VARCHAR({base_expr}, 'DD/MM/YYYY HH24:MI:SS')
            ELSE TO_VARCHAR({base_expr}, 'YYYY-MM-DD HH24:MI:SS')
        END"""
    
    def _generate_silver_entity_sql(self, entity: EntityDefinition) -> str:
        """Generate SQL for silver entity (cleansed from bronze or fresh)."""
        schema = self.get_schema_for_layer(MedallionLayer.SILVER)
        bronze_schema = self.get_schema_for_layer(MedallionLayer.BRONZE)
        
        lines = [
            f"-- Silver data generation for {entity.name}",
            f"-- Row count: {entity.row_count:,}",
            "",
            f"USE SCHEMA {schema};",
            "",
        ]
        
        # Check if we should derive from bronze
        source_entity = None
        if entity.layer_config:
            source_entity = getattr(entity.layer_config, 'source_entity', None) if hasattr(entity.layer_config, 'source_entity') else None
        
        # Look for matching bronze entity
        bronze_source = None
        for bronze_entity in self.model.get_bronze_entities():
            # Check if bronze entity name matches (e.g., raw_customers -> customers)
            if bronze_entity.name.replace("raw_", "") == entity.name:
                bronze_source = bronze_entity.name
                break
        
        if bronze_source:
            # Derive from bronze with cleansing
            lines.append(f"INSERT INTO {entity.name}")
            lines.append(f"SELECT DISTINCT")  # Deduplicate
            
            select_exprs = []
            for field in entity.fields:
                # Cast and clean each field
                bronze_col = field.name
                if field.type.upper() == "TIMESTAMP":
                    expr = f"TRY_TO_TIMESTAMP({bronze_col})"
                elif field.type.upper() == "DATE":
                    expr = f"TRY_TO_DATE({bronze_col})"
                elif field.type.upper() in ("NUMBER", "INTEGER", "INT"):
                    expr = f"TRY_TO_NUMBER({bronze_col})"
                elif field.type.upper() in ("DECIMAL", "FLOAT"):
                    expr = f"TRY_TO_DOUBLE({bronze_col})"
                elif field.type.upper() == "BOOLEAN":
                    expr = f"TRY_TO_BOOLEAN({bronze_col})"
                else:
                    expr = f"NULLIF(TRIM({bronze_col}), '')"  # Standardize nulls
                
                select_exprs.append(f"    {expr} AS {field.name}")
            
            lines.append(",\n".join(select_exprs))
            lines.append(f"FROM {bronze_schema}.{bronze_source}")
            
            # Add dedup logic using primary key
            pk = entity.get_primary_key()
            if pk:
                lines.append(f"QUALIFY ROW_NUMBER() OVER (PARTITION BY {pk.name} ORDER BY _load_timestamp DESC) = 1;")
            else:
                lines.append(";")
        else:
            # Generate fresh clean data
            lines.append(f"INSERT INTO {entity.name}")
            lines.append("SELECT")
            
            select_exprs = []
            for field in entity.fields:
                expr = self._generate_field_sql(field, entity)
                select_exprs.append(f"    {expr} AS {field.name}")
            
            lines.append(",\n".join(select_exprs))
            lines.append(f"FROM TABLE(GENERATOR(ROWCOUNT => {entity.row_count}));")
        
        return "\n".join(lines)
    
    def _generate_gold_entity_sql(self, entity: EntityDefinition) -> str:
        """Generate SQL for gold entity (facts, dimensions, aggregates)."""
        schema = self.get_schema_for_layer(MedallionLayer.GOLD)
        silver_schema = self.get_schema_for_layer(MedallionLayer.SILVER)
        
        lines = [
            f"-- Gold data generation for {entity.name}",
            f"-- Row count: {entity.row_count:,}",
            "",
            f"USE SCHEMA {schema};",
            "",
        ]
        
        # Check if this is an aggregate entity
        if entity.layer_config and entity.layer_config.is_aggregate:
            return self._generate_aggregate_entity_sql(entity)
        
        # Standard dimension/fact generation
        lines.append(f"INSERT INTO {entity.name}")
        lines.append("SELECT")
        
        select_exprs = []
        for field in entity.fields:
            if field.generator and field.generator.get("type") == "sequence":
                expr = f"SEQ4()"
            else:
                expr = self._generate_field_sql(field, entity)
            select_exprs.append(f"    {expr} AS {field.name}")
        
        lines.append(",\n".join(select_exprs))
        lines.append(f"FROM TABLE(GENERATOR(ROWCOUNT => {entity.row_count}));")
        
        return "\n".join(lines)
    
    def _generate_aggregate_entity_sql(self, entity: EntityDefinition) -> str:
        """Generate SQL for aggregate entity (derives from silver)."""
        schema = self.get_schema_for_layer(MedallionLayer.GOLD)
        silver_schema = self.get_schema_for_layer(MedallionLayer.SILVER)
        
        lines = [
            f"-- Aggregate data generation for {entity.name}",
            "",
            f"USE SCHEMA {schema};",
            "",
        ]
        
        # For now, generate synthetic aggregate data
        # In a full implementation, this would aggregate from silver
        lines.append(f"INSERT INTO {entity.name}")
        lines.append("SELECT")
        
        select_exprs = []
        for field in entity.fields:
            if field.generator and field.generator.get("type") == "aggregate":
                func = field.generator.get("function", "SUM")
                if func == "SUM":
                    expr = "UNIFORM(1000, 1000000, RANDOM())"
                elif func == "COUNT":
                    expr = "UNIFORM(1, 10000, RANDOM())"
                elif func == "AVG":
                    expr = "ROUND(UNIFORM(10::FLOAT, 1000::FLOAT, RANDOM()), 2)"
                else:
                    expr = "UNIFORM(1, 10000, RANDOM())"
            else:
                expr = self._generate_field_sql(field, entity)
            select_exprs.append(f"    {expr} AS {field.name}")
        
        lines.append(",\n".join(select_exprs))
        lines.append(f"FROM TABLE(GENERATOR(ROWCOUNT => {entity.row_count}));")
        
        return "\n".join(lines)
    
    def _generate_ddl_sql(self) -> str:
        """Generate CREATE TABLE statements."""
        lines = [
            f"-- DDL for {self.model.name}",
            f"-- Generated: {datetime.now().isoformat()}",
            f"-- Industry: {self.model.industry}",
            "",
            f"USE DATABASE {self.config.database};",
            f"USE SCHEMA {self.config.schema};",
            "",
        ]
        
        for entity in self.model.entities:
            lines.append(self._generate_create_table(entity))
            lines.append("")
        
        return "\n".join(lines)
    
    def _generate_create_table(self, entity: EntityDefinition) -> str:
        """Generate CREATE TABLE statement for an entity."""
        type_mapping = {
            "STRING": "VARCHAR",
            "NUMBER": "NUMBER",
            "INTEGER": "INTEGER",
            "INT": "INTEGER",
            "DECIMAL": "DECIMAL(18,2)",
            "FLOAT": "FLOAT",
            "DOUBLE": "DOUBLE",
            "BOOLEAN": "BOOLEAN",
            "DATE": "DATE",
            "TIMESTAMP": "TIMESTAMP_NTZ",
            "VARIANT": "VARIANT",
        }
        
        lines = [f"CREATE OR REPLACE TABLE {entity.name} ("]
        
        field_defs = []
        for field in entity.fields:
            sf_type = type_mapping.get(field.type.upper(), "VARCHAR")
            nullable = "" if field.nullable else " NOT NULL"
            field_defs.append(f"    {field.name} {sf_type}{nullable}")
        
        lines.append(",\n".join(field_defs))
        lines.append(");")
        
        return "\n".join(lines)
    
    def _generate_entity_sql(self, entity: EntityDefinition) -> str:
        """Generate INSERT SQL using Snowflake GENERATOR."""
        lines = [
            f"-- Data generation for {entity.name}",
            f"-- Row count: {entity.row_count:,}",
            "",
        ]
        
        # Build SELECT expressions for each field
        select_exprs = []
        for field in entity.fields:
            expr = self._generate_field_sql(field, entity)
            select_exprs.append(f"    {expr} AS {field.name}")
        
        lines.append(f"INSERT INTO {entity.name}")
        lines.append("SELECT")
        lines.append(",\n".join(select_exprs))
        lines.append(f"FROM TABLE(GENERATOR(ROWCOUNT => {entity.row_count}));")
        
        return "\n".join(lines)
    
    def _generate_field_sql(self, field: FieldDefinition, entity: EntityDefinition) -> str:
        """Generate SQL expression for a field value."""
        
        # Foreign key - reference existing table
        if field.foreign_key:
            ref_entity, ref_field = field.foreign_key.split(".")
            return f"""(SELECT {ref_field} FROM {ref_entity} ORDER BY RANDOM() LIMIT 1)"""
        
        # Check for generator hints
        if field.generator:
            return self._generate_field_sql_from_hints(field)
        
        # Check if industry generator has SQL for this field
        if self.industry:
            sql = self.industry.generate_field_sql(entity.name, field.name, field.type)
            if sql:
                return sql
        
        # Default SQL generation
        return self._generate_default_field_sql(field)
    
    def _generate_field_sql_from_hints(self, field: FieldDefinition) -> str:
        """Generate SQL expression from generator hints."""
        hints = field.generator
        hint_type = hints.get("type", "default")
        
        if hint_type == "enum":
            values = hints.get("values", ["value1", "value2"])
            values_sql = ", ".join([f"'{v}'" for v in values])
            return f"ARRAY_CONSTRUCT({values_sql})[UNIFORM(0, {len(values)-1}, RANDOM())]"
        
        elif hint_type == "range":
            min_val = hints.get("min", 0)
            max_val = hints.get("max", 100)
            precision = hints.get("precision", 2)
            return f"ROUND(UNIFORM({min_val}::FLOAT, {max_val}::FLOAT, RANDOM()), {precision})"
        
        elif hint_type == "datetime":
            days_back = hints.get("days_back", 730)
            return f"DATEADD('day', -UNIFORM(0, {days_back}, RANDOM()), CURRENT_DATE())"
        
        elif hint_type == "sequence":
            prefix = hints.get("prefix", "")
            padding = hints.get("padding", 8)
            return f"'{prefix}' || LPAD(SEQ4()::STRING, {padding}, '0')"
        
        return "NULL"
    
    def _generate_default_field_sql(self, field: FieldDefinition) -> str:
        """Generate default SQL expression based on field type and name."""
        field_type = field.type.upper()
        field_name = field.name.lower()
        
        # Primary key
        if field.primary_key:
            prefix = field_name.replace("_id", "").upper()[:3]
            return f"'{prefix}-' || LPAD(SEQ4()::STRING, 8, '0')"
        
        # Generate by type
        if field_type == "STRING":
            if "email" in field_name:
                return "'user_' || SEQ4()::STRING || '@example.com'"
            elif "name" in field_name:
                return self._get_random_name_sql()
            else:
                return f"'value_' || UNIFORM(1, 10000, RANDOM())::STRING"
        
        elif field_type in ("NUMBER", "INTEGER", "INT"):
            return "UNIFORM(1, 10000, RANDOM())"
        
        elif field_type in ("DECIMAL", "FLOAT", "DOUBLE"):
            return "ROUND(UNIFORM(0::FLOAT, 10000::FLOAT, RANDOM()), 2)"
        
        elif field_type == "BOOLEAN":
            return "UNIFORM(0, 1, RANDOM()) = 1"
        
        elif field_type == "DATE":
            return "DATEADD('day', -UNIFORM(0, 730, RANDOM()), CURRENT_DATE())"
        
        elif field_type == "TIMESTAMP":
            return "DATEADD('second', -UNIFORM(0, 63072000, RANDOM()), CURRENT_TIMESTAMP())"
        
        elif field_type == "VARIANT":
            return "OBJECT_CONSTRUCT('key', 'value_' || UNIFORM(1, 100, RANDOM())::STRING)"
        
        return "NULL"
    
    def _get_random_name_sql(self) -> str:
        """Generate SQL for random name selection."""
        first_names = ["James", "Mary", "John", "Patricia", "Robert", "Jennifer", 
                       "Michael", "Linda", "William", "Elizabeth", "David", "Barbara",
                       "Richard", "Susan", "Joseph", "Jessica", "Thomas", "Sarah"]
        last_names = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia",
                      "Miller", "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez",
                      "Gonzalez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore"]
        
        first_sql = ", ".join([f"'{n}'" for n in first_names])
        last_sql = ", ".join([f"'{n}'" for n in last_names])
        
        return f"""ARRAY_CONSTRUCT({first_sql})[UNIFORM(0, {len(first_names)-1}, RANDOM())] || ' ' || ARRAY_CONSTRUCT({last_sql})[UNIFORM(0, {len(last_names)-1}, RANDOM())]"""
    
    # =========================================================================
    # Combined SQL Output
    # =========================================================================
    
    def get_full_sql(self) -> str:
        """Get complete SQL script (DDL + all inserts)."""
        if not self._generated_sql:
            self.generate_sql()
        
        parts = []
        
        # DDL first
        if "_ddl" in self._generated_sql:
            parts.append(self._generated_sql["_ddl"])
        
        # Then data in order
        for entity_name in self.model.get_generation_order():
            if entity_name in self._generated_sql:
                parts.append(self._generated_sql[entity_name])
        
        return "\n\n".join(parts)


class IndustryGenerator:
    """
    Base class for industry-specific generators.
    
    Subclass this to provide industry-specific field values.
    """
    
    def __init__(self, fake: Optional["Faker"] = None):
        self.fake = fake
    
    def generate_field(
        self,
        entity_name: str,
        field_name: str,
        field_type: str,
    ) -> Any:
        """
        Generate a field value for Python generation.
        
        Return None to use default generation.
        """
        return None
    
    def generate_field_sql(
        self,
        entity_name: str,
        field_name: str,
        field_type: str,
    ) -> Optional[str]:
        """
        Generate SQL expression for a field.
        
        Return None to use default SQL generation.
        """
        return None
