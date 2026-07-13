<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\KpiDefinition;
use App\Models\KpiEntry;
use Illuminate\Http\Request;

class KpiController extends Controller
{
    // ── Admin: KPI Definitions (thresholds) ──────────────────────────────────

    /**
     * GET /api/admin/kpi/definitions
     * All definitions grouped by role.
     */
    public function definitions()
    {
        $defs = KpiDefinition::orderBy('role')->orderBy('sort_order')->get();
        return response()->json($defs->groupBy('role'));
    }

    /**
     * PUT /api/admin/kpi/definitions/{definition}
     * Update tier thresholds for a KPI.
     */
    public function updateDefinition(Request $request, KpiDefinition $definition)
    {
        $data = $request->validate([
            'name_ar'        => 'sometimes|string',
            'name_en'        => 'sometimes|string',
            'description_ar' => 'nullable|string',
            'description_en' => 'nullable|string',
            'unit'           => 'sometimes|string',
            'max_bonus_pct'  => 'sometimes|integer|min:0|max:500',
            'tier_a_min'     => 'sometimes|numeric',
            'tier_a_bonus'   => 'sometimes|integer|min:0',
            'tier_b_min'     => 'sometimes|numeric',
            'tier_b_bonus'   => 'sometimes|integer|min:0',
            'tier_c_min'     => 'sometimes|numeric',
            'tier_c_bonus'   => 'sometimes|integer|min:0',
            'is_active'      => 'sometimes|boolean',
        ]);

        $definition->update($data);
        return response()->json($definition->fresh());
    }

    // ── Admin: KPI Entries (department-level monthly values) ─────────────────

    /**
     * GET /api/admin/kpi/entries?role=&year=&month=
     * Entries for a department in a given month.
     */
    public function entries(Request $request)
    {
        $query = KpiEntry::with(['definition', 'enteredBy'])
            ->orderBy('year', 'desc')
            ->orderBy('month', 'desc');

        if ($request->filled('role'))  $query->forRole($request->role);
        if ($request->filled('year'))  $query->where('year', $request->year);
        if ($request->filled('month')) $query->where('month', $request->month);

        return response()->json($query->get());
    }

    /**
     * POST /api/admin/kpi/entries
     * Log or update a department's KPI value for a given month.
     * Tier + bonus % are auto-computed from the definition thresholds.
     */
    public function storeEntry(Request $request)
    {
        $data = $request->validate([
            'kpi_definition_id' => 'required|exists:kpi_definitions,id',
            'role'              => 'required|string',
            'year'              => 'required|integer|min:2020|max:2100',
            'month'             => 'required|integer|min:1|max:12',
            'value'             => 'required|numeric|min:0',
            'notes'             => 'nullable|string',
        ]);

        $definition = KpiDefinition::findOrFail($data['kpi_definition_id']);

        // Ensure the role matches the definition's role
        if ($definition->role !== $data['role']) {
            return response()->json(['message' => 'Role does not match this KPI definition.'], 422);
        }

        $evaluation = $definition->evaluate((float) $data['value']);

        $entry = KpiEntry::updateOrCreate(
            [
                'kpi_definition_id' => $data['kpi_definition_id'],
                'role'              => $data['role'],
                'year'              => $data['year'],
                'month'             => $data['month'],
            ],
            [
                'value'       => $data['value'],
                'tier'        => $evaluation['tier'],
                'bonus_pct'   => $evaluation['bonus_pct'],
                'has_warning' => $evaluation['has_warning'],
                'notes'       => $data['notes'] ?? null,
                'entered_by'  => $request->user()->id,
            ]
        );

        return response()->json($entry->load(['definition', 'enteredBy']), 201);
    }

    /**
     * PUT /api/admin/kpi/entries/{entry}
     * Update a value — tier re-computed automatically.
     */
    public function updateEntry(Request $request, KpiEntry $entry)
    {
        $data = $request->validate([
            'value' => 'sometimes|numeric|min:0',
            'notes' => 'nullable|string',
        ]);

        if (isset($data['value'])) {
            $evaluation = $entry->definition->evaluate((float) $data['value']);
            $data = array_merge($data, $evaluation, ['entered_by' => $request->user()->id]);
        }

        $entry->update($data);
        return response()->json($entry->fresh(['definition', 'enteredBy']));
    }

