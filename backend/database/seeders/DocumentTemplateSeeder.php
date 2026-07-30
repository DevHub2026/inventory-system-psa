<?php

namespace Database\Seeders;

use App\Modules\SystemSetup\Models\DocumentTemplate;
use Illuminate\Database\Seeder;

class DocumentTemplateSeeder extends Seeder
{
    public function run(): void
    {
        $templates = [
            [
                'name' => 'Borrow Receipt',
                'document_type' => 'borrow_receipt',
                'description' => 'Official property borrow receipt. Upload a DOCX file containing supported placeholders.',
            ],
            [
                'name' => 'Return Receipt',
                'document_type' => 'return_receipt',
                'description' => 'Official return receipt. Upload a DOCX file containing supported placeholders.',
            ],
            [
                'name' => 'Asset Issuance Receipt (PAR)',
                'document_type' => 'issuance',
                'description' => 'Property Acknowledgement Receipt (PAR). Upload the official DOCX form with placeholders.',
            ],
            [
                'name' => 'Property Transfer Receipt',
                'document_type' => 'property_transfer',
                'description' => 'Property transfer report. Upload a DOCX file containing supported placeholders.',
            ],
            [
                'name' => 'Clearance Certificate',
                'document_type' => 'clearance',
                'description' => 'Property clearance certificate. Upload a DOCX file containing supported placeholders.',
            ],
            [
                'name' => 'Asset Re-Issuance Form',
                'document_type' => 'reissuance',
                'description' => 'Asset re-issuance form. Upload a DOCX file containing supported placeholders.',
            ],
        ];

        foreach ($templates as $data) {
            DocumentTemplate::query()->firstOrCreate(
                ['document_type' => $data['document_type']],
                array_merge($data, [
                    'version' => '1.0',
                    'status' => 'inactive',
                    'is_default' => false,
                    'file_path' => null,
                    'file_name' => null,
                    'file_size' => 0,
                    'validation_status' => null,
                    'has_unknown_placeholders' => false,
                ])
            );
        }
    }
}
