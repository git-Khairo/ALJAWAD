<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\GeneratedContent;
use Illuminate\Http\Request;

class ContentCreationController extends Controller
{
    /**
     * GET /api/admin/content
     * List saved generated content for the authenticated user.
     */
    public function index(Request $request)
    {
        $items = GeneratedContent::where('created_by', $request->user()->id)
            ->latest()
            ->get();

        return response()->json($items);
    }

    /**
     * POST /api/admin/content/generate
     * Generate content via OpenAI.
     * OpenAI integration is NOT yet wired — returns 501 until the API key is configured.
     */
    public function generate(Request $request)
    {
        $request->validate([
            'type'             => 'required|in:reel,post,story,live,carousel',
            'platform'         => 'required|string',
            'prompt'           => 'required|string|max:2000',
            'tone'             => 'required|string',
            'language'         => 'required|in:ar,en,both',
            'audience'         => 'required|string',
            'duration_seconds' => 'nullable|integer',
        ]);

        // TODO: replace this stub with an actual OpenAI call once the API key is set.
        // Example:
        //   $client  = \OpenAI::client(config('services.openai.key'));
        //   $chat    = $client->chat()->create([...]);
        //   $text    = $chat->choices[0]->message->content;

        return response()->json([
            'message' => 'OpenAI integration not yet configured. Set OPENAI_API_KEY in .env and implement the generate logic in ContentCreationController@generate.',
        ], 501);
    }

    /**
     * POST /api/admin/content
     * Save a generated content item.
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'type'             => 'required|in:reel,post,story,live,carousel',
            'platform'         => 'required|string',
            'prompt'           => 'required|string',
            'generated_ar'     => 'nullable|string',
            'generated_en'     => 'nullable|string',
            'tone'             => 'sometimes|string',
            'language'         => 'sometimes|in:ar,en,both',
            'audience'         => 'sometimes|string',
            'duration_seconds' => 'nullable|integer',
        ]);

        $content = GeneratedContent::create([
            ...$data,
            'status'     => 'saved',
            'created_by' => $request->user()->id,
        ]);

        return response()->json($content, 201);
    }

    /**
     * DELETE /api/admin/content/{content}
     */
    public function destroy(Request $request, GeneratedContent $content)
    {
        if ($content->created_by !== $request->user()->id) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $content->delete();

        return response()->json(['message' => 'Deleted.']);
    }
}
