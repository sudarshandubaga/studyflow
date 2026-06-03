<?php

namespace App\Http\Controllers;

use App\Models\School;

abstract class Controller
{
    public function __construct()
    {
        $domain = request()->getHost();
        $school = School::where('domain', $domain)->firstOrFail();

        app()->instance('school', $school);

        view()->share(compact('school'));
    }
}
