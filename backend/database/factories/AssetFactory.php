<?php

namespace Database\Factories;

use App\Modules\Asset\Enums\AssetStatus;
use App\Modules\Asset\Enums\ConditionStatus;
use App\Models\Asset;
use App\Models\AssetCategory;
use App\Models\Location;
use App\Models\Manufacturer;
use App\Models\Office;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Asset>
 */
class AssetFactory extends Factory
{
    protected $model = Asset::class;

    public function definition(): array
    {
        return [
            'asset_number' => 'AST-'.fake()->unique()->numerify('######'),
            'name' => fake()->words(3, true),
            'description' => fake()->optional()->sentence(),
            'asset_category_id' => AssetCategory::factory(),
            'manufacturer_id' => Manufacturer::factory(),
            'office_id' => Office::factory(),
            'location_id' => Location::factory(),
            'model' => fake()->bothify('Model-###'),
            'status' => AssetStatus::AVAILABLE->value,
            'condition_status' => ConditionStatus::GOOD->value,
            'purchase_date' => fake()->dateTimeBetween('-2 years', 'now')->format('Y-m-d'),
            'purchase_cost' => fake()->randomFloat(2, 1000, 100000),
            'remarks' => fake()->optional()->sentence(),
        ];
    }
}
