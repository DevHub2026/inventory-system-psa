<?php
$file = 'app/Modules/AI/Controllers/ChatController.php';
$content = file_get_contents($file);
$content = preg_replace('/\} catch \(Exception \$e\) \{.*?\}/s', "} catch (\\Throwable \$e) {
            \\Illuminate\\Support\\Facades\\Log::error('AI Chat Error', [
                'message' => \$e->getMessage(),
                'trace' => \$e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'The Local AI Assistant is currently unavailable. Please try again.'
            ], 503);
        }", $content);
file_put_contents($file, $content);
echo "Replaced.";
