"""
Base classes for data generation.

Provides DomainModel loading and the base generator interface.
Supports medallion architecture (bronze, silver, gold layers).
"""

from dataclasses import dataclass, field
from enum import Enum
from pathlib import Path
from typing import Any, Optional
import yaml


class MedallionLayer(Enum):
    """Medallion architecture layer."""
    BRONZE = "bronze"   # Raw data: as-is from source, nulls, duplicates, messy
    SILVER = "silver"   # Cleansed: deduped, type-cast, standardized, validated
    GOLD = "gold"       # Business-ready: aggregates, KPIs, dimensional model
    
    @classmethod
    def from_string(cls, value: str) -> "MedallionLayer":
        """Parse layer from string."""
        return cls(value.lower())
    
    def schema_name(self, base_schema: str = "PUBLIC") -> str:
        """Get schema name for this layer."""
        return self.value.upper()  # BRONZE, SILVER, GOLD


@dataclass
class LayerConfig:
    """Configuration for a specific medallion layer."""
    layer: MedallionLayer
    
    # Bronze-specific: noise and quality issues
    null_rate: float = 0.0          # Rate of NULL values to inject
    duplicate_rate: float = 0.0      # Rate of duplicate rows
    format_errors: bool = False      # Include format inconsistencies
    raw_timestamps: bool = False     # Use varied timestamp formats
    
    # Silver-specific: cleansing rules
    deduplicate: bool = False
    standardize_nulls: bool = False
    cast_types: bool = False
    validate_refs: bool = False
    
    # Gold-specific: aggregation
    is_aggregate: bool = False
    source_entities: list[str] = field(default_factory=list)
    grain: list[str] = field(default_factory=list)  # Dimensional grain
    measures: list[str] = field(default_factory=list)
    
    @classmethod
    def bronze_defaults(cls) -> "LayerConfig":
        """Default config for bronze layer."""
        return cls(
            layer=MedallionLayer.BRONZE,
            null_rate=0.05,
            duplicate_rate=0.02,
            format_errors=True,
            raw_timestamps=True,
        )
    
    @classmethod
    def silver_defaults(cls) -> "LayerConfig":
        """Default config for silver layer."""
        return cls(
            layer=MedallionLayer.SILVER,
            deduplicate=True,
            standardize_nulls=True,
            cast_types=True,
            validate_refs=True,
        )
    
    @classmethod
    def gold_defaults(cls) -> "LayerConfig":
        """Default config for gold layer."""
        return cls(
            layer=MedallionLayer.GOLD,
            is_aggregate=False,  # Set True for fact tables
        )
    
    @classmethod
    def from_dict(cls, data: dict) -> "LayerConfig":
        """Create from dictionary."""
        layer = MedallionLayer.from_string(data.get("layer", "gold"))
        
        config = cls(layer=layer)
        
        # Bronze settings
        if layer == MedallionLayer.BRONZE:
            config.null_rate = data.get("null_rate", 0.05)
            config.duplicate_rate = data.get("duplicate_rate", 0.02)
            config.format_errors = data.get("format_errors", True)
            config.raw_timestamps = data.get("raw_timestamps", True)
        
        # Silver settings
        elif layer == MedallionLayer.SILVER:
            config.deduplicate = data.get("deduplicate", True)
            config.standardize_nulls = data.get("standardize_nulls", True)
            config.cast_types = data.get("cast_types", True)
            config.validate_refs = data.get("validate_refs", True)
        
        # Gold settings
        elif layer == MedallionLayer.GOLD:
            config.is_aggregate = data.get("is_aggregate", False)
            config.source_entities = data.get("source_entities", [])
            config.grain = data.get("grain", [])
            config.measures = data.get("measures", [])
        
        return config


@dataclass
class FieldDefinition:
    """Definition of a single field in an entity."""
    name: str
    type: str  # STRING, NUMBER, DATE, TIMESTAMP, BOOLEAN, DECIMAL, VARIANT
    description: str = ""
    nullable: bool = True
    primary_key: bool = False
    foreign_key: Optional[str] = None  # "other_entity.field"
    generator: Optional[dict] = None  # Generation hints
    
    @classmethod
    def from_dict(cls, data: dict) -> "FieldDefinition":
        return cls(
            name=data["name"],
            type=data["type"],
            description=data.get("description", ""),
            nullable=data.get("nullable", True),
            primary_key=data.get("primary_key", False),
            foreign_key=data.get("foreign_key"),
            generator=data.get("generator"),
        )


