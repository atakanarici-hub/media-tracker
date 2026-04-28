<?php

namespace App\Http\Controllers;

use App\Models\Post;
use Illuminate\Http\Request;

class PostController extends Controller
{
    public function index()
    {
        $posts = Post::with(['user:id,name,profile_picture', 'media'])->latest()->paginate(20);
        return response()->json($posts);
    }

    public function store(Request $request)
    {
        $request->validate([
            'content' => 'required|string|max:1000',
            'media_id' => 'nullable|exists:medias,id'
        ]);

        $post = new Post([
            'media_id' => $request->media_id,
            'content'  => $request->content,
        ]);
        $post->user_id = $request->user()->id;
        $post->save();

        return response()->json($post->load(['user:id,name,profile_picture', 'media']), 201);
    }
}
