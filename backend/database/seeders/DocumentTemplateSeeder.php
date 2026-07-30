<?php

namespace Database\Seeders;

use App\Modules\SystemSetup\Models\DocumentTemplate;
use App\Modules\SystemSetup\Services\DocumentTemplateService;
use Illuminate\Database\Seeder;

class DocumentTemplateSeeder extends Seeder
{
    public function run(): void
    {
        $templates = [
            [
                'name' => 'Borrow Receipt',
                'document_type' => 'borrow_receipt',
                'description' => 'Official property borrow receipt template used when employees borrow equipment or assets.',
                'version' => '1.0',
                'status' => 'active',
                'is_default' => true,
            ],
            [
                'name' => 'Return Receipt',
                'document_type' => 'return_receipt',
                'description' => 'Official return receipt template issued when borrowed property is returned to inventory.',
                'version' => '1.0',
                'status' => 'active',
                'is_default' => true,
            ],
            [
                'name' => 'Asset Issuance Receipt',
                'document_type' => 'issuance',
                'description' => 'Property Acknowledgement Receipt (PAR) for permanent property issuance to employees.',
                'version' => '1.0',
                'status' => 'active',
                'is_default' => true,
            ],
            [
                'name' => 'Property Transfer Receipt',
                'document_type' => 'property_transfer',
                'description' => 'Property transfer report template for transferring asset accountability between departments or custodians.',
                'version' => '1.0',
                'status' => 'active',
                'is_default' => true,
            ],
            [
                'name' => 'Clearance Certificate',
                'document_type' => 'clearance',
                'description' => 'Property clearance certificate verifying an employee has no outstanding property accountabilities.',
                'version' => '1.0',
                'status' => 'active',
                'is_default' => true,
            ],
            [
                'name' => 'Asset Re-Issuance Form',
                'document_type' => 'reissuance',
                'description' => 'Official form for transferring permanent asset accountability between employees.',
                'version' => '1.0',
                'status' => 'active',
                'is_default' => true,
            ],
        ];

        foreach ($templates as $data) {
            $preset = DocumentTemplateService::getDefaultPreset($data['document_type']);
            DocumentTemplate::firstOrCreate(
                ['document_type' => $data['document_type']],
                array_merge($data, $preset, [
                    'paper_size' => 'A4',
                    'orientation' => 'portrait',
                    'margin_top' => 25,
                    'margin_bottom' => 25,
                    'margin_left' => 25,
                    'margin_right' => 25,
                    'font_family' => 'Arial',
                    'font_size' => 12,
                    'text_alignment' => 'left',
                ])
            );
        }
    }
}
