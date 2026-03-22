import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Upload, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

async function uploadZipFile(file) {
  // Convert File to base64 for transmission
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = btoa(binary);
  
  const response = await base44.functions.invoke('processZipManual', {
    file_base64: base64,
    file_name: file.name
  });
  
  if (!response.data.success) {
    throw new Error(response.data.error || 'Upload failed');
  }
  
  return response.data;
}

export default function ZipUpload() {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState({ stage: '', percent: 0 });

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const processZip = async (file) => {
    if (!file.name.endsWith('.zip')) {
      setError('Please upload a .zip file');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);
    setProgress({ stage: 'Uploading file...', percent: 10 });

    try {
      setProgress({ stage: 'Extracting ZIP contents...', percent: 25 });
      setProgress({ stage: 'Processing metadata...', percent: 40 });
      setProgress({ stage: 'Uploading images...', percent: 55 });
      
      const response = await uploadZipFile(file);

      if (response.success) {
        setProgress({ stage: 'Linking parts to manual...', percent: 75 });
        
        // Trigger part linking after manual upload
        try {
          await base44.functions.invoke('linkPartsToManuals', { manual_id: response.manual.id });
          setProgress({ stage: 'Complete!', percent: 100 });
        } catch (linkErr) {
          console.warn('Part linking failed:', linkErr);
        }
        
        setResult(response);
      } else {
        setError(response.error || 'Upload failed');
      }
    } catch (err) {
      setError(err.message || 'Error processing zip file');
    } finally {
      setIsLoading(false);
      setProgress({ stage: '', percent: 0 });
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processZip(files[0]);
    }
  };

  const handleFileInput = (e) => {
    const files = e.target.files;
    if (files.length > 0) {
      processZip(files[0]);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 pb-20">
      <h1 className="text-3xl font-bold mb-2">Import Manual from ZIP</h1>
      <p className="text-gray-600 mb-6">Upload a ZIP file containing JSON metadata and PNG images</p>

      {/* Progress Panel */}
      {isLoading && (
        <Card className="p-4 mb-6 bg-blue-50 border border-blue-200">
          <div className="space-y-3">
            <p className="text-sm font-semibold text-blue-900">{progress.stage}</p>
            <div className="w-full bg-blue-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress.percent}%` }}
              />
            </div>
            <p className="text-xs text-blue-700">{progress.percent}% complete</p>
          </div>
        </Card>
      )}

      {/* Upload Zone */}
      <Card
        className={`p-8 mb-6 border-2 border-dashed cursor-pointer transition-all ${
          isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="flex flex-col items-center justify-center">
          <Upload className="w-12 h-12 text-gray-400 mb-3" />
          <h3 className="text-lg font-semibold mb-1">Drag and drop your ZIP file here</h3>
          <p className="text-gray-500 text-sm mb-4">or click to browse</p>
          <input
            type="file"
            accept=".zip"
            onChange={handleFileInput}
            className="hidden"
            id="zip-input"
            disabled={isLoading}
          />
          <label htmlFor="zip-input">
            <Button asChild disabled={isLoading} variant="outline">
              <span>
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Select ZIP File
                  </>
                )}
              </span>
            </Button>
          </label>
        </div>
      </Card>

      {/* Error */}
      {error && (
        <Card className="p-4 mb-6 bg-red-50 border border-red-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-red-800">Error</h4>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          </div>
        </Card>
      )}

      {/* Success */}
      {result && (
        <Card className="p-4 bg-green-50 border border-green-200">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-green-800">Successfully imported!</h4>
              <p className="text-green-700 text-sm mt-1">
                Manual: <strong>{result.manual.title}</strong>
              </p>
              <p className="text-green-700 text-sm">
                Model: <strong>{result.manual.model}</strong>
              </p>
              <p className="text-green-700 text-sm">
                Images uploaded: <strong>{result.images_uploaded}</strong>
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Instructions */}
      <Card className="p-4 bg-blue-50 border border-blue-200">
        <h4 className="font-semibold text-blue-900 mb-2">ZIP Format Requirements</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• One JSON file with manual metadata (title, manufacturer, models, sections, etc.)</li>
          <li>• PNG images named like: p001_img01.png, p002_img01.png (page_imageNum format)</li>
          <li>• The JSON must include: title, manufacturer, models_covered, summary, and sections</li>
        </ul>
      </Card>
    </div>
  );
}