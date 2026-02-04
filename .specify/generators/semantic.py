"""
Semantic Model Generator for Cortex Analyst.

Transforms domain-model.yaml → semantic-model.yaml for use with
Snowflake Cortex Analyst natural language queries.

Mapping Strategy:
- GOLD layer entities → Logical tables (preferred)
- SILVER entities → Fallback if no GOLD
- STRING fields → dimensions
- DATE/TIMESTAMP → time_dimensions
- NUMBER/DECIMAL/INTEGER → facts
- Aggregations from layer_config.measures → metrics
- foreign_key relationships → relationships (many_to_one)
"""

from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Optional
import yaml
import re

from .base import (
    DomainModel,
    EntityDefinition,
    FieldDefinition,
    MedallionLayer,
)


@dataclass
class SemanticColumn:
    """Base class for semantic model columns."""
    name: str
    description: str = ""
    synonyms: list[str] = field(default_factory=list)
    expr: str = ""
    data_type: str = "TEXT"
    unique: bool = False
    access_modifier: str = "public_access"  # or private_access


@dataclass
class Dimension(SemanticColumn):
    """Dimension column (categorical data)."""
    is_enum: bool = False
    cortex_search_service: Optional[dict] = None


@dataclass
class TimeDimension(SemanticColumn):
    """Time dimension column (temporal data)."""
    pass


@dataclass
class Fact(SemanticColumn):
    """Fact column (measurable numeric data)."""
    pass


@dataclass
class Metric:
    """Metric definition (aggregated measure)."""
    name: str
    description: str = ""
    synonyms: list[str] = field(default_factory=list)
    expr: str = ""
    access_modifier: str = "public_access"


@dataclass
class Filter:
    """Predefined filter for common query patterns."""
    name: str
    description: str = ""
    synonyms: list[str] = field(default_factory=list)
    expr: str = ""


@dataclass
class Relationship:
    """Relationship between logical tables."""
    name: str
    left_table: str
    right_table: str
    relationship_columns: list[dict]
    join_type: str = "left_outer"
    relationship_type: str = "many_to_one"


@dataclass
class LogicalTable:
    """Logical table in semantic model."""
    name: str
    description: str = ""
    base_table: dict = field(default_factory=dict)
    primary_key: Optional[dict] = None
    dimensions: list[Dimension] = field(default_factory=list)
    time_dimensions: list[TimeDimension] = field(default_factory=list)
    facts: list[Fact] = field(default_factory=list)
    metrics: list[Metric] = field(default_factory=list)
    filters: list[Filter] = field(default_factory=list)


@dataclass
class SemanticModel:
    """Complete semantic model for Cortex Analyst."""
    name: str
    description: str = ""
    tables: list[LogicalTable] = field(default_factory=list)
    relationships: list[Relationship] = field(default_factory=list)
    metrics: list[Metric] = field(default_factory=list)  # Model-level derived metrics
    verified_queries: list[dict] = field(default_factory=list)


