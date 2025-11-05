// components/admin/kyc-document-viewer.tsx
// Purpose: KYC Document Viewer - Display uploaded KYC documents

"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Download, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";

interface Document {
  type: string;
  fileUrl: string;
  fileName: string;
  uploadedAt: string;
  mimeType: string;
}

interface KYCDocumentViewerProps {
  documents: Document[];
}

export function KYCDocumentViewer({ documents }: KYCDocumentViewerProps) {
  const isImage = (mimeType: string) => mimeType.startsWith("image/");

  return (
    <div className="space-y-4">
      {documents.map((doc, index) => (
        <Card key={index}>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="w-4 h-4" />
              {doc.type.replace("_", " ").toUpperCase()}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isImage(doc.mimeType) ? (
              <div className="relative aspect-video w-full bg-muted rounded-lg overflow-hidden">
                <Image
                  src={doc.fileUrl}
                  alt={doc.type}
                  fill
                  className="object-contain"
                />
              </div>
            ) : (
              <div className="p-8 bg-muted rounded-lg text-center">
                <FileText className="w-12 h-12 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">{doc.fileName}</p>
              </div>
            )}
            <div className="flex gap-2 mt-4">
              <Button variant="outline" size="sm" asChild className="flex-1">
                <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer">
                  <Eye className="w-4 h-4 mr-2" />
                  View Full
                </a>
              </Button>
              <Button variant="outline" size="sm" asChild className="flex-1">
                <a href={doc.fileUrl} download>
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default KYCDocumentViewer;
