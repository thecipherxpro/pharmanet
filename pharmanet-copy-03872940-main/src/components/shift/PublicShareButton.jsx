import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Share2, Copy, Check, ExternalLink } from "lucide-react";
import { base44 } from "@/api/base44Client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export default function PublicShareButton({ shiftId, variant = "outline", size = "sm" }) {
  const [open, setOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleGenerateLink = async () => {
    setLoading(true);
    try {
      const { data } = await base44.functions.invoke('generatePublicShareLink', {
        shift_id: shiftId
      });

      if (data.success) {
        setShareUrl(data.share_url);
        setOpen(true);
      }
    } catch (error) {
      console.error("Error generating share link:", error);
      alert("Failed to generate share link. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const handleOpenInNewTab = () => {
    window.open(shareUrl, '_blank');
  };

  return (
    <>
      <Button
        onClick={handleGenerateLink}
        variant={variant}
        size={size}
        disabled={loading}
      >
        {loading ? (
          <>
            <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
            Generating...
          </>
        ) : (
          <>
            <Share2 className="w-4 h-4 mr-2" />
            Share Publicly
          </>
        )}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Public Share Link</DialogTitle>
            <DialogDescription>
              Anyone with this link can view the shift details without logging in.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Input
                readOnly
                value={shareUrl}
                className="flex-1"
              />
              <Button
                size="icon"
                variant="outline"
                onClick={handleCopy}
                className="flex-shrink-0"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleCopy}
                variant="default"
                className="flex-1"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Link
                  </>
                )}
              </Button>

              <Button
                onClick={handleOpenInNewTab}
                variant="outline"
                className="flex-1"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Preview
              </Button>
            </div>

            <div className="text-xs text-gray-500 text-center">
              Share this link on social media, job boards, or anywhere you want to promote this shift.
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}