'use client'

import { useState } from 'react'
import Image from 'next/image'

export default function Home() {
  const [image, setImage] = useState<File | null>(null)
  const [prompt, setPrompt] = useState('')
  const [loading, setLoading] = useState(false)
  const [generatedImage, setGeneratedImage] = useState('')
  

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!image || !prompt) return

    try {
      setLoading(true)
      const formData = new FormData()
      formData.append('image', image)
      formData.append('prompt', prompt)

      const response = await fetch('/api/generate', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Generation failed')
      }

      const data = await response.json()
      setGeneratedImage(data.outputUrl)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }
  

  return (
    <div className="min-h-screen py-8">
      <h1 className="text-3xl font-bold mb-8">AI Image Editor</h1>
      
      <form onSubmit={handleSubmit} className="space-y-4 max-w-xl">
        <div>
          <label className="block mb-2">Upload Image</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setImage(e.target.files?.[0] || null)}
            className="w-full border rounded p-2"
          />
        </div>

        <div>
          <label className="block mb-2">Transformation Prompt</label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="w-full border rounded p-2"
            rows={4}
            placeholder="Describe how you want to transform the image..."
          />
        </div>

        <button
          type="submit"
          disabled={loading || !image || !prompt}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50 transition-colors"
        >
          {loading ? 'Processing...' : 'Generate'}
        </button>
      </form>

      {generatedImage && (
        <div className="mt-8">
          <h2 className="text-xl font-bold mb-4">Generated Result</h2>
          <div className="relative w-[512px] h-[512px]">
            <Image
              src={generatedImage}
              alt="Generated image"
              fill
              className="rounded-lg object-cover"
            />
          </div>
        </div>
      )}
    </div>
  )
}