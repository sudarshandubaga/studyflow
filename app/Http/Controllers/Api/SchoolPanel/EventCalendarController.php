<?php

namespace App\Http\Controllers\Api\SchoolPanel;

use App\Http\Controllers\Controller;
use App\Models\EventCalendar;
use Illuminate\Http\Request;

class EventCalendarController extends Controller
{
    public function index(Request $request)
    {
        $query = EventCalendar::query();
        if ($schoolId = $request->header('school-id') ?? $request->school_id) {
            $query->where('school_id', $schoolId);
        }
        return response()->json($query->orderBy('start_date', 'asc')->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'school_id' => 'required|exists:schools,id',
            'event_type' => 'required|in:Event,Holiday,Assessment,Sport',
            'name' => 'required|string|max:255',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'description' => 'nullable|string',
            'mark_attendance' => 'nullable|boolean',
            'event_for' => 'required|in:Employee,Student,Both',
            'is_active' => 'boolean',
        ]);

        return response()->json(EventCalendar::create($validated), 201);
    }

    public function show(EventCalendar $eventCalendar)
    {
        return response()->json($eventCalendar);
    }

    public function update(Request $request, EventCalendar $eventCalendar)
    {
        $validated = $request->validate([
            'school_id' => 'required|exists:schools,id',
            'event_type' => 'required|in:Event,Holiday,Assessment,Sport',
            'name' => 'required|string|max:255',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'description' => 'nullable|string',
            'mark_attendance' => 'nullable|boolean',
            'event_for' => 'required|in:Employee,Student,Both',
            'is_active' => 'boolean',
        ]);

        $eventCalendar->update($validated);
        return response()->json($eventCalendar);
    }

    public function destroy(EventCalendar $eventCalendar)
    {
        $eventCalendar->delete();
        return response()->json(['message' => 'Event deleted successfully']);
    }

    public function bulkAction(Request $request)
    {
        $validated = $request->validate([
            'ids' => 'required|array',
            'action' => 'required|string'
        ]);

        $ids = $validated['ids'];
        $action = $validated['action'];

        if ($action === 'delete') {
            EventCalendar::whereIn('id', $ids)->delete();
        } elseif ($action === 'enable') {
            EventCalendar::whereIn('id', $ids)->update(['is_active' => true]);
        } elseif ($action === 'disable') {
            EventCalendar::whereIn('id', $ids)->update(['is_active' => false]);
        }

        return response()->json(['message' => 'Bulk action successful']);
    }
}
