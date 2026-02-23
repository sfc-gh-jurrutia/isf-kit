#!/usr/bin/env python3
"""Synthetic data generator template.

Usage:
    python3 utils/generate_synthetic_data.py --output-dir data/synthetic

Three rules:
    1. RANDOM_SEED = 42 — always use the same seed for reproducibility
    2. Generate once, commit CSVs to the repo
    3. Never run this during deployment — data ships pre-generated
"""

import argparse
import csv
import random
from datetime import datetime, timedelta
from pathlib import Path

# CRITICAL: Fixed seed ensures reproducible data across all environments
RANDOM_SEED = 42

CATEGORIES = [
    "Category_A", "Category_B", "Category_C",
    "Category_D", "Category_E",
]

NAMES = [
    "Alpha", "Beta", "Gamma", "Delta", "Epsilon",
    "Zeta", "Eta", "Theta", "Iota", "Kappa",
]


def generate_sample_data(num_rows: int = 1000) -> list[dict]:
    """Generate sample records with realistic field values."""
    base_date = datetime(2024, 1, 1)
    records: list[dict] = []

    for i in range(1, num_rows + 1):
        offset_days = random.randint(0, 364)
        records.append({
            "id": i,
            "name": f"{random.choice(NAMES)}_{i:05d}",
            "category": random.choice(CATEGORIES),
            "value": round(random.uniform(10.0, 10000.0), 2),
            "created_date": (base_date + timedelta(days=offset_days)).strftime("%Y-%m-%d"),
        })

    return records


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate synthetic demo data")
    parser.add_argument(
        "--output-dir",
        default="data/synthetic",
        help="Directory to write CSV files (default: data/synthetic)",
    )
    parser.add_argument(
        "--num-rows",
        type=int,
        default=1000,
        help="Number of rows to generate (default: 1000)",
    )
    args = parser.parse_args()

    random.seed(RANDOM_SEED)

    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    data = generate_sample_data(args.num_rows)

    output_file = output_dir / "sample_data.csv"
    with open(output_file, "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=["id", "name", "category", "value", "created_date"])
        writer.writeheader()
        writer.writerows(data)

    print(f"Generated {len(data)} rows (seed={RANDOM_SEED})")
    print(f"Output: {output_file}")
    print("Remember: commit this file to the repo — never regenerate at deploy time.")


if __name__ == "__main__":
    main()
