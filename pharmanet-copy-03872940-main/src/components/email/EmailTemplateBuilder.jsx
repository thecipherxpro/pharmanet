import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { 
  Type, 
  Image as ImageIcon, 
  Link as LinkIcon, 
  Code, 
  Eye,
  Plus,
  Trash2,
  Move,
  Edit
} from "lucide-react";

export default function EmailTemplateBuilder({ onGenerate }) {
  const [components, setComponents] = useState([
    { type: 'header', content: 'Pharmanet' },
    { type: 'text', content: '' }
  ]);

  const addComponent = (type) => {
    const newComponent = {
      type,
      content: type === 'header' ? 'Pharmanet' : '',
      ...(type === 'button' && { buttonText: 'Click Here', buttonLink: '#' }),
      ...(type === 'image' && { imageUrl: '', alt: '' })
    };
    setComponents([...components, newComponent]);
  };

  const updateComponent = (index, updates) => {
    const updated = [...components];
    updated[index] = { ...updated[index], ...updates };
    setComponents(updated);
  };

  const removeComponent = (index) => {
    setComponents(components.filter((_, i) => i !== index));
  };

  const moveComponent = (index, direction) => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= components.length) return;
    
    const updated = [...components];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    setComponents(updated);
  };

  const generateHTML = () => {
    let html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; }
    .email-container { max-width: 600px; margin: 0 auto; background: #ffffff; }
    .header { background: linear-gradient(135deg, #14b8a6 0%, #0891b2 100%); padding: 32px 24px; text-align: center; }
    .header-title { color: #ffffff; font-size: 28px; font-weight: bold; margin: 0; }
    .content { padding: 32px 24px; }
    .text-block { color: #374151; font-size: 16px; line-height: 1.6; margin: 16px 0; }
    .button-block { text-align: center; margin: 24px 0; }
    .button { display: inline-block; background: #14b8a6; color: #ffffff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; }
    .image-block { text-align: center; margin: 24px 0; }
    .image-block img { max-width: 100%; height: auto; border-radius: 8px; }
    .divider { border: 0; border-top: 1px solid #e5e7eb; margin: 24px 0; }
    .footer { background: #f9fafb; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb; }
    .footer-text { color: #6b7280; font-size: 14px; margin: 8px 0; }
  </style>
</head>
<body>
  <div class="email-container">
`;

    components.forEach(comp => {
      if (comp.type === 'header') {
        html += `
    <div class="header">
      <h1 class="header-title">${comp.content || 'Pharmanet'}</h1>
    </div>`;
      } else if (comp.type === 'text') {
        html += `
    <div class="content">
      <div class="text-block">${comp.content.replace(/\n/g, '<br>')}</div>
    </div>`;
      } else if (comp.type === 'button') {
        html += `
    <div class="button-block">
      <a href="${comp.buttonLink || '#'}" class="button">${comp.buttonText || 'Click Here'}</a>
    </div>`;
      } else if (comp.type === 'image') {
        if (comp.imageUrl) {
          html += `
    <div class="image-block">
      <img src="${comp.imageUrl}" alt="${comp.alt || 'Image'}" />
    </div>`;
        }
      } else if (comp.type === 'divider') {
        html += `
    <hr class="divider" />`;
      }
    });

    html += `
    <div class="footer">
      <p class="footer-text">© ${new Date().getFullYear()} Pharmanet. All rights reserved.</p>
      <p class="footer-text">This is an automated email from Pharmanet Communication Team.</p>
    </div>
  </div>
</body>
</html>`;

    return html;
  };

  const handleGenerate = () => {
    onGenerate(generateHTML());
  };

  const renderComponentEditor = (comp, index) => {
    return (
      <Card key={index} className="mb-3">
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-600 uppercase">{comp.type}</span>
            </div>
            <div className="flex gap-1">
              {index > 0 && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => moveComponent(index, 'up')}
                  className="h-7 w-7 p-0"
                >
                  ↑
                </Button>
              )}
              {index < components.length - 1 && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => moveComponent(index, 'down')}
                  className="h-7 w-7 p-0"
                >
                  ↓
                </Button>
              )}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => removeComponent(index)}
                className="h-7 w-7 p-0 text-red-600 hover:text-red-700"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>

          {comp.type === 'header' && (
            <Input
              value={comp.content}
              onChange={(e) => updateComponent(index, { content: e.target.value })}
              placeholder="Header text..."
              className="text-sm"
            />
          )}

          {comp.type === 'text' && (
            <Textarea
              value={comp.content}
              onChange={(e) => updateComponent(index, { content: e.target.value })}
              placeholder="Enter your message here..."
              className="min-h-[100px] text-sm"
              rows={4}
            />
          )}

          {comp.type === 'button' && (
            <div className="space-y-2">
              <Input
                value={comp.buttonText}
                onChange={(e) => updateComponent(index, { buttonText: e.target.value })}
                placeholder="Button text"
                className="text-sm"
              />
              <Input
                value={comp.buttonLink}
                onChange={(e) => updateComponent(index, { buttonLink: e.target.value })}
                placeholder="https://example.com"
                className="text-sm"
              />
            </div>
          )}

          {comp.type === 'image' && (
            <div className="space-y-2">
              <Input
                value={comp.imageUrl}
                onChange={(e) => updateComponent(index, { imageUrl: e.target.value })}
                placeholder="https://example.com/image.jpg"
                className="text-sm"
              />
              <Input
                value={comp.alt}
                onChange={(e) => updateComponent(index, { alt: e.target.value })}
                placeholder="Image description"
                className="text-sm"
              />
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => addComponent('text')}
          className="h-9"
        >
          <Type className="w-4 h-4 mr-2" />
          Text
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => addComponent('button')}
          className="h-9"
        >
          <LinkIcon className="w-4 h-4 mr-2" />
          Button
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => addComponent('image')}
          className="h-9"
        >
          <ImageIcon className="w-4 h-4 mr-2" />
          Image
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => addComponent('divider')}
          className="h-9"
        >
          <Code className="w-4 h-4 mr-2" />
          Divider
        </Button>
      </div>

      <div className="space-y-3">
        {components.map((comp, index) => renderComponentEditor(comp, index))}
      </div>

      <Button
        onClick={handleGenerate}
        className="w-full bg-teal-600 hover:bg-teal-700"
      >
        <Eye className="w-4 h-4 mr-2" />
        Generate Email HTML
      </Button>
    </div>
  );
}