    /**
     * DELETE /api/admin/kpi/entries/{entry}
     */
    public function deleteEntry(KpiEntry $entry)
    {
        $entry->delete();
        return response()->json(['message' => 'Entry deleted.']);
    }

    /**
     * GET /api/admin/kpi/summary?year=&month=
     * All departments' KPI scorecard for a given month.
     */
    public function adminSummary(Request $request)
    {
        $year  = $request->integer('year', now()->year);
        $month = $request->integer('month', now()->month);

        $definitions = KpiDefinition::where('is_active', true)
            ->orderBy('role')
            ->orderBy('sort_order')
            ->get()
            ->groupBy('role');

        $entries = KpiEntry::forMonth($year, $month)
            ->with('definition')
            ->get()
            ->keyBy(fn($e) => "{$e->role}_{$e->kpi_definition_id}");

        $result = [];
        foreach ($definitions as $role => $defs) {
            $roleEntries = $defs->map(function ($def) use ($entries, $role) {
                $entry = $entries->get("{$role}_{$def->id}");
                return [
                    'kpi_id'      => $def->id,
                    'slug'        => $def->slug,
                    'name_en'     => $def->name_en,
                    'name_ar'     => $def->name_ar,
                    'unit'        => $def->unit,
                    'max_bonus'   => $def->max_bonus_pct,
                    'value'       => $entry?->value,
                    'tier'        => $entry?->tier,
                    'bonus_pct'   => $entry?->bonus_pct ?? 0,
                    'has_warning' => $entry?->has_warning ?? false,
                    'notes'       => $entry?->notes,
                ];
            });

            $result[] = [
                'role'            => $role,
                'year'            => $year,
                'month'           => $month,
                'kpis'            => $roleEntries,
                'total_bonus_pct' => $roleEntries->sum('bonus_pct'),
                'max_bonus_pct'   => $defs->sum('max_bonus_pct'),
                'warnings'        => $roleEntries->where('has_warning', true)->count(),
            ];
        }

        return response()->json($result);
    }

    // ── Coach: personal scorecard (read-only, department-level) ─────────────

    /**
     * GET /api/coach/kpi/scorecard?year=&month=
     * The authenticated coach's department KPI results for the given month.
     * All coaches in the same role see identical values.
     */
    public function myScorecard(Request $request)
    {
        $user = $request->user();
        // Prefer the Spatie-assigned role, but fall back to the display role stored
        // on the coach record. When a staff member has individual permissions revoked,
        // CoachController removes their Spatie role entirely (keeping the name only in
        // coaches.role), which would otherwise leave them with no scorecard.
        $role = $user->getRoleNames()->first() ?? $user->coach?->role;

        if (! $role) {
            return response()->json(['message' => 'No role assigned.'], 404);
        }

        $year  = $request->integer('year', now()->year);
        $month = $request->integer('month', now()->month);

        $definitions = KpiDefinition::where('role', $role)
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->get();

        $entries = KpiEntry::forRole($role)
            ->forMonth($year, $month)
            ->get()
            ->keyBy('kpi_definition_id');

        $kpis = $definitions->map(function ($def) use ($entries) {
            $entry = $entries->get($def->id);
            return [
                'slug'           => $def->slug,
                'name_en'        => $def->name_en,
                'name_ar'        => $def->name_ar,
                'description_en' => $def->description_en,
                'description_ar' => $def->description_ar,
                'unit'           => $def->unit,
                'direction'      => $def->direction,
                'max_bonus'      => $def->max_bonus_pct,
                'tiers' => [
                    'A' => ['min' => $def->tier_a_min, 'bonus' => $def->tier_a_bonus],
                    'B' => ['min' => $def->tier_b_min, 'bonus' => $def->tier_b_bonus],
                    'C' => ['min' => $def->tier_c_min, 'bonus' => $def->tier_c_bonus],
                ],
                'recorded' => $entry ? [
                    'value'       => $entry->value,
                    'tier'        => $entry->tier,
                    'bonus_pct'   => $entry->bonus_pct,
                    'has_warning' => $entry->has_warning,
                    'notes'       => $entry->notes,
                ] : null,
            ];
        });

        return response()->json([
            'role'            => $role,
            'year'            => $year,
            'month'           => $month,
            'kpis'            => $kpis,
            'total_bonus_pct' => $entries->sum('bonus_pct'),
            'max_total_bonus' => $definitions->sum('max_bonus_pct'),
            'warnings'        => $entries->where('has_warning', true)->count(),
        ]);
    }
}
