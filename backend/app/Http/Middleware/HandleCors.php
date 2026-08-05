<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class HandleCors
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Handle preflight OPTIONS request
        if ($request->getMethod() === 'OPTIONS') {
            $response = response('', 200);
            $this->applyCorsHeaders($response);

            return $response;
        }

        $response = $next($request);

        // Add CORS headers to the actual response.
        //
        // IMPORTANT: use $response->headers->set() instead of $response->header().
        // The header() method only exists on Illuminate\Http\Response, but the
        // document-generation and export endpoints return
        // Symfony\Component\HttpFoundation\BinaryFileResponse, which does not
        // have header(). The headers ResponseHeaderBag is available on both
        // Illuminate\Http\Response and BinaryFileResponse, so this works for
        // JSON responses, file downloads, generated DOCX previews, official
        // documents, and XLSX/CSV exports alike.
        $this->applyCorsHeaders($response);

        return $response;
    }

    /**
     * Apply the CORS headers to any Symfony-compatible response.
     *
     * @param  Response  $response  Illuminate\Http\Response or Symfony BinaryFileResponse
     */
    private function applyCorsHeaders(Response $response): void
    {
        $response->headers->set('Access-Control-Allow-Origin', '*');
        $response->headers->set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
        $response->headers->set('Access-Control-Allow-Headers', 'Content-Type, Accept, Authorization, X-Requested-With, X-CSRF-TOKEN');
        $response->headers->set('Access-Control-Max-Age', '86400');
    }
}
