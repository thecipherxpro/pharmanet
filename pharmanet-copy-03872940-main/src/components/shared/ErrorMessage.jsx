import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, Home, ArrowLeft } from "lucide-react";

export default function ErrorMessage({ 
  title = "Something went wrong",
  message = "We couldn't load this content. Please try again.",
  onRetry,
  onGoBack,
  onGoHome,
  showRetry = true,
  showGoBack = false,
  showGoHome = false
}) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full shadow-lg">
        <CardContent className="p-8 text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-10 h-10 text-red-600" />
          </div>
          
          <h2 className="text-xl font-bold text-gray-900 mb-2">{title}</h2>
          <p className="text-sm text-gray-600 mb-6 leading-relaxed">{message}</p>
          
          <div className="space-y-2">
            {showRetry && onRetry && (
              <Button
                onClick={onRetry}
                className="w-full bg-blue-600 hover:bg-blue-700 h-11"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
            )}
            
            {showGoBack && onGoBack && (
              <Button
                onClick={onGoBack}
                variant="outline"
                className="w-full h-11"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Go Back
              </Button>
            )}
            
            {showGoHome && onGoHome && (
              <Button
                onClick={onGoHome}
                variant="outline"
                className="w-full h-11"
              >
                <Home className="w-4 h-4 mr-2" />
                Go to Dashboard
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}