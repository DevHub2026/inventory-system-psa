<?php

namespace App\Modules\AI\Controllers;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use App\Modules\AI\Services\OllamaService;
use App\Modules\AI\Services\AIToolRegistry;
use Exception;

class ChatController extends Controller
{
    public function __construct(
        protected OllamaService $ollamaService,
        protected AIToolRegistry $toolRegistry
    ) {}

    public function chat(Request $request): JsonResponse
    {
        // Prevent PHP from timing out before the Ollama HTTP request does
        // This is crucial for local AI models which may take minutes to load into RAM initially
        set_time_limit(config('ai.ollama.timeout', 120) + 10);

        $request->validate([
            'messages' => 'required|array|max:15',
            'messages.*.role' => 'required|string|in:user,assistant',
            'messages.*.content' => 'nullable|string|max:2000',
        ]);

        $user = $request->user();
        $inputMessages = $request->input('messages');

        // Resolve active model ONCE for the entire request
        $activeModel = $this->ollamaService->getActiveModel();

        // Concurrency Protection: Limit to 2 active AI requests globally
        $lock1 = \Illuminate\Support\Facades\Cache::lock('ai_generation_slot_1', 120);
        $lock2 = \Illuminate\Support\Facades\Cache::lock('ai_generation_slot_2', 120);
        
        $lock = null;
        if ($lock1->get()) {
            $lock = $lock1;
        } elseif ($lock2->get()) {
            $lock = $lock2;
        }

        if (!$lock) {
            return response()->json([
                'success' => false,
                'message' => 'The AI assistant is currently busy. Please try again in a moment.',
                'code' => 'AI_BUSY'
            ], 503);
        }

        try {
            // Force system prompt to strictly follow backend config
            $systemPrompt = config('ai.system_prompt', 'You are a helpful AI assistant.');
            
            $context = $request->input('context', []);
            $roleNames = $user->roles->pluck('name')->join(', ');
            
            $systemPrompt .= "\n\nCurrent Auth Context: Role(s): " . ($roleNames ?: 'Employee');
            if (!empty($context['current_page'])) {
                $systemPrompt .= "\nCurrent User Page Context: " . $context['current_page'];
            }
            
            $messages = [
                ['role' => 'system', 'content' => $systemPrompt]
            ];

            foreach ($inputMessages as $msg) {
                $messages[] = [
                    'role' => $msg['role'],
                    'content' => $msg['content'] ?? ''
                ];
            }

            $availableTools = $this->toolRegistry->getAvailableTools($user);
            $toolUsedIndicator = false;
            $toolsUsedList = [];
            
            $maxIterations = 5;
            $iteration = 0;

            while ($iteration < $maxIterations) {
                $iteration++;
                
                // Pass the pre-resolved model to prevent mid-stream switches
                $ollamaResponse = $this->ollamaService->chat($messages, $availableTools, $activeModel);
                
                $message = $ollamaResponse['message'] ?? [];
                
                if (empty($message)) {
                    throw new Exception("Empty response from local AI");
                }
                
                // Normalize tool_calls arguments: Ollama sometimes returns [] instead of {}
                // for no-argument tools, but fails to re-parse it on the round-trip
                if (isset($message['tool_calls']) && is_array($message['tool_calls'])) {
                    foreach ($message['tool_calls'] as &$tc) {
                        if (isset($tc['function']['arguments']) && is_array($tc['function']['arguments']) && empty($tc['function']['arguments'])) {
                            $tc['function']['arguments'] = new \stdClass();
                        }
                    }
                    unset($tc);
                }
                
                // Append assistant's response to history
                $messages[] = $message;

                // Check if the model decided to call a tool
                if (isset($message['tool_calls']) && is_array($message['tool_calls']) && count($message['tool_calls']) > 0) {
                    
                    foreach ($message['tool_calls'] as $toolCall) {
                        $functionCall = $toolCall['function'] ?? [];
                        $toolName = $functionCall['name'] ?? '';
                        $arguments = $functionCall['arguments'] ?? [];
                        
                        // Normalize arguments to a plain array for executeTool
                        if ($arguments instanceof \stdClass) {
                            $arguments = (array) $arguments;
                        } elseif (is_string($arguments)) {
                            $arguments = json_decode($arguments, true) ?? [];
                        }
                        
                        // Execute tool securely via RBAC-aware registry
                        $result = $this->toolRegistry->executeTool($toolName, $arguments, $user);
                        
                        // Track tool usage for UI indicator (only protected system tools)
                        if ($result['success'] && $toolName !== 'calculate') {
                            $toolUsedIndicator = true;
                            if (!in_array($toolName, $toolsUsedList)) {
                                $toolsUsedList[] = $toolName;
                            }
                        }
                        
                        // Append tool result to messages
                        $messages[] = [
                            'role' => 'tool',
                            'content' => json_encode($result)
                        ];
                    }
                    
                    // The loop continues, sending the tool results back to Ollama
                    continue;
                }
                
                // If no tool was called, this is the final response
                return response()->json([
                    'success' => true,
                    'data' => [
                        'message' => $message['content'] ?? '',
                        'tool_used' => $toolUsedIndicator,
                        'tools_used' => $toolsUsedList
                    ]
                ]);
            }
            
            throw new Exception("Maximum AI reasoning iterations reached.");

        } catch (\Throwable $e) {
            Log::error('AI Chat Error', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'The Local AI Assistant is currently unavailable. Please try again.'
            ], 503);
        } finally {
            // Always release the concurrency lock
            if ($lock) {
                $lock->release();
            }
        }
    }

    public function health(): JsonResponse
    {
        try {
            $baseUrl = config('ai.ollama.base_url', 'http://127.0.0.1:11434');
            $response = \Illuminate\Support\Facades\Http::timeout(5)->get($baseUrl);
            
            if ($response->successful()) {
                return response()->json([
                    'success' => true,
                    'message' => 'AI Assistant is online.'
                ]);
            }
            
            return response()->json([
                'success' => false,
                'message' => 'AI Assistant is unreachable.'
            ], 503);
            
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'AI Assistant is offline.'
            ], 503);
        }
    }

    public function models(Request $request): JsonResponse
    {
        if (!$request->user()->hasPermission('system.settings.update')) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        $installedModels = $this->ollamaService->getModels();
        $approvedModels = config('ai.ollama.approved_models', []);
        
        // Return intersection of installed and approved models
        $availableModels = array_values(array_intersect($approvedModels, $installedModels));
        
        return response()->json([
            'success' => true,
            'data' => [
                'active_model' => $this->ollamaService->getActiveModel(),
                'available_models' => $availableModels,
            ]
        ]);
    }

    public function updateModel(Request $request): JsonResponse
    {
        if (!$request->user()->hasPermission('system.settings.update')) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'model' => 'required|string',
        ]);

        $newModel = $request->input('model');
        $approvedModels = config('ai.ollama.approved_models', []);
        
        if (!in_array($newModel, $approvedModels)) {
            return response()->json(['success' => false, 'message' => 'Model is not approved.'], 400);
        }
        
        $installedModels = $this->ollamaService->getModels();
        if (!in_array($newModel, $installedModels)) {
            return response()->json(['success' => false, 'message' => 'Model is not installed in Ollama.'], 400);
        }

        $oldModel = $this->ollamaService->getActiveModel();

        // Update or create the setting
        $setting = \App\Models\SystemSetting::firstOrNew(['key' => 'ai.active_model']);
        $setting->value = $newModel;
        $setting->type = 'string';
        $setting->description = 'Active Local AI Model';
        $setting->updated_by = $request->user()->id;
        $setting->save();

        // Log audit
        try {
            $auditLogService = app(\App\Modules\AuditLog\Services\AuditLogService::class);
            $auditLogService->log(
                'update',
                'system_settings',
                "Admin changed AI model from {$oldModel} to {$newModel}",
                ['ai.active_model' => $oldModel],
                ['ai.active_model' => $newModel],
                $request->user()->id,
                $request->ip(),
                $request->userAgent()
            );
        } catch (\Throwable $e) {
            Log::error('Failed to write audit log for model change', ['error' => $e->getMessage()]);
        }

        return response()->json([
            'success' => true,
            'message' => 'AI Model updated successfully.',
            'data' => [
                'active_model' => $newModel
            ]
        ]);
    }
}
