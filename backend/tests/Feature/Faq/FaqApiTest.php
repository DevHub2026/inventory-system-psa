<?php

namespace Tests\Feature\Faq;

use App\Enums\UserRole;
use App\Http\Controllers\FaqController;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Tests\TestCase;

class FaqApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_system_admin_can_create_shared_faq_and_employee_can_read_updated_destination(): void
    {
        $admin = User::factory()->create();
        $admin->roles()->detach();
        $admin->assignRole(UserRole::SYSTEM_ADMINISTRATOR->value);

        $employee = User::factory()->create();
        $employee->roles()->detach();
        $employee->assignRole('Employee');

        $controller = new FaqController();

        $createRequest = Request::create('/api/v1/faqs', 'POST', [
            'question' => 'How do I borrow a test asset?',
            'answer' => 'Open Borrowings and select the asset you need before continuing the borrowing flow.',
            'category' => 'Borrowing',
            'roles' => ['Employee'],
            'destination' => '/borrowings',
            'keywords' => ['borrow', 'asset'],
        ]);
        $createRequest->setUserResolver(fn () => $admin);

        $createResponse = $controller->store($createRequest);
        $this->assertSame(201, $createResponse->getStatusCode());

        $payload = json_decode($createResponse->getContent(), true);
        $faqId = $payload['data']['id'];

        $employeeRequest = Request::create('/api/v1/faqs', 'GET');
        $employeeRequest->setUserResolver(fn () => $employee);
        $employeeResponse = $controller->index($employeeRequest);
        $employeeData = json_decode($employeeResponse->getContent(), true)['data'];

        $this->assertTrue(collect($employeeData)->contains(fn (array $faq) => $faq['question'] === 'How do I borrow a test asset?'));
        $this->assertTrue(collect($employeeData)->contains(fn (array $faq) => $faq['destination'] === '/borrowings'));

        $updateRequest = Request::create('/api/v1/faqs/'.$faqId, 'PUT', [
            'question' => 'How do I borrow a test asset?',
            'answer' => 'Open Borrowings and select the asset you need before continuing the borrowing flow.',
            'category' => 'Borrowing',
            'roles' => ['Employee'],
            'destination' => '/borrow',
            'keywords' => ['borrow', 'asset'],
            'active' => true,
        ]);
        $updateRequest->setUserResolver(fn () => $admin);

        $updateResponse = $controller->update($updateRequest, \App\Models\Faq::findOrFail($faqId));
        $this->assertSame(200, $updateResponse->getStatusCode());
        $this->assertSame('/borrow', json_decode($updateResponse->getContent(), true)['data']['destination']);

        $refreshRequest = Request::create('/api/v1/faqs', 'GET');
        $refreshRequest->setUserResolver(fn () => $employee);
        $refreshData = json_decode($controller->index($refreshRequest)->getContent(), true)['data'];

        $this->assertTrue(collect($refreshData)->contains(fn (array $faq) => $faq['destination'] === '/borrow'));
        $this->assertFalse(collect($refreshData)->contains(fn (array $faq) => $faq['destination'] === '/borrowings' && $faq['question'] === 'How do I borrow a test asset?'));
    }

    public function test_faq_visibility_respects_roles_and_admin_only_writes(): void
    {
        $admin = User::factory()->create();
        $admin->roles()->detach();
        $admin->assignRole(UserRole::SUPER_ADMINISTRATOR->value);

        $employee = User::factory()->create();
        $employee->roles()->detach();
        $employee->assignRole('Employee');

        $controller = new FaqController();

        $createEmployeeFaq = Request::create('/api/v1/faqs', 'POST', [
            'question' => 'Employee-only help test role gate',
            'answer' => 'This FAQ is only visible to employees and should appear for the employee account.',
            'category' => 'General',
            'roles' => ['Employee'],
            'destination' => '/borrowings',
        ]);
        $createEmployeeFaq->setUserResolver(fn () => $admin);
        $this->assertSame(201, $controller->store($createEmployeeFaq)->getStatusCode());

        $createAdminFaq = Request::create('/api/v1/faqs', 'POST', [
            'question' => 'Admin-only help test role gate',
            'answer' => 'This FAQ should not be visible to employees or other users without the admin roles.',
            'category' => 'Administration',
            'roles' => ['System Administrator'],
            'destination' => '/system-setup',
        ]);
        $createAdminFaq->setUserResolver(fn () => $admin);
        $this->assertSame(201, $controller->store($createAdminFaq)->getStatusCode());

        $employeeListRequest = Request::create('/api/v1/faqs', 'GET');
        $employeeListRequest->setUserResolver(fn () => $employee);
        $employeeFaqs = json_decode($controller->index($employeeListRequest)->getContent(), true)['data'];

        $this->assertTrue(collect($employeeFaqs)->contains(fn (array $faq) => $faq['question'] === 'Employee-only help test role gate'));
        $this->assertFalse(collect($employeeFaqs)->contains(fn (array $faq) => $faq['question'] === 'Admin-only help test role gate'));

        $forbiddenRequest = Request::create('/api/v1/faqs', 'POST', [
            'question' => 'Employee should not create faq test role gate',
            'answer' => 'This should be forbidden.',
            'destination' => '/borrowings',
        ]);
        $forbiddenRequest->setUserResolver(fn () => $employee);

        $this->assertSame(403, $controller->store($forbiddenRequest)->getStatusCode());
    }

    public function test_employee_cannot_edit_or_delete_faqs(): void
    {
        $admin = User::factory()->create();
        $admin->roles()->detach();
        $admin->assignRole(UserRole::SYSTEM_ADMINISTRATOR->value);

        $employee = User::factory()->create();
        $employee->roles()->detach();
        $employee->assignRole('Employee');

        $controller = new FaqController();
        $faq = \App\Models\Faq::query()->create([
            'question' => 'Employee should not update this FAQ',
            'answer' => 'This record should stay protected from employee edits.',
            'category' => 'General',
            'roles' => ['Employee'],
            'destination' => '/borrowings',
            'active' => true,
        ]);

        $updateRequest = Request::create('/api/v1/faqs/'.$faq->id, 'PUT', [
            'question' => 'Employee should not update this FAQ',
            'answer' => 'This record should stay protected from employee edits.',
            'category' => 'General',
            'roles' => ['Employee'],
            'destination' => '/inventory',
            'active' => true,
        ]);
        $updateRequest->setUserResolver(fn () => $employee);
        $this->assertSame(403, $controller->update($updateRequest, $faq)->getStatusCode());

        $deleteRequest = Request::create('/api/v1/faqs/'.$faq->id, 'DELETE');
        $deleteRequest->setUserResolver(fn () => $employee);
        $this->assertSame(403, $controller->destroy($deleteRequest, $faq)->getStatusCode());
    }
}
