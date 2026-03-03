#!/usr/bin/env python3
"""
ISF Solution Data Generator
============================

Config-driven synthetic data generator that reads entity definitions from
isf-data-architecture YAML files and behavior profiles to produce realistic,
reproducible datasets.

Usage:
    # Generate all entities for a solution
    python generate_synthetic_data.py --entities-dir references/entities --industry retail

    # Quick mode (reduced row counts)
    python generate_synthetic_data.py --entities-dir references/entities --industry healthcare --quick

    # Specific entity only
    python generate_synthetic_data.py --entities-dir references/entities --industry financial --entity ACCOUNT

    # Custom output directory
    python generate_synthetic_data.py --entities-dir references/entities --industry manufacturing --output src/data_engine/output

Rules:
    - Always use RANDOM_SEED = 42 for reproducibility
    - Generate once, commit to repo
    - Never run during deployment
"""

import os
import sys
import json
import uuid
import random
import argparse
from abc import ABC
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any, Dict, List, Optional

import numpy as np
import pyarrow as pa
import pyarrow.parquet as pq
import yaml
from faker import Faker

SEED = 42
random.seed(SEED)
np.random.seed(SEED)
Faker.seed(SEED)
fake = Faker()


class EntityGenerator:
    """
    Generates synthetic data for entities defined in YAML files.

    Reads entity definitions from isf-data-architecture references/entities/
    and behavior profiles from isf-data-generation references/.
    """

    def __init__(self, entities_dir: str, industry: str,
                 behavior_profiles_path: Optional[str] = None,
                 quick_mode: bool = False):
        self.entities_dir = Path(entities_dir)
        self.industry = industry
        self.quick_mode = quick_mode

        self.core_entities = self._load_yaml(self.entities_dir / "_core.yaml")
        self.industry_entities = self._load_yaml(
            self.entities_dir / f"{industry}.yaml"
        )
        self.behavior = self._load_yaml(
            Path(behavior_profiles_path) if behavior_profiles_path
            else self.entities_dir.parent.parent
            / "isf-data-generation" / "references" / "behavior-profiles.yaml"
        ) or {}

        self.generated_ids: Dict[str, List[str]] = {}

    @staticmethod
    def _load_yaml(path: Path) -> Optional[Dict]:
        if path.exists():
            with open(path) as f:
                return yaml.safe_load(f)
        return None

    def resolve_entity(self, entity_name: str) -> Optional[Dict]:
        """Resolve an entity definition, merging core + industry extensions."""
        core = (self.core_entities or {}).get("entities", {}).get(entity_name)
        industry = (self.industry_entities or {}).get("entities", {}).get(entity_name)

        if not core and not industry:
            return None

        if not industry:
            return core

        if industry.get("extends"):
            merged = dict(core) if core else {}
            merged_cols = dict(merged.get("columns", {}))
            merged_cols.update(industry.get("additional_columns", {}))
            merged["columns"] = merged_cols
            if "additional_columns" in industry:
                del industry["additional_columns"]
            merged.update({k: v for k, v in industry.items()
                           if k not in ("extends", "columns")})
            return merged

        return industry

    def get_all_entity_names(self) -> List[str]:
        """Get all available entity names (core + industry)."""
        names = set()
        if self.core_entities:
            names.update(self.core_entities.get("entities", {}).keys())
        if self.industry_entities:
            names.update(self.industry_entities.get("entities", {}).keys())
        return sorted(names)

    def determine_generation_order(self, entity_names: List[str]) -> List[str]:
        """Order entities so parents are generated before children."""
        ordered = []
        remaining = set(entity_names)

        for _ in range(len(entity_names)):
            for name in list(remaining):
                entity = self.resolve_entity(name)
                if not entity:
                    remaining.discard(name)
                    continue
                deps = {
                    r["entity"] for r in entity.get("relationships", [])
                    if r.get("type") == "many_to_one"
                }
                if deps.issubset(set(ordered) | (set(entity_names) - remaining)):
                    ordered.append(name)
                    remaining.discard(name)

            if not remaining:
                break

        ordered.extend(remaining)
        return ordered

    def generate_value(self, col_def: Dict, parent_ids: Optional[Dict] = None) -> Any:
        """Generate a value based on column generation rule."""
        gen = col_def.get("generation")
        if gen is None:
            return None

        if isinstance(gen, str):
            if gen == "uuid":
                return str(uuid.uuid4())
            if gen == "sequential_id":
                return f"ID_{random.randint(1, 999999):06d}"
            if gen.startswith("faker."):
                method = gen.split(".", 1)[1]
                return getattr(fake, method)()
            if gen == "random_date":
                start = datetime(2023, 1, 1)
                return (start + timedelta(days=random.randint(0, 730))).strftime(
                    "%Y-%m-%dT%H:%M:%S"
                )
            if gen == "customer_ref" and parent_ids and "CUSTOMER" in parent_ids:
                return random.choice(parent_ids["CUSTOMER"])
            if gen == "product_ref" and parent_ids and "PRODUCT" in parent_ids:
                return random.choice(parent_ids["PRODUCT"])
            if gen.endswith("_ref") and parent_ids:
                ref_entity = gen.replace("_ref", "").upper()
                if ref_entity in parent_ids:
                    return random.choice(parent_ids[ref_entity])
            return gen

        if isinstance(gen, dict):
            gen_type = gen.get("type")

            if gen_type == "weighted_choice":
                choices = gen.get("choices", [])
                weights = gen.get("weights", [])
                source = gen.get("source")
                if source and self.behavior:
                    ref = self.behavior
                    for part in source.split("."):
                        ref = ref.get(part, {}) if isinstance(ref, dict) else {}
                    if isinstance(ref, list):
                        choices = [item["value"] for item in ref]
                        weights = [item["weight"] for item in ref]
                if choices and weights:
                    return random.choices(choices, weights=weights, k=1)[0]
                if choices:
                    return random.choice(choices)

            elif gen_type == "lognormal":
                mean = gen.get("mean", 50)
                sigma = gen.get("sigma", 1.5)
                val = np.random.lognormal(np.log(max(mean, 0.01)), sigma)
                val = np.clip(val, gen.get("min", 0), gen.get("max", 1e9))
                return round(float(val), 2)

            elif gen_type == "uniform_int":
                return random.randint(gen.get("min", 0), gen.get("max", 100))

            elif gen_type == "uniform_float":
                return round(
                    random.uniform(gen.get("min", 0.0), gen.get("max", 1.0)), 4
                )

            elif gen_type == "boolean":
                return random.random() < gen.get("weight", 0.5)

            elif gen_type == "random_date":
                days_min = gen.get("days_ago_min", 0)
                days_max = gen.get("days_ago_max", 365)
                dt = datetime.now() - timedelta(
                    days=random.randint(days_min, days_max),
                    hours=random.randint(0, 23),
                    minutes=random.randint(0, 59),
                )
                return dt.strftime("%Y-%m-%dT%H:%M:%S")

        return None

    def generate_entity(self, entity_name: str, row_count: int) -> List[Dict]:
        """Generate rows for a single entity."""
        entity_def = self.resolve_entity(entity_name)
        if not entity_def:
            print(f"[WARN] Entity {entity_name} not found in references")
            return []

        columns = entity_def.get("columns", {})
        rows = []

        for _ in range(row_count):
            row = {}
            for col_name, col_def in columns.items():
                row[col_name] = self.generate_value(col_def, self.generated_ids)
            rows.append(row)

        pk_cols = entity_def.get("key_columns", [])
        if pk_cols and pk_cols[0] in columns:
            self.generated_ids[entity_name] = [
                row[pk_cols[0]] for row in rows
            ]

        return rows

    def apply_segment_multiplier(self, base_count: int, segment: str) -> int:
        """Apply behavior profile multiplier based on customer segment."""
        profiles = self.behavior.get("segment_profiles", {})
        profile = profiles.get(segment, profiles.get("Standard", {}))
        multiplier = profile.get("transaction_multiplier", 1.0)
        return max(1, int(base_count * multiplier))


