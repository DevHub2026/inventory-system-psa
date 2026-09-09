<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Modules\AI\Services\OllamaService;
use Illuminate\Support\Facades\Http;
use Illuminate\Http\Client\ConnectionException;
use Exception;
use Illuminate\Foundation\Testing\RefreshDatabase;

class OllamaServiceTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_returns_response_on_successful_connection()
    {
        // Mock the HTTP response from Ollama
        Http::fake([
            '127.0.0.1:11434/api/generate' => Http::response([
                'model' => 'qwen2.5:7b',
                'response' => 'Hello! I am a local AI assistant.',
                'done' => true
            ], 200)
        ]);

        $service = new OllamaService();
        $response = $service->generate('Who are you?');

        $this->assertEquals('Hello! I am a local AI assistant.', $response);
    }

    public function test_it_throws_friendly_exception_on_connection_failure()
    {
        // Mock a connection exception (e.g. Ollama daemon not running)
        Http::fake(function () {
            throw new ConnectionException('cURL error 7: Failed to connect');
        });

        $this->expectException(Exception::class);
        $this->expectExceptionMessage('The Local AI Assistant is currently offline or unreachable.');

        $service = new OllamaService();
        $service->generate('Hello?');
    }

    public function test_it_throws_friendly_exception_on_server_error()
    {
        // Mock a 500 error from Ollama
        Http::fake([
            '127.0.0.1:11434/api/generate' => Http::response('Internal Server Error', 500)
        ]);

        $this->expectException(Exception::class);
        $this->expectExceptionMessage('Local AI Assistant returned an error.');

        $service = new OllamaService();
        $service->generate('Hello?');
    }
}
