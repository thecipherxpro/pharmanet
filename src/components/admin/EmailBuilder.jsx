import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { 
  Type, 
  Image as ImageIcon, 
  Link as LinkIcon, 
  MousePointerClick, 
  GripVertical, 
  X,
  LayoutTemplate,
  SeparatorHorizontal
} from "lucide-react";

const BLOCK_TYPES = {
  TEXT: 'text',
  BUTTON: 'button',
  IMAGE: 'image',
  SPACER: 'spacer',
  DIVIDER: 'divider'
};

export default function EmailBuilder({ value, onChange }) {
  // value is an array of blocks: [{ id, type, content: {} }]
  
  const addBlock = (type) => {
    const newBlock = {
      id: `block-${Date.now()}`,
      type,
      content: getDefaultContent(type)
    };
    onChange([...value, newBlock]);
  };

  const updateBlock = (id, newContent) => {
    onChange(value.map(b => b.id === id ? { ...b, content: { ...b.content, ...newContent } } : b));
  };

  const removeBlock = (id) => {
    onChange(value.filter(b => b.id !== id));
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    
    const items = Array.from(value);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    onChange(items);
  };

  const getDefaultContent = (type) => {
    switch (type) {
      case BLOCK_TYPES.TEXT: return { html: '<p>Enter your text here...</p>' };
      case BLOCK_TYPES.BUTTON: return { text: 'Click Me', url: 'https://', color: '#0f766e', textColor: '#ffffff' };
      case BLOCK_TYPES.IMAGE: return { url: '', alt: '', width: '100%' };
      case BLOCK_TYPES.SPACER: return { height: '20px' };
      case BLOCK_TYPES.DIVIDER: return { color: '#e5e7eb' };
      default: return {};
    }
  };

  return (
    <div className="grid lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
      {/* Sidebar / Toolbox */}
      <div className="lg:col-span-1 space-y-4">
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold text-sm text-gray-700 mb-3">Content Blocks</h3>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" onClick={() => addBlock(BLOCK_TYPES.TEXT)} className="justify-start h-auto py-3">
                <Type className="w-4 h-4 mr-2 text-gray-500" />
                <span className="text-xs">Text</span>
              </Button>
              <Button variant="outline" onClick={() => addBlock(BLOCK_TYPES.BUTTON)} className="justify-start h-auto py-3">
                <MousePointerClick className="w-4 h-4 mr-2 text-gray-500" />
                <span className="text-xs">Button</span>
              </Button>
              <Button variant="outline" onClick={() => addBlock(BLOCK_TYPES.IMAGE)} className="justify-start h-auto py-3">
                <ImageIcon className="w-4 h-4 mr-2 text-gray-500" />
                <span className="text-xs">Image</span>
              </Button>
              <Button variant="outline" onClick={() => addBlock(BLOCK_TYPES.DIVIDER)} className="justify-start h-auto py-3">
                <SeparatorHorizontal className="w-4 h-4 mr-2 text-gray-500" />
                <span className="text-xs">Divider</span>
              </Button>
              <Button variant="outline" onClick={() => addBlock(BLOCK_TYPES.SPACER)} className="justify-start h-auto py-3">
                <LayoutTemplate className="w-4 h-4 mr-2 text-gray-500" />
                <span className="text-xs">Spacer</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="text-xs text-gray-500 p-2 bg-blue-50 rounded-lg">
          <p>Tip: Drag blocks to reorder. Click 'X' to remove.</p>
        </div>
      </div>

      {/* Editor Canvas */}
      <div className="lg:col-span-2 bg-gray-100 rounded-xl p-4 overflow-y-auto border border-gray-200">
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="email-builder">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="space-y-3 max-w-2xl mx-auto"
              >
                {value.length === 0 && (
                  <div className="text-center py-12 text-gray-400 border-2 border-dashed border-gray-300 rounded-xl">
                    <p>Drag or click blocks to start building your email</p>
                  </div>
                )}
                
                {value.map((block, index) => (
                  <Draggable key={block.id} draggableId={block.id} index={index}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`bg-white rounded-lg shadow-sm border border-gray-200 group relative ${snapshot.isDragging ? 'ring-2 ring-blue-500 z-50' : ''}`}
                      >
                        {/* Block Controls */}
                        <div className="absolute right-2 top-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 backdrop-blur rounded-md p-1 z-10 border border-gray-100 shadow-sm">
                          <div {...provided.dragHandleProps} className="p-1 hover:bg-gray-100 rounded cursor-grab active:cursor-grabbing">
                            <GripVertical className="w-4 h-4 text-gray-400" />
                          </div>
                          <button onClick={() => removeBlock(block.id)} className="p-1 hover:bg-red-50 text-red-400 hover:text-red-600 rounded">
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Block Content */}
                        <div className="p-4">
                          {block.type === BLOCK_TYPES.TEXT && (
                            <div className="prose max-w-none">
                              <ReactQuill 
                                theme="snow"
                                value={block.content.html}
                                onChange={(html) => updateBlock(block.id, { html })}
                                modules={{
                                  toolbar: [
                                    ['bold', 'italic', 'underline', 'strike'],
                                    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                                    ['link', 'clean']
                                  ],
                                }}
                              />
                            </div>
                          )}

                          {block.type === BLOCK_TYPES.BUTTON && (
                            <div className="space-y-3">
                              <div className="flex gap-3">
                                <div className="flex-1">
                                  <Label className="text-xs">Button Text</Label>
                                  <Input 
                                    value={block.content.text} 
                                    onChange={(e) => updateBlock(block.id, { text: e.target.value })}
                                    className="h-8 text-sm"
                                  />
                                </div>
                                <div className="flex-1">
                                  <Label className="text-xs">URL</Label>
                                  <Input 
                                    value={block.content.url} 
                                    onChange={(e) => updateBlock(block.id, { url: e.target.value })}
                                    className="h-8 text-sm"
                                  />
                                </div>
                              </div>
                              <div className="flex gap-3">
                                <div>
                                  <Label className="text-xs">Bg Color</Label>
                                  <div className="flex items-center gap-2">
                                    <input 
                                      type="color" 
                                      value={block.content.color} 
                                      onChange={(e) => updateBlock(block.id, { color: e.target.value })}
                                      className="h-8 w-8 rounded cursor-pointer"
                                    />
                                    <span className="text-xs text-gray-500">{block.content.color}</span>
                                  </div>
                                </div>
                              </div>
                              {/* Preview */}
                              <div className="mt-2 text-center p-4 bg-gray-50 rounded border border-dashed">
                                <a 
                                  href="#" 
                                  onClick={(e) => e.preventDefault()}
                                  style={{ 
                                    backgroundColor: block.content.color, 
                                    color: block.content.textColor,
                                    padding: '10px 20px',
                                    borderRadius: '6px',
                                    textDecoration: 'none',
                                    display: 'inline-block',
                                    fontWeight: '500'
                                  }}
                                >
                                  {block.content.text}
                                </a>
                              </div>
                            </div>
                          )}

                          {block.type === BLOCK_TYPES.IMAGE && (
                            <div className="space-y-3">
                              <div>
                                <Label className="text-xs">Image URL</Label>
                                <Input 
                                  value={block.content.url} 
                                  onChange={(e) => updateBlock(block.id, { url: e.target.value })}
                                  placeholder="https://..."
                                  className="h-8 text-sm"
                                />
                              </div>
                              {block.content.url && (
                                <div className="mt-2 text-center bg-gray-50 rounded p-2">
                                  <img src={block.content.url} alt="Preview" className="max-h-40 mx-auto rounded" />
                                </div>
                              )}
                            </div>
                          )}

                          {block.type === BLOCK_TYPES.DIVIDER && (
                            <div className="py-2">
                              <hr style={{ borderColor: block.content.color, borderWidth: '1px' }} />
                            </div>
                          )}

                          {block.type === BLOCK_TYPES.SPACER && (
                            <div className="flex items-center gap-2">
                              <Label className="text-xs">Height</Label>
                              <select 
                                value={block.content.height}
                                onChange={(e) => updateBlock(block.id, { height: e.target.value })}
                                className="text-sm border rounded p-1"
                              >
                                <option value="10px">Small (10px)</option>
                                <option value="20px">Medium (20px)</option>
                                <option value="40px">Large (40px)</option>
                                <option value="60px">Extra Large (60px)</option>
                              </select>
                              <div style={{ height: block.content.height }} className="w-full bg-gray-100 border border-dashed border-gray-300 rounded ml-2"></div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>
    </div>
  );
}

// Helper to convert blocks to HTML
export const blocksToHtml = (blocks) => {
  return blocks.map(block => {
    switch (block.type) {
      case BLOCK_TYPES.TEXT:
        return `<div style="font-family: sans-serif; line-height: 1.5; color: #374151;">${block.content.html}</div>`;
      case BLOCK_TYPES.BUTTON:
        return `
          <div style="text-align: center; padding: 10px 0;">
            <a href="${block.content.url}" style="background-color: ${block.content.color}; color: ${block.content.textColor}; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; display: inline-block; font-family: sans-serif;">
              ${block.content.text}
            </a>
          </div>
        `;
      case BLOCK_TYPES.IMAGE:
        return block.content.url ? `
          <div style="text-align: center; padding: 10px 0;">
            <img src="${block.content.url}" alt="${block.content.alt || ''}" style="max-width: 100%; height: auto; border-radius: 8px;" />
          </div>
        ` : '';
      case BLOCK_TYPES.DIVIDER:
        return `<hr style="border: 0; border-top: 1px solid ${block.content.color}; margin: 20px 0;" />`;
      case BLOCK_TYPES.SPACER:
        return `<div style="height: ${block.content.height};"></div>`;
      default:
        return '';
    }
  }).join('');
};