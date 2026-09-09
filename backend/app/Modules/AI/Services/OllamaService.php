<?php

namespace App\Modules\AI\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Http\Client\ConnectionException;
use Exception;

class OllamaService
{
    protected string $baseUrl;
    protected int $timeout;

    public function __construct()
    {
        $this->baseUrl = config('ai.ollama.base_url', 'http://127.0.0.1:11434');
        $this->timeout = config('ai.ollama.timeout', 120);
    }

    public function getActiveModel(): string
    {
        $setting = \App\Models\SystemSetting::where('key', 'ai.active_model')->first();
        if ($setting && !empty($setting->value)) {
            return $setting->getStringValue();
        }
        return config('ai.ollama.model', 'qwen2.5:3b');
    }

    public function getModels(): array
    {
        try {
            $response = Http::timeout(5)->get(rtrim($this->baseUrl, '/') . '/api/tags');
            if ($response->successful()) {
                $data = $response->json();
                return array_map(function($model) {
                    return $model['name'];
                }, $data['models'] ?? []);
            }
            return [];
        } catch (\Throwable $e) {
            return [];
        }
    }

    /**
     * Send a prompt to the Ollama local LLM.
     * 
     * @param string $prompt
     * @param string $systemPrompt
     * @return string
     * @throws Exception
     */
    public function chat(array $messages, array $tools = [], ?string $model = null): array
    {
        try {
            $payload = [
                'model' => $model ?? $this->getActiveModel(),
                'messages' => $messages,
                'stream' => false,
            ];

            if (!empty($tools)) {
                $payload['tools'] = array_map(function($tool) {
                    return [
                        'type' => 'function',
                        'function' => [
                            'name' => $tool['name'],
                            'description' => $tool['description'],
                            'parameters' => $tool['parameters'],
                        ]
                    ];
                }, $tools);
            }

            $response = Http::timeout($this->timeout)
                ->post(rtrim($this->baseUrl, '/') . '/api/chat', $payload);

            if ($response->successful()) {
                return $response->json();
            }

            Log::error('Ollama API error', ['status' => $response->status(), 'body' => $response->body()]);
            throw new Exception("Local AI Assistant returned an error.");
        } catch (ConnectionException $e) {
            Log::error('Ollama connection timeout or refused', ['exception' => $e->getMessage()]);
            throw new Exception("The Local AI Assistant is currently offline or unreachable.");
        } catch (\Exception $e) {
            Log::error('Ollama generic error', ['exception' => $e->getMessage()]);
            if ($e->getMessage() === "Local AI Assistant returned an error.") { throw $e; }
            throw new Exception("An unexpected error occurred with the AI Assistant.");
        }
    }

    public function generate(string $prompt, string $systemPrompt = ''): string
    {
        try {
            $payload = [
                'model' => $this->getActiveModel(),
                'prompt' => $prompt,
                'stream' => false,
            ];

            if (!empty($systemPrompt)) {
                $payload['system'] = $systemPrompt;
            }

            $response = Http::timeout($this->timeout)
                ->post(rtrim($this->baseUrl, '/') . '/api/generate', $payload);

            if ($response->successful()) {
                $data = $response->json();
                return $data['response'] ?? '';
            }

            Log::error('Ollama API error', ['status' => $response->status(), 'body' => $response->body()]);
            throw new Exception("Local AI Assistant returned an error.");
        } catch (ConnectionException $e) {
            Log::error('Ollama connection timeout or refused', ['exception' => $e->getMessage()]);
            throw new Exception("The Local AI Assistant is currently offline or unreachable.");
        } catch (\Exception $e) {
            Log::error('Ollama generic error', ['exception' => $e->getMessage()]);
            if ($e->getMessage() === "Local AI Assistant returned an error.") { throw $e; }
            throw new Exception("An unexpected error occurred with the AI Assistant.");
        }
    }
}



