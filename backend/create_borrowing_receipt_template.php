<?php

/**
 * One-off generator for a sample Borrowing Receipt DOCX template.
 *
 * Uses ONLY placeholders registered and resolvable for BORROWING_RECEIPT.
 * The generated file is validated with the project's existing
 * DocxTemplateService::validateFile() pipeline.
 *
 * Does NOT touch the database, does NOT create/activate a DocumentTemplate row,
 * and does NOT modify workflow logic.
 */

use App\Modules\SystemSetup\Services\DocxTemplateService;
use App\Modules\SystemSetup\Services\PlaceholderRegistry;
use PhpOffice\PhpWord\IOFactory;
use PhpOffice\PhpWord\PhpWord;
use PhpOffice\PhpWord\Shared\Converter;
use PhpOffice\PhpWord\SimpleType\Jc;

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
/** @var \Illuminate\Contracts\Console\Kernel $kernel */
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

/*
 * 1. Verify the exact BORROWING_RECEIPT placeholder set — no guessing.
 */
$supportedDefs = PlaceholderRegistry::forUsageContext('BORROWING_RECEIPT');
$supported     = array_map(static fn (array $d) => $d['key'], $supportedDefs);
sort($supported);

$usedPlaceholders = [
    // System / organization
    'organization_name',
    'generated_date',
    'current_date',
    'current_time',
    'generated_by',
    'prepared_by',
    // Borrower
    'employee_name',
    'employee_number',
    'employee_email',
    'department_name',
    'office_name',
    // Borrowing dates
    'borrow_date',
    'due_date',
    // Asset / equipment
    'asset_name',
    'asset_description',
    'property_number',
    'asset_number',
    'serial_number',
    'asset_category',
    'asset_condition',
    'asset_status',
    'model',
];

$unsupported = array_values(array_diff($usedPlaceholders, $supported));
if ($unsupported !== []) {
    fwrite(STDERR, 'CRITICAL: Unsupported placeholders would be used: '.implode(', ', $unsupported).PHP_EOL);
    fwrite(STDERR, 'Supported BORROWING_RECEIPT placeholders: '.implode(', ', $supported).PHP_EOL);
    exit(1);
}

/*
 * 2. Build the A4 sample template (clean official PSA-government style).
 */
$phpWord = new PhpWord();
$phpWord->setDefaultFontName('Times New Roman');
$phpWord->setDefaultFontSize(11);

$section = $phpWord->addSection([
    'pageSizeW'    => Converter::cmToTwip(21.0),
    'pageSizeH'    => Converter::cmToTwip(29.7),
    'marginTop'    => Converter::cmToTwip(1.4),
    'marginBottom' => Converter::cmToTwip(1.4),
    'marginLeft'   => Converter::cmToTwip(1.8),
    'marginRight'  => Converter::cmToTwip(1.8),
]);

// Named styles
$phpWord->addFontStyle('OrgLine',     ['name' => 'Arial', 'size' => 12, 'bold' => true, 'color' => '1F1F1F']);
$phpWord->addFontStyle('OrgName',     ['name' => 'Arial', 'size' => 14, 'bold' => true, 'color' => '003DA5']);
$phpWord->addFontStyle('SubLine',     ['name' => 'Arial', 'size' => 11, 'color' => '333333']);
$phpWord->addFontStyle('DocTitle',    ['name' => 'Arial', 'size' => 18, 'bold' => true, 'color' => '003DA5']);
$phpWord->addFontStyle('Label',       ['name' => 'Arial', 'size' => 10, 'bold' => true, 'color' => '1F4E79']);
$phpWord->addFontStyle('Value',       ['name' => 'Times New Roman', 'size' => 11]);
$phpWord->addFontStyle('SectionTitle',['name' => 'Arial', 'size' => 11, 'bold' => true, 'color' => 'FFFFFF']);
$phpWord->addFontStyle('SmallItalic', ['name' => 'Arial', 'size' => 9, 'italic' => true, 'color' => '666666']);
$phpWord->addFontStyle('FooterText',  ['name' => 'Arial', 'size' => 8.5, 'color' => '666666']);