class SemanticModelGenerator:
    """
    Generates Cortex Analyst semantic models from domain models.
    
    Usage:
        generator = SemanticModelGenerator(domain_model, config)
        semantic_model = generator.generate()
        generator.to_yaml("semantic-model.yaml")
    """
    
    # Type mappings from domain model to semantic model
    DIMENSION_TYPES = {"STRING", "VARCHAR", "TEXT", "CHAR"}
    TIME_DIMENSION_TYPES = {"DATE", "TIMESTAMP", "TIMESTAMP_NTZ", "TIMESTAMP_LTZ", "DATETIME"}
    FACT_TYPES = {"NUMBER", "INTEGER", "INT", "DECIMAL", "FLOAT", "DOUBLE", "NUMERIC"}
    
    # Common aggregation functions for metrics
    AGGREGATIONS = {
        "SUM": "Total {field}",
        "AVG": "Average {field}",
        "COUNT": "Count of {field}",
        "MIN": "Minimum {field}",
        "MAX": "Maximum {field}",
    }
    
    def __init__(
        self,
        domain_model: DomainModel,
        database: str = "DEMO_DB",
        schema_override: Optional[str] = None,
        include_silver: bool = False,
        pii_fields: Optional[list[str]] = None,
    ):
        """
        Initialize semantic model generator.
        
        Args:
            domain_model: Loaded domain model
            database: Target Snowflake database
            schema_override: Override schema (default: use layer schemas)
            include_silver: Include SILVER layer entities (not just GOLD)
            pii_fields: List of field names to mark as private
        """
        self.domain_model = domain_model
        self.database = database
        self.schema_override = schema_override
        self.include_silver = include_silver
        self.pii_fields = set(pii_fields or [])
        
        # Extract PII fields from domain model if available
        config = getattr(domain_model, 'industry_config', None) or {}
        self.pii_fields.update(config.get('pii_fields', []))
        
        self.semantic_model: Optional[SemanticModel] = None
    
    def generate(self) -> SemanticModel:
        """Generate semantic model from domain model."""
        # Create semantic model
        self.semantic_model = SemanticModel(
            name=f"{self.domain_model.name}_semantic_model",
            description=self._generate_description(),
        )
        
        # Get entities to include (GOLD preferred, SILVER as fallback)
        entities = self._get_eligible_entities()
        
        # Generate logical tables
        for entity in entities:
            logical_table = self._entity_to_logical_table(entity)
            self.semantic_model.tables.append(logical_table)
        
        # Generate relationships from foreign keys
        self.semantic_model.relationships = self._generate_relationships(entities)
        
        # Generate model-level derived metrics
        self.semantic_model.metrics = self._generate_derived_metrics(entities)
        
        # Add placeholder verified queries
        self.semantic_model.verified_queries = self._generate_sample_queries()
        
        return self.semantic_model
    
    def _generate_description(self) -> str:
        """Generate semantic model description."""
        industry = self.domain_model.industry
        name = self.domain_model.name
        return f"Semantic model for {name} ({industry} domain). Enables natural language queries via Cortex Analyst."
    
    def _get_eligible_entities(self) -> list[EntityDefinition]:
        """Get entities eligible for semantic model (GOLD preferred)."""
        entities = []
        
        # Prefer GOLD layer entities
        gold_entities = self.domain_model.get_entities_by_layer(MedallionLayer.GOLD)
        entities.extend(gold_entities)
        
        # Include SILVER if configured and no GOLD exists
        if self.include_silver or not gold_entities:
            silver_entities = self.domain_model.get_entities_by_layer(MedallionLayer.SILVER)
            entities.extend(silver_entities)
        
        return entities
    
    def _entity_to_logical_table(self, entity: EntityDefinition) -> LogicalTable:
        """Convert domain entity to semantic logical table."""
        # Determine schema
        if self.schema_override:
            schema = self.schema_override
        elif entity.layer:
            schema = entity.layer.schema_name()
        else:
            schema = "PUBLIC"
        
        logical_table = LogicalTable(
            name=self._to_logical_name(entity.name),
            description=entity.description,
            base_table={
                "database": self.database,
                "schema": schema,
                "table": entity.name.upper(),
            },
        )
        
        # Find primary key
        pk_fields = [f.name for f in entity.fields if f.primary_key]
        if pk_fields:
            logical_table.primary_key = {"columns": pk_fields}
        
        # Classify fields
        for field_def in entity.fields:
            # Skip internal/metadata fields
            if field_def.name.startswith("_"):
                continue
            
            column = self._classify_field(field_def, entity)
            
            if isinstance(column, TimeDimension):
                logical_table.time_dimensions.append(column)
            elif isinstance(column, Dimension):
                logical_table.dimensions.append(column)
            elif isinstance(column, Fact):
                logical_table.facts.append(column)
        
        # Generate metrics from facts
        logical_table.metrics = self._generate_table_metrics(entity, logical_table.facts)
        
        # Generate common filters
        logical_table.filters = self._generate_filters(entity, logical_table)
        
        return logical_table
    
    def _to_logical_name(self, entity_name: str) -> str:
        """Convert entity name to logical table name."""
        # Remove common prefixes for cleaner names
        name = entity_name.lower()
        for prefix in ["dim_", "fact_", "agg_", "raw_"]:
            if name.startswith(prefix):
                name = name[len(prefix):]
                break
        return name
    
    def _classify_field(
        self,
        field_def: FieldDefinition,
        entity: EntityDefinition,
    ) -> SemanticColumn:
        """Classify field as dimension, time_dimension, or fact."""
        field_type = field_def.type.upper()
        is_pii = self._is_pii_field(field_def.name, entity.name)
        access = "private_access" if is_pii else "public_access"
        
        # Generate synonyms from field name and description
        synonyms = self._generate_synonyms(field_def)
        
        # Base expression (simple column reference)
        expr = field_def.name
        
        # Time dimensions
        if field_type in self.TIME_DIMENSION_TYPES:
            return TimeDimension(
                name=field_def.name,
                description=field_def.description or f"Time dimension: {field_def.name}",
                synonyms=synonyms,
                expr=expr,
                data_type=self._map_data_type(field_type),
                unique=field_def.primary_key,
            )
        
        # Facts (numeric)
        if field_type in self.FACT_TYPES:
            return Fact(
                name=field_def.name,
                description=field_def.description or f"Numeric measure: {field_def.name}",
                synonyms=synonyms,
                expr=expr,
                data_type="NUMBER",
                access_modifier=access,
            )
        
        # Dimensions (categorical/string) - default
        is_enum = self._is_enum_field(field_def)
        return Dimension(
            name=field_def.name,
            description=field_def.description or f"Dimension: {field_def.name}",
            synonyms=synonyms,
            expr=expr,
            data_type="TEXT",
            unique=field_def.primary_key,
            is_enum=is_enum,
        )
    
    def _is_pii_field(self, field_name: str, entity_name: str) -> bool:
        """Check if field contains PII."""
        # Check explicit PII list
        if field_name in self.pii_fields:
            return True
        if f"{entity_name}.{field_name}" in self.pii_fields:
            return True
        
        # Check common PII patterns
        pii_patterns = [
            r"ssn", r"social_security", r"tax_id",
            r"email", r"phone", r"address", r"zip_code", r"postal",
            r"credit_card", r"card_number", r"cvv",
            r"password", r"secret", r"token",
            r"date_of_birth", r"dob", r"birthdate",
        ]
        field_lower = field_name.lower()
        return any(re.search(pattern, field_lower) for pattern in pii_patterns)
    
    def _is_enum_field(self, field_def: FieldDefinition) -> bool:
        """Check if field is an enumeration."""
        if field_def.generator:
            return field_def.generator.get("type") == "enum"
        
        # Common enum patterns
        enum_patterns = ["status", "type", "category", "state", "level", "tier", "grade"]
        return any(p in field_def.name.lower() for p in enum_patterns)
    
    def _generate_synonyms(self, field_def: FieldDefinition) -> list[str]:
        """Generate synonyms for a field."""
        synonyms = []
        name = field_def.name
        
        # Convert snake_case to readable form
        readable = name.replace("_", " ").title()
        if readable.lower() != name.lower():
            synonyms.append(readable)
        
        # Add common variations
        if "_id" in name.lower():
            base = name.lower().replace("_id", "")
            synonyms.append(f"{base} identifier")
            synonyms.append(f"{base} ID")
        
        if "_key" in name.lower():
            base = name.lower().replace("_key", "")
            synonyms.append(f"{base} key")
        
        if "_date" in name.lower():
            base = name.lower().replace("_date", "")
            synonyms.append(f"{base} date")
            synonyms.append(f"date of {base}")
        
        if "_amount" in name.lower():
            base = name.lower().replace("_amount", "")
            synonyms.append(f"{base} amount")
            synonyms.append(f"total {base}")
        
        if "_count" in name.lower():
            base = name.lower().replace("_count", "")
            synonyms.append(f"number of {base}")
            synonyms.append(f"{base} count")
        
        return synonyms[:4]  # Limit to 4 synonyms
    
    def _map_data_type(self, domain_type: str) -> str:
        """Map domain type to semantic model data type."""
        type_map = {
            "STRING": "TEXT",
            "VARCHAR": "TEXT",
            "TEXT": "TEXT",
            "NUMBER": "NUMBER",
            "INTEGER": "NUMBER",
            "INT": "NUMBER",
            "DECIMAL": "NUMBER",
            "FLOAT": "NUMBER",
            "DOUBLE": "NUMBER",
            "DATE": "DATE",
            "TIMESTAMP": "TIMESTAMP",
            "TIMESTAMP_NTZ": "TIMESTAMP",
            "TIMESTAMP_LTZ": "TIMESTAMP",
            "BOOLEAN": "BOOLEAN",
            "VARIANT": "VARIANT",
        }
        return type_map.get(domain_type.upper(), "TEXT")
    
    def _generate_table_metrics(
        self,
        entity: EntityDefinition,
        facts: list[Fact],
    ) -> list[Metric]:
        """Generate metrics for a logical table from its facts."""
        metrics = []
        
        # Get measures from layer config if available
        layer_measures = []
        if entity.layer_config:
            layer_measures = entity.layer_config.measures
        
        for fact in facts:
            # Skip private facts
            if fact.access_modifier == "private_access":
                continue
            
            # Generate SUM metric for amount/revenue/cost fields
            if any(p in fact.name.lower() for p in ["amount", "revenue", "cost", "price", "total", "sum"]):
                metrics.append(Metric(
                    name=f"total_{fact.name}",
                    description=f"Sum of {fact.name}",
                    synonyms=[f"total {fact.name.replace('_', ' ')}", f"sum of {fact.name.replace('_', ' ')}"],
                    expr=f"SUM({fact.expr})",
                ))
            
            # Generate COUNT metric for quantity/count fields
            if any(p in fact.name.lower() for p in ["quantity", "count", "num", "qty"]):
                metrics.append(Metric(
                    name=f"total_{fact.name}",
                    description=f"Total {fact.name}",
                    synonyms=[f"total {fact.name.replace('_', ' ')}"],
                    expr=f"SUM({fact.expr})",
                ))
            
            # Generate AVG metric for rate/score/rating fields
            if any(p in fact.name.lower() for p in ["rate", "score", "rating", "average", "avg"]):
                metrics.append(Metric(
                    name=f"avg_{fact.name}",
                    description=f"Average {fact.name}",
                    synonyms=[f"average {fact.name.replace('_', ' ')}", f"mean {fact.name.replace('_', ' ')}"],
                    expr=f"AVG({fact.expr})",
                ))
        
        # Add explicit measures from layer_config
        for measure in layer_measures:
            if measure not in [m.name for m in metrics]:
                metrics.append(Metric(
                    name=measure,
                    description=f"Metric: {measure}",
                    expr=f"SUM({measure})",  # Default to SUM
                ))
        
        return metrics
    
    def _generate_filters(
        self,
        entity: EntityDefinition,
        logical_table: LogicalTable,
    ) -> list[Filter]:
        """Generate common filters for a logical table."""
        filters = []
        
        # Status-based filters
        for dim in logical_table.dimensions:
            if "status" in dim.name.lower():
                filters.append(Filter(
                    name="active_only",
                    description="Filter to active records only",
                    synonyms=["active", "current", "not deleted"],
                    expr=f"{dim.expr} = 'ACTIVE'",
                ))
                break
        
        # Time-based filters for tables with date fields
        for td in logical_table.time_dimensions:
            if any(p in td.name.lower() for p in ["created", "order", "transaction", "event"]):
                filters.extend([
                    Filter(
                        name="last_30_days",
                        description="Records from the last 30 days",
                        synonyms=["recent", "last month", "past 30 days"],
                        expr=f"{td.expr} >= DATEADD(day, -30, CURRENT_DATE())",
                    ),
                    Filter(
                        name="current_year",
                        description="Records from the current year",
                        synonyms=["this year", "YTD", "year to date"],
                        expr=f"YEAR({td.expr}) = YEAR(CURRENT_DATE())",
                    ),
                ])
                break
        
        return filters
    
    def _generate_relationships(
        self,
        entities: list[EntityDefinition],
    ) -> list[Relationship]:
        """Generate relationships from foreign keys."""
        relationships = []
        entity_names = {e.name.lower(): e.name for e in entities}
        
        for entity in entities:
            for field_def in entity.fields:
                if not field_def.foreign_key:
                    continue
                
                # Parse foreign key: "other_entity.field"
                try:
                    ref_entity, ref_field = field_def.foreign_key.split(".")
                except ValueError:
                    continue
                
                # Check if referenced entity is in our set
                ref_entity_actual = entity_names.get(ref_entity.lower())
                if not ref_entity_actual:
                    continue
                
                rel_name = f"{self._to_logical_name(entity.name)}_to_{self._to_logical_name(ref_entity_actual)}"
                
                relationships.append(Relationship(
                    name=rel_name,
                    left_table=self._to_logical_name(entity.name),
                    right_table=self._to_logical_name(ref_entity_actual),
                    relationship_columns=[{
                        "left_column": field_def.name,
                        "right_column": ref_field,
                    }],
                    join_type="left_outer",
                    relationship_type="many_to_one",
                ))
        
        return relationships
    
    def _generate_derived_metrics(
        self,
        entities: list[EntityDefinition],
    ) -> list[Metric]:
        """Generate model-level derived metrics."""
        metrics = []
        
        # Look for common cross-table metrics
        has_revenue = any(
            any("revenue" in f.name.lower() or "amount" in f.name.lower() for f in e.fields)
            for e in entities
        )
        has_cost = any(
            any("cost" in f.name.lower() for f in e.fields)
            for e in entities
        )
        
        if has_revenue and has_cost:
            metrics.append(Metric(
                name="profit_margin",
                description="Profit margin calculated as (revenue - cost) / revenue",
                synonyms=["margin", "profitability", "profit percentage"],
                expr="(SUM(revenue) - SUM(cost)) / NULLIF(SUM(revenue), 0)",
            ))
        
        return metrics
    
    def _generate_sample_queries(self) -> list[dict]:
        """Generate sample verified queries with proper timestamps.
        
        IMPORTANT: Snowflake semantic models require:
        - verified_at: Unix timestamp (int64), NOT ISO date string
        - Each verified query must have: name, question, sql, verified_at
        """
        import time
        verified_at = int(time.time())  # Unix timestamp (int64) - required format
        
        return [
            {
                "name": "sample_query_placeholder",
                "question": "What are the top 10 results?",
                "sql": "-- Replace with actual verified query",
                "verified_at": verified_at,  # Required: Unix timestamp (int64)
                "use_as_onboarding_question": True,
            }
        ]
    
    def to_dict(self) -> dict:
        """Convert semantic model to dictionary."""
        if not self.semantic_model:
            self.generate()
        
        model = self.semantic_model
        
        result = {
            "name": model.name,
            "description": model.description,
            "tables": [],
        }
        
        # Convert tables
        for table in model.tables:
            table_dict = {
                "name": table.name,
                "description": table.description,
                "base_table": table.base_table,
            }
            
            if table.primary_key:
                table_dict["primary_key"] = table.primary_key
            
            # Dimensions
            if table.dimensions:
                table_dict["dimensions"] = [
                    self._column_to_dict(d, include_enum=True)
                    for d in table.dimensions
                ]
            
            # Time dimensions
            if table.time_dimensions:
                table_dict["time_dimensions"] = [
                    self._column_to_dict(td)
                    for td in table.time_dimensions
                ]
            
            # Facts
            if table.facts:
                table_dict["facts"] = [
                    self._column_to_dict(f, include_access=True)
                    for f in table.facts
                ]
            
            # Metrics
            if table.metrics:
                table_dict["metrics"] = [
                    self._metric_to_dict(m)
                    for m in table.metrics
                ]
            
            # Filters
            if table.filters:
                table_dict["filters"] = [
                    self._filter_to_dict(f)
                    for f in table.filters
                ]
            
            result["tables"].append(table_dict)
        
        # Relationships
        if model.relationships:
            result["relationships"] = [
                {
                    "name": r.name,
                    "left_table": r.left_table,
                    "right_table": r.right_table,
                    "relationship_columns": r.relationship_columns,
                    "join_type": r.join_type,
                    "relationship_type": r.relationship_type,
                }
                for r in model.relationships
            ]
        
        # Model-level metrics
        if model.metrics:
            result["metrics"] = [
                self._metric_to_dict(m)
                for m in model.metrics
            ]
        
        # Verified queries
        if model.verified_queries:
            result["verified_queries"] = model.verified_queries
        
        return result
    
    def _column_to_dict(
        self,
        col: SemanticColumn,
        include_enum: bool = False,
        include_access: bool = False,
    ) -> dict:
        """Convert column to dictionary."""
        d = {
            "name": col.name,
            "description": col.description,
            "expr": col.expr,
            "data_type": col.data_type,
        }
        
        if col.synonyms:
            d["synonyms"] = col.synonyms
        
        if col.unique:
            d["unique"] = col.unique
        
        if include_enum and isinstance(col, Dimension) and col.is_enum:
            d["is_enum"] = col.is_enum
        
        if include_access and col.access_modifier != "public_access":
            d["access_modifier"] = col.access_modifier
        
        return d
    
    def _metric_to_dict(self, metric: Metric) -> dict:
        """Convert metric to dictionary."""
        d = {
            "name": metric.name,
            "description": metric.description,
            "expr": metric.expr,
        }
        
        if metric.synonyms:
            d["synonyms"] = metric.synonyms
        
        if metric.access_modifier != "public_access":
            d["access_modifier"] = metric.access_modifier
        
        return d
    
    def _filter_to_dict(self, filter_def: Filter) -> dict:
        """Convert filter to dictionary."""
        d = {
            "name": filter_def.name,
            "description": filter_def.description,
            "expr": filter_def.expr,
        }
        
        if filter_def.synonyms:
            d["synonyms"] = filter_def.synonyms
        
        return d
    
    def to_yaml(self, output_path: str | Path) -> Path:
        """Write semantic model to YAML file."""
        output_path = Path(output_path)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        
        model_dict = self.to_dict()
        
        # Custom YAML representer for cleaner output
        def str_representer(dumper, data):
            if '\n' in data:
                return dumper.represent_scalar('tag:yaml.org,2002:str', data, style='|')
            return dumper.represent_scalar('tag:yaml.org,2002:str', data)
        
        yaml.add_representer(str, str_representer)
        
        with open(output_path, "w") as f:
            f.write("# Cortex Analyst Semantic Model\n")
            f.write(f"# Generated from domain model\n")
            f.write(f"# Upload to a Snowflake stage for use with Cortex Analyst\n\n")
            yaml.dump(model_dict, f, default_flow_style=False, sort_keys=False, allow_unicode=True)
        
        return output_path


def generate_semantic_model(
    domain_model_path: str | Path,
    output_path: str | Path,
    database: str = "DEMO_DB",
    include_silver: bool = False,
) -> Path:
    """
    Convenience function to generate semantic model from domain model file.
    
    Args:
        domain_model_path: Path to domain-model.yaml
        output_path: Path for output semantic-model.yaml
        database: Target Snowflake database
        include_silver: Include SILVER layer entities
        
    Returns:
        Path to generated semantic model file
    """
    domain_model = DomainModel.from_yaml(domain_model_path)
    
    generator = SemanticModelGenerator(
        domain_model=domain_model,
        database=database,
        include_silver=include_silver,
    )
    
    return generator.to_yaml(output_path)
