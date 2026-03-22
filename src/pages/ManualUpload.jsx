import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export default function ManualUpload() {
  const [manualTitle, setManualTitle] = useState('');
  const [manufacturer, setManufacturer] = useState('');
  const [jsonFile, setJsonFile] = useState(null);
  const [imageFiles, setImageFiles] = useState([]);
  const [mdFile, setMdFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [stagingId, setStagingId] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleJsonChange = (e) => {
    setJsonFile(e.target.files?.[0] || null);
  };

  const handleImagesChange = (e) => {
    setImageFiles(Array.from(e.target.files || []));
  };

  const handleMdChange = (e) => {
    setMdFile(e.target.files?.[0] || null);
  };

  const uploadFiles = async () => {
    if (!manualTitle || !manufacturer || !jsonFile || imageFiles.length === 0) {
      setError('Please fill in all required fields and select at least one image');
      return;
    }

    setError(null);
    setUploading(true);

    try {
      // Upload JSON file
      const jsonUpload = await base44.integrations.Core.UploadFile({ file: jsonFile });
      console.log('JSON uploaded:', jsonUpload.file_url);

      // Upload images
      const imageUrls = [];
      for (const img of imageFiles) {
        const imgUpload = await base44.integrations.Core.UploadFile({ file: img });
        imageUrls.push({
          url: imgUpload.file_url,
          original_name: img.name,
          uploaded_at: new Date().toISOString()
        });
        console.log('Image uploaded:', img.name, '→', imgUpload.file_url);
      }

      // Upload MD file if provided
      let mdUrl = null;
      if (mdFile) {
        const mdUpload = await base44.integrations.Core.UploadFile({ file: mdFile });
        mdUrl = mdUpload.file_url;
        console.log('MD uploaded:', mdUrl);
      }

      // Create staging record
      console.log('Creating staging record...');
      const staging = await base44.entities.StagingUpload.create({
        manual_title: manualTitle,
        manufacturer: manufacturer,
        json_file_url: jsonUpload.file_url,
        image_urls: imageUrls,
        md_file_url: mdUrl,
        status: 'pending'
      });

      setStagingId(staging.id);
      setUploading(false);
    } catch (err) {
      console.error('Upload error:', err);
      setError(err.message);
      setUploading(false);
    }
  };

  const processManual = async () => {
    if (!stagingId) return;

    setProcessing(true);
    setError(null);

    try {
      const response = await base44.functions.invoke('processStagingManual', {
        staging_id: stagingId
      });

      console.log('Processing complete:', response.data);
      setResult(response.data);
      setManualTitle('');
      setManufacturer('');
      setJsonFile(null);
      setImageFiles([]);
      setMdFile(null);
      setStagingId(null);
    } catch (err) {
      console.error('Processing error:', err);
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  };

  // Show result state
  if (result) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
        <div className="max-w-2xl mx-auto">
          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
                <CardTitle>Manual Processed Successfully</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm text-slate-600"><strong>Title:</strong> {result.manual.title}</p>
                <p className="text-sm text-slate-600"><strong>Manufacturer:</strong> {result.manual.manufacturer}</p>
                <p className="text-sm text-slate-600"><strong>Model:</strong> {result.manual.model}</p>
                <p className="text-sm text-slate-600"><strong>Images Processed:</strong> {result.images_processed}</p>
              </div>
              <Button onClick={() => setResult(null)} className="w-full">
                Upload Another Manual
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Show upload form
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload Manual Files
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            {!stagingId ? (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Manual Title *</label>
                  <Input
                    placeholder="e.g., Gilbarco Encore S Dispenser"
                    value={manualTitle}
                    onChange={(e) => setManualTitle(e.target.value)}
                    disabled={uploading}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Manufacturer *</label>
                  <Input
                    placeholder="e.g., Gilbarco"
                    value={manufacturer}
                    onChange={(e) => setManufacturer(e.target.value)}
                    disabled={uploading}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">manual_data.json *</label>
                  <Input
                    type="file"
                    accept=".json"
                    onChange={handleJsonChange}
                    disabled={uploading}
                  />
                  {jsonFile && <p className="text-xs text-green-600">✓ {jsonFile.name}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Images (PNG/JPG) *</label>
                  <Input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImagesChange}
                    disabled={uploading}
                  />
                  {imageFiles.length > 0 && (
                    <p className="text-xs text-green-600">✓ {imageFiles.length} image{imageFiles.length !== 1 ? 's' : ''} selected</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Documentation (MD) - Optional</label>
                  <Input
                    type="file"
                    accept=".md"
                    onChange={handleMdChange}
                    disabled={uploading}
                  />
                  {mdFile && <p className="text-xs text-green-600">✓ {mdFile.name}</p>}
                </div>

                <Button
                  onClick={uploadFiles}
                  disabled={uploading || !manualTitle || !manufacturer || !jsonFile || imageFiles.length === 0}
                  className="w-full"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    'Upload Files'
                  )}
                </Button>
              </>
            ) : (
              <>
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-900">
                    <strong>{manualTitle}</strong> by <strong>{manufacturer}</strong> is ready to process.
                    {imageFiles.length > 0 && <span> ({imageFiles.length} images)</span>}
                  </p>
                </div>

                <Button
                  onClick={processManual}
                  disabled={processing}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  {processing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    'Process Manual'
                  )}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}