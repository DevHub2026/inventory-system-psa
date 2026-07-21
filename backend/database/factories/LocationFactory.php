<?php

namespace Database\Factories;

use App\Models\Location;
use App\Models\Office;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Location>
 */
class LocationFactory extends Factory
{
    protected $model = Location::class;

    public function definition(): array
    {
        return [
            'office_id' => Office::factory(),
            'name' => fake()->unique()->city().' Storage',
            'code' => strtoupper(fake()->unique()->bothify('LOC-###')),
            'description' => fake()->optional()->sentence(),
            'is_active' => true,
        ];
    }
}
