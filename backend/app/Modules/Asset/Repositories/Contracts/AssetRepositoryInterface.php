<?php

namespace App\Modules\Asset\Repositories\Contracts;

use App\Models\Asset;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface AssetRepositoryInterface
{
    public function all(array $filters = []): LengthAwarePaginator;

    public function find(int $id): Asset;

    public function create(array $data): Asset;

    public function update(Asset $asset, array $data): Asset;

    public function delete(Asset $asset): void;

    public function findByAssetNumber(string $assetNumber): ?Asset;

    public function findByStatus(string $status): LengthAwarePaginator;
}
