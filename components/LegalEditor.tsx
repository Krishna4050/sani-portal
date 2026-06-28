'use client';
import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import 'react-quill-new/dist/quill.snow.css';
import { Loader2, Save } from 'lucide-react';

const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false, loading: () => <div className="h-64 flex items-center justify-center"><Loader2 className="animate-spin text-slate-400" /></div> });

export default function LegalEditor() {
  const [docType, setDocType] = useState('terms');
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchDocument(docType);
  }, [docType]);

  async function fetchDocument(type: string) {
    setIsLoading(true);
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';
      const res = await fetch(`${backendUrl}/api/legal-documents?type=${type}`);
      if (res.ok) {
        const data = await res.json();
        setContent(data.content || '');
      } else {
        setContent('');
      }
    } catch (e) {
      console.error(e);
      setContent('');
    } finally {
      setIsLoading(false);
    }
  }

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';
      const res = await fetch(`${backendUrl}/api/admin/legal-documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ doc_type: docType, content })
      });
      if (res.ok) {
        alert('Document saved successfully!');
      } else {
        alert('Failed to save document');
      }
    } catch (e) {
      alert('Network error while saving document');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Legal Documents</h2>
          <p className="text-sm text-gray-500 mt-1">Edit the public Terms, Privacy, and Cookie policies.</p>
        </div>
        <div className="flex gap-4">
          <select 
            className="border border-gray-300 rounded-lg px-4 py-2 bg-gray-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-800"
            value={docType}
            onChange={(e) => setDocType(e.target.value)}
            disabled={isLoading || isSaving}
          >
            <option value="terms">Terms of Service</option>
            <option value="privacy">Privacy Policy</option>
            <option value="cookies">Cookie Policy</option>
          </select>
          <button 
            onClick={handleSave} 
            disabled={isLoading || isSaving}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white px-6 py-2 rounded-lg font-semibold transition-colors disabled:opacity-50"
          >
            {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            Save Changes
          </button>
        </div>
      </div>
      
      <div className="border border-gray-200 rounded-xl overflow-hidden pb-12">
        <ReactQuill 
          theme="snow" 
          value={content} 
          onChange={setContent} 
          className="bg-white h-[450px]"
          modules={{
            toolbar: [
              [{ 'header': [1, 2, 3, false] }],
              ['bold', 'italic', 'underline', 'strike'],
              [{ 'color': [] }, { 'background': [] }],
              [{ 'list': 'ordered'}, { 'list': 'bullet' }],
              ['link', 'clean']
            ],
          }}
        />
      </div>
    </div>
  );
}
