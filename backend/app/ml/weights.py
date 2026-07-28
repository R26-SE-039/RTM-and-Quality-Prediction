"""Shared weighted-formula baseline used both to label synthetic training
data and as a runtime fallback when no trained model is available.
"""

FEATURE_ORDER = [
    "assertion_strength",
    "coverage_percent",
    "boundary_coverage",
    "error_handling",
    "mutation_resistance",
]

WEIGHTS = {
    "assertion_strength": 0.25,
    "coverage_percent": 0.30,
    "boundary_coverage": 0.20,
    "error_handling": 0.15,
    "mutation_resistance": 0.10,
}

QUALITY_REJECT_THRESHOLD = 60.0


def weighted_score(features: dict) -> float:
    score = sum(features[key] * WEIGHTS[key] for key in FEATURE_ORDER)
    return max(0.0, min(100.0, score))
