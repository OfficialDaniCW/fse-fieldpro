import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, CheckCircle2, AlertCircle, Loader2, FileText, Image as ImageIcon, Link as LinkIcon } from 'lucide-react';

export default function ManualUpload() {
  const [step, setStep] = useState('info'); // info, uploading, review, processing, complete
  const [manualTitle, setManualTitle] = useState('');
  const [manufacturer, setManufacturer] = useState('');
  const [jsonFile, setJsonFile] = useState(null);
  const [imageFiles, setImageFiles] = useState([]);
  const [mdFile, setMdFile] = useState(null);
  const [pdfFile, setPdfFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
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

  const handlePdfChange = (e) => {
    setPdfFile(e.target.files?.[0] || null);
  };

  const uploadFiles = async () => {
    if (!manualTitle || !manufacturer || !jsonFile || imageFiles.length === 0) {
      setError('Please fill in all required fields and select at least one image');
      return;
    }

    setError(null);
    setStep('uploading');
    const totalFiles = 1 + imageFiles.length + (mdFile ? 1 : 0) + (pdfFile ? 1 : 0);
    let uploaded = 0;

    try {
      // Upload JSON file
      setUploadProgress({ current: uploaded, total: totalFiles });
      const jsonUpload = await base44.integrations.Core.UploadFile({ file: jsonFile });
      uploaded++;
      setUploadProgress({ current: uploaded, total: totalFiles });
      console.log('JSON uploaded:', jsonUpload.file_url);

      // Upload images
      const imageUrls = [];
      for (const img of imageFiles) {
        setUploadProgress({ current: uploaded, total: totalFiles });
        const imgUpload = await base44.integrations.Core.UploadFile({ file: img });
        imageUrls.push({
          url: imgUpload.file_url,
          original_name: img.name,
          uploaded_at: new Date().toISOString()
        });
        uploaded++;
        setUploadProgress({ current: uploaded, total: totalFiles });
        console.log('Image uploaded:', img.name);
      }

      // Upload MD file if provided
      let mdUrl = null;
      if (mdFile) {
        setUploadProgress({ current: uploaded, total: totalFiles });
        const mdUpload = await base44.integrations.Core.UploadFile({ file: mdFile });
        mdUrl = mdUpload.file_url;
        uploaded++;
        setUploadProgress({ current: uploaded, total: totalFiles });
        console.log('MD uploaded:', mdUrl);
      }

      // Upload PDF file if provided
      let pdfUrl = null;
      if (pdfFile) {
        setUploadProgress({ current: uploaded, total: totalFiles });
        const pdfUpload = await base44.integrations.Core.UploadFile({ file: pdfFile });
        pdfUrl = pdfUpload.file_url;
        uploaded++;
        setUploadProgress({ current: uploaded, total: totalFiles });
        console.log('PDF uploaded:', pdfUrl);
      }

      // Create staging record
      console.log('Creating staging record...');
      const staging = await base44.entities.StagingUpload.create({
        manual_title: manualTitle,
        manufacturer: manufacturer,
        json_file_url: jsonUpload.file_url,
        image_urls: imageUrls,
        md_file_url: mdUrl,
        pdf_url: pdfUrl,
        status: 'pending'
      });

      setStagingId(staging.id);
      setStep('review');
    } catch (err) {
      console.error('Upload error:', err);
      setError(err.message);
      setStep('info');
    }
  };

  const submitForProcessing = async () => {
    if (!stagingId) return;

    setError(null);
    setStep('processing');

    try {
      const response = await base44.functions.invoke('processStagingManual', {
        staging_id: stagingId
      });

      console.log('Processing complete:', response.data);
      setResult(response.data);
      setStep('complete');
    } catch (err) {
      console.error('Processing error:', err);
      setError(err.message);
      setStep('review');
    }
  };

  const resetForm = () => {
    setStep('info');
    setManualTitle('');
    setManufacturer('');
    setJsonFile(null);
    setImageFiles([]);
    setMdFile(null);
    setPdfFile(null);
    setStagingId(null);
    setResult(null);
    setError(null);
  };

  // Info entry step
  if (step === 'info') {
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

              <div className="space-y-2">
                <label className="text-sm font-medium">Manual Title *</label>
                <Input
                  placeholder="e.g., Gilbarco Encore S Dispenser"
                  value={manualTitle}
                  onChange={(e) => setManualTitle(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Manufacturer *</label>
                <Input
                  placeholder="e.g., Gilbarco"
                  value={manufacturer}
                  onChange={(e) => setManufacturer(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">manual_data.json *</label>
                <Input
                  type="file"
                  accept=".json"
                  onChange={handleJsonChange}
                />
                {jsonFile && <p className="text-xs text-green-600 flex items-center gap-1"><FileText className="h-3 w-3" /> {jsonFile.name}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Images (PNG/JPG) *</label>
                <Input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImagesChange}
                />
                {imageFiles.length > 0 && (
                  <p className="text-xs text-green-600 flex items-center gap-1"><ImageIcon className="h-3 w-3" /> {imageFiles.length} image{imageFiles.length !== 1 ? 's' : ''} selected</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Original PDF - Optional</label>
                <Input
                  type="file"
                  accept=".pdf"
                  onChange={handlePdfChange}
                />
                {pdfFile && <p className="text-xs text-green-600 flex items-center gap-1"><FileText className="h-3 w-3" /> {pdfFile.name}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Documentation (MD) - Optional</label>
                <Input
                  type="file"
                  accept=".md"
                  onChange={handleMdChange}
                />
                {mdFile && <p className="text-xs text-green-600 flex items-center gap-1"><FileText className="h-3 w-3" /> {mdFile.name}</p>}
              </div>

              <Button
                onClick={uploadFiles}
                disabled={!manualTitle || !manufacturer || !jsonFile || imageFiles.length === 0}
                className="w-full"
              >
                Next: Upload Files
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Uploading step
  if (step === 'uploading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Uploading Files...</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Progress</span>
                  <span className="text-sm text-slate-500">{uploadProgress.current}/{uploadProgress.total}</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{
                      width: uploadProgress.total > 0 
                        ? `${(uploadProgress.current / uploadProgress.total) * 100}%`
                        : '0%'
                    }}
                  />
                </div>
              </div>
              <div className="flex items-center justify-center gap-2 text-slate-600">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Uploading {uploadProgress.current} of {uploadProgress.total} files...</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Review step
  if (step === 'review') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Review Upload</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              <div className="space-y-3 p-4 bg-slate-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-700">Manual</span>
                  <span className="text-sm text-slate-900">{manualTitle}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-700">Manufacturer</span>
                  <span className="text-sm text-slate-900">{manufacturer}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-700">JSON File</span>
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-700">Images</span>
                  <span className="text-sm text-slate-900">{imageFiles.length} uploaded</span>
                </div>
                {pdfFile && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-700">PDF</span>
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  </div>
                )}
                {mdFile && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-700">Documentation</span>
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={resetForm}
                  variant="outline"
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  onClick={submitForProcessing}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  Submit for Processing
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Processing step
  if (step === 'processing') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                Processing Manual...
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-center">
              <p className="text-slate-600 text-sm">
                Extracting content, validating data, and creating wiki...
              </p>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Parsing manual data
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Processing images
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Creating manual record
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Complete step
  if (step === 'complete' && result) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
        <div className="max-w-2xl mx-auto">
          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
                <CardTitle>Manual Processing Complete</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3 p-4 bg-white rounded-lg border border-green-200">
                <p className="text-sm"><strong>Title:</strong> {result.manual.title}</p>
                <p className="text-sm"><strong>Manufacturer:</strong> {result.manual.manufacturer}</p>
                <p className="text-sm"><strong>Model:</strong> {result.manual.model}</p>
                <p className="text-sm"><strong>Images Processed:</strong> {result.images_processed}</p>
              </div>

              <div className="space-y-2">
                <a
                  href={`/Manuals?manual_id=${result.manual_id}`}
                  className="flex items-center gap-2 p-3 bg-white border border-slate-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors text-blue-600"
                >
                  <LinkIcon className="h-4 w-4" />
                  <span className="text-sm font-medium">View Manual Record</span>
                </a>
                <a
                  href={`/Manuals?view=wiki&manual_id=${result.manual_id}`}
                  className="flex items-center gap-2 p-3 bg-white border border-slate-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors text-blue-600"
                >
                  <LinkIcon className="h-4 w-4" />
                  <span className="text-sm font-medium">View Wiki with Images</span>
                </a>
              </div>

              <Button onClick={resetForm} className="w-full">
                Upload Another Manual
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return null;
}