def save_parquet(rows: List[Dict], path: Path) -> int:
    if not rows:
        return 0
    path.parent.mkdir(parents=True, exist_ok=True)
    table = pa.Table.from_pylist(rows)
    pq.write_table(table, path, compression='snappy')
    return len(rows)


def default_row_counts(quick: bool) -> Dict[str, int]:
    """Default row counts by entity type."""
    if quick:
        return {
            "CUSTOMER": 100, "TRANSACTION": 500, "ORDER": 300,
            "PRODUCT": 50, "ADDRESS": 150, "EVENT": 1000,
        }
    return {
        "CUSTOMER": 10000, "TRANSACTION": 50000, "ORDER": 30000,
        "PRODUCT": 500, "ADDRESS": 15000, "EVENT": 100000,
    }


def main():
    parser = argparse.ArgumentParser(
        description="ISF Solution Data Generator — config-driven synthetic data",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument("--entities-dir", required=True,
                        help="Path to entity YAML directory")
    parser.add_argument("--industry", "-i", required=True,
                        help="Industry name (matches YAML filename)")
    parser.add_argument("--behavior-profiles",
                        help="Path to behavior-profiles.yaml")
    parser.add_argument("--output", "-o", default="src/data_engine/output",
                        help="Output directory for Parquet files")
    parser.add_argument("--entity", "-e",
                        help="Generate a single entity only")
    parser.add_argument("--quick", "-q", action="store_true",
                        help="Quick mode: reduced row counts")
    parser.add_argument("--rows", "-r", type=int,
                        help="Override row count for all entities")
    args = parser.parse_args()

    gen = EntityGenerator(
        entities_dir=args.entities_dir,
        industry=args.industry,
        behavior_profiles_path=args.behavior_profiles,
        quick_mode=args.quick,
    )

    output_dir = Path(args.output)
    row_defaults = default_row_counts(args.quick)

    if args.entity:
        entity_names = [args.entity]
    else:
        entity_names = gen.get_all_entity_names()

    ordered = gen.determine_generation_order(entity_names)

    manifest = {
        "seed": SEED,
        "industry": args.industry,
        "quick_mode": args.quick,
        "generated_at": datetime.utcnow().isoformat(),
        "entities": [],
    }

    print(f"ISF Data Generator")
    print(f"Industry: {args.industry}")
    print(f"Mode: {'Quick' if args.quick else 'Full'}")
    print(f"Entities: {len(ordered)}")
    print(f"Output: {output_dir}")
    print()

    for entity_name in ordered:
        count = args.rows or row_defaults.get(entity_name, 1000 if not args.quick else 100)
        print(f"  Generating {entity_name}: {count:,} rows...", end=" ")

        rows = gen.generate_entity(entity_name, count)
        path = output_dir / f"{entity_name.lower()}.parquet"
        written = save_parquet(rows, path)

        print(f"[OK] {written:,} rows -> {path}")

        manifest["entities"].append({
            "entity": entity_name,
            "rows": written,
            "file": str(path),
        })

    manifest_path = output_dir / "manifest.json"
    manifest_path.parent.mkdir(parents=True, exist_ok=True)
    with open(manifest_path, "w") as f:
        json.dump(manifest, f, indent=2)

    total = sum(e["rows"] for e in manifest["entities"])
    print(f"\n[OK] Generation complete. {len(manifest['entities'])} entities, {total:,} total rows.")
    print(f"[OK] Manifest: {manifest_path}")
    print(f"[OK] Seed: {SEED}")
    print("Remember: commit generated files to version control.")


if __name__ == "__main__":
    main()
