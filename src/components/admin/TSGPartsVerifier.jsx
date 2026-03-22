import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Upload, CheckCircle2, AlertTriangle, FileText } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

export default function TSGPartsVerifier() {
  const [tsgFile, setTsgFile] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResults, setVerificationResults] = useState(null);
  const queryClient = useQueryClient();

  const { data: verifications } = useQuery({
    queryKey: ["part-verifications"],
    queryFn: async () => {
      return await base44.entities.PartVerification.list("-created_date", 100);
    },
  });

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.endsWith('.csv') && !file.name.endsWith('.xlsx')) {
        toast.error("Please upload a CSV or Excel file");
        return;
      }
      setTsgFile(file);
    }
  };

  const handleVerify = async () => {
    if (!tsgFile) {
      toast.error("Please select a TSG parts file");
      return;
    }

    setIsVerifying(true);
    try {
      // Parse CSV/Excel file
      const text = await tsgFile.text();
      const lines = text.split('\n').filter(l => l.trim());
      
      // Simple CSV parse (part_number, description columns)
      const tsgMap = {};
      lines.slice(1).forEach(line => {
        const [partNumber, description] = line.split(',').map(s => s.trim().replace(/^["']|["']$/g, ''));
        if (partNumber && description) {
          tsgMap[partNumber] = description;
        }
      });

      if (Object.keys(tsgMap).length === 0) {
        toast.error("No valid parts found in file (expected: part_number, description)");
        setIsVerifying(false);
        return;
      }

      // Call verification function
      const result = await base44.functions.invoke('verifyExtractedParts', { tsg_parts_map: tsgMap });
      
      setVerificationResults(result.data);
      toast.success(`Verification complete: ${result.data.verified} verified, ${result.data.flagged} flagged`);
      queryClient.invalidateQueries({ queryKey: ["part-verifications"] });
    } catch (error) {
      toast.error("Verification failed: " + error.message);
    }
    setIsVerifying(false);
  };

  return (
    <div className="space-y-6">
      {/* TSG Parts Upload */}
      <Card className="p-4 border border-amber-200 bg-amber-50">
        <h3 className="font-semibold text-sm text-amber-900 mb-3 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          TSG Original Parts List Verification
        </h3>
        <p className="text-xs text-amber-800 mb-4">
          Upload the original TSG parts list (CSV with part_number, description). This will verify all current parts haven't been altered.
        </p>
        
        <div className="flex gap-2 flex-col sm:flex-row">
          <label className="flex-1">
            <input
              type="file"
              accept=".csv,.xlsx"
              onChange={handleFileUpload}
              className="hidden"
            />
            <div className="border border-amber-300 rounded-lg p-3 text-center cursor-pointer hover:bg-amber-100 transition">
              <Upload className="w-4 h-4 inline mr-2 text-amber-700" />
              <span className="text-xs font-medium text-amber-900">
                {tsgFile ? tsgFile.name : "Select TSG parts file"}
              </span>
            </div>
          </label>
          <Button
            onClick={handleVerify}
            disabled={!tsgFile || isVerifying}
            className="bg-amber-600 hover:bg-amber-700"
          >
            {isVerifying ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : null}
            Verify
          </Button>
        </div>
      </Card>

      {/* Verification Results */}
      {verificationResults && (
        <Card className="p-4 border border-blue-200 bg-blue-50">
          <h3 className="font-semibold text-sm text-blue-900 mb-3">Verification Summary</h3>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="bg-white rounded p-2 border border-blue-100">
              <p className="text-xs text-blue-600">Verified</p>
              <p className="text-lg font-bold text-green-600">{verificationResults.verified}</p>
            </div>
            <div className="bg-white rounded p-2 border border-blue-100">
              <p className="text-xs text-blue-600">Flagged</p>
              <p className="text-lg font-bold text-red-600">{verificationResults.flagged}</p>
            </div>
            <div className="bg-white rounded p-2 border border-blue-100">
              <p className="text-xs text-blue-600">Updated</p>
              <p className="text-lg font-bold text-blue-600">{verificationResults.updated}</p>
            </div>
          </div>
          
          {verificationResults.results?.length > 0 && (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {verificationResults.results.map((r, idx) => (
                <div
                  key={idx}
                  className={`text-xs p-2 rounded border ${
                    r.status === 'verified' ? 'bg-green-50 border-green-200 text-green-800' :
                    r.status === 'discrepancy' ? 'bg-red-50 border-red-200 text-red-800' :
                    'bg-yellow-50 border-yellow-200 text-yellow-800'
                  }`}
                >
                  <strong>{r.part_number}</strong> — {r.message}
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Verification History */}
      <div>
        <h3 className="font-semibold text-sm mb-3">Verification History</h3>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {verifications?.length === 0 ? (
            <p className="text-xs text-gray-500 text-center py-8">No verifications yet</p>
          ) : (
            verifications?.map(v => (
              <Card key={v.id} className="p-3">
                <div className="flex items-start gap-2">
                  {v.verification_status === 'verified' ? (
                    <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-900">{v.part_number}</p>
                    <p className="text-xs text-gray-600 mt-0.5">
                      {v.verification_status === 'verified' ? '✓ Matches TSG original' : '✗ Discrepancy found'}
                    </p>
                    {v.description_matches_tsg === false && (
                      <p className="text-xs text-red-600 mt-1">
                        <strong>TSG:</strong> {v.tsg_original_description}
                        <br />
                        <strong>Current:</strong> {v.current_description}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      Verified by {v.verified_by} on {format(new Date(v.verified_date), 'PPpp')}
                    </p>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}