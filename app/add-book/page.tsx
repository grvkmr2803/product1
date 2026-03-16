"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function AddBook() {

  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [reflection, setReflection] = useState("");
  const [message, setMessage] = useState("");
  const router = useRouter();

  const handleAddBook = async () => {

    if (!title || !author) {
      setMessage("Please enter both title and author");
      return;
    }

    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;

    if (!user) {
      setMessage("You must be logged in.");
      return;
    }

    const { error } = await supabase.from("books").insert([
      {
        user_id: user.id,
        title,
        author,
        reflection
      }
    ]);

    if (error) {
      setMessage(error.message);
    } else {
        setTitle("");
        setAuthor("");
        setReflection("");
        toast.success(" Your identity evolved");
        router.push("/my-books");
    }
  };

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center">

      <h1 className="text-3xl mb-6">Add Book</h1>

      {/* Title */}
      <input
        placeholder="Book title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="px-4 py-2 rounded mb-3 w-80 bg-white text-black border border-gray-400"
      />

      {/* Author */}
      <input
        placeholder="Author"
        value={author}
        onChange={(e) => setAuthor(e.target.value)}
        className="px-4 py-2 rounded mb-3 w-80 bg-white text-black border border-gray-400"
      />

      {/* Reflection */}
      <textarea
        placeholder="What did this book change about you?"
        value={reflection}
        onChange={(e) => setReflection(e.target.value)}
        className="px-4 py-2 rounded mb-4 w-80 h-28 bg-white text-black border border-gray-400"
      />

      {/* Button */}
      <button
        onClick={handleAddBook}
        className="bg-white text-black px-6 py-2 rounded hover:bg-gray-200 transition"
      >
        Add Book
      </button>

      {message && <p className="mt-4">{message}</p>}

    </main>
  );
}