@dataclass
class EntityDefinition:
    """Definition of a data entity (table)."""
    name: str
    description: str
    row_count: int
    fields: list[FieldDefinition]
    layer: MedallionLayer = MedallionLayer.GOLD  # Default to gold
    layer_config: Optional[LayerConfig] = None
    generation_hints: Optional[dict] = None
    
    @classmethod
    def from_dict(cls, data: dict) -> "EntityDefinition":
        # Parse layer
        layer_str = data.get("layer", "gold")
        layer = MedallionLayer.from_string(layer_str)
        
        # Parse layer config or use defaults
        layer_config_data = data.get("layer_config")
        if layer_config_data:
            layer_config = LayerConfig.from_dict(layer_config_data)
        else:
            # Use defaults based on layer
            if layer == MedallionLayer.BRONZE:
                layer_config = LayerConfig.bronze_defaults()
            elif layer == MedallionLayer.SILVER:
                layer_config = LayerConfig.silver_defaults()
            else:
                layer_config = LayerConfig.gold_defaults()
        
        return cls(
            name=data["name"],
            description=data.get("description", ""),
            row_count=data.get("row_count", 1000),
            fields=[FieldDefinition.from_dict(f) for f in data.get("fields", [])],
            layer=layer,
            layer_config=layer_config,
            generation_hints=data.get("generation_hints"),
        )
    
    def get_primary_key(self) -> Optional[FieldDefinition]:
        """Get the primary key field."""
        for f in self.fields:
            if f.primary_key:
                return f
        return None
    
    def get_foreign_keys(self) -> list[FieldDefinition]:
        """Get all foreign key fields."""
        return [f for f in self.fields if f.foreign_key]


@dataclass
class RelationshipDefinition:
    """Definition of a relationship between entities."""
    name: str
    from_entity: str  # entity.field
    to_entity: str    # entity.field
    type: str         # many-to-one, one-to-many, many-to-many
    
    @classmethod
    def from_dict(cls, data: dict) -> "RelationshipDefinition":
        return cls(
            name=data.get("name", f"{data['from']}_to_{data['to']}"),
            from_entity=data["from"],
            to_entity=data["to"],
            type=data.get("type", "many-to-one"),
        )


@dataclass
class DataCharacteristics:
    """Configuration for data characteristics (anomalies, trends, etc.)."""
    anomalies: bool = False
    anomaly_rate: float = 0.02
    anomaly_types: list[str] = field(default_factory=lambda: ["spike", "drop", "outlier"])
    
    seasonality: bool = False
    seasonal_patterns: list[dict] = field(default_factory=list)
    
    trends: bool = False
    trend_direction: str = "flat"  # up, down, flat
    trend_strength: float = 0.1
    
    missing_data: bool = False
    missing_rate: float = 0.05
    
    @classmethod
    def from_dict(cls, data: dict) -> "DataCharacteristics":
        if not data:
            return cls()
        
        return cls(
            anomalies=data.get("anomalies", {}).get("enabled", False),
            anomaly_rate=data.get("anomalies", {}).get("rate", 0.02),
            anomaly_types=data.get("anomalies", {}).get("types", ["spike", "drop", "outlier"]),
            seasonality=data.get("seasonality", {}).get("enabled", False),
            seasonal_patterns=data.get("seasonality", {}).get("patterns", []),
            trends=data.get("trends", {}).get("enabled", False),
            trend_direction=data.get("trends", {}).get("direction", "flat"),
            trend_strength=data.get("trends", {}).get("strength", 0.1),
            missing_data=data.get("missing_data", {}).get("enabled", False),
            missing_rate=data.get("missing_data", {}).get("rate", 0.05),
        )


