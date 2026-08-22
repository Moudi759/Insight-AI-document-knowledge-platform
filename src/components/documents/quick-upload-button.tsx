"use client";

import * as React from "react";
import { Upload } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { UploadDropzone } from "@/components/documents/upload-dropzone";

export function QuickUploadButton({
  children,
  variant = "default",
}: {
  children?: React.ReactNode;
  variant?: "default" | "outline" | "secondary";
}) {
  const [open, setOpen] = React.useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={variant}>
          <Upload aria-hidden="true" />
          {children ?? "Quick upload"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Upload documents</DialogTitle>
          <DialogDescription>
            Files are extracted, chunked and indexed automatically.
          </DialogDescription>
        </DialogHeader>
        <UploadDropzone compact />
      </DialogContent>
    </Dialog>
  );
}