/*
 * ── Header: Republic / PSA Region XII ──────────────────────────────
 */
$section->addText('Republic of the Philippines', 'OrgLine', ['alignment' => Jc::CENTER]);
$section->addText('{{organization_name}}', 'OrgName', ['alignment' => Jc::CENTER]);
$section->addText('Regional Statistical Services Office XII', 'SubLine', ['alignment' => Jc::CENTER]);
$section->addText('Koronadal City, South Cotabato', 'SubLine', ['alignment' => Jc::CENTER]);

// Logo placeholder box — static label only (no placeholder syntax, so it is never scanned)
$section->addText('', 'SubLine');
$logoTable = $section->addTable(['borderSize' => 6, 'borderColor' => 'BFBFBF', 'cellMargin' => 60]);
$logoRow   = $logoTable->addRow(Converter::cmToTwip(1.2));
$logoCell  = $logoRow->addCell(Converter::cmToTwip(5.0), ['alignment' => Jc::CENTER, 'valign' => 'center']);
$logoCell->addText('[ PSA LOGO ]', ['name' => 'Arial', 'size' => 10, 'italic' => true, 'color' => '999999'], ['alignment' => Jc::CENTER]);

/*
 * ── Title ─────────────────────────────────────────────────────────
 */
$section->addText('', 'SubLine');
$section->addText('BORROWING RECEIPT', 'DocTitle', ['alignment' => Jc::CENTER]);
$section->addText('', 'SubLine');

/*
 * ── Receipt number (static blank — no registered placeholder exists) ─
 */
$receiptTable = $section->addTable(['cellMargin' => 60]);
$receiptRow   = $receiptTable->addRow();
$receiptRow->addCell(Converter::cmToTwip(9.0))->addText('Receipt No.: ________________________', 'Label');
$receiptRow->addCell(Converter::cmToTwip(8.4))->addText('Date: ______________________________', 'Label');

/*
 * ── Section banner helper state ────────────────────────────────────
 */
$sectionWidth = Converter::cmToTwip(17.4);
$labelWidth   = Converter::cmToTwip(5.6);
$valueWidth   = Converter::cmToTwip(11.8);

function addSectionBanner(PhpWord $phpWord, $section, string $title): void
{
    $name = 'SectionBanner_'.str_replace(' ', '_', $title);
    $phpWord->addFontStyle($name, ['name' => 'Arial', 'size' => 11, 'bold' => true, 'color' => 'FFFFFF']);

    $table = $section->addTable(['borderSize' => 6, 'borderColor' => 'BFBFBF', 'cellMargin' => 80]);
    $row   = $table->addRow(Converter::cmToTwip(0.7));
    $cell  = $row->addCell(Converter::cmToTwip(17.4), ['shading' => ['fill' => '1F4E79']]);
    $cell->addText($title, $name);
}

function addInfoTable($section, array $rows, int $labelWidth, int $valueWidth): void
{
    $table = $section->addTable(['borderSize' => 6, 'borderColor' => 'BFBFBF', 'cellMargin' => 80]);

    foreach ($rows as [$label, $value]) {
        $row = $table->addRow(Converter::cmToTwip(0.85));
        $lc  = $row->addCell($labelWidth, ['shading' => ['fill' => 'E8F0FE']]);
        $lc->addText($label, 'Label');
        $vc = $row->addCell($valueWidth);
        $vc->addText($value, 'Value');
    }
}

/*
 * ── 1. Borrower Information ────────────────────────────────────────
 */
addSectionBanner($phpWord, $section, 'BORROWER INFORMATION');
addInfoTable($section, [
    ['Employee Name:', '{{employee_name}}'],
    ['Employee Number:', '{{employee_number}}'],
    ['Office / Division:', '{{office_name}}'],
    ['Department:', '{{department_name}}'],
    ['Email Address:', '{{employee_email}}'],
], $labelWidth, $valueWidth);

$section->addText('', 'Value');

/*
 * ── 2. Borrowing Information ───────────────────────────────────────
 */
