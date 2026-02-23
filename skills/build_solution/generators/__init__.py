"""
Data Generators for Spec-Driven Demos.

This package provides a hybrid data generation system that supports:
- Python/Faker generation for small datasets (< 1M rows)
- Snowflake SQL generation for large datasets (>= 1M rows)
- Industry-specific field generators (healthcare, retail, financial)
- Medallion architecture (bronze, silver, gold layers)
- Semantic model generation for Cortex Analyst
- Multiple output formats (SQL, Parquet, CSV)

Usage:
    from generators import generate_data
    
    # Generate from a domain model YAML file
    data, handler = generate_data(
        "domain-model.yaml",
        database="DEMO_DB",
        schema="PUBLIC",
    )
    
    # Output options
    handler.to_sql("output/data.sql")
    handler.to_parquet("output/")
    handler.to_csv("output/")
    
    # Or execute directly in Snowflake
    handler.execute(connection="my_connection")
    
    # Generate semantic model for Cortex Analyst
    from generators import generate_semantic_model
    generate_semantic_model("domain-model.yaml", "semantic-model.yaml")
"""

from pathlib import Path
from typing import Any, Optional

from .base import (
    DomainModel,
    EntityDefinition,
    FieldDefinition,
    RelationshipDefinition,
    DataCharacteristics,
    MedallionLayer,
    LayerConfig,
)
from .generator import DataGenerator, IndustryGenerator, GeneratorConfig
from .output import OutputHandler, MedallionConfig
from .industries import get_industry_generator, register_industry, list_industries
from .semantic import SemanticModelGenerator, generate_semantic_model


__all__ = [
    # Core classes
    "DomainModel",
    "EntityDefinition",
    "FieldDefinition",
    "RelationshipDefinition",
    "DataCharacteristics",
    # Medallion architecture
    "MedallionLayer",
    "LayerConfig",
    "MedallionConfig",
    # Generator classes
    "DataGenerator",
    "IndustryGenerator",
    # Semantic model generation
    "SemanticModelGenerator",
    "generate_semantic_model",
    # Output handling
    "OutputHandler",
    # Industry registration
    "get_industry_generator",
    "register_industry",
    "list_industries",
    # Factory functions
    "generate_data",
    "create_generator",
]


def create_generator(
    domain_model_path: str | Path,
    seed: Optional[int] = None,
) -> DataGenerator:
    """
    Create a DataGenerator from a domain model YAML file.
    
    Args:
        domain_model_path: Path to domain model YAML file
        seed: Random seed for reproducibility
        
    Returns:
        Configured DataGenerator instance
    """
    model = DomainModel.from_yaml(domain_model_path)
    config = GeneratorConfig(seed=seed if seed is not None else model.seed)
    return DataGenerator(model, config=config)


def generate_data(
    domain_model_path: str | Path,
    database: str = "DEMO_DB",
    schema: str = "PUBLIC",
    seed: Optional[int] = None,
    force_python: bool = False,
    force_sql: bool = False,
) -> tuple[dict[str, Any], OutputHandler]:
    """
    Generate data from a domain model and return an output handler.
    
    This is the main factory function for data generation. It automatically
    chooses the best generation strategy based on scale:
    - < 1M rows: Python/Faker (returns DataFrames)
    - >= 1M rows: Snowflake SQL (returns SQL strings)
    
    Args:
        domain_model_path: Path to domain model YAML file
        database: Target Snowflake database
        schema: Target Snowflake schema
        seed: Random seed for reproducibility
        force_python: Force Python generation regardless of scale
        force_sql: Force SQL generation regardless of scale
        
    Returns:
        Tuple of (generated_data, output_handler)
        - generated_data: Dict of entity_name -> DataFrame or SQL string
        - output_handler: OutputHandler for writing to files or executing
        
    Example:
        # Generate healthcare data
        data, handler = generate_data(
            "healthcare-domain.yaml",
            database="HEALTHCARE_DEMO",
            schema="DEMO_DATA",
        )
        
        # Write SQL file
        handler.to_sql("load_data.sql")
        
        # Or load directly
        results = handler.execute(connection="Snowhouse")
        print(f"Loaded {sum(results.values())} rows")
    """
    generator = create_generator(domain_model_path, seed=seed)
    
    # Determine generation strategy
    if force_python:
        use_sql = False
    elif force_sql:
        use_sql = True
    else:
        use_sql = generator.should_use_sql()
    
    # Generate data
    if use_sql:
        data = generator.generate_sql()
        # Add full SQL as metadata
        data["_full_sql"] = generator.get_full_sql()
    else:
        data = generator.generate_python()
    
    # Create output handler
    handler = OutputHandler(data, database=database, schema=schema)
    
    return data, handler


def generate_for_tenant(
    domain_model_path: str | Path,
    tenant_id: str,
    database: str = "DEMO_DB",
    seed: Optional[int] = None,
) -> tuple[dict[str, Any], OutputHandler]:
    """
    Generate data for a specific tenant with schema isolation.
    
    Multi-tenant data is isolated using schema-per-tenant pattern:
    - Schema name: tenant_{tenant_id}
    - All tables created within tenant schema
    
    Args:
        domain_model_path: Path to domain model YAML file
        tenant_id: Unique tenant identifier
        database: Target Snowflake database
        seed: Random seed for reproducibility
        
    Returns:
        Tuple of (generated_data, output_handler)
    """
    schema = f"tenant_{tenant_id}"
    return generate_data(
        domain_model_path,
        database=database,
        schema=schema,
        seed=seed,
    )


def get_supported_industries() -> list[str]:
    """
    Get list of supported industries.
    
    Returns:
        List of industry names that have registered generators
    """
    return list_industries()


def validate_domain_model(domain_model_path: str | Path) -> dict[str, Any]:
    """
    Validate a domain model YAML file.
    
    Args:
        domain_model_path: Path to domain model YAML file
        
    Returns:
        Dict with validation results:
        - valid: bool
        - errors: list of error messages
        - warnings: list of warning messages
        - entities: list of entity names
        - relationships: list of relationship descriptions
        - estimated_rows: total estimated row count
    """
    result = {
        "valid": True,
        "errors": [],
        "warnings": [],
        "entities": [],
        "relationships": [],
        "estimated_rows": 0,
    }
    
    try:
        model = DomainModel.from_yaml(domain_model_path)
        
        result["entities"] = [e.name for e in model.entities]
        result["relationships"] = [
            f"{r.from_entity} -> {r.to_entity} ({r.type})"
            for r in model.relationships
        ]
        
        # Estimate total rows
        for entity in model.entities:
            result["estimated_rows"] += entity.row_count
        
        # Check for industry generator
        industry = model.industry.lower()
        supported = list_industries()
        if industry not in supported:
            result["warnings"].append(
                f"No specialized generator for industry '{industry}'. "
                f"Using generic generation. Supported: {supported}"
            )
        
        # Check for orphaned entities (no relationships)
        entities_in_relationships = set()
        for r in model.relationships:
            entities_in_relationships.add(r.from_entity)
            entities_in_relationships.add(r.to_entity)
        
        for entity in model.entities:
            if entity.name not in entities_in_relationships:
                result["warnings"].append(
                    f"Entity '{entity.name}' has no relationships defined"
                )
        
        # Check for circular dependencies
        try:
            model.get_generation_order()
        except Exception as e:
            result["errors"].append(f"Circular dependency detected: {e}")
            result["valid"] = False
            
    except Exception as e:
        result["valid"] = False
        result["errors"].append(str(e))
    
    return result
