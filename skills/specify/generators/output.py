"""
Output handlers for generated data.

Supports multiple output formats:
- SQL INSERT statements
- Parquet files (for Snowflake staging)
- CSV files (for debugging/inspection)
- Direct Snowflake execution

Medallion Architecture Support:
- Schema-prefixed table keys (e.g., BRONZE.raw_customers, SILVER.customers)
- Multi-schema DDL generation (BRONZE, SILVER, GOLD)
- Layer-organized output directories
"""

from datetime import datetime, date
from pathlib import Path
from typing import Any, Optional, TYPE_CHECKING
from dataclasses import dataclass
import json

if TYPE_CHECKING:
    import pandas as pd


@dataclass
class MedallionConfig:
    """Configuration for medallion architecture output."""
    enabled: bool = True
    bronze_schema: str = "BRONZE"
    silver_schema: str = "SILVER"
    gold_schema: str = "GOLD"
    create_schemas: bool = True  # Generate CREATE SCHEMA statements


class OutputHandler:
    """
    Handles output of generated data to various formats.
    
    Usage:
        handler = OutputHandler(generated_data, config)
        handler.to_sql("output.sql")
        handler.to_parquet("output/")
        handler.to_csv("output/")
        handler.execute(connection="my_connection")
    """
    
    def __init__(
        self,
        data: dict[str, Any],
        database: str = "DEMO_DB",
        schema: str = "PUBLIC",
        medallion: Optional[MedallionConfig] = None,
    ):
        """
        Initialize output handler.
        
        Args:
            data: Dict of entity_name -> DataFrame (Python) or SQL string (Snowflake)
                  For medallion architecture, keys can be schema-prefixed:
                  e.g., "BRONZE.raw_customers", "SILVER.customers", "GOLD.daily_sales"
            database: Target database name
            schema: Target schema name (default for non-medallion tables)
            medallion: Optional medallion architecture configuration
        """
        self.data = data
        self.database = database
        self.schema = schema
        self.medallion = medallion or MedallionConfig(enabled=False)
        
        # Detect medallion mode from data keys if not explicitly configured
        if not self.medallion.enabled:
            self._auto_detect_medallion()
    
    def _auto_detect_medallion(self) -> None:
        """Auto-detect medallion architecture from data keys."""
        medallion_prefixes = {"BRONZE", "SILVER", "GOLD"}
        for key in self.data.keys():
            if key.startswith("_"):
                continue
            if "." in key:
                prefix = key.split(".")[0].upper()
                if prefix in medallion_prefixes:
                    self.medallion.enabled = True
                    return
    
    def _parse_table_key(self, key: str) -> tuple[str, str]:
        """
        Parse a table key into (schema, table_name).
        
        Args:
            key: Table key, optionally schema-prefixed (e.g., "BRONZE.raw_customers")
            
        Returns:
            Tuple of (schema, table_name)
        """
        if "." in key:
            parts = key.split(".", 1)
            return (parts[0].upper(), parts[1])
        return (self.schema, key)
    
    def _get_layers(self) -> dict[str, list[str]]:
        """
        Group data keys by medallion layer.
        
        Returns:
            Dict mapping layer name to list of table keys
        """
        layers = {
            "BRONZE": [],
            "SILVER": [],
            "GOLD": [],
            "OTHER": [],  # Non-medallion tables
        }
        
        for key in self.data.keys():
            if key.startswith("_"):
                continue
            schema, _ = self._parse_table_key(key)
            if schema in layers:
                layers[schema].append(key)
            else:
                layers["OTHER"].append(key)
        
        return layers
    
    def _get_medallion_schemas(self) -> list[str]:
        """Get list of medallion schemas in use."""
        schemas = []
        layers = self._get_layers()
        if layers["BRONZE"]:
            schemas.append(self.medallion.bronze_schema)
        if layers["SILVER"]:
            schemas.append(self.medallion.silver_schema)
        if layers["GOLD"]:
            schemas.append(self.medallion.gold_schema)
        return schemas
    
    # =========================================================================
    # SQL Output
    # =========================================================================
    
    def to_sql(
        self,
        output_path: str | Path,
        include_ddl: bool = True,
        batch_size: int = 1000,
    ) -> Path:
        """
        Write data as SQL INSERT statements.
        
        For medallion architecture, generates:
        - CREATE SCHEMA statements for BRONZE, SILVER, GOLD
        - Tables organized by layer with proper schema prefixes
        
        Args:
            output_path: Path to output SQL file
            include_ddl: Include CREATE TABLE statements
            batch_size: Number of rows per INSERT statement
            
        Returns:
            Path to written file
        """
        output_path = Path(output_path)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        
        lines = [
            f"-- Generated Data Load Script",
            f"-- Created: {datetime.now().isoformat()}",
            f"-- Database: {self.database}",
        ]
        
        if self.medallion.enabled:
            lines.append(f"-- Architecture: Medallion (Bronze → Silver → Gold)")
            lines.append("")
            lines.append(f"USE DATABASE {self.database};")
            lines.append("")
            
            # Generate schema creation for medallion layers
            if self.medallion.create_schemas:
                lines.extend(self._generate_medallion_schema_ddl())
            
            # Handle _ddl metadata if present
            if "_ddl" in self.data and include_ddl:
                lines.append(self.data["_ddl"])
                lines.append("")
            
            # Output data organized by layer
            lines.extend(self._generate_medallion_sql(batch_size))
        else:
            # Non-medallion output (original behavior)
            lines.append(f"-- Schema: {self.schema}")
            lines.append("")
            lines.append(f"USE DATABASE {self.database};")
            lines.append(f"USE SCHEMA {self.schema};")
            lines.append("")
            
            for entity_name, entity_data in self.data.items():
                if entity_name.startswith("_"):
                    if entity_name == "_ddl" and include_ddl:
                        lines.append(entity_data)
                        lines.append("")
                    continue
                
                if isinstance(entity_data, str):
                    lines.append(entity_data)
                    lines.append("")
                else:
                    lines.append(f"-- Data for {entity_name}")
                    lines.extend(self._dataframe_to_inserts(entity_name, entity_data, batch_size))
                    lines.append("")
        
        with open(output_path, "w") as f:
            f.write("\n".join(lines))
        
        return output_path
    
    def _generate_medallion_schema_ddl(self) -> list[str]:
        """Generate CREATE SCHEMA statements for medallion layers."""
        lines = [
            "-- ==========================================================================",
            "-- MEDALLION SCHEMA SETUP",
            "-- ==========================================================================",
            "",
        ]
        
        schemas = self._get_medallion_schemas()
        for schema in schemas:
            lines.append(f"CREATE SCHEMA IF NOT EXISTS {schema};")
        
        lines.append("")
        return lines
    
    def _generate_medallion_sql(self, batch_size: int) -> list[str]:
        """Generate SQL organized by medallion layer."""
        lines = []
        layers = self._get_layers()
        
        layer_order = [
            ("BRONZE", self.medallion.bronze_schema, "Raw data with noise/duplicates"),
            ("SILVER", self.medallion.silver_schema, "Cleansed and standardized data"),
            ("GOLD", self.medallion.gold_schema, "Business-ready aggregates"),
        ]
        
        for layer_key, schema_name, description in layer_order:
            table_keys = layers.get(layer_key, [])
            if not table_keys:
                continue
            
            lines.extend([
                f"-- ==========================================================================",
                f"-- {layer_key} LAYER: {description}",
                f"-- ==========================================================================",
                "",
                f"USE SCHEMA {schema_name};",
                "",
            ])
            
            for key in table_keys:
                _, table_name = self._parse_table_key(key)
                entity_data = self.data[key]
                
                if isinstance(entity_data, str):
                    lines.append(entity_data)
                    lines.append("")
                else:
                    lines.append(f"-- Data for {table_name}")
                    # Use schema.table format for clarity
                    full_table = f"{schema_name}.{table_name}"
                    lines.extend(self._dataframe_to_inserts(full_table, entity_data, batch_size))
                    lines.append("")
        
        # Handle non-medallion tables (OTHER)
        other_tables = layers.get("OTHER", [])
        if other_tables:
            lines.extend([
                f"-- ==========================================================================",
                f"-- OTHER TABLES (non-medallion)",
                f"-- ==========================================================================",
                "",
                f"USE SCHEMA {self.schema};",
                "",
            ])
            
            for key in other_tables:
                entity_data = self.data[key]
                if isinstance(entity_data, str):
                    lines.append(entity_data)
                    lines.append("")
                else:
                    lines.append(f"-- Data for {key}")
                    lines.extend(self._dataframe_to_inserts(key, entity_data, batch_size))
                    lines.append("")
        
        return lines
    
    def _dataframe_to_inserts(
        self,
        table_name: str,
        df: "pd.DataFrame",
        batch_size: int = 1000,
    ) -> list[str]:
        """Convert DataFrame to INSERT statements."""
        if len(df) == 0:
            return [f"-- No data for {table_name}"]
        
        columns = df.columns.tolist()
        columns_sql = ", ".join(columns)
        
        lines = []
        
        # Process in batches
        for i in range(0, len(df), batch_size):
            batch = df.iloc[i:i + batch_size]
            
            values_list = []
            for _, row in batch.iterrows():
                values = []
                for col in columns:
                    values.append(self._format_sql_value(row[col]))
                values_list.append(f"({', '.join(values)})")
            
            insert_sql = f"INSERT INTO {table_name} ({columns_sql}) VALUES\n"
            insert_sql += ",\n".join(values_list) + ";"
            lines.append(insert_sql)
        
        return lines
    
    def _format_sql_value(self, value: Any) -> str:
        """Format a Python value for SQL."""
        if value is None:
            return "NULL"
        elif isinstance(value, bool):
            return "TRUE" if value else "FALSE"
        elif isinstance(value, (int, float)):
            return str(value)
        elif isinstance(value, (datetime, date)):
            return f"'{value.isoformat()}'"
        elif isinstance(value, dict):
            return f"PARSE_JSON('{json.dumps(value)}')"
        elif isinstance(value, list):
            return f"PARSE_JSON('{json.dumps(value)}')"
        else:
            # Escape single quotes
            escaped = str(value).replace("'", "''")
            return f"'{escaped}'"
    
    # =========================================================================
    # Parquet Output
    # =========================================================================
    
    def to_parquet(
        self,
        output_dir: str | Path,
        compression: str = "snappy",
        organize_by_layer: bool = True,
    ) -> list[Path]:
        """
        Write data as Parquet files (one per entity).
        
        For medallion architecture with organize_by_layer=True:
        - output_dir/bronze/table.parquet
        - output_dir/silver/table.parquet
        - output_dir/gold/table.parquet
        
        Args:
            output_dir: Directory for output files
            compression: Parquet compression (snappy, gzip, none)
            organize_by_layer: If True and medallion enabled, create subdirs per layer
            
        Returns:
            List of paths to written files
        """
        try:
            import pyarrow as pa
            import pyarrow.parquet as pq
        except ImportError:
            raise ImportError("pyarrow is required for Parquet output. Install with: pip install pyarrow")
        
        output_dir = Path(output_dir)
        output_dir.mkdir(parents=True, exist_ok=True)
        
        written_files = []
        
        if self.medallion.enabled and organize_by_layer:
            # Medallion: organize by layer subdirectories
            layers = self._get_layers()
            
            for layer_key in ["BRONZE", "SILVER", "GOLD", "OTHER"]:
                table_keys = layers.get(layer_key, [])
                if not table_keys:
                    continue
                
                # Create layer subdirectory
                layer_dir = output_dir / layer_key.lower()
                layer_dir.mkdir(parents=True, exist_ok=True)
                
                for key in table_keys:
                    entity_data = self.data[key]
                    if isinstance(entity_data, str):
                        continue
                    
                    _, table_name = self._parse_table_key(key)
                    output_path = layer_dir / f"{table_name}.parquet"
                    table = pa.Table.from_pandas(entity_data)
                    pq.write_table(table, output_path, compression=compression)
                    written_files.append(output_path)
        else:
            # Non-medallion: flat directory
            for entity_name, entity_data in self.data.items():
                if entity_name.startswith("_"):
                    continue
                
                if isinstance(entity_data, str):
                    continue
                
                # Handle schema prefix in filename
                _, table_name = self._parse_table_key(entity_name)
                output_path = output_dir / f"{table_name}.parquet"
                table = pa.Table.from_pandas(entity_data)
                pq.write_table(table, output_path, compression=compression)
                written_files.append(output_path)
        
        # Write metadata file
        metadata = self._build_output_metadata(written_files)
        metadata_path = output_dir / "_metadata.json"
        with open(metadata_path, "w") as f:
            json.dump(metadata, f, indent=2)
        
        return written_files
    
    def _build_output_metadata(self, written_files: list[Path]) -> dict:
        """Build metadata dict for file outputs."""
        metadata = {
            "generated": datetime.now().isoformat(),
            "database": self.database,
            "medallion_enabled": self.medallion.enabled,
        }
        
        if self.medallion.enabled:
            layers = self._get_layers()
            metadata["layers"] = {
                "bronze": {"schema": self.medallion.bronze_schema, "tables": len(layers.get("BRONZE", []))},
                "silver": {"schema": self.medallion.silver_schema, "tables": len(layers.get("SILVER", []))},
                "gold": {"schema": self.medallion.gold_schema, "tables": len(layers.get("GOLD", []))},
            }
        else:
            metadata["schema"] = self.schema
        
        metadata["files"] = [str(f.relative_to(f.parent.parent) if self.medallion.enabled else f.name) for f in written_files]
        metadata["row_counts"] = {
            name: len(data) for name, data in self.data.items()
            if not name.startswith("_") and not isinstance(data, str)
        }
        
        return metadata
    
    # =========================================================================
    # CSV Output
    # =========================================================================
    
    def to_csv(
        self,
        output_dir: str | Path,
        include_header: bool = True,
        organize_by_layer: bool = True,
    ) -> list[Path]:
        """
        Write data as CSV files (one per entity).
        
        For medallion architecture with organize_by_layer=True:
        - output_dir/bronze/table.csv
        - output_dir/silver/table.csv
        - output_dir/gold/table.csv
        
        Args:
            output_dir: Directory for output files
            include_header: Include column headers
            organize_by_layer: If True and medallion enabled, create subdirs per layer
            
        Returns:
            List of paths to written files
        """
        output_dir = Path(output_dir)
        output_dir.mkdir(parents=True, exist_ok=True)
        
        written_files = []
        
        if self.medallion.enabled and organize_by_layer:
            # Medallion: organize by layer subdirectories
            layers = self._get_layers()
            
            for layer_key in ["BRONZE", "SILVER", "GOLD", "OTHER"]:
                table_keys = layers.get(layer_key, [])
                if not table_keys:
                    continue
                
                # Create layer subdirectory
                layer_dir = output_dir / layer_key.lower()
                layer_dir.mkdir(parents=True, exist_ok=True)
                
                for key in table_keys:
                    entity_data = self.data[key]
                    if isinstance(entity_data, str):
                        continue
                    
                    _, table_name = self._parse_table_key(key)
                    output_path = layer_dir / f"{table_name}.csv"
                    entity_data.to_csv(output_path, index=False, header=include_header)
                    written_files.append(output_path)
        else:
            # Non-medallion: flat directory
            for entity_name, entity_data in self.data.items():
                if entity_name.startswith("_"):
                    continue
                
                if isinstance(entity_data, str):
                    continue
                
                # Handle schema prefix in filename
                _, table_name = self._parse_table_key(entity_name)
                output_path = output_dir / f"{table_name}.csv"
                entity_data.to_csv(output_path, index=False, header=include_header)
                written_files.append(output_path)
        
        return written_files
    
    # =========================================================================
    # Snowflake Execution
    # =========================================================================
    
    def execute(
        self,
        connection: Optional[str] = None,
        use_staging: bool = True,
    ) -> dict[str, int]:
        """
        Execute SQL directly in Snowflake.
        
        For medallion architecture:
        - Creates BRONZE, SILVER, GOLD schemas if needed
        - Executes data loads layer by layer
        
        Args:
            connection: Snowflake connection name (from connections.toml)
            use_staging: If True, stage Parquet files and COPY INTO.
                        If False, execute INSERT statements directly.
                        
        Returns:
            Dict of entity_name -> rows loaded
        """
        try:
            import snowflake.connector
        except ImportError:
            raise ImportError(
                "snowflake-connector-python is required for direct execution. "
                "Install with: pip install snowflake-connector-python"
            )
        
        # Connect to Snowflake
        conn = snowflake.connector.connect(connection_name=connection)
        cursor = conn.cursor()
        
        try:
            cursor.execute(f"USE DATABASE {self.database}")
            
            results = {}
            
            if self.medallion.enabled:
                # Create medallion schemas
                if self.medallion.create_schemas:
                    for schema in self._get_medallion_schemas():
                        cursor.execute(f"CREATE SCHEMA IF NOT EXISTS {schema}")
                
                # Execute _ddl if present
                if "_ddl" in self.data:
                    for statement in self.data["_ddl"].split(";"):
                        statement = statement.strip()
                        if statement:
                            cursor.execute(statement)
                
                # Process by layer
                layers = self._get_layers()
                layer_schema_map = {
                    "BRONZE": self.medallion.bronze_schema,
                    "SILVER": self.medallion.silver_schema,
                    "GOLD": self.medallion.gold_schema,
                    "OTHER": self.schema,
                }
                
                for layer_key in ["BRONZE", "SILVER", "GOLD", "OTHER"]:
                    table_keys = layers.get(layer_key, [])
                    if not table_keys:
                        continue
                    
                    schema_name = layer_schema_map[layer_key]
                    cursor.execute(f"USE SCHEMA {schema_name}")
                    
                    for key in table_keys:
                        entity_data = self.data[key]
                        _, table_name = self._parse_table_key(key)
                        
                        if isinstance(entity_data, str):
                            cursor.execute(entity_data)
                            results[key] = cursor.rowcount
                        else:
                            if use_staging:
                                rows = self._load_via_staging(cursor, table_name, entity_data)
                            else:
                                rows = self._load_via_inserts(cursor, table_name, entity_data)
                            results[key] = rows
            else:
                # Non-medallion execution (original behavior)
                cursor.execute(f"USE SCHEMA {self.schema}")
                
                for entity_name, entity_data in self.data.items():
                    if entity_name.startswith("_"):
                        if entity_name == "_ddl":
                            for statement in entity_data.split(";"):
                                statement = statement.strip()
                                if statement:
                                    cursor.execute(statement)
                        continue
                    
                    if isinstance(entity_data, str):
                        cursor.execute(entity_data)
                        results[entity_name] = cursor.rowcount
                    else:
                        if use_staging:
                            rows = self._load_via_staging(cursor, entity_name, entity_data)
                        else:
                            rows = self._load_via_inserts(cursor, entity_name, entity_data)
                        results[entity_name] = rows
            
            return results
            
        finally:
            cursor.close()
            conn.close()
    
    def _load_via_staging(
        self,
        cursor: Any,
        table_name: str,
        df: "pd.DataFrame",
    ) -> int:
        """Load data via Snowflake staging (Parquet → Stage → COPY INTO)."""
        import tempfile
        import pyarrow as pa
        import pyarrow.parquet as pq
        
        # Write to temp Parquet file
        with tempfile.NamedTemporaryFile(suffix=".parquet", delete=False) as tmp:
            table = pa.Table.from_pandas(df)
            pq.write_table(table, tmp.name)
            tmp_path = tmp.name
        
        try:
            # Create temporary stage
            stage_name = f"temp_stage_{table_name}_{int(datetime.now().timestamp())}"
            cursor.execute(f"CREATE TEMPORARY STAGE {stage_name}")
            
            # PUT file to stage
            cursor.execute(f"PUT file://{tmp_path} @{stage_name}")
            
            # COPY INTO table
            cursor.execute(f"""
                COPY INTO {table_name}
                FROM @{stage_name}
                FILE_FORMAT = (TYPE = 'PARQUET')
                MATCH_BY_COLUMN_NAME = CASE_INSENSITIVE
            """)
            
            return cursor.rowcount
            
        finally:
            # Cleanup temp file
            Path(tmp_path).unlink(missing_ok=True)
    
    def _load_via_inserts(
        self,
        cursor: Any,
        table_name: str,
        df: "pd.DataFrame",
        batch_size: int = 1000,
    ) -> int:
        """Load data via INSERT statements."""
        total_rows = 0
        
        columns = df.columns.tolist()
        columns_sql = ", ".join(columns)
        
        for i in range(0, len(df), batch_size):
            batch = df.iloc[i:i + batch_size]
            
            values_list = []
            for _, row in batch.iterrows():
                values = [self._format_sql_value(row[col]) for col in columns]
                values_list.append(f"({', '.join(values)})")
            
            insert_sql = f"INSERT INTO {table_name} ({columns_sql}) VALUES {', '.join(values_list)}"
            cursor.execute(insert_sql)
            total_rows += cursor.rowcount
        
        return total_rows
    
    # =========================================================================
    # COPY INTO Script Generation
    # =========================================================================
    
    def generate_copy_script(
        self,
        stage_path: str,
        output_path: str | Path,
    ) -> Path:
        """
        Generate a COPY INTO script for loading staged Parquet files.
        
        For medallion architecture, expects files organized by layer:
        - @STAGE/bronze/table.parquet
        - @STAGE/silver/table.parquet
        - @STAGE/gold/table.parquet
        
        Args:
            stage_path: Snowflake stage path (e.g., @MY_STAGE/data/)
            output_path: Path for output SQL file
            
        Returns:
            Path to written file
        """
        output_path = Path(output_path)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        
        # Ensure stage_path ends with /
        if not stage_path.endswith("/"):
            stage_path = stage_path + "/"
        
        lines = [
            f"-- COPY INTO Script for Staged Data",
            f"-- Created: {datetime.now().isoformat()}",
            f"-- Stage: {stage_path}",
            "",
            f"USE DATABASE {self.database};",
        ]
        
        if self.medallion.enabled:
            lines.append(f"-- Architecture: Medallion (Bronze → Silver → Gold)")
            lines.append("")
            
            layers = self._get_layers()
            layer_order = [
                ("BRONZE", self.medallion.bronze_schema, "bronze"),
                ("SILVER", self.medallion.silver_schema, "silver"),
                ("GOLD", self.medallion.gold_schema, "gold"),
            ]
            
            for layer_key, schema_name, layer_dir in layer_order:
                table_keys = layers.get(layer_key, [])
                if not table_keys:
                    continue
                
                lines.extend([
                    f"-- ==========================================================================",
                    f"-- {layer_key} LAYER",
                    f"-- ==========================================================================",
                    "",
                    f"USE SCHEMA {schema_name};",
                    "",
                ])
                
                for key in table_keys:
                    _, table_name = self._parse_table_key(key)
                    lines.append(f"-- Load {table_name}")
                    lines.append(f"""COPY INTO {table_name}
FROM {stage_path}{layer_dir}/{table_name}.parquet
FILE_FORMAT = (TYPE = 'PARQUET')
MATCH_BY_COLUMN_NAME = CASE_INSENSITIVE;
""")
            
            # Handle OTHER tables
            other_tables = layers.get("OTHER", [])
            if other_tables:
                lines.extend([
                    f"-- ==========================================================================",
                    f"-- OTHER TABLES",
                    f"-- ==========================================================================",
                    "",
                    f"USE SCHEMA {self.schema};",
                    "",
                ])
                
                for key in other_tables:
                    lines.append(f"-- Load {key}")
                    lines.append(f"""COPY INTO {key}
FROM {stage_path}other/{key}.parquet
FILE_FORMAT = (TYPE = 'PARQUET')
MATCH_BY_COLUMN_NAME = CASE_INSENSITIVE;
""")
        else:
            # Non-medallion: original behavior
            lines.append(f"USE SCHEMA {self.schema};")
            lines.append("")
            
            for entity_name in self.data.keys():
                if entity_name.startswith("_"):
                    continue
                
                lines.append(f"-- Load {entity_name}")
                lines.append(f"""COPY INTO {entity_name}
FROM {stage_path}{entity_name}.parquet
FILE_FORMAT = (TYPE = 'PARQUET')
MATCH_BY_COLUMN_NAME = CASE_INSENSITIVE;
""")
        
        with open(output_path, "w") as f:
            f.write("\n".join(lines))
        
        return output_path