addSectionBanner($phpWord, $section, 'BORROWING INFORMATION');
addInfoTable($section, [
    ['Borrow Date:', '{{borrow_date}}'],
    ['Due Date:', '{{due_date}}'],
], $labelWidth, $valueWidth);

$section->addText('', 'Value');

/*
 * ── 3. Asset / Equipment Information ───────────────────────────────
 */
addSectionBanner($phpWord, $section, 'ASSET / EQUIPMENT INFORMATION');
addInfoTable($section, [
    ['Asset Name:', '{{asset_name}}'],
    ['Property Number:', '{{property_number}}'],
    ['Asset Number:', '{{asset_number}}'],
    ['Serial Number:', '{{serial_number}}'],
    ['Category:', '{{asset_category}}'],
    ['Model:', '{{model}}'],
    ['Condition:', '{{asset_condition}}'],
    ['Asset Status:', '{{asset_status}}'],
    ['Description:', '{{asset_description}}'],
], $labelWidth, $valueWidth);

$section->addText('', 'Value');

/*
 * ── 4. Purpose / Remarks (static — no registered placeholder) ──────
 */
$section->addText('PURPOSE / REMARKS', 'Label');
$section->addText('______________________________________________________________________________', 'Value');
$section->addText('______________________________________________________________________________', 'Value');
$section->addText('______________________________________________________________________________', 'Value');
$section->addText('', 'Value');

/*
 * ── 5. Terms of borrowing ──────────────────────────────────────────
 */
$section->addText(
    'I/We acknowledge receipt of the above-described property in good condition and agree to return it '
    .'on or before the due date indicated above. I/We shall be responsible for any loss or damage to the '
    .'property while it is in my/our custody.',
    'Value'
);

$section->addText('', 'Value');

/*
 * ── 6. Signatures ──────────────────────────────────────────────────
 */
$sigTable = $section->addTable(['cellMargin' => 60]);
$sigRow   = $sigTable->addRow(Converter::cmToTwip(3.6));

$left = $sigRow->addCell(Converter::cmToTwip(8.5));
$left->addText('Borrower / Requester', 'Label');
$left->addText('', 'Value');
$left->addText('_________________________________', 'Value');
$left->addText('Signature over Printed Name', 'SmallItalic');
$left->addText('Date: ______________________', 'Value');

$right = $sigRow->addCell(Converter::cmToTwip(8.9));
$right->addText('Releasing Officer / Authorized Officer', 'Label');
$right->addText('', 'Value');
$right->addText('_________________________________', 'Value');
$right->addText('Signature over Printed Name', 'SmallItalic');
$right->addText('Date: ______________________', 'Value');

$section->addText('', 'Value');
$section->addText('Prepared By: {{prepared_by}}', 'Label');

$section->addText('', 'Value');
$section->addText(
    'This document was system-generated. Generated on {{generated_date}} at {{current_time}} by {{generated_by}}.',
    'FooterText',
    ['alignment' => Jc::CENTER]
);

/*
 * 3. Save.
 */
$dir = dirname(__DIR__).'/docs/sample-templates';
if (! is_dir($dir)) {
    mkdir($dir, 0755, true);
}
$absolutePath = $dir.'/Borrowing_Receipt_Sample.docx';

$writer = IOFactory::createWriter($phpWord, 'Word2007');
$writer->save($absolutePath);

/*
 * 4. Validate using the project's existing DOCX template validation pipeline.
 */
$docxService = new DocxTemplateService();
$validation  = $docxService->validateFile($absolutePath);

$result = [
    'path'                     => realpath($absolutePath),
    'placeholders_used'        => $usedPlaceholders,
    'placeholders_found'       => $validation['placeholders'],
    'valid_placeholders'       => $validation['valid'],
    'unknown_placeholders'     => $validation['unknown'],
    'validation_status'        => $validation['validation_status'],
    'is_valid'                 => $validation['is_valid'],
    'ready_to_upload_activate' => $validation['is_valid'] && $validation['unknown'] === [],
];

echo json_encode($result, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES).PHP_EOL;

if ($result['ready_to_upload_activate'] !== true) {
    exit(1);
}