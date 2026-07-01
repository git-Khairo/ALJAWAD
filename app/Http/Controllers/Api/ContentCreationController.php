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
     * Generate social-media content via OpenAI gpt-4o-mini.
     */
    public function generate(Request $request)
    {
        $data = $request->validate([
            'type'             => 'required|in:reel,post,story,live,carousel',
            'platform'         => 'required|string',
            'prompt'           => 'required|string|max:2000',
            'tone'             => 'required|string',
            'language'         => 'required|in:ar,en,both',
            'audience'         => 'required|string',
            'duration_seconds' => 'nullable|integer',
        ]);

        $apiKey = config('services.openai.key');
        if (empty($apiKey)) {
            return response()->json([
                'message' => 'OpenAI API key is not configured. Add OPENAI_API_KEY to your .env file.',
            ], 501);
        }

        $typeLabels = [
            'reel'     => 'short video reel script (hook → body → CTA)',
            'post'     => 'social media post caption with relevant hashtags',
            'story'    => 'story — punchy, max 3 lines, one clear message',
            'live'     => 'live session outline: intro + 3–4 talking points + closing CTA',
            'carousel' => 'carousel — write each slide on a new line, prefixed with "Slide N:"',
        ];

        $toneLabels = [
            'energetic'    => 'energetic and enthusiastic',
            'professional' => 'professional and authoritative',
            'casual'       => 'casual and friendly',
            'educational'  => 'educational and informative',
            'promotional'  => 'promotional and persuasive',
        ];

        $audienceLabels = [
            'beginners'    => 'complete beginners with no prior trading knowledge',
            'intermediate' => 'traders with some experience',
            'advanced'     => 'experienced, advanced traders',
            'all'          => 'a general mixed audience',
        ];

        $duration  = $data['duration_seconds'] ?? 60;
        $wordCount = (int) round($duration * 2.5); // ~150 words/min
        $type      = $typeLabels[$data['type']]      ?? $data['type'];
        $tone      = $toneLabels[$data['tone']]      ?? $data['tone'];
        $audience  = $audienceLabels[$data['audience']] ?? $data['audience'];

        $system = <<<SYSTEM
You are a professional social-media content writer for AlJawad Trading — a Syrian financial trading education company specialising in technical analysis, VIP trade tracking, and financial education for Arabic-speaking audiences.

Brand voice: transparent, trustworthy, empowering. Never exaggerate returns or promise profits.
SYSTEM;

        $lang = $data['language'];

        if ($lang === 'both') {
            $instruction = <<<INST
Write the content in BOTH Arabic and English.
Respond with ONLY valid JSON (no markdown, no code fences) in exactly this shape:
{"ar":"<Arabic content>","en":"<English content>"}
INST;
        } elseif ($lang === 'ar') {
            $instruction = 'Write the content in Arabic only. Respond with plain text — no JSON, no labels.';
        } else {
            $instruction = 'Write the content in English only. Respond with plain text — no JSON, no labels.';
        }

        $user = <<<USER
Create a {$type} for {$data['platform']}.

Topic / idea: {$data['prompt']}
Tone: {$tone}
Target audience: {$audience}
Target length: ~{$wordCount} words when read aloud (adjust as needed for the format)

Include relevant emojis where natural. End with a clear call-to-action.

{$instruction}
USER;

        try {
            $client   = \OpenAI::client($apiKey);
            $response = $client->chat()->create([
                'model'       => config('services.openai.model', 'gpt-4o-mini'),
                'messages'    => [
                    ['role' => 'system', 'content' => $system],
                    ['role' => 'user',   'content' => $user],
                ],
                'temperature' => 0.8,
                'max_tokens'  => 1200,
            ]);

            $text = trim($response->choices[0]->message->content ?? '');

            if ($lang === 'both') {
                $parsed = json_decode($text, true);
                return response()->json([
                    'generated_ar' => $parsed['ar'] ?? null,
                    'generated_en' => $parsed['en'] ?? null,
                ]);
            }

            return response()->json([
                'generated_ar' => $lang === 'ar' ? $text : null,
                'generated_en' => $lang === 'en' ? $text : null,
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'OpenAI request failed: ' . $e->getMessage(),
            ], 500);
        }
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
