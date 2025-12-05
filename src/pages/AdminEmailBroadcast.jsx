import React, { useState, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AdminOnly } from "../components/auth/RouteProtection";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent
} from "@/components/ui/tabs";
import {
  Mail,
  Users,
  Send,
  Layout,
  Plus,
  GripVertical,
  Trash2,
  Type,
  Image as ImageIcon,
  MousePointerClick,
  MoveVertical,
  Eye,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Loader2,
  X,
  Calendar,
  MapPin,
  Clock,
  RefreshCw
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

// --- Email Builder Components ---

const BLOCK_TYPES = {
  TEXT: 'text',
  BUTTON: 'button',
  IMAGE: 'image',
  SPACER: 'spacer'
};

const INITIAL_BLOCKS = [
  { id: 'b1', type: BLOCK_TYPES.TEXT, content: '<h2>Hello there!</h2><p>Write your message here...</p>' }
];

const PRESET_TEMPLATES = [
  {
    id: 'newsletter',
    name: 'Newsletter',
    subject: 'Monthly Update from Pharmanet',
    blocks: [
      { id: 't1', type: BLOCK_TYPES.IMAGE, url: 'https://placehold.co/600x200/0f766e/white?text=Pharmanet+Newsletter', alt: 'Header' },
      { id: 't2', type: BLOCK_TYPES.TEXT, content: '<h2>Monthly Update</h2><p>Here is what is new this month...</p>' },
      { id: 't3', type: BLOCK_TYPES.BUTTON, label: 'Read More', url: 'https://pharmanet.com', color: '#0f766e' }
    ]
  },
  {
    id: 'alert',
    name: 'Urgent Alert',
    subject: 'Important: Action Required',
    blocks: [
      { id: 'a1', type: BLOCK_TYPES.TEXT, content: '<h2 style="color: #dc2626;">Action Required</h2><p>Please login to your account to verify your details.</p>' },
      { id: 'a2', type: BLOCK_TYPES.BUTTON, label: 'Login Now', url: 'https://pharmanet.com/login', color: '#dc2626' }
    ]
  },
  {
    id: 'promo',
    name: 'Promotion',
    subject: 'Special Offer for You',
    blocks: [
      { id: 'p1', type: BLOCK_TYPES.TEXT, content: '<h2>Special Offer!</h2><p>Get 50% off your next posting.</p>' },
      { id: 'p2', type: BLOCK_TYPES.SPACER, height: 20 },
      { id: 'p3', type: BLOCK_TYPES.BUTTON, label: 'Claim Offer', url: 'https://pharmanet.com/promo', color: '#0f766e' }
    ]
  },
  {
    id: 'recent_shifts',
    name: 'Recent Available Shifts',
    subject: 'New Shifts Available - Check Them Out!',
    requiresShifts: true,
    blocks: [
      { id: 'rs1', type: BLOCK_TYPES.TEXT, content: '<h2>New Shifts Available!</h2><p>We found some shifts that might interest you. Check them out below:</p>' },
      { id: 'rs2', type: BLOCK_TYPES.SPACER, height: 10 },
      { id: 'rs3', type: 'shifts_placeholder', content: '' },
      { id: 'rs4', type: BLOCK_TYPES.SPACER, height: 20 },
      { id: 'rs5', type: BLOCK_TYPES.BUTTON, label: 'Browse All Shifts', url: 'https://shifts.pharmanet.ca/BrowseShifts', color: '#0f766e' }
    ]
  }
];

function EmailBlock({ block, index, updateBlock, removeBlock }) {
  return (
    <Draggable draggableId={block.id} index={index}>
      {(provided) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className="mb-3 group relative"
        >
          <div className="absolute left-0 top-0 bottom-0 w-8 flex items-center justify-center cursor-move opacity-0 group-hover:opacity-100 transition-opacity bg-gray-100 rounded-l-lg border-y border-l border-gray-200"
               {...provided.dragHandleProps}>
            <GripVertical className="w-4 h-4 text-gray-400" />
          </div>
          
          <div className="bg-white border border-gray-200 rounded-lg p-4 pl-10 shadow-sm hover:shadow-md transition-shadow">
            <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:bg-red-50" onClick={() => removeBlock(block.id)}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>

            {/* Block Content Editor */}
            <div className="pr-8">
              {block.type === BLOCK_TYPES.TEXT && (
                <div>
                  <Label className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                    <Type className="w-3 h-3" /> Rich Text
                  </Label>
                  <ReactQuill 
                    value={block.content} 
                    onChange={(val) => updateBlock(block.id, { content: val })}
                    theme="snow"
                    modules={{
                      toolbar: [
                        ['bold', 'italic', 'underline', 'strike'],
                        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                        [{ 'header': [1, 2, 3, false] }],
                        ['link', 'clean']
                      ],
                    }}
                  />
                </div>
              )}

              {block.type === BLOCK_TYPES.BUTTON && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <Label className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                      <MousePointerClick className="w-3 h-3" /> Button
                    </Label>
                  </div>
                  <div>
                    <Label className="text-xs">Label</Label>
                    <Input 
                      value={block.label} 
                      onChange={(e) => updateBlock(block.id, { label: e.target.value })}
                      placeholder="Click Here"
                      className="h-8"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Color</Label>
                    <div className="flex items-center gap-2">
                      <input 
                        type="color" 
                        value={block.color || '#0f766e'}
                        onChange={(e) => updateBlock(block.id, { color: e.target.value })}
                        className="h-8 w-8 p-0 border-0 rounded cursor-pointer"
                      />
                      <Input 
                        value={block.color || '#0f766e'} 
                        onChange={(e) => updateBlock(block.id, { color: e.target.value })}
                        className="h-8"
                      />
                    </div>
                  </div>
                  <div className="col-span-2">
                    <Label className="text-xs">URL</Label>
                    <Input 
                      value={block.url} 
                      onChange={(e) => updateBlock(block.id, { url: e.target.value })}
                      placeholder="https://"
                      className="h-8"
                    />
                  </div>
                </div>
              )}

              {block.type === BLOCK_TYPES.IMAGE && (
                <div>
                  <Label className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                    <ImageIcon className="w-3 h-3" /> Image
                  </Label>
                  <div className="space-y-2">
                    <Input 
                      value={block.url} 
                      onChange={(e) => updateBlock(block.id, { url: e.target.value })}
                      placeholder="Image URL (https://...)"
                      className="h-8"
                    />
                    <Input 
                      value={block.alt} 
                      onChange={(e) => updateBlock(block.id, { alt: e.target.value })}
                      placeholder="Alt Text"
                      className="h-8"
                    />
                    {block.url && (
                      <div className="mt-2 border rounded p-1 bg-gray-50">
                         <img src={block.url} alt={block.alt} className="max-h-32 mx-auto object-contain" />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {block.type === BLOCK_TYPES.SPACER && (
                <div>
                   <Label className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                    <MoveVertical className="w-3 h-3" /> Spacer
                  </Label>
                  <div className="flex items-center gap-3">
                    <Input 
                      type="number"
                      value={block.height || 20} 
                      onChange={(e) => updateBlock(block.id, { height: parseInt(e.target.value) })}
                      className="h-8 w-24"
                    />
                    <span className="text-xs text-gray-500">pixels height</span>
                  </div>
                </div>
              )}
              
              {block.type === 'shifts_placeholder' && (
                <div className="bg-teal-50 border border-teal-200 rounded-lg p-4 text-center">
                  <Calendar className="w-8 h-8 text-teal-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-teal-800">Shifts Placeholder</p>
                  <p className="text-xs text-teal-600">Recent shifts will be inserted here</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </Draggable>
  );
}

// --- Main Page Component ---

function AdminEmailBroadcastContent() {
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  
  // Step 1: Audience
  const [audience, setAudience] = useState('all');
  const [specificEmails, setSpecificEmails] = useState('');
  
  // Step 2: Content
  const [subject, setSubject] = useState('');
  const [blocks, setBlocks] = useState(INITIAL_BLOCKS);
  const [previewMode, setPreviewMode] = useState(false);
  
  // Validation and Status
  const [validationError, setValidationError] = useState('');
  const [sendStatus, setSendStatus] = useState(null);
  const [testEmailDialogOpen, setTestEmailDialogOpen] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [testingSMTP, setTestingSMTP] = useState(false);
  
  // Shifts for Recent Shifts template
  const [selectedShifts, setSelectedShifts] = useState([]);
  const [loadingShifts, setLoadingShifts] = useState(false);
  const [showShiftsSection, setShowShiftsSection] = useState(false);

  // Fetch Users for Specific Selection
  const { data: users = [] } = useQuery({
    queryKey: ['adminUsersList'],
    queryFn: async () => {
      const result = await base44.entities.User.list();
      return Array.isArray(result) ? result : [];
    },
    enabled: audience === 'specific'
  });

  // Broadcast Mutation
  const broadcastMutation = useMutation({
    mutationFn: async (data) => {
      setSendStatus('sending');
      const response = await base44.functions.invoke('adminBroadcastEmail', data);
      return response.data;
    },
    onSuccess: (data) => {
      setSendStatus('success');
      setTimeout(() => {
        setStep(1);
        setBlocks(INITIAL_BLOCKS);
        setSubject('');
        setSpecificEmails('');
        setSendStatus(null);
        setValidationError('');
        setShowShiftsSection(false);
        setSelectedShifts([]);
      }, 3000);
    },
    onError: (error) => {
      setSendStatus('error');
      setValidationError(error.response?.data?.error || error.message || 'Failed to send emails');
    }
  });

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    const items = Array.from(blocks);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    setBlocks(items);
  };

  const addBlock = (type) => {
    const newBlock = {
      id: `b${Date.now()}`,
      type,
      content: type === BLOCK_TYPES.TEXT ? '<p>New text block</p>' : '',
      label: type === BLOCK_TYPES.BUTTON ? 'Click Me' : '',
      url: '',
      color: '#0f766e',
      height: 20
    };
    setBlocks([...blocks, newBlock]);
  };

  const updateBlock = (id, updates) => {
    setBlocks(blocks.map(b => b.id === id ? { ...b, ...updates } : b));
  };

  const removeBlock = (id) => {
    setBlocks(blocks.filter(b => b.id !== id));
  };

  const loadTemplate = (template) => {
    if (confirm('Load template? This will replace your current content.')) {
      setSubject(template.subject);
      setBlocks(template.blocks.map(b => ({...b, id: `b${Date.now()}-${Math.random()}`})));
      
      if (template.requiresShifts) {
        setShowShiftsSection(true);
        setSelectedShifts([]);
      } else {
        setShowShiftsSection(false);
        setSelectedShifts([]);
      }
    }
  };
  
  const fetchRecentShifts = async () => {
    setLoadingShifts(true);
    try {
      const shifts = await base44.entities.Shift.filter(
        { status: 'open' },
        '-created_date',
        5
      );
      setSelectedShifts(shifts);
      toast({
        title: "Shifts Loaded",
        description: `Fetched ${shifts.length} open shifts`,
      });
    } catch (error) {
      console.error('Failed to fetch shifts:', error);
      toast({
        variant: "destructive",
        title: "Failed to fetch shifts",
        description: error.message
      });
    } finally {
      setLoadingShifts(false);
    }
  };
  
  const formatShiftDate = (shift) => {
    if (!shift.schedule || shift.schedule.length === 0) return 'Date TBD';
    const firstSchedule = shift.schedule[0];
    try {
      const date = new Date(firstSchedule.date + 'T00:00:00');
      return date.toLocaleDateString('en-CA', { weekday: 'short', month: 'short', day: 'numeric' });
    } catch {
      return firstSchedule.date;
    }
  };
  
  const formatShiftTime = (shift) => {
    if (!shift.schedule || shift.schedule.length === 0) return '';
    const firstSchedule = shift.schedule[0];
    const formatTime = (time24) => {
      if (!time24) return '';
      const [hours, minutes] = time24.split(':').map(Number);
      const period = hours >= 12 ? 'PM' : 'AM';
      const hours12 = hours % 12 || 12;
      return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
    };
    return `${formatTime(firstSchedule.start_time)} - ${formatTime(firstSchedule.end_time)}`;
  };
  
  const generateShiftsHTML = () => {
    if (selectedShifts.length === 0) {
      return '<p style="color: #666; font-style: italic; text-align: center; padding: 20px;">No shifts loaded yet. Click "Fetch 5 Recent Shifts" in the sidebar.</p>';
    }
    
    return selectedShifts.map(shift => {
      const publicUrl = `https://shifts.pharmanet.ca/PublicShift?id=${shift.id}`;
      const location = [shift.pharmacy_city, shift.pharmacy_province].filter(Boolean).join(', ') || 'Ontario';
      
      return `
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 12px 0;">
          <h3 style="margin: 0 0 8px; font-size: 16px; color: #1a1a1a; font-weight: 600;">${shift.title || 'Pharmacy Shift'}</h3>
          <p style="margin: 0 0 4px; font-size: 14px; color: #666;">
            <strong>📍 Location:</strong> ${shift.pharmacy_name || 'Pharmacy'} - ${location}
          </p>
          <p style="margin: 0 0 4px; font-size: 14px; color: #666;">
            <strong>📅 Date:</strong> ${formatShiftDate(shift)}
          </p>
          <p style="margin: 0 0 12px; font-size: 14px; color: #666;">
            <strong>⏰ Time:</strong> ${formatShiftTime(shift)}
          </p>
          <a href="${publicUrl}" style="display: inline-block; background: #0f766e; color: #ffffff; padding: 8px 16px; text-decoration: none; font-size: 12px; font-weight: 600; border-radius: 4px;">View Shift →</a>
        </div>
      `;
    }).join('');
  };

  const generateHTML = () => {
    const logoUrl = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68fc5eaf1b32d1359be8744a/86aaf53ec_6852a121a_android-launchericon-512-512.png';

    let html = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Pharmanet Communication</title>
  <link href="https://fonts.googleapis.com/css2?family=Roboto+Condensed:wght@300;400;600;700&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { margin: 0; padding: 0; font-family: 'Roboto Condensed', Arial, sans-serif; background-color: #f5f5f5; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }
    table { border-collapse: collapse; width: 100%; }
    img { border: 0; display: block; outline: none; text-decoration: none; }
    
    .email-wrapper { width: 100%; background-color: #f5f5f5; padding: 16px 0; }
    .email-container { max-width: 600px; width: 100%; margin: 0 auto; background: #ffffff; border: 1px solid #e0e0e0; }
    
    .email-header { background: #d3f3fbff; padding: 16px 24px; }
    .email-header-content { display: flex; justify-content: space-between; align-items: center; width: 100%; }
    .email-header-text { text-align: left; }
    .email-header-title { font-family: 'Roboto Condensed', Arial, sans-serif; font-size: 20px; font-weight: 700; color: #010101ff; letter-spacing: 0.5px; margin: 0; }
    .email-header-logo { text-align: right; }
    .email-header-logo-img { width: 40px; height: 40px; }
    
    .email-body { padding: 28px 24px; background: #ffffff; }
    .text-block { font-family: 'Roboto Condensed', Arial, sans-serif; color: #333333; font-size: 14px; line-height: 1.6; margin: 14px 0; }
    .text-block p { margin: 12px 0; }
    .text-block h1, .text-block h2, .text-block h3 { font-family: 'Roboto Condensed', Arial, sans-serif; color: #1a1a1a; margin: 18px 0 10px; font-size: 18px; }
    .text-block a { color: #1a1a1a; text-decoration: underline; }

    .button-wrapper { text-align: center; margin: 20px 0; }
    .button { display: inline-block; font-family: 'Roboto Condensed', Arial, sans-serif; background: #1a1a1a; color: #ffffff !important; padding: 11px 28px; text-decoration: none; font-weight: 600; font-size: 12px; letter-spacing: 0.8px; text-transform: uppercase; border: 2px solid #1a1a1a; transition: all 0.3s; }
    .button:hover { background: #ffffff; color: #1a1a1a !important; }
    
    .image-wrapper { text-align: center; margin: 20px 0; padding: 0; }
    .image-wrapper img { max-width: 100%; height: auto; margin: 0 auto; border: 1px solid #e0e0e0; }
    
    .email-footer { background: #E8EEF2; padding: 32px 24px 24px; text-align: center; color: #333333; }
    .footer-brand { font-family: 'Roboto Condensed', Arial, sans-serif; font-size: 18px; font-weight: 700; color: #333333; letter-spacing: 0.5px; margin-bottom: 8px; text-transform: uppercase; }
    .footer-text { font-family: 'Roboto Condensed', Arial, sans-serif; color: #666666; font-size: 13px; line-height: 1.3; margin: 5px 0; }
    .footer-contact { font-family: 'Roboto Condensed', Arial, sans-serif; font-size: 13px; color: #333333; margin: 12px 0; }
    .footer-label { font-weight: 600; color: #333333; }
    .footer-link { color: #4A90B8; text-decoration: none; }
    .footer-link:hover { text-decoration: underline; }
    .footer-secured { font-family: 'Roboto Condensed', Arial, sans-serif; font-size: 12px; color: #666666; margin: 16px 0 8px; }
    .footer-unsubscribe { font-family: 'Roboto Condensed', Arial, sans-serif; font-size: 12px; margin-top: 12px; }
    .footer-unsubscribe a { color: #4A90B8; text-decoration: underline; }
    
    @media only screen and (max-width: 600px) {
      .email-wrapper { padding: 8px 0 !important; }
      .email-header { padding: 12px 16px !important; }
      .email-header-text { text-align: left !important; vertical-align: middle !important; }
      .email-header-logo { text-align: right !important; vertical-align: middle !important; width: 50px !important; }
      .email-header-logo-img { width: 36px !important; height: 36px !important; display: block !important; }
      .email-header-title { font-size: 18px !important; }
      .email-body { padding: 20px 16px !important; }
      .text-block { font-size: 13px !important; line-height: 1.5 !important; }
      .text-block h1, .text-block h2, .text-block h3 { font-size: 16px !important; }
      .button { padding: 10px 22px !important; font-size: 11px !important; }
      .email-footer { padding: 24px 16px 20px !important; }
      .footer-brand { font-size: 16px !important; }
      .footer-text { font-size: 12px !important; }
      .footer-contact { font-size: 12px !important; }
    }
  </style>
</head>
<body>
  <table role="presentation" class="email-wrapper" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center">
        <table role="presentation" class="email-container" cellpadding="0" cellspacing="0">
          <tr>
            <td class="email-header">
              <div class="email-header-content">
                <div class="email-header-text">
                  <h1 class="email-header-title">Pharmanet</h1>
                </div>
                <div class="email-header-logo">
                  <img src="${logoUrl}" alt="Pharmanet Logo" class="email-header-logo-img">
                </div>
              </div>
            </td>
          </tr>
          
          <tr>
            <td class="email-body">
`;
    
    blocks.forEach(block => {
      if (block.type === BLOCK_TYPES.TEXT) {
        html += `              <div class="text-block">${block.content}</div>\n`;
      } else if (block.type === BLOCK_TYPES.BUTTON) {
        html += `              <div class="button-wrapper">
                <a href="${block.url}" class="button" style="background-color: ${block.color || '#1a1a1a'}; border-color: ${block.color || '#1a1a1a'};">${block.label}</a>
              </div>\n`;
      } else if (block.type === BLOCK_TYPES.IMAGE) {
        if (block.url) {
          html += `              <div class="image-wrapper">
                <img src="${block.url}" alt="${block.alt || 'Image'}" />
              </div>\n`;
        }
      } else if (block.type === BLOCK_TYPES.SPACER) {
        html += `              <div style="height: ${block.height || 20}px;"></div>\n`;
      } else if (block.type === 'shifts_placeholder') {
        html += `              <div class="shifts-section">${generateShiftsHTML()}</div>\n`;
      }
    });
    
    html += `            </td>
          </tr>
          
          <tr>
            <td class="email-footer">
              <div class="footer-brand">PHARMANET INC</div>
              <p class="footer-text">
                You're receiving this email because you've signed up for the Pharmanet Platform.
              </p>
              <p class="footer-contact">
                <span class="footer-label">Contact Us:</span> <a href="mailto:info@pharmanet.ca" class="footer-link">info@pharmanet.ca</a>
              </p>
              <p class="footer-contact">
                <span class="footer-label">Website:</span> <a href="https://pharmanet.ca" class="footer-link">Pharmanet.ca</a>
              </p>
              <p class="footer-secured">
                Secured By: CipherX Solutions
              </p>
              <p class="footer-unsubscribe">
                <a href="#" class="footer-link">Unsubscribe</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
    
    return html;
  };

  const validateBeforeSend = () => {
    setValidationError('');
    
    if (!subject || subject.trim() === '') {
      setValidationError('Please enter an email subject');
      return false;
    }
    
    if (blocks.length === 0) {
      setValidationError('Please add at least one content block to your email');
      return false;
    }
    
    if (audience === 'specific') {
      const emails = specificEmails.split(',').map(e => e.trim()).filter(e => e);
      if (emails.length === 0) {
        setValidationError('Please enter at least one email address');
        return false;
      }
      
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const invalidEmails = emails.filter(email => !emailRegex.test(email));
      if (invalidEmails.length > 0) {
        setValidationError(`Invalid email format: ${invalidEmails.join(', ')}`);
        return false;
      }
    }
    
    return true;
  };

  const handleSend = () => {
    if (!validateBeforeSend()) {
      return;
    }
    
    const html_body = generateHTML();
    const specific_emails_array = specificEmails.split(',').map(e => e.trim()).filter(e => e);
    
    broadcastMutation.mutate({
      subject,
      html_body,
      target_audience: audience,
      specific_emails: specific_emails_array
    });
  };

  const handleTestSMTP = async () => {
    setTestingSMTP(true);
    try {
      const response = await base44.functions.invoke('testBrevoAPI', {});
      
      if (response.data.success) {
        toast({
          title: "✓ SMTP Connection OK",
          description: `Connected to ${response.data.config.host}:${response.data.config.port}`,
          className: "bg-green-50 border-green-200 text-green-900"
        });
      } else {
        throw new Error(response.data.error || 'SMTP test failed');
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "SMTP Connection Failed",
        description: error.response?.data?.error || error.message
      });
    } finally {
      setTestingSMTP(false);
    }
  };

  const handleTestEmail = async () => {
    if (!testEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(testEmail)) {
      toast({
        variant: "destructive",
        title: "Invalid Email",
        description: "Please enter a valid email address"
      });
      return;
    }

    setTestingSMTP(true);
    try {
      const html_body = generateHTML();
      const response = await base44.functions.invoke('sendBrevoEmail', {
        to: testEmail,
        subject: `[TEST] ${subject || 'Pharmanet Email Test'}`,
        html_body: html_body
      });

      if (response.data.success) {
        toast({
          title: "✓ Test Email Sent",
          description: `Check ${testEmail} for the test email`,
          className: "bg-green-50 border-green-200 text-green-900"
        });
        setTestEmailDialogOpen(false);
        setTestEmail('');
      } else {
        throw new Error(response.data.error || 'Failed to send test email');
      }
    } catch (error) {
      const errorMsg = error.response?.data?.error || error.response?.data?.details || error.message;
      toast({
        variant: "destructive",
        title: "Test Email Failed",
        description: errorMsg
      });
    } finally {
      setTestingSMTP(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Sticky Status Banner */}
      {(sendStatus || validationError) && (
        <div className={`sticky top-0 z-50 ${
          sendStatus === 'success' ? 'bg-green-600' :
          sendStatus === 'sending' ? 'bg-blue-600' :
          sendStatus === 'error' || validationError ? 'bg-red-600' : 'bg-gray-600'
        } text-white px-6 py-3 shadow-lg`}>
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              {sendStatus === 'success' && (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  <span className="font-semibold">✓ Emails sent successfully!</span>
                </>
              )}
              {sendStatus === 'sending' && (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="font-semibold">Sending emails...</span>
                </>
              )}
              {(sendStatus === 'error' || validationError) && (
                <>
                  <X className="w-5 h-5" />
                  <span className="font-semibold">{validationError || 'Failed to send emails'}</span>
                </>
              )}
            </div>
            {(sendStatus === 'error' || validationError) && !broadcastMutation.isPending && (
              <button 
                onClick={() => {
                  setSendStatus(null);
                  setValidationError('');
                }}
                className="text-white/80 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      )}
      
      {/* Header */}
      <div className="bg-gradient-to-br from-teal-600 to-emerald-600 text-white px-6 py-8">
        <div className="max-w-[1600px] mx-auto">
          <div className="flex items-center gap-3 mb-2">
             <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <Mail className="w-6 h-6 text-white" />
             </div>
             <div>
                <h1 className="text-2xl font-bold">Email Broadcaster</h1>
                <p className="text-teal-100 text-sm">Create and send rich HTML emails to your users</p>
             </div>
          </div>
          
          {/* Stepper */}
          <div className="flex items-center mt-8 relative">
            <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-teal-800/30 -z-10" />
            {[
              { num: 1, label: 'Audience' },
              { num: 2, label: 'Design' },
              { num: 3, label: 'Review' }
            ].map((s) => (
              <div key={s.num} className="flex-1 flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                  step >= s.num ? 'bg-white text-teal-700 shadow-lg scale-110' : 'bg-teal-800/50 text-teal-300 border border-teal-700'
                }`}>
                  {step > s.num ? <CheckCircle2 className="w-5 h-5" /> : s.num}
                </div>
                <span className={`text-xs mt-2 font-medium ${step >= s.num ? 'text-white' : 'text-teal-200'}`}>
                  {s.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-4 -mt-6">
        
        {/* STEP 1: AUDIENCE */}
        {step === 1 && (
          <Card className="shadow-xl border-0">
            <CardHeader>
              <CardTitle>Select Audience</CardTitle>
              <CardDescription>Who should receive this email?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                  { id: 'all', icon: Users, label: 'All Users', desc: 'Everyone on the platform' },
                  { id: 'pharmacists', icon: Users, label: 'Pharmacists', desc: 'Only registered pharmacists' },
                  { id: 'employers', icon: Users, label: 'Employers', desc: 'Only registered employers' },
                  { id: 'specific', icon: Mail, label: 'Specific List', desc: 'Enter emails manually' }
                ].map((type) => (
                  <div 
                    key={type.id}
                    onClick={() => setAudience(type.id)}
                    className={`cursor-pointer rounded-xl border-2 p-4 transition-all hover:shadow-md ${
                      audience === type.id 
                        ? 'border-teal-600 bg-teal-50 ring-1 ring-teal-600' 
                        : 'border-gray-200 hover:border-teal-300 bg-white'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-3 ${
                      audience === type.id ? 'bg-teal-200 text-teal-800' : 'bg-gray-100 text-gray-600'
                    }`}>
                      <type.icon className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-sm text-gray-900">{type.label}</h3>
                    <p className="text-xs text-gray-500 mt-1">{type.desc}</p>
                  </div>
                ))}
              </div>

              {audience === 'specific' && (
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 animate-in fade-in slide-in-from-top-4">
                  <Label className="mb-2 block">Enter Email Addresses (comma separated)</Label>
                  <textarea
                    value={specificEmails}
                    onChange={(e) => setSpecificEmails(e.target.value)}
                    className="w-full min-h-[100px] p-3 rounded-md border border-gray-300 focus:ring-2 focus:ring-teal-500 text-sm"
                    placeholder="john@example.com, jane@example.com"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Enter manually or paste a list.
                  </p>
                </div>
              )}
            </CardContent>
            <CardFooter className="justify-end border-t bg-gray-50/50 p-4">
              <Button onClick={() => setStep(2)} className="bg-teal-600 hover:bg-teal-700">
                Next Step <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardFooter>
          </Card>
        )}

        {/* STEP 2: DESIGN */}
        {step === 2 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Sidebar: Tools */}
            <div className="lg:col-span-1 space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-xs font-bold text-gray-500 uppercase mb-1.5">Email Subject</Label>
                    <Input 
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="Enter subject line..."
                      className="font-medium"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Templates</CardTitle>
                </CardHeader>
                <CardContent>
                   <div className="space-y-2">
                     {PRESET_TEMPLATES.map(t => (
                       <Button 
                        key={t.id} 
                        variant="outline" 
                        className={`w-full justify-start text-left font-normal text-xs h-9 ${t.requiresShifts ? 'border-teal-200 bg-teal-50/50' : ''}`}
                        onClick={() => loadTemplate(t)}
                       >
                         <Layout className="w-3 h-3 mr-2 text-gray-500" />
                         {t.name}
                         {t.requiresShifts && <Badge className="ml-auto text-[10px] bg-teal-100 text-teal-700">+Shifts</Badge>}
                       </Button>
                     ))}
                   </div>
                </CardContent>
              </Card>
              
              {/* Shifts Section - Only visible when Recent Shifts template is selected */}
              {showShiftsSection && (
                <Card className="border-teal-200 bg-teal-50/30">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-teal-600" />
                      Recent Shifts
                    </CardTitle>
                    <CardDescription>Fetch and insert shift listings into your email</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button 
                      onClick={fetchRecentShifts}
                      disabled={loadingShifts}
                      className="w-full bg-teal-600 hover:bg-teal-700"
                    >
                      {loadingShifts ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Fetching...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Fetch 5 Recent Shifts
                        </>
                      )}
                    </Button>
                    
                    {selectedShifts.length > 0 && (
                      <div className="space-y-2 mt-3">
                        <p className="text-xs font-semibold text-gray-600">{selectedShifts.length} Shifts Loaded:</p>
                        {selectedShifts.map((shift) => (
                          <div key={shift.id} className="bg-white rounded-lg p-3 border border-gray-200 text-xs">
                            <p className="font-semibold text-gray-900 truncate">{shift.title || 'Pharmacy Shift'}</p>
                            <div className="flex items-center gap-1 text-gray-500 mt-1">
                              <MapPin className="w-3 h-3" />
                              <span className="truncate">{shift.pharmacy_name || 'Pharmacy'}</span>
                            </div>
                            <div className="flex items-center gap-1 text-gray-500 mt-0.5">
                              <Calendar className="w-3 h-3" />
                              <span>{formatShiftDate(shift)}</span>
                            </div>
                            <div className="flex items-center gap-1 text-gray-500 mt-0.5">
                              <Clock className="w-3 h-3" />
                              <span>{formatShiftTime(shift)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {selectedShifts.length === 0 && !loadingShifts && (
                      <p className="text-xs text-gray-500 text-center py-2">
                        Click the button above to fetch recent open shifts
                      </p>
                    )}
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Add Blocks</CardTitle>
                  <CardDescription>Drag blocks to reorder in canvas</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-2">
                  <Button variant="outline" className="h-20 flex flex-col gap-2 hover:bg-teal-50 hover:text-teal-700 hover:border-teal-200" onClick={() => addBlock(BLOCK_TYPES.TEXT)}>
                    <Type className="w-6 h-6" />
                    <span className="text-xs">Text</span>
                  </Button>
                  <Button variant="outline" className="h-20 flex flex-col gap-2 hover:bg-teal-50 hover:text-teal-700 hover:border-teal-200" onClick={() => addBlock(BLOCK_TYPES.BUTTON)}>
                    <MousePointerClick className="w-6 h-6" />
                    <span className="text-xs">Button</span>
                  </Button>
                  <Button variant="outline" className="h-20 flex flex-col gap-2 hover:bg-teal-50 hover:text-teal-700 hover:border-teal-200" onClick={() => addBlock(BLOCK_TYPES.IMAGE)}>
                    <ImageIcon className="w-6 h-6" />
                    <span className="text-xs">Image</span>
                  </Button>
                  <Button variant="outline" className="h-20 flex flex-col gap-2 hover:bg-teal-50 hover:text-teal-700 hover:border-teal-200" onClick={() => addBlock(BLOCK_TYPES.SPACER)}>
                    <MoveVertical className="w-6 h-6" />
                    <span className="text-xs">Spacer</span>
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Main Canvas */}
            <div className="lg:col-span-2">
               <Card className="min-h-[600px] shadow-lg border-0 flex flex-col">
                 <div className="bg-gray-100 border-b p-3 flex justify-between items-center rounded-t-xl">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1.5">
                         <div className="w-3 h-3 rounded-full bg-red-400"></div>
                         <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                         <div className="w-3 h-3 rounded-full bg-green-400"></div>
                      </div>
                      <span className="text-xs text-gray-500 font-mono ml-2">email-preview.html</span>
                    </div>
                    <Button 
                      size="sm" 
                      variant={previewMode ? "default" : "outline"}
                      className={previewMode ? "bg-teal-600 hover:bg-teal-700" : ""}
                      onClick={() => setPreviewMode(!previewMode)}
                    >
                      <Eye className="w-3 h-3 mr-1.5" />
                      {previewMode ? 'Edit Mode' : 'Preview'}
                    </Button>
                 </div>
                 
                 <CardContent className="p-6 flex-1 bg-gray-50/50">
                   {previewMode ? (
                     <div className="bg-white shadow-sm mx-auto max-w-[600px] min-h-[500px] rounded-lg overflow-hidden border border-gray-200">
                        <div dangerouslySetInnerHTML={{ __html: generateHTML() }} className="p-8" />
                     </div>
                   ) : (
                     <DragDropContext onDragEnd={handleDragEnd}>
                       <Droppable droppableId="blocks">
                         {(provided) => (
                           <div
                             {...provided.droppableProps}
                             ref={provided.innerRef}
                             className="max-w-[600px] mx-auto min-h-[400px] space-y-3"
                           >
                             {blocks.map((block, index) => (
                               <EmailBlock 
                                 key={block.id} 
                                 block={block} 
                                 index={index} 
                                 updateBlock={updateBlock}
                                 removeBlock={removeBlock}
                               />
                             ))}
                             {provided.placeholder}
                             
                             {blocks.length === 0 && (
                               <div className="border-2 border-dashed border-gray-300 rounded-xl h-40 flex flex-col items-center justify-center text-gray-400 bg-white/50">
                                  <Layout className="w-8 h-8 mb-2 opacity-50" />
                                  <p className="text-sm font-medium">Canvas is empty</p>
                                  <p className="text-xs">Add blocks from the sidebar</p>
                               </div>
                             )}
                           </div>
                         )}
                       </Droppable>
                     </DragDropContext>
                   )}
                 </CardContent>
                 <CardFooter className="justify-between border-t p-4 bg-white rounded-b-xl">
                    <Button variant="outline" onClick={() => setStep(1)}>
                      <ArrowLeft className="w-4 h-4 mr-2" /> Back
                    </Button>
                    <Button onClick={() => setStep(3)} className="bg-teal-600 hover:bg-teal-700">
                      Next: Review <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                 </CardFooter>
               </Card>
            </div>
          </div>
        )}

        {/* STEP 3: REVIEW */}
        {step === 3 && (
          <Card className="shadow-xl border-0 max-w-2xl mx-auto">
             <CardHeader className="text-center border-b pb-6 bg-gradient-to-br from-teal-50 to-emerald-50 rounded-t-xl">
                <div className="w-16 h-16 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center mx-auto mb-4">
                   <Send className="w-8 h-8 ml-1" />
                </div>
                <CardTitle>Ready to Broadcast?</CardTitle>
                <CardDescription>Please review the details below before sending.</CardDescription>
             </CardHeader>
             <CardContent className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                   <div className="bg-gray-50 p-4 rounded-xl">
                      <p className="text-xs font-bold text-gray-500 uppercase mb-1">Audience</p>
                      <p className="font-medium text-gray-900 flex items-center gap-2">
                         <Users className="w-4 h-4 text-teal-600" />
                         {audience === 'all' ? 'All Users' : 
                          audience === 'pharmacists' ? 'All Pharmacists' : 
                          audience === 'employers' ? 'All Employers' : 'Specific List'}
                      </p>
                      {audience === 'specific' && (
                         <p className="text-xs text-gray-500 mt-1 pl-6 truncate">
                           {specificEmails}
                         </p>
                      )}
                   </div>
                   <div className="bg-gray-50 p-4 rounded-xl">
                      <p className="text-xs font-bold text-gray-500 uppercase mb-1">Subject</p>
                      <p className="font-medium text-gray-900">{subject || '(No Subject)'}</p>
                   </div>
                </div>

                <div className="border rounded-xl overflow-hidden">
                   <div className="bg-gray-100 px-4 py-2 text-xs font-bold text-gray-500 uppercase border-b">
                      Email Preview
                   </div>
                   <div className="bg-white p-6 max-h-[300px] overflow-y-auto">
                      <div dangerouslySetInnerHTML={{ __html: generateHTML() }} />
                   </div>
                </div>

                {validationError && (
                  <div className="flex items-center gap-3 bg-red-50 text-red-800 p-4 rounded-xl text-sm border border-red-200">
                    <X className="w-5 h-5 flex-shrink-0" />
                    <p>{validationError}</p>
                  </div>
                )}

                <div className="flex items-center gap-3 bg-yellow-50 text-yellow-800 p-4 rounded-xl text-sm border border-yellow-200">
                  <Loader2 className="w-5 h-5 flex-shrink-0" />
                  <p>This action cannot be undone. Please make sure all details are correct.</p>
                </div>
             </CardContent>
             <CardFooter className="justify-between p-6 bg-gray-50 rounded-b-xl">
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setStep(2)}>
                     <ArrowLeft className="w-4 h-4 mr-2" /> Back
                  </Button>
                  <Button variant="outline" onClick={() => setTestEmailDialogOpen(true)}>
                     <Mail className="w-4 h-4 mr-2" /> Send Test
                  </Button>
                </div>
                <Button 
                  onClick={handleSend} 
                  disabled={broadcastMutation.isPending}
                  className="bg-teal-600 hover:bg-teal-700 min-w-[160px] h-11 text-base"
                >
                   {broadcastMutation.isPending ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Sending...
                      </>
                   ) : (
                      <>
                        <Send className="w-5 h-5 mr-2" />
                        Send Broadcast
                      </>
                   )}
                </Button>
             </CardFooter>
          </Card>
        )}
      </div>

      {/* Test Email Dialog */}
      <Dialog open={testEmailDialogOpen} onOpenChange={setTestEmailDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Test Email</DialogTitle>
            <DialogDescription>
              Send a test email to verify your SMTP configuration and email design before broadcasting.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-3">
            <div>
              <Label className="mb-2 block">Test Email Address</Label>
              <Input
                type="email"
                placeholder="your.email@example.com"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleTestEmail()}
              />
            </div>
            <Button 
              variant="outline" 
              onClick={handleTestSMTP}
              disabled={testingSMTP}
              className="w-full"
            >
              {testingSMTP ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Testing...
                </>
              ) : (
                'Test Brevo API'
              )}
            </Button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTestEmailDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleTestEmail}
              disabled={testingSMTP}
              className="bg-teal-600 hover:bg-teal-700"
            >
              {testingSMTP ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send Test
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function AdminEmailBroadcast() {
  return (
    <AdminOnly>
      <AdminEmailBroadcastContent />
    </AdminOnly>
  );
}