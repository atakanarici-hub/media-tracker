<?php

namespace App\Http\Controllers;

use App\Models\Post;
use Illuminate\Http\Request;

class PostController extends Controller
{
    public function index()
    {
        $posts = Post::with(['user:id,name,profile_picture', 'media'])->latest()->get();
        return response()->json($posts);
    }

    public function store(Request $request)
    {
        $request->validate([
            'content' => 'required|string|max:1000',
            'media_id' => 'nullable|exists:medias,id'
        ]);

        $post = Post::create([
            'user_id' => $request->user()->id,
            'media_id' => $request->media_id,
            'content' => $request->content
        ]);

        return response()->json($post->load(['user:id,name,profile_picture', 'media']), 201);
    }
}