@dataclass
class DomainModel:
    """
    Complete domain model loaded from YAML.
    
    Contains all entity definitions, relationships, and generation parameters.
    """
    name: str
    industry: str
    scale: str  # minimal, realistic, scale_test
    time_range: dict  # start, end
    seed: int
    entities: list[EntityDefinition]
    relationships: list[RelationshipDefinition]
    characteristics: DataCharacteristics
    industry_config: dict
    
    @classmethod
    def from_yaml(cls, path: str | Path) -> "DomainModel":
        """Load domain model from YAML file."""
        path = Path(path)
        with open(path) as f:
            data = yaml.safe_load(f)
        
        return cls.from_dict(data)
    
    @classmethod
    def from_dict(cls, data: dict) -> "DomainModel":
        """Create domain model from dictionary."""
        metadata = data.get("metadata", {})
        
        return cls(
            name=metadata.get("name", "unnamed"),
            industry=metadata.get("industry", "generic"),
            scale=metadata.get("scale", "realistic"),
            time_range=metadata.get("time_range", {"start": "-1y", "end": "today"}),
            seed=metadata.get("seed", 42),
            entities=[EntityDefinition.from_dict(e) for e in data.get("entities", [])],
            relationships=[RelationshipDefinition.from_dict(r) for r in data.get("relationships", [])],
            characteristics=DataCharacteristics.from_dict(data.get("characteristics")),
            industry_config=data.get("industry_config", {}),
        )
    
    def get_entity(self, name: str) -> Optional[EntityDefinition]:
        """Get entity by name."""
        for e in self.entities:
            if e.name == name:
                return e
        return None
    
    def get_generation_order(self) -> list[str]:
        """
        Return entity names in dependency order.
        
        Entities with no foreign keys come first, then entities
        that reference them, etc.
        """
        # Build dependency graph
        dependencies: dict[str, set[str]] = {e.name: set() for e in self.entities}
        
        for entity in self.entities:
            for fk in entity.get_foreign_keys():
                if fk.foreign_key:
                    # Extract entity name from "entity.field"
                    ref_entity = fk.foreign_key.split(".")[0]
                    if ref_entity in dependencies:
                        dependencies[entity.name].add(ref_entity)
        
        # Topological sort
        ordered = []
        remaining = set(dependencies.keys())
        
        while remaining:
            # Find entities with no remaining dependencies
            ready = [e for e in remaining if dependencies[e] <= set(ordered)]
            
            if not ready:
                # Circular dependency - just add remaining in any order
                ordered.extend(remaining)
                break
            
            # Add ready entities
            for e in sorted(ready):  # Sort for deterministic order
                ordered.append(e)
                remaining.remove(e)
        
        return ordered
    
    def total_rows(self) -> int:
        """Get total row count across all entities."""
        return sum(e.row_count for e in self.entities)
    
    def should_use_sql_generation(self, threshold: int = 1_000_000) -> bool:
        """Determine if SQL generation is recommended based on scale."""
        return self.total_rows() >= threshold
    
    # =========================================================================
    # Medallion Architecture Methods
    # =========================================================================
    
    def get_entities_by_layer(self, layer: MedallionLayer) -> list[EntityDefinition]:
        """Get all entities for a specific medallion layer."""
        return [e for e in self.entities if e.layer == layer]
    
    def get_bronze_entities(self) -> list[EntityDefinition]:
        """Get all bronze layer entities."""
        return self.get_entities_by_layer(MedallionLayer.BRONZE)
    
    def get_silver_entities(self) -> list[EntityDefinition]:
        """Get all silver layer entities."""
        return self.get_entities_by_layer(MedallionLayer.SILVER)
    
    def get_gold_entities(self) -> list[EntityDefinition]:
        """Get all gold layer entities."""
        return self.get_entities_by_layer(MedallionLayer.GOLD)
    
    def get_layers_used(self) -> list[MedallionLayer]:
        """Get list of medallion layers used in this model."""
        layers = set(e.layer for e in self.entities)
        # Return in order: bronze, silver, gold
        ordered = []
        for layer in [MedallionLayer.BRONZE, MedallionLayer.SILVER, MedallionLayer.GOLD]:
            if layer in layers:
                ordered.append(layer)
        return ordered
    
    def get_generation_order_by_layer(self) -> dict[MedallionLayer, list[str]]:
        """
        Return entity names in dependency order, grouped by layer.
        
        Bronze is generated first, then silver, then gold.
        Within each layer, entities are ordered by dependencies.
        """
        result = {}
        
        for layer in self.get_layers_used():
            layer_entities = self.get_entities_by_layer(layer)
            
            # Build dependency graph for this layer
            dependencies: dict[str, set[str]] = {e.name: set() for e in layer_entities}
            
            for entity in layer_entities:
                for fk in entity.get_foreign_keys():
                    if fk.foreign_key:
                        ref_entity = fk.foreign_key.split(".")[0]
                        # Only add if reference is in same layer
                        if ref_entity in dependencies:
                            dependencies[entity.name].add(ref_entity)
            
            # Topological sort
            ordered = []
            remaining = set(dependencies.keys())
            
            while remaining:
                ready = [e for e in remaining if dependencies[e] <= set(ordered)]
                if not ready:
                    ordered.extend(remaining)
                    break
                for e in sorted(ready):
                    ordered.append(e)
                    remaining.remove(e)
            
            result[layer] = ordered
        
        return result
    
    def total_rows_by_layer(self) -> dict[MedallionLayer, int]:
        """Get total row count per layer."""
        return {
            layer: sum(e.row_count for e in self.get_entities_by_layer(layer))
            for layer in self.get_layers_used()
        }
