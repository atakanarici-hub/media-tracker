<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $request->validate([
            'name'            => 'required|string|max:255',
            'email'           => 'required|string|email|max:255|unique:users',
            'password'        => 'required|string|min:8',
            // Only HTTPS URLs accepted; prevents JS-URI XSS and plain-HTTP downgrade.
            'profile_picture' => 'nullable|url|starts_with:https://',
            'device_name'     => 'nullable|string|max:255',
        ]);

        $user = User::create([
            'name'            => $request->name,
            'email'           => $request->email,
            'password'        => Hash::make($request->password),
            'profile_picture' => $request->profile_picture,
        ]);

        $token = $user->createToken($request->input('device_name', 'web'))->plainTextToken;

        return response()->json([
            'user'  => $user,
            'token' => $token,
        ], 201);
    }

    public function login(Request $request)
    {
        $request->validate([
            'email'       => 'required|string|email',
            'password'    => 'required|string',
            'device_name' => 'nullable|string|max:255',
        ]);

        $user = User::where('email', $request->email)->first();

        if (! $user || ! Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Geçersiz kimlik bilgileri.'],
            ]);
        }

        // Delete all existing tokens — prevents token accumulation across logins.
        $user->tokens()->delete();

        $token = $user->createToken($request->input('device_name', 'web'))->plainTextToken;

        return response()->json([
            'user'  => $user,
            'token' => $token,
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Başarıyla çıkış yapıldı.'
        ]);
    }
}
