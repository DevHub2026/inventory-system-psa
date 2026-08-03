<?php

namespace App\Modules\Inventory\Services;

/**
 * Single source of truth for PPE / SE / SUPPLY classification logic.
 *
 * Business rules (verified, from PSA accounting policy):
 *   unit_cost >= 50 000          → PPE   (Property, Plant and Equipment)
 *   unit_cost > 0 and < 50 000  → SE    (Semi-Expendable)
 *   unit_cost = 0 or null        → null  (Manual Review Required)
 *
 * Supply items are NEVER re-classified by price; they remain SUPPLY.
 *
 * Only call classify() for accountable items (PPE or SE candidates).
 * Do NOT call classify() for SUPPLY items.
 */
class InventoryClassificationService
{
    public const PPE_THRESHOLD = 50000.00;

    public const CLASSIFICATION_PPE    = 'PPE';
    public const CLASSIFICATION_SE     = 'SE';
    public const CLASSIFICATION_SUPPLY = 'SUPPLY';

    /**
     * Derive PPE or SE from a numeric unit_cost.
     *
     * Returns an array ready to merge into an InventoryItem update payload:
     *   [classification, classification_reason]
     *
     * Returns ['classification' => null, 'classification_reason' => '...'] when
     * the cost is null/zero — the item must remain unclassified pending manual review.
     *
     * @param  float|int|string|null  $unitCost
     * @return array{classification: string|null, classification_reason: string}
     */
    public static function classify(float|int|string|null $unitCost): array
    {
        if ($unitCost === null || $unitCost === '' || (float) $unitCost <= 0) {
            return [
                'classification'        => null,
                'classification_reason' => 'Manual Review Required: unit cost is missing or zero.',
            ];
        }

        $cost = (float) $unitCost;

        if ($cost >= self::PPE_THRESHOLD) {
            return [
                'classification'        => self::CLASSIFICATION_PPE,
                'classification_reason' => sprintf(
                    'Auto-classified as PPE: unit cost ₱%s meets the ≥ ₱%s threshold.',
                    number_format($cost, 2),
                    number_format(self::PPE_THRESHOLD, 2),
                ),
            ];
        }

        // cost > 0 and cost < 50 000
        return [
            'classification'        => self::CLASSIFICATION_SE,
            'classification_reason' => sprintf(
                'Auto-classified as SE: unit cost ₱%s is below the ₱%s PPE threshold.',
                number_format($cost, 2),
                number_format(self::PPE_THRESHOLD, 2),
            ),
        ];
    }

    /**
     * Return true when the classification should be driven by price.
     *
     * Supply items are excluded — their price is a procurement cost, not an
     * accountability classification trigger.
     */
    public static function shouldClassifyByPrice(?string $currentClassification): bool
    {
        return $currentClassification !== self::CLASSIFICATION_SUPPLY;
    }

    /**
     * Validate that a unit_cost value is acceptable before saving.
     *
     * Throws \InvalidArgumentException for negative values.
     * Returns the cast float (or null for empty/null inputs).
     */
    public static function castAndValidate(mixed $value): ?float
    {
        if ($value === null || $value === '') {
            return null;
        }

        $float = filter_var($value, FILTER_VALIDATE_FLOAT);

        if ($float === false) {
            throw new \InvalidArgumentException('Unit cost must be a valid numeric value.');
        }

        if ($float < 0) {
            throw new \InvalidArgumentException('Unit cost cannot be negative.');
        }

        return $float;
    }
}
